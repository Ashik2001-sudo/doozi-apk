import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { config, getResolvedTenantId } from '@/lib/config';
import { getCachedItem } from '@/lib/mobile-storage';

interface RealtimeContextValue {
  socket: Socket | null;
  connected: boolean;
}

const RealtimeSocketContext = createContext<RealtimeContextValue>({
  socket: null,
  connected: false,
});

export function RealtimeSocketProvider({ children }: { children: React.ReactNode }) {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const tenantId = getResolvedTenantId();
    const branchId = getCachedItem('selectedBranchId') || '';
    if (!tenantId) return;

    const socket = io(`${config.API_URL.replace(/\/$/, '')}/realtime`, {
      query: { tenantId, branchId },
      transports: ['polling', 'websocket'],
    });
    socketRef.current = socket;
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const value = useMemo(
    () => ({ socket: socketRef.current, connected }),
    [connected],
  );

  return (
    <RealtimeSocketContext.Provider value={value}>{children}</RealtimeSocketContext.Provider>
  );
}

export function useRealtimeSocket() {
  return useContext(RealtimeSocketContext);
}
