import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const leadIds = body.leadIds;
    const rawTargetId = body.assignedToId || body.userId || body.targetUserId || null;

    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return NextResponse.json({ error: 'Lead IDs array is required' }, { status: 400 });
    }

    let assignedUser = null;
    if (rawTargetId && rawTargetId !== 'UNASSIGNED') {
      assignedUser = await prisma.user.findFirst({
        where: {
          OR: [
            { id: rawTargetId },
            { email: rawTargetId },
            { empId: rawTargetId },
          ],
        },
      });
    }

    const targetUserId = assignedUser ? assignedUser.id : null;

    // Bulk update lead assignment
    await prisma.lead.updateMany({
      where: { id: { in: leadIds } },
      data: {
        assignedToId: targetUserId,
        status: targetUserId ? 'Assigned' : 'New',
      },
    });

    // Create activity logs safely
    if (targetUserId) {
      for (const leadId of leadIds) {
        try {
          await prisma.leadActivity.create({
            data: {
              leadId,
              userId: targetUserId,
              type: 'Assignment',
              description: `Lead assigned to ${assignedUser?.name || 'Leader'}`,
            },
          });
        } catch (e) {}
      }
    }

    return NextResponse.json({
      success: true,
      updatedCount: leadIds.length,
      assignedTo: assignedUser ? assignedUser.name : 'Unassigned',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
