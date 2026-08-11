import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { type, description, userId } = body;

    if (!type || !description) {
      return NextResponse.json({ error: 'Type and description are required.' }, { status: 400 });
    }

    const activity = await prisma.leadActivity.create({
      data: {
        leadId: params.id,
        userId: userId || null,
        type,
        description,
      },
    });

    // Update lastContactedAt if activity is Called or WhatsApp
    if (['Called', 'WhatsApp', 'Contacted'].includes(type)) {
      await prisma.lead.update({
        where: { id: params.id },
        data: { lastContactedAt: new Date() },
      });
    }

    return NextResponse.json({ activity });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
