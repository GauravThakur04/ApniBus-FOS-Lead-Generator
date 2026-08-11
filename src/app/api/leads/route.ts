import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

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

    // STRICT ROLE ISOLATION: If not ADMIN (e.g. Sonu, Tarun, Rajnish), FORCE assignedToId to match the manager's user ID!
    if (userRole !== 'ADMIN' && userEmail && userEmail !== 'admin@apnibus.in') {
      const user = await prisma.user.findUnique({ where: { email: userEmail } });
      if (user) {
        where.assignedToId = user.id;
      } else {
        // Unknown user: return empty set
        return NextResponse.json({ leads: [], pagination: { total: 0, page, limit, totalPages: 0 } });
      }
    } else {
      // ADMIN mode: allow filtering by assignedToId if specified
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
        { businessName: { contains: q } },
        { phone: { contains: q } },
        { city: { contains: q } },
        { address: { contains: q } },
      ];
    }

    const total = await prisma.lead.count({ where });

    const leads = await prisma.lead.findMany({
      where,
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true, empId: true, designation: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
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
