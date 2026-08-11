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
  const apiKey = process.env.GOOGLE_API_KEY;

  if (!apiKey || apiKey.trim() === '' || apiKey === 'your_google_places_api_key_here') {
    return {
      success: false,
      places: [],
      error: 'Google Places API Key is not configured in .env file. You can still import CSV files or create leads manually.',
      errorCode: 'API_KEY_MISSING',
    };
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
      if (response.status === 400 || response.status === 403) {
        return {
          success: false,
          places: [],
          error: data.error?.message || 'Invalid API key or Places API is not enabled in Google Cloud Console.',
          errorCode: 'API_KEY_INVALID',
        };
      }
      if (response.status === 429) {
        return {
          success: false,
          places: [],
          error: 'Google Places API quota exceeded or rate limited. Please try again later.',
          errorCode: 'QUOTA_EXCEEDED',
        };
      }
      return {
        success: false,
        places: [],
        error: data.error?.message || `Google API error (Status ${response.status})`,
        errorCode: 'API_ERROR',
      };
    }

    const places = data.places || [];
    return {
      success: true,
      places,
    };
  } catch (err: any) {
    return {
      success: false,
      places: [],
      error: err.message || 'Failed to connect to Google Places API.',
      errorCode: 'NETWORK_ERROR',
    };
  }
}
