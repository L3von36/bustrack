import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_PORT = 3004;

let socketInstance: Socket | null = null;

function getSocket(): Socket {
  if (!socketInstance) {
    socketInstance = io('/?XTransformPort=' + SOCKET_PORT, {
      transports: ['websocket', 'polling'],
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 10000,
    });
  }
  return socketInstance;
}

export function useRealtimeSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    // Initialize connection state from socket without calling setState synchronously
    const connected = socket.connected;
    if (connected) {
      // Use queueMicrotask to avoid synchronous setState in effect
      queueMicrotask(() => setIsConnected(true));
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  const emit = useCallback((event: string, data?: any) => {
    socketRef.current?.emit(event, data);
  }, []);

  const on = useCallback((event: string, handler: (...args: any[]) => void) => {
    const socket = socketRef.current;
    if (!socket) return () => {};
    socket.on(event, handler);
    return () => { socket.off(event, handler); };
  }, []);

  const joinSchedule = useCallback((scheduleId: string) => {
    socketRef.current?.emit('join-schedule', scheduleId);
  }, []);

  const leaveSchedule = useCallback((scheduleId: string) => {
    socketRef.current?.emit('leave-schedule', scheduleId);
  }, []);

  const joinGate = useCallback((scheduleId: string) => {
    socketRef.current?.emit('join-gate', scheduleId);
  }, []);

  const joinDashboard = useCallback(() => {
    socketRef.current?.emit('join-dashboard');
  }, []);

  return {
    isConnected,
    emit,
    on,
    joinSchedule,
    leaveSchedule,
    joinGate,
    joinDashboard,
  };
}

// Activity feed hook
export function useActivityFeed() {
  const [activities, setActivities] = useState<Array<{ type: string; message: string; timestamp: string; role?: string }>>([]);
  const { on, emit } = useRealtimeSocket();

  useEffect(() => {
    const off = on('activity:feed', (data: { activities: any[] }) => {
      setActivities(data.activities);
    });
    emit('activity:fetch');
    return off;
  }, [on, emit]);

  return activities;
}