import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const apiKey = process.env.GOOGLE_API_KEY;
  const isKeyConfigured = Boolean(
    apiKey && apiKey.trim() !== '' && apiKey !== 'your_google_places_api_key_here'
  );

  const settings = await prisma.setting.findMany();
  const settingsObj: Record<string, string> = {
    dailyCap: '100',
    hotThreshold: '80',
    warmThreshold: '60',
    phoneWeight: '25',
    keywordWeight: '20',
    ratingWeight: '10',
  };

  settings.forEach((s) => {
    settingsObj[s.key] = s.value;
  });

  return NextResponse.json({
    apiConnected: isKeyConfigured,
    hasApiKey: isKeyConfigured,
    dailyCap: settingsObj.dailyCap,
    hotThreshold: settingsObj.hotThreshold,
    warmThreshold: settingsObj.warmThreshold,
    phoneWeight: settingsObj.phoneWeight,
    keywordWeight: settingsObj.keywordWeight,
    ratingWeight: settingsObj.ratingWeight,
    settings: settingsObj,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const keysToSave = [
      'dailyCap',
      'hotThreshold',
      'warmThreshold',
      'phoneWeight',
      'keywordWeight',
      'ratingWeight',
    ];

    for (const key of keysToSave) {
      if (body[key] !== undefined) {
        await prisma.setting.upsert({
          where: { key },
          update: { value: String(body[key]) },
          create: { key, value: String(body[key]) },
        });
      }
    }

    if (body.settings && typeof body.settings === 'object') {
      for (const [key, value] of Object.entries(body.settings)) {
        await prisma.setting.upsert({
          where: { key },
          update: { value: String(value) },
          create: { key, value: String(value) },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
