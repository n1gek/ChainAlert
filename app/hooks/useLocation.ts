import { useState, useEffect, useCallback } from 'react';
import { 
  getUserLocation, 
  getLocationWithAddress, 
  isGeolocationAvailable,
  LocationData,
  AddressData
} from '../lib/geolocation';

interface UseLocationState {
  location: LocationData | null;
  address: AddressData | null;
  loading: boolean;
  error: string | null;
  permissionDenied: boolean;
}

interface UseLocationReturn extends UseLocationState {
  requestLocation: () => Promise<void>;
  requestLocationWithAddress: () => Promise<void>;
  isAvailable: boolean;
}

/**
 * Hook for accessing user's geolocation
 * @param autoRequest - Automatically request location on mount
 * @returns Location state and request functions
 */
export function useLocation(autoRequest: boolean = false): UseLocationReturn {
  const [state, setState] = useState<UseLocationState>({
    location: null,
    address: null,
    loading: false,
    error: null,
    permissionDenied: false
  });

  const requestLocation = useCallback(async () => {
    if (!isGeolocationAvailable()) {
      setState(prev => ({
        ...prev,
        error: 'Geolocation is not supported by your browser',
        loading: false
      }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const location = await getUserLocation();
      setState(prev => ({
        ...prev,
        location,
        loading: false,
        error: null,
        permissionDenied: false
      }));
    } catch (error) {
      const errorMessage = (error as Error).message;
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
        permissionDenied: errorMessage.includes('denied')
      }));
    }
  }, []);

  const requestLocationWithAddress = useCallback(async () => {
    if (!isGeolocationAvailable()) {
      setState(prev => ({
        ...prev,
        error: 'Geolocation is not supported by your browser',
        loading: false
      }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const { location, address } = await getLocationWithAddress();
      setState(prev => ({
        ...prev,
        location,
        address,
        loading: false,
        error: null,
        permissionDenied: false
      }));
    } catch (error) {
      const errorMessage = (error as Error).message;
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
        permissionDenied: errorMessage.includes('denied')
      }));
    }
  }, []);

  useEffect(() => {
    if (autoRequest) {
      requestLocation();
    }
  }, [autoRequest, requestLocation]);

  return {
    ...state,
    requestLocation,
    requestLocationWithAddress,
    isAvailable: isGeolocationAvailable()
  };
}

