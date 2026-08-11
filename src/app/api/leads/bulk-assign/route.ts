import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { leadIds, userId } = await req.json();

    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return NextResponse.json({ error: 'Lead IDs array is required' }, { status: 400 });
    }

    // Determine target user
    let user = null;
    if (userId) {
      user = await prisma.user.findUnique({ where: { id: userId } });
    }

    // Bulk update lead assignment
    await prisma.lead.updateMany({
      where: { id: { in: leadIds } },
      data: {
        assignedToId: userId || null,
        status: userId ? 'Assigned' : 'New',
      },
    });

    // Create activity logs for assigned leads
    for (const leadId of leadIds) {
      await prisma.leadActivity.create({
        data: {
          leadId,
          userId: userId || undefined,
          type: 'Assignment',
          description: userId
            ? `Lead assigned to ${user?.name || 'Leader'}`
            : 'Lead marked as Unassigned',
        },
      });
    }

    return NextResponse.json({
      success: true,
      updatedCount: leadIds.length,
      assignedTo: user ? user.name : 'Unassigned',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
