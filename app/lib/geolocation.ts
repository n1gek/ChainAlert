export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: Date;
}

export interface AddressData {
  city?: string;
  state?: string;
  country?: string;
  county?: string;
  suburb?: string;
  neighbourhood?: string;
  town?: string;
  village?: string;
  fullAddress: string;
}

export function getUserLocation(): Promise<LocationData> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported by this browser"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date(position.timestamp)
        });
      },
      (error) => {
        let errorMessage = "Unknown error occurred";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "User denied location permission";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out";
            break;
        }
        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy: true, // GPS if available
        timeout: 10000, // 10 seconds max wait
        maximumAge: 0 
      }
    );
  });
}

/**
 * Get address information from coordinates using OpenStreetMap (free, no API key)
 * @param lat Latitude
 * @param lng Longitude
 * @returns Promise with address data
 */
export async function getAddressFromCoords(
  lat: number,
  lng: number
): Promise<AddressData> {
  try {
    // OpenStreetMap Nominatim - Free reverse geocoding
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      {
        headers: {
          'User-Agent': 'ChainAlert-SafetyApp' // Required by OSM
        }
      }
    );

    if (!response.ok) {
      throw new Error('Geocoding request failed');
    }

    const data = await response.json();

    return {
      city: data.address?.city,
      town: data.address?.town,
      village: data.address?.village,
      suburb: data.address?.suburb,
      neighbourhood: data.address?.neighbourhood,
      county: data.address?.county,
      state: data.address?.state,
      country: data.address?.country,
      fullAddress: data.display_name
    };
  } catch (error) {
    console.error('Error getting address:', error);
    return {
      fullAddress: `${lat.toFixed(6)}, ${lng.toFixed(6)}`
    };
  }
}

/**
 * Get user location with address information
 * @returns Promise with location and address data
 */
export async function getLocationWithAddress(): Promise<{
  location: LocationData;
  address: AddressData;
}> {
  const location = await getUserLocation();
  const address = await getAddressFromCoords(
    location.latitude,
    location.longitude
  );

  return { location, address };
}

/**
 * Format location data for Firestore storage
 */
export function formatLocationForStorage(location: LocationData, address?: AddressData) {
  return {
    coordinates: {
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy
    },
    address: address ? {
      city: address.city || null,
      town: address.town || null,
      village: address.village || null,
      suburb: address.suburb || null,
      neighbourhood: address.neighbourhood || null,
      county: address.county || null,
      state: address.state || null,
      country: address.country || null,
      formatted: address.fullAddress
    } : null,
    timestamp: location.timestamp.toISOString()
  };
}


export function isGeolocationAvailable(): boolean {
  return 'geolocation' in navigator;
}
