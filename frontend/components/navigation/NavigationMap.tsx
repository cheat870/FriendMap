'use client';

import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Car, Footprints, Bike, X, Compass, CheckCircle2 } from 'lucide-react';
import TurnInstruction from './TurnInstruction';
import { RouteResult, RouteStep } from '@/types';
import { formatDistance, formatDuration } from '@/services/location.service';

interface NavigationMapProps {
  userLocation: { latitude: number; longitude: number; heading?: number | null; speed?: number | null } | null;
  friend: any;
  route: RouteResult | null;
  currentStepIndex: number;
  transportMode: 'driving' | 'walking' | 'cycling';
  onModeChange: (mode: 'driving' | 'walking' | 'cycling') => void;
  onEndNavigation: () => void;
  hasArrived: boolean;
}

// Auto-follow navigator position
function AutoFollow({ position }: { position: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (position && position[0] && position[1]) {
      map.setView(position, 16, { animate: true });
    }
  }, [position, map]);
  return null;
}

// User location marker with direction bearing
function createNavigatorIcon(heading?: number | null) {
  const rotation = heading || 0;
  const html = `
    <div class="relative w-12 h-12 flex items-center justify-center">
      <div class="w-10 h-10 rounded-full bg-blue-600 border-4 border-white shadow-2xl flex items-center justify-center text-white" style="transform: rotate(${rotation}deg);">
        <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>
        </svg>
      </div>
    </div>
  `;
  return L.divIcon({
    className: 'navigator-marker',
    html,
    iconSize: [48, 48],
    iconAnchor: [24, 24],
  });
}

// Destination marker
function createDestinationIcon(friend: any) {
  const avatar = friend?.avatarUrl
    ? `<img src="${friend.avatarUrl}" class="w-full h-full object-cover rounded-full" alt="Target" />`
    : `<div class="w-full h-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs rounded-full">DEST</div>`;

  const html = `
    <div class="relative flex flex-col items-center">
      <div class="w-12 h-12 rounded-full border-3 border-emerald-500 bg-white shadow-2xl overflow-hidden ring-4 ring-emerald-300/40">
        ${avatar}
      </div>
      <div class="mt-1 px-2 py-0.5 rounded-full bg-emerald-600 text-white font-bold text-[10px] shadow">
        ${friend?.displayName || 'Target'}
      </div>
    </div>
  `;
  return L.divIcon({
    className: 'destination-marker',
    html,
    iconSize: [48, 64],
    iconAnchor: [24, 48],
  });
}

export default function NavigationMap({
  userLocation,
  friend,
  route,
  currentStepIndex,
  transportMode,
  onModeChange,
  onEndNavigation,
  hasArrived,
}: NavigationMapProps) {
  const currentStep = route?.steps?.[currentStepIndex] || null;
  const nextStep = route?.steps?.[currentStepIndex + 1] || null;

  const userPos: [number, number] = useMemo(() => {
    if (userLocation) return [userLocation.latitude, userLocation.longitude];
    return [11.5564, 104.9282];
  }, [userLocation]);

  const destPos: [number, number] = useMemo(() => {
    if (friend?.location) return [Number(friend.location.latitude), Number(friend.location.longitude)];
    return [11.5684, 104.9312];
  }, [friend]);

  const navIcon = useMemo(() => {
    return createNavigatorIcon(userLocation?.heading);
  }, [userLocation?.heading]);

  const destIcon = useMemo(() => {
    return createDestinationIcon(friend);
  }, [friend]);

  // ETA calculation
  const etaFormatted = useMemo(() => {
    if (!route?.duration) return '--:--';
    const arrivalDate = new Date(Date.now() + route.duration * 1000);
    return arrivalDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, [route?.duration]);

  // Parse polyline positions safely
  const polylinePositions: [number, number][] = useMemo(() => {
    if (!route?.geometry) return [];
    if (Array.isArray(route.geometry)) {
      return route.geometry as [number, number][];
    }
    if (route.geometry.coordinates && Array.isArray(route.geometry.coordinates)) {
      return route.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);
    }
    return [];
  }, [route?.geometry]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-900">
      {/* Top Turn Instruction Panel */}
      <div className="absolute top-4 inset-x-4 z-20 max-w-lg mx-auto">
        <TurnInstruction step={currentStep} nextStep={nextStep} />
      </div>

      {/* Center Leaflet Navigation Map */}
      <MapContainer
        center={userPos}
        zoom={16}
        zoomControl={false}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {userLocation && <AutoFollow position={userPos} />}

        {/* Navigator Marker */}
        {userLocation && <Marker position={userPos} icon={navIcon} />}

        {/* Destination Marker */}
        <Marker position={destPos} icon={destIcon} />

        {/* Blue Navigation Route Polyline */}
        {polylinePositions.length > 0 && (
          <Polyline
            positions={polylinePositions}
            pathOptions={{
              color: '#3B82F6',
              weight: 8,
              opacity: 0.9,
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
        )}
      </MapContainer>

      {/* Bottom Summary Bar (Google Maps style) */}
      <div className="absolute bottom-6 inset-x-4 z-20 max-w-lg mx-auto">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            {/* ETA & Distance */}
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-emerald-600">
                  {route?.duration ? formatDuration(route.duration) : '--'}
                </span>
                <span className="text-sm font-semibold text-gray-500">
                  ({route?.distance ? formatDistance(route.distance) : '--'})
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                មកដល់នៅម៉ោង (ETA): <span className="font-semibold text-gray-700">{etaFormatted}</span>
              </p>
            </div>

            {/* Mode Selector */}
            <div className="flex items-center bg-gray-100 p-1 rounded-2xl gap-1">
              <button
                onClick={() => onModeChange('driving')}
                className={`p-2 rounded-xl transition-colors ${
                  transportMode === 'driving' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400'
                }`}
                title="Driving"
              >
                <Car className="w-4 h-4" />
              </button>
              <button
                onClick={() => onModeChange('walking')}
                className={`p-2 rounded-xl transition-colors ${
                  transportMode === 'walking' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400'
                }`}
                title="Walking"
              >
                <Footprints className="w-4 h-4" />
              </button>
              <button
                onClick={() => onModeChange('cycling')}
                className={`p-2 rounded-xl transition-colors ${
                  transportMode === 'cycling' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400'
                }`}
                title="Cycling"
              >
                <Bike className="w-4 h-4" />
              </button>
            </div>

            {/* End Navigation Button */}
            <button
              onClick={onEndNavigation}
              className="w-12 h-12 bg-red-500 hover:bg-red-600 active:scale-95 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-red-200 transition-all shrink-0"
              title="End Navigation"
            >
              <X className="w-6 h-6 stroke-[3]" />
            </button>
          </div>
        </div>
      </div>

      {/* Arrival Notification Modal */}
      {hasArrived && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95">
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-gray-900">អ្នកបានមកដល់ហើយ!</h2>
            <p className="text-sm text-gray-500 mt-1 mb-6">
              You have arrived at your friend's location ({friend?.displayName}).
            </p>
            <button
              onClick={onEndNavigation}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-200 transition-colors"
            >
              បញ្ចប់ការនាំផ្លូវ (End Navigation)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
