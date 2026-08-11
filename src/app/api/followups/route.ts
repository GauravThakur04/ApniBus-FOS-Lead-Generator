import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { startOfDay, endOfDay } from 'date-fns';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    const whereUser = userId ? { userId } : {};

    const allFollowUps = await prisma.followUp.findMany({
      where: {
        ...whereUser,
      },
      include: {
        lead: {
          select: {
            id: true,
            businessName: true,
            phone: true,
            city: true,
            state: true,
            status: true,
            leadTemperature: true,
          },
        },
        user: {
          select: { id: true, name: true },
        },
      },
      orderBy: { followUpDate: 'asc' },
    });

    const overdue = allFollowUps.filter(
      (f) => f.status === 'Pending' && new Date(f.followUpDate) < todayStart
    );

    const todays = allFollowUps.filter(
      (f) =>
        f.status === 'Pending' &&
        new Date(f.followUpDate) >= todayStart &&
        new Date(f.followUpDate) <= todayEnd
    );

    const upcoming = allFollowUps.filter(
      (f) => f.status === 'Pending' && new Date(f.followUpDate) > todayEnd
    );

    const completed = allFollowUps.filter((f) => f.status === 'Completed');

    return NextResponse.json({
      overdue,
      todays,
      upcoming,
      completed,
      overdueCount: overdue.length,
      todaysCount: todays.length,
      upcomingCount: upcoming.length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { leadId, userId, followUpDate, time, reason, notes } = body;

    if (!leadId || !followUpDate) {
      return NextResponse.json({ error: 'Lead and Follow-up date are required.' }, { status: 400 });
    }

    const followUp = await prisma.followUp.create({
      data: {
        leadId,
        userId: userId || null,
        followUpDate: new Date(followUpDate),
        time: time || '10:00 AM',
        reason: reason || 'General Follow-up',
        notes: notes || null,
        status: 'Pending',
      },
    });

    // Update lead nextFollowUpAt & status
    await prisma.lead.update({
      where: { id: leadId },
      data: {
        nextFollowUpAt: new Date(followUpDate),
        status: 'Follow-up',
      },
    });

    // Log Activity
    await prisma.leadActivity.create({
      data: {
        leadId,
        userId: userId || null,
        type: 'FollowUp_Scheduled',
        description: `Follow-up scheduled for ${new Date(followUpDate).toLocaleDateString()} (${reason || 'General'})`,
      },
    });

    return NextResponse.json({ followUp });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { followUpId, status, notes } = body;

    if (!followUpId || !status) {
      return NextResponse.json({ error: 'FollowUp ID and status are required.' }, { status: 400 });
    }

    const updated = await prisma.followUp.update({
      where: { id: followUpId },
      data: {
        status,
        notes: notes || undefined,
      },
    });

    if (status === 'Completed') {
      await prisma.leadActivity.create({
        data: {
          leadId: updated.leadId,
          type: 'Note_Added',
          description: `Follow-up completed: ${notes || 'No extra notes'}`,
        },
      });
    }

    return NextResponse.json({ followUp: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
