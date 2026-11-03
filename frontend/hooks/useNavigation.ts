import { useState, useCallback, useRef } from 'react';
import { useLocationContext } from '@/contexts/LocationContext';
import { navigationApi } from '@/services/api';
import { NavigationState, RouteResult, TransportMode, LocationCoords } from '@/types';
import { calculateDistance } from '@/services/location.service';
import toast from 'react-hot-toast';

const ARRIVAL_THRESHOLD_M = 50; // meters - consider arrived

const initialState: NavigationState = {
  isNavigating: false,
  route: null,
  currentStep: 0,
  remainingDistance: 0,
  remainingDuration: 0,
  transportMode: 'driving',
  friendId: null,
  hasArrived: false,
};

export function useNavigation() {
  const { position } = useLocationContext();
  const [state, setState] = useState<NavigationState>(initialState);
  const positionRef = useRef<LocationCoords | null>(null);
  positionRef.current = position;

  const startNavigation = useCallback(
    async (friendId: string, mode: TransportMode = 'driving') => {
      const pos = positionRef.current;
      if (!pos) {
        toast.error('Unable to get your location. Please enable GPS.');
        return;
      }
      try {
        const { data } = await navigationApi.getRoute({
          targetUserId: friendId,
          originLat: pos.latitude,
          originLng: pos.longitude,
          mode,
        });
        const route: RouteResult = data.route ?? data;
        setState({
          isNavigating: true,
          route,
          currentStep: 0,
          remainingDistance: route.distance,
          remainingDuration: route.duration,
          transportMode: mode,
          friendId,
          hasArrived: false,
        });
      } catch {
        toast.error('Could not fetch route. Please try again.');
      }
    },
    []
  );

  const startNavigationWithCoords = useCallback(
    async (
      friendId: string,
      destLat: number,
      destLng: number,
      mode: TransportMode = 'driving'
    ) => {
      const pos = positionRef.current;
      if (!pos) {
        toast.error('Unable to get your location. Please enable GPS.');
        return;
      }
      try {
        const { data } = await navigationApi.getRoute({
          targetUserId: friendId,
          originLat: pos.latitude,
          originLng: pos.longitude,
          destLat,
          destLng,
          mode,
        });
        const route: RouteResult = data.route ?? data;
        setState({
          isNavigating: true,
          route,
          currentStep: 0,
          remainingDistance: route.distance,
          remainingDuration: route.duration,
          transportMode: mode,
          friendId,
          hasArrived: false,
        });
      } catch {
        toast.error('Could not fetch route. Please try again.');
      }
    },
    []
  );

  const endNavigation = useCallback(() => {
    setState(initialState);
  }, []);

  const updateProgress = useCallback((currentPos: LocationCoords) => {
    setState((prev) => {
      if (!prev.isNavigating || !prev.route) return prev;

      const dest = prev.route.destination;
      if (!dest) return prev;

      const distToDestination = calculateDistance(
        currentPos.latitude,
        currentPos.longitude,
        dest.latitude,
        dest.longitude
      );

      const hasArrived = distToDestination <= ARRIVAL_THRESHOLD_M;

      let currentStep = prev.currentStep;
      const steps = prev.route.steps;
      if (currentStep < steps.length - 1) {
        const nextStep = steps[currentStep + 1];
        if (nextStep && nextStep.coordinates && nextStep.coordinates[0]) {
          const [nextLat, nextLng] = nextStep.coordinates[0];
          const distToNext = calculateDistance(
            currentPos.latitude,
            currentPos.longitude,
            nextLat,
            nextLng
          );
          if (distToNext <= 20) {
            currentStep += 1;
          }
        }
      }

      return {
        ...prev,
        currentStep,
        remainingDistance: Math.round(distToDestination),
        hasArrived,
      };
    });
  }, []);

  return {
    ...state,
    startNavigation,
    startNavigationWithCoords,
    endNavigation,
    updateProgress,
  };
}
