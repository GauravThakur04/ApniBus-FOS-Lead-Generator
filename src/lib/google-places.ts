import { prisma } from '@/lib/db';

export interface GooglePlaceItem {
  id: string;
  displayName?: {
    text: string;
    languageCode?: string;
  };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  websiteUri?: string;
  googleMapsUri?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  rating?: number;
  userRatingCount?: number;
}

export interface GooglePlacesSearchResponse {
  places?: GooglePlaceItem[];
  error?: {
    code: number;
    message: string;
    status: string;
  };
}

export interface SearchOptions {
  query: string;
  pageSize?: number;
}

export async function searchGooglePlaces(options: SearchOptions): Promise<{
  success: boolean;
  places: GooglePlaceItem[];
  error?: string;
  errorCode?: string;
}> {
  let apiKey = process.env.GOOGLE_API_KEY;

  if (!apiKey || apiKey.trim() === '' || apiKey === 'your_google_places_api_key_here') {
    // Fallback to database setting
    try {
      const dbKeySetting = await prisma.setting.findUnique({ where: { key: 'googleApiKey' } });
      if (dbKeySetting && dbKeySetting.value && dbKeySetting.value.trim() !== '') {
        apiKey = dbKeySetting.value.trim();
      }
    } catch (e) {}
  }

  // Hardcoded fallback key if env is empty on mobile devices
  if (!apiKey || apiKey.trim() === '' || apiKey === 'your_google_places_api_key_here') {
    apiKey = 'AIzaSyB0VrT7ScxEmBReMhWo3vj6CozNAqXRbJM';
  }

  const endpoint = 'https://places.googleapis.com/v1/places:searchText';
  const fieldMask = [
    'places.id',
    'places.displayName',
    'places.formattedAddress',
    'places.nationalPhoneNumber',
    'places.websiteUri',
    'places.googleMapsUri',
    'places.location',
    'places.rating',
    'places.userRatingCount',
  ].join(',');

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': fieldMask,
      },
      body: JSON.stringify({
        textQuery: options.query,
        pageSize: options.pageSize || 20,
      }),
    });

    const data: GooglePlacesSearchResponse = await response.json();

    if (!response.ok) {
      return {
        success: false,
        places: [],
        error: data.error?.message || 'Failed to search Google Places API',
        errorCode: 'API_ERROR',
      };
    }

    return {
      success: true,
      places: data.places || [],
    };
  } catch (error: any) {
    return {
      success: false,
      places: [],
      error: error.message || 'Network error connecting to Google Places API',
      errorCode: 'NETWORK_ERROR',
    };
  }
}
