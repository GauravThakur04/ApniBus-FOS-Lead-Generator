import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import Papa from 'papaparse';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const type = searchParams.get('type') || 'all'; // all, hot, followups, converted, my_leads
    const state = searchParams.get('state');
    const city = searchParams.get('city');
    const assignedToId = searchParams.get('assignedToId');

    const where: any = {};

    if (state && state !== 'ALL') where.state = state;
    if (city && city !== 'ALL') where.city = city;
    if (assignedToId && assignedToId !== 'ALL') where.assignedToId = assignedToId;

    if (type === 'hot') where.leadTemperature = 'HOT';
    if (type === 'followups') where.status = 'Follow-up';
    if (type === 'converted') where.status = 'Converted';

    const leads = await prisma.lead.findMany({
      where,
      include: {
        assignedTo: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const csvData = leads.map((l) => ({
      'Business Name': l.businessName,
      'Phone': l.phone || '',
      'Email': l.email || '',
      'Website': l.website || '',
      'Address': l.address || '',
      'City': l.city,
      'State': l.state,
      'Lead Score': l.leadScore,
      'Temperature': l.leadTemperature,
      'Status': l.status,
      'Source': l.source,
      'Assigned FOS': l.assignedTo ? l.assignedTo.name : 'Unassigned',
      'Rating': l.rating || '',
      'Reviews': l.reviewCount || 0,
      'Google Maps URL': l.googleMapsUrl || '',
      'Place ID': l.placeId || '',
      'Created Date': l.createdAt.toISOString().split('T')[0],
    }));

    const csvString = Papa.unparse(csvData);

    return new NextResponse(csvString, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="apnibus_leads_${type}_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
