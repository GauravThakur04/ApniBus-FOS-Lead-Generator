import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: params.id },
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true, phone: true },
        },
        activities: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { name: true } },
          },
        },
        followUps: {
          orderBy: { followUpDate: 'asc' },
        },
      },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    return NextResponse.json({ lead });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { status, assignedToId, leadTemperature, notes, phone, email, website, lastContactedAt, nextFollowUpAt } = body;

    const currentLead = await prisma.lead.findUnique({ where: { id: params.id } });
    if (!currentLead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const updateData: any = {};
    if (status && status !== currentLead.status) {
      updateData.status = status;
    }
    if (leadTemperature && leadTemperature !== currentLead.leadTemperature) {
      updateData.leadTemperature = leadTemperature;
    }
    if (assignedToId !== undefined) {
      updateData.assignedToId = assignedToId || null;
    }
    if (notes !== undefined) updateData.notes = notes;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (website !== undefined) updateData.website = website;
    if (lastContactedAt) updateData.lastContactedAt = new Date(lastContactedAt);
    if (nextFollowUpAt) updateData.nextFollowUpAt = new Date(nextFollowUpAt);

    const updatedLead = await prisma.lead.update({
      where: { id: params.id },
      data: updateData,
      include: {
        assignedTo: {
          select: { id: true, name: true, empId: true, designation: true },
        },
      },
    });

    // Log Activity for Temperature Override
    if (leadTemperature && leadTemperature !== currentLead.leadTemperature) {
      await prisma.leadActivity.create({
        data: {
          leadId: params.id,
          type: 'Category_Changed',
          description: `Team manually re-categorized lead priority to ${leadTemperature}`,
        },
      });
    }

    // Log Activity for Status Change
    if (status && status !== currentLead.status) {
      await prisma.leadActivity.create({
        data: {
          leadId: params.id,
          type: 'Status_Changed',
          description: `Status updated from ${currentLead.status} to ${status}`,
        },
      });
    }

    if (assignedToId !== undefined && assignedToId !== currentLead.assignedToId) {
      const newFOS = assignedToId
        ? await prisma.user.findUnique({ where: { id: assignedToId } })
        : null;
      await prisma.leadActivity.create({
        data: {
          leadId: params.id,
          type: 'Assigned',
          description: newFOS
            ? `Lead assigned to ${newFOS.name}`
            : 'Lead unassigned',
        },
      });
    }

    return NextResponse.json({ lead: updatedLead });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    // Delete activities and followups
    await prisma.leadActivity.deleteMany({ where: { leadId: params.id } });
    await prisma.followUp.deleteMany({ where: { leadId: params.id } });

    await prisma.lead.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
