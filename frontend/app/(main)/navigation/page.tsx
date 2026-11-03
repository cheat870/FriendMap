'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLocationContext } from '@/contexts/LocationContext';
import { useSocket } from '@/contexts/SocketContext';
import { navigationApi, locationApi } from '@/services/api';
import { RouteResult } from '@/types';
import toast from 'react-hot-toast';
import { Navigation, Users, ArrowLeft } from 'lucide-react';
import Button from '@/components/ui/Button';

// Dynamically import NavigationMap (no SSR)
const NavigationMap = dynamic(() => import('@/components/navigation/NavigationMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
      <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
      <p className="text-sm font-medium text-emerald-400">កំពុងរៀបចំផែនទីនាំផ្លូវ (Loading Turn-by-Turn GPS)...</p>
    </div>
  ),
});

function NavigationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const friendIdParam = searchParams.get('friendId');

  const { user } = useAuth();
  const { position, startSharing } = useLocationContext();
  const { socket } = useSocket();

  const [friend, setFriend] = useState<any | null>(null);
  const [friendsList, setFriendsList] = useState<any[]>([]);
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [transportMode, setTransportMode] = useState<'driving' | 'walking' | 'cycling'>('driving');
  const [hasArrived, setHasArrived] = useState(false);
  const [loadingRoute, setLoadingRoute] = useState(false);

  useEffect(() => {
    startSharing();
  }, [startSharing]);

  useEffect(() => {
    if (!friendIdParam) {
      locationApi.getFriendsLocations().then((res) => {
        if (res.data?.friendsLocations) {
          const list = res.data.friendsLocations.map((item: any) => ({
            ...item.friend,
            location: item.location,
          }));
          setFriendsList(list);
        }
      });
    }
  }, [friendIdParam]);

  useEffect(() => {
    if (friendIdParam) {
      locationApi
        .getFriendLocation(friendIdParam)
        .then((res) => {
          if (res.data) {
            setFriend({
              ...res.data.friend,
              location: res.data.location,
            });
          }
        })
        .catch(() => {
          toast.error('ទីតាំងមិត្តភក្តិមិនអាចទាញយកបានទេ (Friend location not accessible)');
        });
    }
  }, [friendIdParam]);

  const startRoute = useCallback(
    async (targetFriend: any, mode: 'driving' | 'walking' | 'cycling') => {
      if (!position) {
        toast.error('សូមបើក GPS ជាមុនសិន (Please enable GPS)');
        return;
      }
      if (!targetFriend?.location) {
        toast.error('មិនមានទីតាំងមិត្តភក្តិទេ (No friend location available)');
        return;
      }

      setLoadingRoute(true);
      try {
        const destLat = Number(targetFriend.location.latitude);
        const destLng = Number(targetFriend.location.longitude);

        const res = await navigationApi.getRoute({
          targetUserId: targetFriend.id,
          originLat: position.latitude,
          originLng: position.longitude,
          destLat,
          destLng,
          mode,
        });

        if (res.data?.route) {
          setRoute(res.data.route);
          setCurrentStepIndex(0);
          setHasArrived(false);

          const startRes = await navigationApi.start({
            targetUserId: targetFriend.id,
            originLat: position.latitude,
            originLng: position.longitude,
            destLat,
            destLng,
            transportMode: mode,
          });

          if (startRes.data?.session) {
            setSessionId(startRes.data.session.id);
          }
        }
      } catch (err: any) {
        toast.error(err.response?.data?.error || 'បរាជ័យក្នុងការគណនាផ្លូវ (Failed to calculate route)');
      } finally {
        setLoadingRoute(false);
      }
    },
    [position]
  );

  useEffect(() => {
    if (friend && position && !route && !loadingRoute) {
      startRoute(friend, transportMode);
    }
  }, [friend, position, route, loadingRoute, transportMode, startRoute]);

  useEffect(() => {
    if (!sessionId || !position || !friend?.location || hasArrived) return;

    const destLat = Number(friend.location.latitude);
    const destLng = Number(friend.location.longitude);

    navigationApi
      .update(sessionId, {
        userLat: position.latitude,
        userLng: position.longitude,
        destLat,
        destLng,
        transportMode,
      })
      .then((res) => {
        if (res.data?.arrived) {
          setHasArrived(true);
          toast.success('អ្នកបានមកដល់ទីតាំងហើយ! (You have arrived!)');
        } else if (res.data?.recalculatedRoute) {
          setRoute(res.data.recalculatedRoute);
          toast('ផ្លូវត្រូវបានគណនាឡើងវិញ (Route recalculated)', { icon: '🔄' });
        }
      })
      .catch(() => {});
  }, [position, sessionId, friend, transportMode, hasArrived]);

  useEffect(() => {
    if (!socket || !sessionId) return;

    const handleRouteUpdated = (data: any) => {
      if (data.sessionId === sessionId && data.route) {
        setRoute(data.route);
      }
    };

    const handleArrived = (data: any) => {
      if (data.sessionId === sessionId) {
        setHasArrived(true);
      }
    };

    socket.on('navigation:route_updated', handleRouteUpdated);
    socket.on('navigation:arrived', handleArrived);

    return () => {
      socket.off('navigation:route_updated', handleRouteUpdated);
      socket.off('navigation:arrived', handleArrived);
    };
  }, [socket, sessionId]);

  const handleEndNavigation = async () => {
    if (sessionId) {
      try {
        await navigationApi.end(sessionId);
      } catch (e) {
        // ignore
      }
    }
    router.push('/map');
  };

  const handleModeChange = (mode: 'driving' | 'walking' | 'cycling') => {
    setTransportMode(mode);
    if (friend) {
      startRoute(friend, mode);
    }
  };

  if (!friendIdParam || !friend) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col p-4 max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-6 pt-4">
          <button
            onClick={() => router.push('/map')}
            className="p-2 -ml-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">ជ្រើសរើសមិត្តភក្តិដើម្បីនាំផ្លូវ</h1>
        </div>

        <p className="text-xs text-gray-500 mb-4">
          Select a friend who is actively sharing their live GPS location:
        </p>

        {friendsList.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-gray-100 shadow-sm">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-800 text-sm">មិនទាន់មានមិត្តភក្តិចែករំលែកទីតាំង</h3>
            <p className="text-xs text-gray-400 mt-1 mb-6">
              No friends are currently sharing location with you.
            </p>
            <Button variant="primary" onClick={() => router.push('/friends')}>
              ស្វែងរកមិត្តភក្តិ (Find Friends)
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {friendsList.map((f) => (
              <div
                key={f.id}
                onClick={() => {
                  setFriend(f);
                  router.push(`/navigation?friendId=${f.id}`);
                }}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer hover:border-indigo-400 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center font-bold text-indigo-600">
                    {f.displayName?.substring(0, 2) || 'FR'}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">{f.displayName}</h4>
                    <p className="text-xs text-gray-400">@{f.username}</p>
                  </div>
                </div>
                <Navigation className="w-5 h-5 text-indigo-600" />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <NavigationMap
      userLocation={position}
      friend={friend}
      route={route}
      currentStepIndex={currentStepIndex}
      transportMode={transportMode}
      onModeChange={handleModeChange}
      onEndNavigation={handleEndNavigation}
      hasArrived={hasArrived}
    />
  );
}

export default function NavigationPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm font-medium text-emerald-400">កំពុងរៀបចំផែនទីនាំផ្លូវ...</p>
        </div>
      }
    >
      <NavigationContent />
    </Suspense>
  );
}
