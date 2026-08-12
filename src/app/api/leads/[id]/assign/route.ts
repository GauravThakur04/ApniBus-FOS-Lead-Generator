import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const rawTargetId = body.assignedToId || body.userId || body.targetUserId || null;

    const lead = await prisma.lead.findUnique({ where: { id: params.id } });
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
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

    const updatedLead = await prisma.lead.update({
      where: { id: params.id },
      data: {
        assignedToId: targetUserId,
        status: targetUserId ? 'Assigned' : lead.status,
      },
      include: {
        assignedTo: {
          select: { id: true, name: true, empId: true, designation: true, email: true },
        },
      },
    });

    try {
      if (targetUserId) {
        await prisma.leadActivity.create({
          data: {
            leadId: params.id,
            userId: targetUserId,
            type: 'Assigned',
            description: `Lead assigned to leader ${assignedUser?.name || 'Leader'} (${assignedUser?.empId || ''})`,
          },
        });
      }
    } catch (e) {}

    return NextResponse.json({ success: true, lead: updatedLead });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
