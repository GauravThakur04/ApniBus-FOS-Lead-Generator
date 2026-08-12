import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const ADMIN_EMAILS = [
  'gaurav.thakur@apnibus.com',
  'arvind.ranjan@apnibus.com',
  'admin@apnibus.in',
];

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const userEmail = searchParams.get('email');
    const userRole = searchParams.get('role');

    const search = searchParams.get('search');
    const state = searchParams.get('state');
    const city = searchParams.get('city');
    const status = searchParams.get('status');
    const source = searchParams.get('source');
    const temperature = searchParams.get('temperature');
    const assignedToId = searchParams.get('assignedToId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '500', 10);

    const where: any = {};

    const isAdmin =
      userRole === 'ADMIN' ||
      userRole === 'SUPER_ADMIN' ||
      (userEmail && ADMIN_EMAILS.includes(userEmail.toLowerCase()));

    // STRICT ROLE ISOLATION: Non-admin managers (Sonu, Tarun, Rajnish) see ONLY their assigned leads
    if (!isAdmin && userEmail) {
      const user = await prisma.user.findUnique({ where: { email: userEmail } });
      if (user) {
        where.assignedToId = user.id;
      } else {
        return NextResponse.json({ leads: [], pagination: { total: 0, page, limit, totalPages: 0 } });
      }
    } else {
      // ADMIN & SUPER ADMIN mode (Gaurav Thakur & Arvind Ranjan): Show ALL leads
      if (assignedToId && assignedToId !== 'ALL') {
        if (assignedToId === 'UNASSIGNED') {
          where.assignedToId = null;
        } else {
          where.assignedToId = assignedToId;
        }
      }
    }

    if (state && state !== 'ALL') where.state = state;
    if (city && city !== 'ALL') where.city = city;
    if (status && status !== 'ALL') where.status = status;
    if (source && source !== 'ALL') where.source = source;
    if (temperature && temperature !== 'ALL') where.leadTemperature = temperature;

    if (search && search.trim() !== '') {
      const q = search.trim();
      where.OR = [
        { businessName: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
        { city: { contains: q, mode: 'insensitive' } },
        { state: { contains: q, mode: 'insensitive' } },
        { searchKeyword: { contains: q, mode: 'insensitive' } },
      ];
    }

    const total = await prisma.lead.count({ where });

    const rawLeads = await prisma.lead.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: (page - 1) * limit,
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            empId: true,
            designation: true,
          },
        },
      },
    });

    // Clean up any businessName containing "places/ChIJ..." into human travel titles
    const leads = rawLeads.map((l) => {
      let bName = l.businessName;
      if (!bName || bName.startsWith('places/') || bName.includes('ChIJ')) {
        bName = `${l.searchKeyword || 'Intercity Bus Operator'} (${l.city} Bus Operator)`;
      }
      return {
        ...l,
        businessName: bName,
      };
    });

    return NextResponse.json({
      leads,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
