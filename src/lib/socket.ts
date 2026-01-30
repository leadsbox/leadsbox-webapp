/* eslint-disable @typescript-eslint/no-explicit-any */
// Socket.IO Client Service for Real-time Messaging
// LeadsBox Dashboard

import React from 'react';
import { io, Socket } from 'socket.io-client';
import { Message, Thread } from '@/types';
import type { Analytics } from '@/types';

// Socket.IO event types matching the backend
export interface ServerToClientEvents {
  // Thread & Message Events
  'thread:new': (data: { thread: Thread }) => void;
  'thread:updated': (data: { thread: Thread }) => void;
  'thread:read': (data: { threadId: string } | any) => void;
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
  'analytics:overview': (data: Analytics) => void;

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

  // Analytics subscriptions
  'analytics:subscribe': (data: { range?: string }, callback?: (response?: { success?: boolean; data?: Analytics }) => void) => void;
  'analytics:unsubscribe': () => void;
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
      return;
    }

    if (this.isConnecting) {
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        this.isConnecting = true;

        // Get authentication data (matching the API client keys)
        const token = localStorage.getItem('lb_access_token');
        const orgId = localStorage.getItem('lb_org_id');

        // Auth check performed; proceed or reject below.

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

        // Connecting to Socket.IO server

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
          this.handleDisconnection(reason);
        });

        // Server confirmation
        this.socket.on('connected', () => {
          this.emitToListeners('connected', undefined as any);
        });

        // Error handling
        this.socket.on('error', (data) => {
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
    }
  }

  // Leave a thread room
  leaveThread(threadId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('thread:leave', { threadId });
    }
  }

  // Send a message
  sendMessage(threadId: string, text: string, type: string = 'text'): void {
    // sendMessage called — emit if connected

    if (this.socket?.connected) {
      // Add unique identifier to track this specific emission
      const emissionId = `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

      // Emit the message with tracking ID
      const messageData = { threadId, text, type, emissionId };
      this.socket.emit('message:send', messageData);

      // Add a small delay and check if the event was actually sent
      // Optional: small post-emission checks or follow-up emits were removed
    } else {
      console.error('Socket not connected - cannot send message');
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
    }
  }

  unsubscribeFromDashboard(): void {
    if (this.socket?.connected) {
      this.socket.emit('dashboard:unsubscribe');
    }
  }

  async subscribeToAnalytics(range: string = '7d'): Promise<void> {
    if (!this.socket?.connected) {
      try {
        await this.connect();
      } catch (error) {
        console.error('Failed to connect for analytics subscription:', error);
        return;
      }
    }

    this.socket?.emit('analytics:subscribe', { range }, (response?: { success?: boolean; data?: Analytics }) => {
      if (response?.success && response.data) {
        this.emitToListeners('analytics:overview', response.data);
      } else if (response && response.success === false) {
        this.emitToListeners('error', {
          message: 'Failed to load analytics overview',
          code: 'ANALYTICS_OVERVIEW_FAILED',
        });
      }
    });
  }

  unsubscribeFromAnalytics(): void {
    if (this.socket?.connected) {
      this.socket.emit('analytics:unsubscribe');
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

  // Remove event listener
  off<K extends keyof ServerToClientEvents>(event: K, callback: (data: Parameters<ServerToClientEvents[K]>[0]) => void): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
      if (eventListeners.size === 0) {
        this.listeners.delete(event);
      }
    }
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
    this.socket.on('analytics:overview', (data) => this.emitToListeners('analytics:overview', data));
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
    off: socketService.off.bind(socketService),
  };
}

export default socketService;
