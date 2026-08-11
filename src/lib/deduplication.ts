import { prisma } from './db';
import { calculateLeadScore } from './scoring';

export interface RawLeadInput {
  placeId?: string | null;
  businessName: string;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  address?: string | null;
  city: string;
  state: string;
  latitude?: number | null;
  longitude?: number | null;
  googleMapsUrl?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  source?: string;
  searchKeyword?: string | null;
  assignedToId?: string | null;
  notes?: string | null;
}

export function normalizePhoneNumber(phone?: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 7) return null;
  // If Indian mobile number with 91 prefix, take last 10 digits
  if (digits.length >= 10) {
    return digits.slice(-10);
  }
  return digits;
}

export async function processAndSaveLead(input: RawLeadInput): Promise<{
  action: 'CREATED' | 'UPDATED_DUPLICATE';
  lead: any;
}> {
  const normPhone = normalizePhoneNumber(input.phone);

  // 1. Primary deduplication check by placeId
  let existingLead = null;
  if (input.placeId && input.placeId.trim() !== '') {
    existingLead = await prisma.lead.findUnique({
      where: { placeId: input.placeId },
    });
  }

  // 2. Secondary deduplication check by phone number if placeId check missed
  if (!existingLead && normPhone) {
    const leadsWithPhone = await prisma.lead.findMany({
      where: { phone: { not: null } },
      select: { id: true, phone: true, searchKeywordsHistory: true, placeId: true },
    });

    for (const l of leadsWithPhone) {
      if (l.phone && normalizePhoneNumber(l.phone) === normPhone) {
        existingLead = await prisma.lead.findUnique({
          where: { id: l.id },
        });
        break;
      }
    }
  }

  // 3. Handle existing duplicate lead
  if (existingLead) {
    let history: string[] = [];
    try {
      if (existingLead.searchKeywordsHistory) {
        history = JSON.parse(existingLead.searchKeywordsHistory);
      }
    } catch {
      history = [];
    }

    if (input.searchKeyword && !history.includes(input.searchKeyword)) {
      history.push(input.searchKeyword);
    }

    const updatedLead = await prisma.lead.update({
      where: { id: existingLead.id },
      data: {
        lastFoundAt: new Date(),
        searchKeywordsHistory: JSON.stringify(history),
        // Update website or phone if previously missing
        website: existingLead.website || input.website || null,
        phone: existingLead.phone || input.phone || null,
      },
    });

    return {
      action: 'UPDATED_DUPLICATE',
      lead: updatedLead,
    };
  }

  // 4. Calculate score and temperature for new lead
  const { score, temperature } = calculateLeadScore({
    phone: input.phone,
    website: input.website,
    rating: input.rating,
    reviewCount: input.reviewCount,
    businessName: input.businessName,
    searchKeyword: input.searchKeyword,
    address: input.address,
  });

  const history = input.searchKeyword ? [input.searchKeyword] : [];

  const newLead = await prisma.lead.create({
    data: {
      placeId: input.placeId || null,
      businessName: input.businessName,
      phone: input.phone || null,
      email: input.email || null,
      website: input.website || null,
      address: input.address || null,
      city: input.city,
      state: input.state,
      latitude: input.latitude || null,
      longitude: input.longitude || null,
      googleMapsUrl: input.googleMapsUrl || null,
      rating: input.rating || null,
      reviewCount: input.reviewCount || 0,
      source: input.source || 'Google Places',
      searchKeyword: input.searchKeyword || null,
      searchKeywordsHistory: JSON.stringify(history),
      leadScore: score,
      leadTemperature: temperature,
      status: input.assignedToId ? 'Assigned' : 'New',
      assignedToId: input.assignedToId || null,
      notes: input.notes || null,
    },
  });

  // Log creation activity
  await prisma.leadActivity.create({
    data: {
      leadId: newLead.id,
      type: 'Created',
      description: `Lead generated via ${newLead.source} (${input.searchKeyword || 'Manual'})`,
    },
  });

  return {
    action: 'CREATED',
    lead: newLead,
  };
}
