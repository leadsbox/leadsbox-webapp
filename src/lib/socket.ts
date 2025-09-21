/* eslint-disable @typescript-eslint/no-explicit-any */
// Socket.IO Client Service for Real-time Messaging
// LeadsBox Dashboard

import React from 'react';
import { io, Socket } from 'socket.io-client';
import { Message, Thread } from '@/types';

// Socket.IO event types matching the backend
export interface ServerToClientEvents {
  // Thread & Message Events
  'thread:new': (data: { thread: Thread }) => void;
  'thread:updated': (data: { thread: Thread }) => void;
  'thread:deleted': (data: { threadId: string }) => void;

  // Message Events
  'message:new': (data: { message: Message; thread: Thread }) => void;
  'message:updated': (data: { message: Message }) => void;
  'message:deleted': (data: { messageId: string; threadId: string }) => void;

  // Lead Events
  'lead:new': (data: { lead: any }) => void;
  'lead:updated': (data: { lead: any }) => void;
  'lead:deleted': (data: { leadId: string }) => void;

  // Typing Events
  'typing:start': (data: { threadId: string; userId: string; userName: string }) => void;
  'typing:stop': (data: { threadId: string; userId: string }) => void;

  // Dashboard Events
  'dashboard:stats': (data: { totalLeads: number; activeThreads: number; [key: string]: any }) => void;

  // System Events
  connected: () => void;
  error: (data: { message: string; code?: string }) => void;
}

export interface ClientToServerEvents {
  // Authentication
  auth: (data: { token: string; orgId: string }) => void;

  // Thread Management
  'thread:join': (data: { threadId: string }) => void;
  'thread:leave': (data: { threadId: string }) => void;

  // Message Sending
  'message:send': (data: { threadId: string; text: string; type?: string }) => void;

  // Typing Indicators
  'typing:start': (data: { threadId: string }) => void;
  'typing:stop': (data: { threadId: string }) => void;

  // Dashboard Subscriptions
  'dashboard:subscribe': () => void;
  'dashboard:unsubscribe': () => void;
}

// Socket.IO Client Service
export class SocketIOService {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private isConnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor() {
    // Auto-connect when service is created
    this.connect();
  }

  // Connect to Socket.IO server
  async connect(): Promise<void> {
    if (this.socket?.connected) {
      console.log('Socket already connected:', this.socket.id);
      return;
    }

    if (this.isConnecting) {
      console.log('Socket connection already in progress...');
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        this.isConnecting = true;

        // Get authentication data (matching the API client keys)
        const token = localStorage.getItem('lb_access_token');
        const orgId = localStorage.getItem('lb_org_id');

        console.log('Socket.IO Auth Check:', {
          hasToken: !!token,
          hasOrgId: !!orgId,
          tokenLength: token?.length || 0,
          orgId: orgId,
        });

        if (!token) {
          this.isConnecting = false;
          reject(new Error('No access token found. Please login again.'));
          return;
        }

        if (!orgId) {
          this.isConnecting = false;
          reject(new Error('No organization selected. Please select an organization.'));
          return;
        }

        // Socket.IO server URL
        const serverUrl = import.meta.env.VITE_API_BASE?.replace('/api', '') || 'http://localhost:3010';

        console.log('Connecting to Socket.IO server:', serverUrl, 'with auth:', { orgId });

        // Create Socket.IO connection
        this.socket = io(serverUrl, {
          auth: {
            token,
            orgId,
          },
          transports: ['websocket', 'polling'],
          timeout: 10000,
          retries: 3,
        });

        // Connection successful
        this.socket.on('connect', () => {
          console.log('Socket.IO connected:', this.socket?.id);
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          resolve();
        });

        // Connection error
        this.socket.on('connect_error', (error) => {
          console.error('Socket.IO connection error:', error);
          this.isConnecting = false;
          this.socket = null; // Clear failed socket
          reject(error);
        });

        // Disconnection
        this.socket.on('disconnect', (reason) => {
          console.log('Socket.IO disconnected:', reason);
          this.handleDisconnection(reason);
        });

        // Server confirmation
        this.socket.on('connected', () => {
          console.log('Socket.IO server confirmed connection');
        });

        // Error handling
        this.socket.on('error', (data) => {
          console.error('Socket.IO server error:', data);
          this.emitToListeners('error', data);
        });

        // Set up event forwarding
        this.setupEventForwarding();
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  // Disconnect from Socket.IO server
  disconnect(): void {
    if (this.socket) {
      console.log('Disconnecting socket:', this.socket.id);
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnecting = false;
    this.listeners.clear();
  }

  // Check connection status
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Join a thread room
  joinThread(threadId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('thread:join', { threadId });
      console.log('Joined thread room:', threadId);
    }
  }

  // Leave a thread room
  leaveThread(threadId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('thread:leave', { threadId });
      console.log('Left thread room:', threadId);
    }
  }

  // Send a message
  sendMessage(threadId: string, text: string, type: string = 'text'): void {
    console.log('=== ATTEMPTING TO SEND MESSAGE ===');
    console.log('Socket connected:', this.socket?.connected);
    console.log('Socket ID:', this.socket?.id);
    console.log('Socket readyState:', this.socket?.connected ? 'OPEN' : 'CLOSED');
    console.log('Socket instance exists:', !!this.socket);
    console.log('Socket transport:', this.socket?.io?.engine?.transport?.name);
    console.log('Socket auth:', this.socket?.auth);
    console.log('Message data:', { threadId, text, type });

    if (this.socket?.connected) {
      // Add unique identifier to track this specific emission
      const emissionId = `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      console.log('🚀 About to emit message:send event with ID:', emissionId);

      // Emit the message with tracking ID
      const messageData = { threadId, text, type, emissionId };
      this.socket.emit('message:send', messageData);
      console.log('✅ Message emitted via Socket.IO:', { threadId, text, emissionId });

      // Add a small delay and check if the event was actually sent
      setTimeout(() => {
        console.log('🔍 Post-emission check:');
        console.log('  - Socket still connected:', this.socket?.connected);
        console.log('  - Socket ID:', this.socket?.id);
      }, 100);

      // Add delays between emissions to test rapid-fire theory
      setTimeout(() => {
        console.log('🔗 Also emitting thread:join for comparison...');
        this.socket?.emit('thread:join', { threadId });
        console.log('✅ thread:join emitted for comparison');
      }, 500);

      setTimeout(() => {
        console.log('🏓 Testing socket emission with typing:start...');
        this.socket?.emit('typing:start', { threadId });
        console.log('✅ typing:start emitted for connectivity test');
      }, 1000);
    } else {
      console.error('❌ Socket not connected - cannot send message');
    }
  }

  // Send typing indicator
  startTyping(threadId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('typing:start', { threadId });
    }
  }

  stopTyping(threadId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('typing:stop', { threadId });
    }
  }

  // Subscribe to dashboard updates
  subscribeToDashboard(): void {
    if (this.socket?.connected) {
      this.socket.emit('dashboard:subscribe');
      console.log('Subscribed to dashboard updates');
    }
  }

  unsubscribeFromDashboard(): void {
    if (this.socket?.connected) {
      this.socket.emit('dashboard:unsubscribe');
    }
  }

  // Event listener management
  on<K extends keyof ServerToClientEvents>(event: K, callback: (data: Parameters<ServerToClientEvents[K]>[0]) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        eventListeners.delete(callback);
        if (eventListeners.size === 0) {
          this.listeners.delete(event);
        }
      }
    };
  }

  // Emit events to registered listeners
  private emitToListeners(event: string, data: unknown): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in Socket.IO listener for ${event}:`, error);
        }
      });
    }
  }

  // Set up event forwarding from Socket.IO to internal listeners
  private setupEventForwarding(): void {
    if (!this.socket) return;

    // Thread events
    this.socket.on('thread:new', (data) => this.emitToListeners('thread:new', data));
    this.socket.on('thread:updated', (data) => this.emitToListeners('thread:updated', data));
    this.socket.on('thread:deleted', (data) => this.emitToListeners('thread:deleted', data));

    // Message events
    this.socket.on('message:new', (data) => this.emitToListeners('message:new', data));
    this.socket.on('message:updated', (data) => this.emitToListeners('message:updated', data));
    this.socket.on('message:deleted', (data) => this.emitToListeners('message:deleted', data));

    // Lead events
    this.socket.on('lead:new', (data) => this.emitToListeners('lead:new', data));
    this.socket.on('lead:updated', (data) => this.emitToListeners('lead:updated', data));
    this.socket.on('lead:deleted', (data) => this.emitToListeners('lead:deleted', data));

    // Typing events
    this.socket.on('typing:start', (data) => this.emitToListeners('typing:start', data));
    this.socket.on('typing:stop', (data) => this.emitToListeners('typing:stop', data));

    // Dashboard events
    this.socket.on('dashboard:stats', (data) => this.emitToListeners('dashboard:stats', data));
  }

  // Handle disconnection with reconnection logic
  private handleDisconnection(reason: string): void {
    console.log('Socket.IO disconnected, reason:', reason);

    // Auto-reconnect for certain reasons
    if (reason === 'io server disconnect') {
      // Server initiated disconnect - don't reconnect
      return;
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);

      console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

      setTimeout(() => {
        if (!this.socket?.connected) {
          this.connect().catch(console.error);
        }
      }, delay);
    } else {
      console.log('Max reconnection attempts reached');
      this.emitToListeners('error', {
        message: 'Connection lost and could not reconnect',
        code: 'MAX_RECONNECT_ATTEMPTS',
      });
    }
  }
}

// Create singleton instance
export const socketService = new SocketIOService();

// React Hook for Socket.IO
export function useSocketIO() {
  const [isConnected, setIsConnected] = React.useState(socketService.isConnected());
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Monitor connection status
    const checkConnection = () => {
      setIsConnected(socketService.isConnected());
    };

    // Listen for connection events
    const unsubscribeError = socketService.on('error', (data) => {
      setError(data.message);
    });

    // Check connection periodically
    const interval = setInterval(checkConnection, 1000);

    // Check if we have auth data before attempting connection
    const hasAuth = localStorage.getItem('lb_access_token') && localStorage.getItem('lb_org_id');

    // Only attempt connection ONCE if we have authentication data and no connection exists
    if (hasAuth && !socketService.isConnected() && !socketService['isConnecting']) {
      console.log('useSocketIO: Attempting single connection...');
      socketService.connect().catch((err) => {
        // Only show error if it's not an auth issue
        if (!err.message.includes('authentication') && !err.message.includes('login')) {
          setError(err.message);
        } else {
          console.log('Socket.IO: Waiting for authentication...');
        }
      });
    } else if (socketService.isConnected()) {
      console.log('useSocketIO: Socket already connected, skipping connection attempt');
    } else if (socketService['isConnecting']) {
      console.log('useSocketIO: Connection already in progress, skipping');
    }

    return () => {
      clearInterval(interval);
      unsubscribeError();
    };
  }, []);

  return {
    isConnected,
    error,
    socket: socketService,
    joinThread: socketService.joinThread.bind(socketService),
    leaveThread: socketService.leaveThread.bind(socketService),
    sendMessage: socketService.sendMessage.bind(socketService),
    startTyping: socketService.startTyping.bind(socketService),
    stopTyping: socketService.stopTyping.bind(socketService),
    subscribeToDashboard: socketService.subscribeToDashboard.bind(socketService),
    unsubscribeFromDashboard: socketService.unsubscribeFromDashboard.bind(socketService),
    on: socketService.on.bind(socketService),
  };
}

export default socketService;
