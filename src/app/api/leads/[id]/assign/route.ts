import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const targetUserId = body.userId || body.assignedToId || null;

    const lead = await prisma.lead.findUnique({ where: { id: params.id } });
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const assignedUser = targetUserId
      ? await prisma.user.findUnique({ where: { id: targetUserId } })
      : null;

    const updatedLead = await prisma.lead.update({
      where: { id: params.id },
      data: {
        assignedToId: targetUserId || null,
        status: targetUserId ? 'Assigned' : lead.status,
      },
      include: {
        assignedTo: {
          select: { id: true, name: true, empId: true, designation: true },
        },
      },
    });

    await prisma.leadActivity.create({
      data: {
        leadId: params.id,
        userId: targetUserId || undefined,
        type: 'Assigned',
        description: assignedUser
          ? `Lead assigned to leader ${assignedUser.name} (${assignedUser.empId})`
          : 'Lead unassigned',
      },
    });

    return NextResponse.json({ lead: updatedLead });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
