import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { calculateLeadScore } from '@/lib/scoring';
import { searchGooglePlaces } from '@/lib/google-places';

const FORBIDDEN_WORDS = [
  'cab',
  'cabs',
  'taxi',
  'taxis',
  'truck',
  'trucks',
  'trucking',
  'logistics',
  'cargo',
  'freight',
  'sleeper',
  'sleepers',
  'packers',
  'movers',
  'car rental',
  'rent a car',
  'rental',
  'driving school',
  'auto',
  'rickshaw',
  'courier',
  'parcel',
  'ambulance',
  'crane',
  'earthmover',
  'jcb',
];

function isForbiddenNonBus(businessName: string, address?: string): boolean {
  const text = `${businessName} ${address || ''}`.toLowerCase();
  for (const word of FORBIDDEN_WORDS) {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    if (regex.test(text)) {
      return true; // Reject cabs, trucks, sleepers, logistics, car rentals!
    }
  }
  return false;
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

    // 2. Fetch existing placeIds, phones, AND normalized names in 1 FAST QUERY for STRICT DEDUPLICATION
    let existingPlacesSet = new Set<string>();
    let existingPhonesSet = new Set<string>();
    let existingNamesSet = new Set<string>();
    try {
      const existingLeads = await prisma.lead.findMany({
        select: { placeId: true, phone: true, businessName: true, city: true },
      });
      existingLeads.forEach((l) => {
        if (l.placeId) existingPlacesSet.add(l.placeId);
        if (l.phone) existingPhonesSet.add(l.phone.replace(/[^0-9]/g, ''));
        if (l.businessName && l.city) {
          const key = `${l.businessName.trim().toLowerCase()}_${l.city.trim().toLowerCase()}`;
          existingNamesSet.add(key);
        }
      });
    } catch (e) {}

    // 3. Determine Cities to Scan (Supports Full State Bulk Scanning)
    const targetCities: string[] = city.toLowerCase().includes('full') || city.toLowerCase().includes('24')
      ? ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Hazaribagh', 'Deoghar', 'Giridih', 'Ramgarh', 'Sahibganj', 'Medininagar', 'Chaibasa', 'Dumka']
      : [city];

    const targetKeywords = keywords.slice(0, 15);

    // 4. Run Google Places API searches across Cities & Keywords in Parallel
    const searchQueries: { city: string; keyword: string }[] = [];
    for (const c of targetCities) {
      for (const kw of targetKeywords) {
        searchQueries.push({ city: c, keyword: kw });
      }
    }

    const searchPromises = searchQueries.map(async (item) => {
      const queryText = `${item.keyword} in ${item.city}, ${state}, India`;
      try {
        const searchRes = await searchGooglePlaces({ query: queryText, pageSize: 20 });
        return {
          city: item.city,
          keyword: item.keyword,
          places: searchRes.places || [],
          error: searchRes.success ? null : searchRes.error,
        };
      } catch (err: any) {
        return { city: item.city, keyword: item.keyword, places: [], error: err.message };
      }
    });

    const searchResults = await Promise.all(searchPromises);

    let totalFound = 0;
    let newLeadsCount = 0;
    let duplicateCount = 0;
    let filteredOutCount = 0;
    const leadsToInsert: any[] = [];
    const errorsList: string[] = [];

    // 5. Fast In-Memory Filtering & Triple Deduplication
    for (const resItem of searchResults) {
      const { city: itemCity, keyword, places, error } = resItem;
      if (error) {
        errorsList.push(`Notice for "${keyword}" (${itemCity}): ${error}`);
      }

      totalFound += places.length;

      for (const p of places) {
        const placeId = p.id || `custom-${Date.now()}-${Math.random()}`;
        const businessName = p.displayName?.text || keyword;
        const address = p.formattedAddress || `${itemCity}, ${state}`;

        // FILTER 1: REJECT CABS, TAXIS, TRUCKS, SLEEPERS, LOGISTICS, CARGO, PACKERS & MOVERS
        if (isForbiddenNonBus(businessName, address)) {
          filteredOutCount += 1;
          continue; // Skip irrelevant place!
        }

        const rawPhone = p.nationalPhoneNumber || null;
        const cleanPhone = rawPhone ? rawPhone.replace(/[^0-9]/g, '') : null;
        const website = p.websiteUri || null;
        const rating = p.rating ? Number(p.rating) : null;
        const reviewCount = p.userRatingCount ? Number(p.userRatingCount) : 0;
        const googleMapsUrl = p.googleMapsUri || null;

        const nameKey = `${businessName.trim().toLowerCase()}_${itemCity.trim().toLowerCase()}`;

        // FILTER 2: STRICT TRIPLE DEDUPLICATION (placeId, phone, OR businessName+city)
        const isDuplicatePlace = existingPlacesSet.has(placeId);
        const isDuplicatePhone = cleanPhone && existingPhonesSet.has(cleanPhone);
        const isDuplicateName = existingNamesSet.has(nameKey);

        if (!isDuplicatePlace && !isDuplicatePhone && !isDuplicateName) {
          const { score, temperature } = calculateLeadScore({
            phone: rawPhone,
            website,
            rating,
            reviewCount,
            businessName,
            searchKeyword: keyword,
            address,
          });

          const leadId = `lead-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

          const leadObj = {
            id: leadId,
            placeId,
            businessName,
            phone: rawPhone,
            email: null,
            website,
            address,
            city: itemCity,
            state,
            country: 'India',
            latitude: (p.location as any)?.latitude || null,
            longitude: (p.location as any)?.longitude || null,
            googleMapsUrl,
            rating,
            reviewCount,
            source: 'Google Places',
            searchKeyword: keyword,
            searchKeywordsHistory: keyword,
            leadScore: score,
            leadTemperature: temperature,
            status: 'New',
            assignedToId: null,
          };

          leadsToInsert.push(leadObj);
          existingPlacesSet.add(placeId);
          if (cleanPhone) existingPhonesSet.add(cleanPhone);
          existingNamesSet.add(nameKey);
          newLeadsCount += 1;
        } else {
          duplicateCount += 1;
        }
      }
    }

    // 6. BULK INSERT ALL NEW UNIQUE BUS LEADS IN 1 SINGLE QUERY
    if (leadsToInsert.length > 0) {
      try {
        await prisma.lead.createMany({
          data: leadsToInsert,
          skipDuplicates: true,
        });
      } catch (insertErr) {
        await Promise.all(
          leadsToInsert.map((leadObj) =>
            prisma.lead.create({ data: leadObj }).catch(() => {})
          )
        );
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        totalSearchedKeywords: targetKeywords.length,
        totalFound,
        newLeadsCount,
        duplicatesSkipped: duplicateCount,
        filteredOutNonBus: filteredOutCount,
        errors: errorsList,
      },
      resultsFound: totalFound,
      newLeads: newLeadsCount,
      duplicates: duplicateCount,
      filteredOutNonBus: filteredOutCount,
      leads: leadsToInsert,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
