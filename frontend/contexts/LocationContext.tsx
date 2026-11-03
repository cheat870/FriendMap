'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react';
import Cookies from 'js-cookie';
import { locationApi } from '@/services/api';
import { useAuthStore } from '@/contexts/AuthContext';
import { LocationCoords } from '@/types';

interface LocationContextValue {
  position: LocationCoords | null;
  isSharing: boolean;
  error: GeolocationPositionError | null;
  isSupported: boolean;
  startSharing: () => void;
  stopSharing: () => void;
  requestLocation: () => void;
}

const LocationContext = createContext<LocationContextValue>({
  position: null,
  isSharing: false,
  error: null,
  isSupported: false,
  startSharing: () => {},
  stopSharing: () => {},
  requestLocation: () => {},
});

const MIN_DISTANCE_M = 5;   // send update if moved ≥ 5 m
const MAX_INTERVAL_MS = 10_000; // or every 10 seconds

function haversineMeters(a: LocationCoords, b: LocationCoords): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const ha =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) *
      Math.cos(toRad(b.latitude)) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(ha), Math.sqrt(1 - ha));
}

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore();
  const [position, setPosition] = useState<LocationCoords | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<GeolocationPositionError | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastSentRef = useRef<{ pos: LocationCoords; ts: number } | null>(null);

  const isSupported =
    typeof window !== 'undefined' && 'geolocation' in navigator;

  const sendUpdate = useCallback(
    async (coords: LocationCoords) => {
      const activeToken =
        token ||
        useAuthStore.getState().token ||
        Cookies.get('fm_token');
      if (!activeToken) return;
      try {
        await locationApi.update({
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy,
          heading: coords.heading,
          speed: coords.speed,
        });
        lastSentRef.current = { pos: coords, ts: Date.now() };
      } catch {
        // silently ignore network errors for location updates
      }
    },
    [token]
  );

  const requestLocation = useCallback(() => {
    if (!isSupported) return;

    const onSuccess = (pos: GeolocationPosition) => {
      const coords: LocationCoords = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        altitude: pos.coords.altitude,
        heading: pos.coords.heading,
        speed: pos.coords.speed,
      };
      setPosition(coords);
      setError(null);
      sendUpdate(coords);
    };

    const onError = (err: GeolocationPositionError) => {
      console.warn('Geolocation high accuracy fallback:', err);
      // Fallback for timeout or position unavailable
      navigator.geolocation.getCurrentPosition(
        onSuccess,
        (fallbackErr) => {
          console.warn('Geolocation low accuracy error:', fallbackErr);
          setError(fallbackErr);
        },
        {
          enableHighAccuracy: false,
          timeout: 20000,
          maximumAge: 30000,
        }
      );
    };

    navigator.geolocation.getCurrentPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5000,
    });
  }, [isSupported, sendUpdate]);

  const startSharing = useCallback(() => {
    if (!isSupported) return;

    // Trigger instant position fix
    requestLocation();

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const coords: LocationCoords = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          altitude: pos.coords.altitude,
          heading: pos.coords.heading,
          speed: pos.coords.speed,
        };
        setPosition(coords);
        setError(null);

        // Throttle: send if moved ≥ 5 m or 10 s elapsed
        const last = lastSentRef.current;
        const now = Date.now();
        if (
          !last ||
          haversineMeters(last.pos, coords) >= MIN_DISTANCE_M ||
          now - last.ts >= MAX_INTERVAL_MS
        ) {
          sendUpdate(coords);
        }
      },
      (err) => {
        console.warn('Geolocation watch error:', err);
        setError(err);
      },
      { enableHighAccuracy: true, maximumAge: 5_000, timeout: 25_000 }
    );
    setIsSharing(true);
  }, [isSupported, requestLocation, sendUpdate]);

  const stopSharing = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsSharing(false);
    locationApi.stopSharing().catch(() => {});
  }, []);

  // 1. Auto-start sharing whenever user is authenticated anywhere in the app
  useEffect(() => {
    const activeToken = token || Cookies.get('fm_token');
    if (activeToken && isSupported) {
      startSharing();
    }
  }, [token, isSupported, startSharing]);

  // 2. Restore last stored location from backend on initial mount
  useEffect(() => {
    const activeToken = token || Cookies.get('fm_token');
    if (activeToken && !position) {
      locationApi
        .getMyLocation()
        .then((res) => {
          if (res.data?.location) {
            const loc = res.data.location;
            setPosition({
              latitude: Number(loc.latitude),
              longitude: Number(loc.longitude),
              accuracy: loc.accuracy,
              heading: loc.heading,
              speed: loc.speed,
            });
          }
        })
        .catch(() => {});
    }
  }, [token, position]);

  // 3. Periodic heartbeat (every 25s) to guarantee server has fresh coordinates even for stationary PCs/laptops
  useEffect(() => {
    const activeToken = token || Cookies.get('fm_token');
    if (!activeToken || !position) return;
    const interval = setInterval(() => {
      sendUpdate(position);
    }, 25000);
    return () => clearInterval(interval);
  }, [token, position, sendUpdate]);

  // Auto-stop on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return (
    <LocationContext.Provider
      value={{ position, isSharing, error, isSupported, startSharing, stopSharing, requestLocation }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocationContext() {
  return useContext(LocationContext);
}
