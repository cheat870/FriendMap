import { useEffect, useRef, useState, useCallback } from 'react';
import { LocationCoords } from '@/types';

interface UseGeolocationReturn {
  position: LocationCoords | null;
  error: GeolocationPositionError | null;
  isSupported: boolean;
  isWatching: boolean;
  startWatch: () => void;
  stopWatch: () => void;
  requestOnce: () => void;
}

export function useGeolocation(autoStart = false): UseGeolocationReturn {
  const [position, setPosition] = useState<LocationCoords | null>(null);
  const [error, setError] = useState<GeolocationPositionError | null>(null);
  const [isWatching, setIsWatching] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  const isSupported =
    typeof window !== 'undefined' && 'geolocation' in navigator;

  const handleSuccess = (pos: GeolocationPosition) => {
    setPosition({
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
      altitude: pos.coords.altitude,
      heading: pos.coords.heading,
      speed: pos.coords.speed,
    });
    setError(null);
  };

  const handleError = (err: GeolocationPositionError) => {
    setError(err);
  };

  const options: PositionOptions = {
    enableHighAccuracy: true,
    maximumAge: 5_000,
    timeout: 15_000,
  };

  const startWatch = useCallback(() => {
    if (!isSupported || isWatching) return;
    watchIdRef.current = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      options
    );
    setIsWatching(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSupported, isWatching]);

  const stopWatch = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsWatching(false);
  }, []);

  const requestOnce = useCallback(() => {
    if (!isSupported) return;
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, options);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSupported]);

  useEffect(() => {
    if (autoStart) startWatch();
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  return { position, error, isSupported, isWatching, startWatch, stopWatch, requestOnce };
}
