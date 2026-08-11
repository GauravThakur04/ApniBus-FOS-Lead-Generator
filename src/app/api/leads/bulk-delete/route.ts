import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { leadIds } = await req.json();

    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return NextResponse.json({ error: 'Lead IDs array is required' }, { status: 400 });
    }

    // Delete associated activities and followups first
    await prisma.leadActivity.deleteMany({
      where: { leadId: { in: leadIds } },
    });

    await prisma.followUp.deleteMany({
      where: { leadId: { in: leadIds } },
    });

    // Delete leads
    const result = await prisma.lead.deleteMany({
      where: { id: { in: leadIds } },
    });

    return NextResponse.json({
      success: true,
      deletedCount: result.count,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
