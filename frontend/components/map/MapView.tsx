'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { Crosshair, Plus, Minus, Search, ShieldCheck } from 'lucide-react';
import FriendDetailSheet from './FriendDetailSheet';
import { calculateDistance } from '@/services/location.service';

interface MapViewProps {
  userLocation: { latitude: number; longitude: number; accuracy?: number } | null;
  friends: any[];
  currentUser: any;
  onNavigateToFriend?: (friend: any) => void;
  activeRoute?: any;
}

// Map Controller helper to handle flyTo / recenter
function MapRecenter({ center, zoom }: { center: [number, number]; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, zoom || map.getZoom(), { duration: 1.2 });
    }
  }, [center, zoom, map]);
  return null;
}

// Custom DivIcon for Current User (Whoo-inspired blue glow pulse)
function createSelfIcon(avatarUrl?: string, displayName?: string) {
  const initials = displayName
    ? displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2)
    : 'ME';

  const avatarContent = avatarUrl
    ? `<img src="${avatarUrl}" class="w-full h-full object-cover rounded-full" alt="Me" />`
    : `<div class="w-full h-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs rounded-full">${initials}</div>`;

  const html = `
    <div class="relative w-12 h-12 flex items-center justify-center">
      <div class="absolute inset-0 rounded-full bg-indigo-500/25 animate-ping"></div>
      <div class="absolute -inset-1 rounded-full border-2 border-indigo-500/40 animate-pulse"></div>
      <div class="w-10 h-10 rounded-full border-2 border-white shadow-xl overflow-hidden bg-white z-10">
        ${avatarContent}
      </div>
      <div class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-blue-500 border-2 border-white z-20 flex items-center justify-center">
        <div class="w-1.5 h-1.5 rounded-full bg-white"></div>
      </div>
    </div>
  `;

  return L.divIcon({
    className: 'custom-self-marker',
    html,
    iconSize: [48, 48],
    iconAnchor: [24, 24],
  });
}

// Custom DivIcon for Friend Markers (Whoo-inspired avatar with online glow & name)
function createFriendIcon(friend: any) {
  const name = friend.displayName || friend.username || 'Friend';
  const isOnline = friend.isOnline || (friend.lastActiveAt && (Date.now() - new Date(friend.lastActiveAt).getTime()) < 300000);

  const initials = name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);

  const avatarContent = friend.avatarUrl
    ? `<img src="${friend.avatarUrl}" class="w-full h-full object-cover rounded-full" alt="${name}" />`
    : `<div class="w-full h-full bg-gradient-to-tr from-cyan-500 to-indigo-500 text-white flex items-center justify-center font-bold text-xs rounded-full">${initials}</div>`;

  const statusBorder = isOnline ? 'border-emerald-500 ring-2 ring-emerald-400/50' : 'border-gray-300';

  const html = `
    <div class="relative flex flex-col items-center cursor-pointer group">
      <div class="relative w-11 h-11 rounded-full border-2 ${statusBorder} bg-white shadow-lg overflow-hidden transition-transform duration-200 group-hover:scale-110">
        ${avatarContent}
      </div>
      ${
        isOnline
          ? `<span class="absolute top-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white"></span>`
          : ''
      }
      <div class="mt-1 px-1.5 py-0.5 rounded-full bg-white/90 backdrop-blur-sm shadow text-[10px] font-semibold text-gray-800 whitespace-nowrap max-w-[80px] truncate border border-gray-100">
        ${name}
      </div>
    </div>
  `;

  return L.divIcon({
    className: 'custom-friend-marker',
    html,
    iconSize: [44, 60],
    iconAnchor: [22, 30],
  });
}

export default function MapView({
  userLocation,
  friends,
  currentUser,
  onNavigateToFriend,
  activeRoute,
}: MapViewProps) {
  const [selectedFriend, setSelectedFriend] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);

  // Default coordinate (Phnom Penh center if user GPS not yet resolved)
  const defaultCenter: [number, number] = useMemo(() => {
    if (userLocation) return [userLocation.latitude, userLocation.longitude];
    return [11.5564, 104.9282];
  }, [userLocation]);

  // Self Icon
  const selfIcon = useMemo(() => {
    return createSelfIcon(currentUser?.avatarUrl, currentUser?.displayName);
  }, [currentUser]);

  // Recenter to user's real GPS
  const handleRecenter = useCallback(() => {
    if (userLocation) {
      setMapCenter([userLocation.latitude, userLocation.longitude]);
    }
  }, [userLocation]);

  // Filter friends with valid coordinates
  const friendsWithDistance = useMemo(() => {
    return friends
      .filter((f) => f.location && f.location.latitude && f.location.longitude)
      .map((f) => {
        let distanceMeters: number | undefined;
        if (userLocation) {
          distanceMeters = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            Number(f.location.latitude),
            Number(f.location.longitude)
          );
        }
        return {
          ...f,
          distanceMeters,
        };
      });
  }, [friends, userLocation]);

  const filteredFriends = useMemo(() => {
    if (!searchQuery.trim()) return friendsWithDistance;
    return friendsWithDistance.filter(
      (f) =>
        f.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.username?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [friendsWithDistance, searchQuery]);

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] overflow-hidden bg-slate-100">
      {/* Search Bar Overlay */}
      <div className="absolute top-4 left-4 right-4 z-20 max-w-md mx-auto">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-gray-100 flex items-center px-3.5 py-2">
          <Search className="w-4 h-4 text-gray-400 mr-2.5 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ស្វែងរកមិត្តភក្តិលើផែនទី... (Search friends on map)"
            className="w-full bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs text-gray-400 hover:text-gray-600 px-1.5"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Interactive Leaflet Map */}
      <MapContainer
        center={defaultCenter}
        zoom={14}
        zoomControl={false}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {mapCenter && <MapRecenter center={mapCenter} />}

        {/* User GPS Accuracy Circle & Marker */}
        {userLocation && (
          <>
            <Circle
              center={[userLocation.latitude, userLocation.longitude]}
              radius={Math.min(userLocation.accuracy || 30, 200)}
              pathOptions={{
                color: '#4F46E5',
                fillColor: '#6366F1',
                fillOpacity: 0.15,
                weight: 1.5,
              }}
            />
            <Marker
              position={[userLocation.latitude, userLocation.longitude]}
              icon={selfIcon}
            />
          </>
        )}

        {/* Friends Markers */}
        {filteredFriends.map((friend) => (
          <Marker
            key={friend.id}
            position={[Number(friend.location.latitude), Number(friend.location.longitude)]}
            icon={createFriendIcon(friend)}
            eventHandlers={{
              click: () => {
                setSelectedFriend(friend);
                setMapCenter([Number(friend.location.latitude), Number(friend.location.longitude)]);
              },
            }}
          />
        ))}

        {/* Route Polyline if active */}
        {activeRoute && (
          <Polyline
            positions={
              Array.isArray(activeRoute.geometry)
                ? activeRoute.geometry
                : activeRoute.geometry?.coordinates
                ? activeRoute.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]])
                : []
            }
            pathOptions={{
              color: '#4F46E5',
              weight: 6,
              opacity: 0.85,
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
        )}
      </MapContainer>

      {/* Floating Action Controls (Right Bottom) */}
      <div className="absolute right-4 bottom-24 z-20 flex flex-col gap-2.5">
        <button
          onClick={handleRecenter}
          className="w-12 h-12 bg-white rounded-2xl shadow-xl border border-gray-100 flex items-center justify-center text-indigo-600 hover:bg-indigo-50 active:scale-95 transition-all"
          title="My Location"
        >
          <Crosshair className="w-5 h-5" />
        </button>
      </div>

      {/* Bottom Sheet for selected friend */}
      {selectedFriend && (
        <FriendDetailSheet
          friend={selectedFriend}
          userLocation={userLocation}
          onClose={() => setSelectedFriend(null)}
          onGetDirections={(friend) => {
            if (onNavigateToFriend) {
              onNavigateToFriend(friend);
            }
          }}
        />
      )}
    </div>
  );
}
