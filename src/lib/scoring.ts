export interface ScoringInput {
  phone?: string | null;
  website?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  businessName: string;
  searchKeyword?: string | null;
  address?: string | null;
}

export interface ScoringWeights {
  phone: number;
  website: number;
  rating: number;
  reviewCount: number;
  keywordName: number;
  keywordRelevance: number;
  address: number;
}

export const DEFAULT_WEIGHTS: ScoringWeights = {
  phone: 25,
  website: 10,
  rating: 10,
  reviewCount: 10,
  keywordName: 25,
  keywordRelevance: 15,
  address: 5,
};

export function calculateLeadScore(
  input: ScoringInput,
  weights: ScoringWeights = DEFAULT_WEIGHTS
): { score: number; temperature: 'HOT' | 'WARM' | 'COLD' } {
  let score = 0;

  // 1. Phone available (Crucial for FOS ground sales outreach)
  if (input.phone && input.phone.trim().length >= 7) {
    score += weights.phone;
  }

  // 2. Website available
  if (input.website && input.website.trim().length > 5) {
    score += weights.website;
  }

  // 3. Rating >= 3.5 (Local stage carriage operators usually have 3.5-4.5)
  if (input.rating && input.rating >= 3.5) {
    score += weights.rating;
  }

  // 4. Review count >= 5
  if (input.reviewCount && input.reviewCount >= 5) {
    score += weights.reviewCount;
  }

  const nameLower = input.businessName.toLowerCase();
  const kwLower = (input.searchKeyword || '').toLowerCase();

  // 5. APNIBUS Target: NON-SLEEPER / STAGE CARRIAGE / SEATER ROUTE BUSES (+30 Points)
  const nonSleeperTargetKeywords = [
    'stage carriage',
    'route bus',
    'roadways',
    'seater',
    'non sleeper',
    'ordinary bus',
    'passenger bus',
    'bus stand',
    'bus service',
    'mini bus',
    'city bus',
    'express bus',
    'transport service',
  ];

  if (nonSleeperTargetKeywords.some((kw) => nameLower.includes(kw) || kwLower.includes(kw))) {
    score += weights.keywordName;
  }

  // 6. PENALIZATION: Pure Sleeper / Luxury Sleeper Bus Operators (-35 Points Penalty)
  // Reason: Sleeper operators use online OTAs (redBus, AbhiBus); Non-sleeper/seater buses need ApniBus POS machines!
  const sleeperKeywords = ['sleeper', 'ac sleeper', 'luxury sleeper', 'multi axle sleeper', 'sleeper coach'];
  if (sleeperKeywords.some((kw) => nameLower.includes(kw) || kwLower.includes(kw))) {
    score -= 35; // Heavy penalty for sleeper bus operators
  }

  // Deduct points for tourist/car rental operators
  const excludeTourist = ['tourist', 'tour & travels', 'tours', 'car rental', 'cab', 'taxi'];
  if (excludeTourist.some((kw) => nameLower.includes(kw)) && !nameLower.includes('bus')) {
    score -= 20;
  }

  // 7. Address available
  if (input.address && input.address.trim().length > 5) {
    score += weights.address;
  }

  // Cap score between 0 and 100
  score = Math.min(100, Math.max(0, score));

  // Determine temperature (HOT >= 75, WARM >= 50)
  let temperature: 'HOT' | 'WARM' | 'COLD' = 'COLD';
  if (score >= 75) {
    temperature = 'HOT';
  } else if (score >= 50) {
    temperature = 'WARM';
  }

  return { score, temperature };
}
