import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { friendsApi } from '@/services/api';
import toast from 'react-hot-toast';

export function useFriends() {
  const qc = useQueryClient();

  const friendsQuery = useQuery({
    queryKey: ['friends'],
    queryFn: async () => {
      const { data } = await friendsApi.list();
      return data;
    },
    staleTime: 30_000,
  });

  const pendingQuery = useQuery({
    queryKey: ['friends', 'pending'],
    queryFn: async () => {
      const { data } = await friendsApi.pending();
      return data;
    },
    staleTime: 15_000,
  });

  const sendRequest = useMutation({
    mutationFn: (userId: string) => friendsApi.sendRequest(userId),
    onSuccess: () => {
      toast.success('Friend request sent!');
      qc.invalidateQueries({ queryKey: ['friends'] });
    },
    onError: () => toast.error('Failed to send friend request'),
  });

  const acceptRequest = useMutation({
    mutationFn: (requestId: string) => friendsApi.accept(requestId),
    onSuccess: () => {
      toast.success('Friend request accepted!');
      qc.invalidateQueries({ queryKey: ['friends'] });
    },
    onError: () => toast.error('Failed to accept request'),
  });

  const rejectRequest = useMutation({
    mutationFn: (requestId: string) => friendsApi.reject(requestId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['friends', 'pending'] });
    },
    onError: () => toast.error('Failed to reject request'),
  });

  const cancelRequest = useMutation({
    mutationFn: (requestId: string) => friendsApi.cancel(requestId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['friends', 'pending'] });
    },
  });

  const removeFriend = useMutation({
    mutationFn: (friendId: string) => friendsApi.remove(friendId),
    onSuccess: () => {
      toast.success('Friend removed');
      qc.invalidateQueries({ queryKey: ['friends'] });
    },
    onError: () => toast.error('Failed to remove friend'),
  });

  return {
    friends: friendsQuery.data ?? [],
    friendsLoading: friendsQuery.isLoading,
    pending: pendingQuery.data ?? [],
    pendingLoading: pendingQuery.isLoading,
    sendRequest,
    acceptRequest,
    rejectRequest,
    cancelRequest,
    removeFriend,
  };
}
