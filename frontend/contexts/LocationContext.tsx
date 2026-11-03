'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react';
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
}

const LocationContext = createContext<LocationContextValue>({
  position: null,
  isSharing: false,
  error: null,
  isSupported: false,
  startSharing: () => {},
  stopSharing: () => {},
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
      if (!token) return;
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

  const startSharing = useCallback(() => {
    if (!isSupported || isSharing) return;

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
      (err) => setError(err),
      { enableHighAccuracy: true, maximumAge: 5_000, timeout: 15_000 }
    );
    setIsSharing(true);
  }, [isSupported, isSharing, sendUpdate]);

  const stopSharing = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsSharing(false);
    locationApi.stopSharing().catch(() => {});
  }, []);

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
      value={{ position, isSharing, error, isSupported, startSharing, stopSharing }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocationContext() {
  return useContext(LocationContext);
}
