import { useSocketContext } from '@/contexts/SocketContext';

export function useSocket() {
  return useSocketContext();
}
