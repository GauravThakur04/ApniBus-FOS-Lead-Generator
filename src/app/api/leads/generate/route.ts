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
        } catch (err: any) {
          errorsList.push(`Fetch failed for "${keyword}": ${err.message}`);
        }
      }

      totalFound += places.length;
      let kwNewLeads = 0;
      let kwDuplicates = 0;

      for (const place of places) {
        const placeId = place.id || null;
        const businessName = place.name || 'Bus Operator';
        const phone = place.nationalPhoneNumber || place.internationalPhoneNumber || null;
        const website = place.websiteUri || null;
        const address = place.formattedAddress || null;
        const rating = place.rating || null;
        const reviewCount = place.userRatingCount || null;
        const googleMapsUrl = place.googleMapsUri || null;

        // Check deduplication by placeId or businessName+city
        let existing = null;
        if (placeId) {
          existing = await prisma.lead.findUnique({ where: { placeId } });
        }
        if (!existing) {
          existing = await prisma.lead.findFirst({
            where: {
              businessName,
              city,
            },
          });
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

          // Create new lead as UNASSIGNED so user can manually assign
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
              assignedToId: null, // Unassigned by default per user directive
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

      // Log search job
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
      leads: createdLeads,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
