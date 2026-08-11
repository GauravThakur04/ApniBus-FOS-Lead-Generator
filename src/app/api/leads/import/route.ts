import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import Papaparse from 'papaparse';

const STATE_CODE_MAP: Record<string, string> = {
  RJ: 'Rajasthan',
  UP: 'Uttar Pradesh',
  PB: 'Punjab',
  HR: 'Haryana',
  MP: 'Madhya Pradesh',
  JH: 'Jharkhand',
  UK: 'Uttarakhand',
  CG: 'Chhattisgarh',
  DL: 'Delhi',
  HP: 'Himachal Pradesh',
  BR: 'Bihar',
  WB: 'West Bengal',
  GJ: 'Gujarat',
  MH: 'Maharashtra',
  KA: 'Karnataka',
  TN: 'Tamil Nadu',
  TS: 'Telangana',
  TG: 'Telangana',
  AP: 'Andhra Pradesh',
};

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'CSV file is required.' }, { status: 400 });
    }

    const text = await file.text();
    const parsed = Papaparse.parse(text, {
      header: true,
      skipEmptyLines: true,
    });

    const rows = parsed.data as any[];
    let totalParsed = rows.length;
    let newInserted = 0;
    let duplicatesSkipped = 0;
    const insertedLeads: any[] = [];

    for (const row of rows) {
      const opName = (row['Operator Name'] || row.operator_name || row.Name || row.name || '').trim();
      const compName = (row['Company Name'] || row.company_name || row.Company || row.company || row['Bus Service'] || '').trim();

      // Combine Operator Name & Company / Travel Name if both exist and are different
      let combinedBusinessName = '';
      if (opName && compName) {
        if (opName.toLowerCase() === compName.toLowerCase()) {
          combinedBusinessName = opName;
        } else if (opName.includes('|') || opName.includes('/')) {
          // Handles cases like "leelaram meena | Lila Ram"
          combinedBusinessName = opName;
        } else {
          // e.g. "Rakesh (Rakesh Travels)" or "Avnish (Avnish Tourist Bus Service)"
          combinedBusinessName = `${opName} (${compName})`;
        }
      } else {
        combinedBusinessName = opName || compName || row.businessName || row.BusinessName || row['Business Name'];
      }

      if (!combinedBusinessName || !String(combinedBusinessName).trim()) continue;

      // 2. Phone Number (Matches exact user image headers: Phone Number, Alternate No)
      const rawPhone =
        row['Phone Number'] ||
        row.phone ||
        row.Phone ||
        row['Alternate No'] ||
        row['Alternate Number'] ||
        row.mobile ||
        row.Mobile ||
        row.contact ||
        row.Contact;

      // 3. City / Location (Matches exact user image header: District/ Location)
      const rawCity =
        row['District/ Location'] ||
        row['District/Location'] ||
        row.District ||
        row.district ||
        row.Location ||
        row.location ||
        row.city ||
        row.City ||
        'Ludhiana';

      // 4. State Code / Full State (Matches exact user image header: State e.g. RJ, UP, PB, JH)
      let rawState =
        row.State ||
        row.state ||
        row.Region ||
        row.region ||
        'Punjab';

      const cleanName = String(combinedBusinessName).trim();
      const cleanPhone = rawPhone ? String(rawPhone).trim() : null;
      const cleanCity = String(rawCity).trim();

      // Normalize State Code if short code used (e.g. RJ -> Rajasthan, UP -> Uttar Pradesh)
      let cleanState = String(rawState).trim();
      const upperState = cleanState.toUpperCase();
      if (STATE_CODE_MAP[upperState]) {
        cleanState = STATE_CODE_MAP[upperState];
      }

      // Check deduplication
      let existing = null;
      if (cleanPhone) {
        existing = await prisma.lead.findFirst({ where: { phone: cleanPhone } });
      }
      if (!existing) {
        existing = await prisma.lead.findFirst({ where: { businessName: cleanName, city: cleanCity } });
      }

      if (!existing) {
        const newLead = await prisma.lead.create({
          data: {
            businessName: cleanName,
            phone: cleanPhone,
            city: cleanCity,
            state: cleanState,
            website: null,
            address: null,
            leadScore: 50,
            leadTemperature: 'WARM', // Default WARM until team manually categorizes
            status: 'New',
            assignedToId: null, // Unassigned by default so user manually assigns
          },
        });

        newInserted += 1;
        insertedLeads.push(newLead);
      } else {
        duplicatesSkipped += 1;
      }
    }

    return NextResponse.json({
      success: true,
      totalParsed,
      newInserted,
      duplicatesSkipped,
      insertedLeads,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
