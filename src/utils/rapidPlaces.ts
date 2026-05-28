// Helper functions for RapidAPI Google Map Places New V2 API with built-in Google Maps JS SDK + Local Fuzzy Failbacks
import { POLICE_STATIONS } from '../constants';

const RAPID_KEY = '5f2b24e02emsh645a917bb3f6b5bp1734bbjsn30ba61c92d78';
const RAPID_HOST = 'google-map-places-new-v2.p.rapidapi.com';

const API_KEY =
  (typeof process !== 'undefined' && process.env?.GOOGLE_MAPS_PLATFORM_KEY) ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

export interface AutocompleteSuggestion {
  placePrediction: {
    place: string; // "places/ChIJ..."
    placeId: string;
    text: {
      text: string;
    };
    structuredFormat?: {
      mainText: { text: string };
      secondaryText?: { text: string };
    };
  };
}

export interface PlaceDetails {
  id: string;
  location: {
    latitude: number;
    longitude: number;
  };
  displayName: {
    text: string;
    languageCode: string;
  } | string;
  formattedAddress: string;
}

const LOCAL_LOCATIONS = [
  { name: 'Sitamarhi, Bihar, India', lat: 26.5944, lng: 85.4843, ps: 'Sitamarhi Nagar PS', district: 'Sitamarhi' },
  { name: 'Dumra, Sitamarhi, Bihar, India', lat: 26.5684, lng: 85.4746, ps: 'Dumra PS', district: 'Sitamarhi' },
  { name: 'Riga, Sitamarhi, Bihar, India', lat: 26.6342, lng: 85.3951, ps: 'Riga PS', district: 'Sitamarhi' },
  { name: 'Bairgania, Sitamarhi, Bihar, India', lat: 26.7324, lng: 85.2912, ps: 'Bairgania PS', district: 'Sitamarhi' },
  { name: 'Majorganj, Sitamarhi, Bihar, India', lat: 26.7020, lng: 85.4520, ps: 'Majorganj PS', district: 'Sitamarhi' },
  { name: 'Sursand, Sitamarhi, Bihar, India', lat: 26.6358, lng: 85.6984, ps: 'Sursand PS', district: 'Sitamarhi' },
  { name: 'Pupri, Sitamarhi, Bihar, India', lat: 26.4678, lng: 85.6456, ps: 'Pupri PS', district: 'Sitamarhi' },
  { name: 'Runni Saidpur, Sitamarhi, Bihar, India', lat: 26.3789, lng: 85.5245, ps: 'Runi Saidpur PS', district: 'Sitamarhi' },
  { name: 'Belsand, Sitamarhi, Bihar, India', lat: 26.3721, lng: 85.3456, ps: 'Belsand PS', district: 'Sitamarhi' },
  { name: 'Sheohar, Bihar, India', lat: 26.5050, lng: 85.2950, ps: 'Sheohar PS', district: 'Sheohar' },
  { name: 'Piprahi, Sheohar, Bihar, India', lat: 26.5450, lng: 85.3050, ps: 'Piprahi PS', district: 'Sheohar' },
  { name: 'Tariyani, Sheohar, Bihar, India', lat: 26.4250, lng: 85.2650, ps: 'Tariyani PS', district: 'Sheohar' },
  { name: 'Sitamarhi Railway Station, Sitamarhi, Bihar', lat: 26.5982, lng: 85.4851, ps: 'Sitamarhi Nagar PS', district: 'Sitamarhi' },
  { name: 'Janaki Mandir, Sitamarhi, Bihar, India', lat: 26.6015, lng: 85.4820, ps: 'Sitamarhi Nagar PS', district: 'Sitamarhi' },
  { name: 'Punaura Dham, Sitamarhi, Bihar, India', lat: 26.6080, lng: 85.4542, ps: 'Punaura PS', district: 'Sitamarhi' }
];

export function getLocalFuzzySuggestions(input: string): AutocompleteSuggestion[] {
  const normInput = input.toLowerCase().trim();
  const matches: AutocompleteSuggestion[] = [];

  if (!normInput) {
    // Return curated locations directly when search input is empty or on focus
    LOCAL_LOCATIONS.forEach((loc, index) => {
      matches.push({
        placePrediction: {
          place: `local-curated-${index}`,
          placeId: `local-curated-${index}`,
          text: { text: loc.name },
          structuredFormat: {
            mainText: { text: loc.name.split(',')[0] },
            secondaryText: { text: loc.name.split(',').slice(1).join(',').trim() }
          }
        }
      });
    });
    return matches.slice(0, 10);
  }

  // 1. Check curated locations
  LOCAL_LOCATIONS.forEach((loc, index) => {
    if (loc.name.toLowerCase().includes(normInput) || loc.ps.toLowerCase().includes(normInput) || loc.district.toLowerCase().includes(normInput)) {
      matches.push({
        placePrediction: {
          place: `local-curated-${index}`,
          placeId: `local-curated-${index}`,
          text: { text: loc.name },
          structuredFormat: {
            mainText: { text: loc.name.split(',')[0] },
            secondaryText: { text: loc.name.split(',').slice(1).join(',').trim() }
          }
        }
      });
    }
  });

  // 2. Check remaining police stations that might not be in curated list
  Object.entries(POLICE_STATIONS).forEach(([district, psList]) => {
    psList.forEach((psName, idx) => {
      const alreadyAdded = matches.some(m => m.placePrediction.text.text.toLowerCase().includes(psName.toLowerCase()));
      if (!alreadyAdded && (psName.toLowerCase().includes(normInput) || district.toLowerCase().includes(normInput))) {
        const fullName = `${psName}, ${district}, Bihar, India`;
        matches.push({
          placePrediction: {
            place: `local-ps-${district}-${idx}`,
            placeId: `local-ps-${district}-${idx}`,
            text: { text: fullName },
            structuredFormat: {
              mainText: { text: psName },
              secondaryText: { text: `${district}, Bihar, India` }
            }
          }
        });
      }
    });
  });

  return matches.slice(0, 5);
}

/**
 * Fetch autocomplete suggestions from Google Map Places New V2 API via RapidAPI or fallback to standard JS SDK or local matches
 */
export async function getAutocompleteSuggestions(input: string, biasLatLng?: { lat: number, lng: number }): Promise<AutocompleteSuggestion[]> {
  if (!input.trim()) {
    return getLocalFuzzySuggestions('');
  }

  // -------------------------------------------------------------
  // TIER 1: Standard Google Maps Autocomplete Service (JS SDK)
  // -------------------------------------------------------------
  const g = (typeof window !== 'undefined' ? (window as any).google : null);
  if (hasValidKey && g && g.maps && g.maps.places) {
    try {
      const autocompleteService = new g.maps.places.AutocompleteService();
      const biasLat = biasLatLng?.lat ?? 26.5944;
      const biasLng = biasLatLng?.lng ?? 85.4843;

      const predictions: any[] = await new Promise((resolve, reject) => {
        autocompleteService.getPlacePredictions({
          input,
          locationBias: new g.maps.LatLng(biasLat, biasLng),
          componentRestrictions: { country: 'in' }
        }, (res: any, status: any) => {
          if (status === g.maps.places.PlacesServiceStatus.OK && res) {
            resolve(res);
          } else if (status === g.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
            resolve([]);
          } else {
            reject(new Error(`AutocompleteService error status: ${status}`));
          }
        });
      });

      if (predictions && predictions.length > 0) {
        return predictions.map(pred => ({
          placePrediction: {
            place: `places/${pred.place_id}`,
            placeId: pred.place_id,
            text: {
              text: pred.description
            },
            structuredFormat: {
              mainText: { text: pred.structured_formatting.main_text },
              secondaryText: pred.structured_formatting.secondary_text ? { text: pred.structured_formatting.secondary_text } : undefined
            }
          }
        }));
      }
    } catch (gErr) {
      console.warn('Google Maps AutocompleteService query bypassed or failed, trying RapidAPI:', gErr);
    }
  }

  // -------------------------------------------------------------
  // TIER 2: RapidAPI Places New V2 API
  // -------------------------------------------------------------
  const url = `https://${RAPID_HOST}/v1/places:autocomplete`;
  const biasLat = biasLatLng?.lat ?? 26.5944;
  const biasLng = biasLatLng?.lng ?? 85.4843;

  const payload = {
    input,
    locationBias: {
      circle: {
        center: {
          latitude: biasLat,
          longitude: biasLng
        },
        radius: 45000 // 45km radius (must be <= 50,000 meters)
      }
    },
    includedPrimaryTypes: [],
    includedRegionCodes: [],
    languageCode: 'en',
    regionCode: 'IN',
    origin: {
      latitude: biasLat,
      longitude: biasLng
    },
    inputOffset: 0,
    includeQueryPredictions: true,
    sessionToken: ''
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-rapidapi-key': RAPID_KEY,
        'x-rapidapi-host': RAPID_HOST,
        'X-Goog-FieldMask': '*'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.warn(`Autocomplete API limit or failure (Status ${response.status}). Falling back to local fuzzy suggestion engine.`);
      return getLocalFuzzySuggestions(input);
    }

    const data = await response.json();
    const rawSuggestions = data.suggestions || [];
    
    // Filter and normalize response structure to comply with AutocompleteSuggestion interface
    const validSuggestions = rawSuggestions
      .filter((s: any) => s && s.placePrediction && s.placePrediction.placeId)
      .map((s: any) => {
        const textVal = s.placePrediction.text?.text || '';
        const mainText = s.placePrediction.structuredFormat?.mainText?.text || textVal.split(',')[0] || '';
        const secondaryText = s.placePrediction.structuredFormat?.secondaryText?.text || textVal.split(',').slice(1).join(',').trim() || '';
        return {
          placePrediction: {
            place: s.placePrediction.place || `places/${s.placePrediction.placeId}`,
            placeId: s.placePrediction.placeId,
            text: {
              text: textVal
            },
            structuredFormat: {
              mainText: { text: mainText },
              secondaryText: secondaryText ? { text: secondaryText } : undefined
            }
          }
        };
      });

    return validSuggestions;
  } catch (error: any) {
    console.warn('Error fetching autocomplete suggestions from RapidAPI, using local suggestions fallback:', error.message || error);

    // -------------------------------------------------------------
    // TIER 3: Local Fuzzy Search Fallback (Resilient offline/quota system)
    // -------------------------------------------------------------
    try {
      const localMatches = getLocalFuzzySuggestions(input);
      if (localMatches.length > 0) {
        return localMatches;
      }
    } catch (localErr) {
      console.error('Error in local fuzzy autocomplete fallback:', localErr);
    }

    return [];
  }
}

/**
 * Fetch place details to get latitude/longitude from placeId via RapidAPI or JS SDK or local match
 */
export async function getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
  if (!placeId) return null;

  // Intercept local curated place IDs
  if (placeId.startsWith('local-curated-')) {
    const idx = parseInt(placeId.replace('local-curated-', ''), 10);
    const loc = LOCAL_LOCATIONS[idx];
    if (loc) {
      return {
        id: placeId,
        location: {
          latitude: loc.lat,
          longitude: loc.lng
        },
        displayName: loc.name.split(',')[0],
        formattedAddress: loc.name
      };
    }
  }

  // Intercept local PS place IDs
  if (placeId.startsWith('local-ps-')) {
    const parts = placeId.replace('local-ps-', '').split('-');
    const districtName = parts[0];
    const idx = parseInt(parts[1], 10);
    const psName = POLICE_STATIONS[districtName]?.[idx];
    if (psName) {
      const isSheohar = districtName.toLowerCase() === 'sheohar';
      const baseLat = isSheohar ? 26.5050 : 26.5944;
      const baseLng = isSheohar ? 85.2950 : 85.4843;
      return {
        id: placeId,
        location: {
          latitude: baseLat,
          longitude: baseLng
        },
        displayName: psName,
        formattedAddress: `${psName}, ${districtName}, Bihar, India`
      };
    }
  }

  // Check if standard Google Maps library is loaded
  const g = (typeof window !== 'undefined' ? (window as any).google : null);
  if (hasValidKey && g && g.maps && g.maps.places) {
    try {
      const dummyNode = document.createElement('div');
      const service = new g.maps.places.PlacesService(dummyNode);

      const detailResult: any = await new Promise((resolve, reject) => {
        service.getDetails({
          placeId: placeId,
          fields: ['name', 'geometry', 'formatted_address']
        }, (place: any, status: any) => {
          if (status === g.maps.places.PlacesServiceStatus.OK && place) {
            resolve(place);
          } else {
            reject(new Error(`PlacesService status: ${status}`));
          }
        });
      });

      if (detailResult && detailResult.geometry && detailResult.geometry.location) {
        return {
          id: placeId,
          location: {
            latitude: detailResult.geometry.location.lat(),
            longitude: detailResult.geometry.location.lng()
          },
          displayName: {
            text: detailResult.name,
            languageCode: 'en'
          },
          formattedAddress: detailResult.formatted_address || detailResult.name
        };
      }
    } catch (gErr) {
      console.warn('Google Maps PlacesService query bypassed or failed, trying RapidAPI:', gErr);
    }
  }

  // Fallback to RapidAPI Place Details endpoint
  const url = `https://${RAPID_HOST}/v1/places/${placeId}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': RAPID_KEY,
        'x-rapidapi-host': RAPID_HOST,
        'X-Goog-FieldMask': 'id,location,displayName,formattedAddress'
      }
    });

    if (!response.ok) {
      console.warn(`Place Details API limit/failure (Status ${response.status}). Returning default position.`);
      return {
        id: placeId,
        location: {
          latitude: 26.5944,
          longitude: 85.4843
        },
        displayName: 'Sitamarhi, Bihar, India',
        formattedAddress: 'Sitamarhi, Bihar, India'
      };
    }

    const data = await response.json();
    return data as PlaceDetails;
  } catch (error: any) {
    console.warn('Error fetching place details from RapidAPI, using default coordinates:', error.message || error);
    return {
      id: placeId,
      location: {
        latitude: 26.5944,
        longitude: 85.4843
      },
      displayName: 'Sitamarhi, Bihar, India',
      formattedAddress: 'Sitamarhi, Bihar, India'
    };
  }
}
