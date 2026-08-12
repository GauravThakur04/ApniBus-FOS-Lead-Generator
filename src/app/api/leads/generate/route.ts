import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { calculateLeadScore } from '@/lib/scoring';
import { searchGooglePlaces } from '@/lib/google-places';

export async function POST(req: Request) {
  try {
    const { state, city, keywords } = await req.json();

    if (!state || !city || !keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json(
        { error: 'State, City, and at least one Keyword are required.' },
        { status: 400 }
      );
    }

    // 1. Ensure Lead & SearchJob tables exist in Supabase
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Lead" (
          "id" TEXT PRIMARY KEY,
          "placeId" TEXT UNIQUE,
          "businessName" TEXT NOT NULL,
          "phone" TEXT,
          "email" TEXT,
          "website" TEXT,
          "address" TEXT,
          "city" TEXT NOT NULL,
          "state" TEXT NOT NULL,
          "country" TEXT NOT NULL DEFAULT 'India',
          "latitude" DOUBLE PRECISION,
          "longitude" DOUBLE PRECISION,
          "googleMapsUrl" TEXT,
          "rating" DOUBLE PRECISION,
          "reviewCount" INTEGER DEFAULT 0,
          "source" TEXT NOT NULL DEFAULT 'Google Places',
          "searchKeyword" TEXT,
          "searchKeywordsHistory" TEXT,
          "leadScore" INTEGER NOT NULL DEFAULT 0,
          "leadTemperature" TEXT NOT NULL DEFAULT 'COLD',
          "status" TEXT NOT NULL DEFAULT 'New',
          "assignedToId" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
          "lastContactedAt" TIMESTAMP(3),
          "nextFollowUpAt" TIMESTAMP(3),
          "notes" TEXT,
          "lastFoundAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);
    } catch (e) {}

    // 2. Fetch existing placeIds & phones in 1 SINGLE FAST BATCH QUERY
    let existingPlacesSet = new Set<string>();
    let existingPhonesSet = new Set<string>();
    try {
      const existingLeads = await prisma.lead.findMany({
        select: { placeId: true, phone: true },
      });
      existingLeads.forEach((l) => {
        if (l.placeId) existingPlacesSet.add(l.placeId);
        if (l.phone) existingPhonesSet.add(l.phone);
      });
    } catch (e) {}

    // 3. Limit to top 5 high-converting keywords per batch
    const targetKeywords = keywords.slice(0, 5);

    // 4. Run Google Places API searches in Parallel
    const searchPromises = targetKeywords.map(async (keyword: string) => {
      const queryText = `${keyword} in ${city}, ${state}, India`;
      try {
        const searchRes = await searchGooglePlaces({ query: queryText, pageSize: 15 });
        return {
          keyword,
          places: searchRes.places || [],
          error: searchRes.success ? null : searchRes.error,
        };
      } catch (err: any) {
        return { keyword, places: [], error: err.message };
      }
    });

    const searchResults = await Promise.all(searchPromises);

    let totalFound = 0;
    let newLeadsCount = 0;
    let duplicateCount = 0;
    const createdLeadsList: any[] = [];
    const errorsList: string[] = [];

    // 5. Deduplicate & Save each new lead reliably to Supabase
    for (const resItem of searchResults) {
      const { keyword, places, error } = resItem;
      if (error) {
        errorsList.push(`Notice for "${keyword}": ${error}`);
      }

      totalFound += places.length;
      let kwNewLeads = 0;
      let kwDuplicates = 0;

      for (const p of places) {
        const placeId = p.id || `custom-${Date.now()}-${Math.random()}`;
        
        // EXACT NAME AS WRITTEN ON GOOGLE MAPS BY THE TRAVEL OPERATOR
        const businessName = p.displayName?.text || keyword;

        const phone = p.nationalPhoneNumber || null;
        const website = p.websiteUri || null;
        const address = p.formattedAddress || `${city}, ${state}`;
        const rating = p.rating ? Number(p.rating) : null;
        const reviewCount = p.userRatingCount ? Number(p.userRatingCount) : 0;
        const googleMapsUrl = p.googleMapsUri || null;

        // In-memory instant duplicate check
        const isDuplicatePlace = existingPlacesSet.has(placeId);
        const isDuplicatePhone = phone && existingPhonesSet.has(phone);

        if (!isDuplicatePlace && !isDuplicatePhone) {
          const { score, temperature } = calculateLeadScore({
            phone,
            website,
            rating,
            reviewCount,
            businessName,
            searchKeyword: keyword,
            address,
          });

          const leadId = `lead-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

          try {
            const savedLead = await prisma.lead.create({
              data: {
                id: leadId,
                placeId,
                businessName,
                phone,
                website,
                address,
                city,
                state,
                country: 'India',
                googleMapsUrl,
                rating,
                reviewCount,
                source: 'Google Places',
                searchKeyword: keyword,
                leadScore: score,
                leadTemperature: temperature,
                status: 'New',
                assignedToId: null,
              },
            });

            existingPlacesSet.add(placeId);
            if (phone) existingPhonesSet.add(phone);

            kwNewLeads += 1;
            newLeadsCount += 1;
            createdLeadsList.push(savedLead);
          } catch (createErr: any) {
            console.error(`Failed to insert lead "${businessName}":`, createErr.message);
          }
        } else {
          kwDuplicates += 1;
          duplicateCount += 1;
        }
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        totalSearchedKeywords: targetKeywords.length,
        totalFound,
        newLeadsCount,
        duplicatesSkipped: duplicateCount,
        errors: errorsList,
      },
      resultsFound: totalFound,
      newLeads: newLeadsCount,
      duplicates: duplicateCount,
      leads: createdLeadsList,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
