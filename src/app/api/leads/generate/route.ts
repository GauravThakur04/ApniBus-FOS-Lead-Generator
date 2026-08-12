import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { calculateLeadScore } from '@/lib/scoring';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || '';

interface GooglePlaceItem {
  id?: string;
  name?: string;
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
}

export async function POST(req: Request) {
  try {
    const { state, city, keywords } = await req.json();

    if (!state || !city || !keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json(
        { error: 'State, City, and at least one Keyword are required.' },
        { status: 400 }
      );
    }

    // Ensure Lead and SearchJob tables exist
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "SearchJob" (
          "id" TEXT PRIMARY KEY,
          "state" TEXT NOT NULL,
          "city" TEXT NOT NULL,
          "keyword" TEXT NOT NULL,
          "searchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "resultsFound" INTEGER NOT NULL DEFAULT 0,
          "newLeads" INTEGER NOT NULL DEFAULT 0,
          "duplicates" INTEGER NOT NULL DEFAULT 0,
          "status" TEXT NOT NULL DEFAULT 'Completed',
          "userId" TEXT REFERENCES "User"("id") ON DELETE SET NULL
        );
      `);
    } catch (e) {}

    let totalFound = 0;
    let newLeadsCount = 0;
    let duplicateCount = 0;
    const createdLeads: any[] = [];
    const errorsList: string[] = [];

    for (const keyword of keywords) {
      const queryText = `${keyword} in ${city}, ${state}, India`;
      let places: GooglePlaceItem[] = [];

      if (GOOGLE_API_KEY) {
        try {
          const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Goog-Api-Key': GOOGLE_API_KEY,
              'X-Goog-FieldMask':
                'places.id,places.name,places.formattedAddress,places.nationalPhoneNumber,places.internationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.googleMapsUri',
            },
            body: JSON.stringify({
              textQuery: queryText,
              pageSize: 20,
            }),
          });

          if (!res.ok) {
            const errData = await res.json();
            errorsList.push(`API Error for "${keyword}": ${errData.error?.message || res.statusText}`);
          } else {
            const data = await res.json();
            places = data.places || [];
          }
        } catch (fetchErr: any) {
          errorsList.push(`Fetch failed for "${keyword}": ${fetchErr.message}`);
        }
      }

      totalFound += places.length;
      let kwNewLeads = 0;
      let kwDuplicates = 0;

      for (const p of places) {
        const placeId = p.id || `custom-${Date.now()}-${Math.random()}`;
        const businessName = p.name || keyword;
        const phone = p.nationalPhoneNumber || p.internationalPhoneNumber || null;
        const website = p.websiteUri || null;
        const address = p.formattedAddress || `${city}, ${state}`;
        const rating = p.rating || null;
        const reviewCount = p.userRatingCount || 0;
        const googleMapsUrl = p.googleMapsUri || null;

        // Check duplicate
        let existing = null;
        if (p.id) {
          existing = await prisma.lead.findUnique({ where: { placeId: p.id } });
        }
        if (!existing && phone) {
          existing = await prisma.lead.findFirst({ where: { phone } });
        }

        if (!existing) {
          const { score, temperature } = calculateLeadScore({
            phone,
            website,
            rating,
            reviewCount,
            businessName,
            searchKeyword: keyword,
            address,
          });

          const result = await prisma.lead.create({
            data: {
              placeId,
              businessName,
              phone,
              website,
              address,
              city,
              state,
              rating,
              reviewCount,
              leadScore: score,
              leadTemperature: temperature,
              searchKeyword: keyword,
              googleMapsUrl,
              status: 'New',
              assignedToId: null,
            },
          });

          kwNewLeads += 1;
          newLeadsCount += 1;
          createdLeads.push(result);
        } else {
          kwDuplicates += 1;
          duplicateCount += 1;
        }
      }

      // Safely log search job audit entry
      try {
        await prisma.searchJob.create({
          data: {
            state,
            city,
            keyword,
            resultsFound: places.length,
            newLeads: kwNewLeads,
            duplicates: kwDuplicates,
            status: 'COMPLETED',
          },
        });
      } catch (e) {}
    }

    return NextResponse.json({
      success: true,
      summary: {
        totalSearchedKeywords: keywords.length,
        totalFound,
        newLeadsCount,
        duplicatesSkipped: duplicateCount,
        errors: errorsList,
      },
      resultsFound: totalFound,
      newLeads: newLeadsCount,
      duplicates: duplicateCount,
      leads: createdLeads,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
