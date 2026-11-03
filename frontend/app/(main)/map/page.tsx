'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useLocationContext } from '@/contexts/LocationContext';
import { useSocket } from '@/contexts/SocketContext';
import { locationApi } from '@/services/api';
import toast from 'react-hot-toast';

// Dynamically import Leaflet Map (no SSR)
const MapView = dynamic(() => import('@/components/map/MapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[calc(100vh-4rem)] bg-slate-100 flex flex-col items-center justify-center">
      <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
      <p className="text-sm font-medium text-gray-500">កំពុងដំណើរការផែនទី (Loading interactive map)...</p>
    </div>
  ),
});

export default function MapPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { position, startSharing } = useLocationContext();
  const { socket } = useSocket();
  const [friends, setFriends] = useState<any[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(true);

  // Request GPS sharing on mount
  useEffect(() => {
    startSharing();
  }, [startSharing]);

  // Load authorized friends locations from API
  const fetchFriendsLocations = async () => {
    try {
      const res = await locationApi.getFriendsLocations();
      if (res.data?.friendsLocations) {
        const formatted = res.data.friendsLocations.map((item: any) => ({
          ...item.friend,
          location: item.location,
          permission: item.permission,
        }));
        setFriends(formatted);
      }
    } catch (err) {
      console.error('Failed to load friends locations:', err);
    } finally {
      setLoadingFriends(false);
    }
  };

  useEffect(() => {
    fetchFriendsLocations();
    const interval = setInterval(fetchFriendsLocations, 20000);
    return () => clearInterval(interval);
  }, []);

  // Listen to Socket.IO real-time friend updates
  useEffect(() => {
    if (!socket) return;

    const handleFriendUpdated = (data: any) => {
      setFriends((prev) => {
        const index = prev.findIndex((f) => f.id === data.userId);
        if (index !== -1) {
          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            location: {
              ...updated[index].location,
              latitude: data.latitude,
              longitude: data.longitude,
              accuracy: data.accuracy,
              heading: data.heading,
              speed: data.speed,
              recordedAt: data.recordedAt || new Date().toISOString(),
            },
            isOnline: true,
          };
          return updated;
        }
        return prev;
      });
    };

    const handleSharingStopped = (data: any) => {
      setFriends((prev) => prev.filter((f) => f.id !== data.userId));
    };

    socket.on('location:friend_updated', handleFriendUpdated);
    socket.on('location:sharing_stopped', handleSharingStopped);

    return () => {
      socket.off('location:friend_updated', handleFriendUpdated);
      socket.off('location:sharing_stopped', handleSharingStopped);
    };
  }, [socket]);

  return (
    <MainLayout showNav={true} showBottom={true}>
      <div className="relative w-full h-[calc(100vh-4rem)]">
        <MapView
          userLocation={position}
          friends={friends}
          currentUser={user}
          onNavigateToFriend={(friend) => {
            router.push(`/navigation?friendId=${friend.id}`);
          }}
        />
      </div>
    </MainLayout>
  );
}
