// Inbox Page Component for LeadsBox Dashboard

import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, MoreHorizontal, Phone, Clock, X, ChevronLeft, Save } from 'lucide-react';
import { WhatsAppIcon, TelegramIcon, InstagramIcon } from '@/components/brand-icons';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';

import client, { getOrgId } from '@/api/client';
import { endpoints } from '@/api/config';
import { AxiosError } from 'axios';
import { toast } from 'react-toastify';
import { Thread, Message, Stage, LeadLabel, leadLabelUtils } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import { WhatsAppConnectionError } from '@/components/WhatsAppConnectionError';
import { useSocketIO } from '@/lib/socket';

const InboxPage: React.FC = () => {
  const navigate = useNavigate();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loadingThreads, setLoadingThreads] = useState(false);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'mine' | 'hot'>('all');
  const [mobileThreadsOpen, setMobileThreadsOpen] = useState(false);
  const [composer, setComposer] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [newText, setNewText] = useState('');
  const [sendingNew, setSendingNew] = useState(false);
  const [whatsappConnectionError, setWhatsappConnectionError] = useState(false);
  const [editingContact, setEditingContact] = useState(false);
  const [contactForm, setContactForm] = useState<{
    displayName: string;
    email: string;
    phone: string;
  }>({ displayName: '', email: '', phone: '' });
  const [savingContact, setSavingContact] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map());

  // Ref for auto-scrolling to bottom of messages
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Function to scroll to bottom of messages
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Socket.IO integration
  const {
    isConnected,
    error: socketError,
    socket,
    joinThread,
    leaveThread,
    sendMessage: socketSendMessage,
    startTyping,
    stopTyping,
    on: socketOn,
  } = useSocketIO();

  // Debug authentication state
  React.useEffect(() => {
    const token = localStorage.getItem('lb_access_token');
    const orgId = localStorage.getItem('lb_org_id');
    console.log('Inbox Auth State:', { hasToken: !!token, hasOrgId: !!orgId, socketError, isConnected });
  }, [socketError, isConnected]);

  useEffect(() => {
    document.body.style.overflow = mobileThreadsOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileThreadsOpen]);

  // Allow the global header hamburger to control the inbox threads drawer on mobile
  useEffect(() => {
    const toggle = () => setMobileThreadsOpen((v) => !v);
    const open = () => setMobileThreadsOpen(true);
    const close = () => setMobileThreadsOpen(false);
    window.addEventListener('lb:toggle-inbox-threads', toggle);
    window.addEventListener('lb:open-inbox-threads', open);
    window.addEventListener('lb:close-inbox-threads', close);
    return () => {
      window.removeEventListener('lb:toggle-inbox-threads', toggle);
      window.removeEventListener('lb:open-inbox-threads', open);
      window.removeEventListener('lb:close-inbox-threads', close);
    };
  }, []);

  // API types and mappers (local)
  type ApiThread = {
    id: string;
    organizationId: string;
    contact: {
      id: string;
      organizationId: string;
      displayName?: string | null;
      phone?: string | null;
      waId?: string | null; // WhatsApp ID
      igUsername?: string | null;
      fbPsid?: string | null;
      email?: string | null;
      country?: string | null;
      identityConfidence?: number;
      mergedIntoId?: string | null;
      lastSeenAt?: string | null;
      createdAt: string;
      updatedAt: string;
    };
    channel: { id: string; type: 'WHATSAPP' | 'INSTAGRAM' | 'FACEBOOK' | 'TELEGRAM'; displayName?: string | null };
    Lead?: Array<{
      id: string;
      label?: string | null;
      createdAt: string;
      updatedAt: string;
    }>;
    status: string;
    lastMessageAt: string;
  };
  type ApiMessage = {
    id: string;
    threadId: string;
    channelType: 'WHATSAPP' | 'INSTAGRAM' | 'FACEBOOK' | 'TELEGRAM';
    direction: 'IN' | 'OUT';
    text?: string | null;
    sentAt: string;
  };

  const mapChannel = (t: ApiThread['channel']['type']): Thread['channel'] => {
    if (t === 'WHATSAPP') return 'whatsapp';
    if (t === 'TELEGRAM') return 'telegram';
    if (t === 'INSTAGRAM') return 'instagram';
    if (t === 'FACEBOOK') return 'sms';
    return 'whatsapp';
  };
  const toUiLead = (api: ApiThread): Thread['lead'] => {
    // Extract the meaningful contact information
    const displayName = api.contact.displayName;
    const phone = api.contact.phone || api.contact.waId; // Use waId if phone is null
    const email = api.contact.email;

    // Build a proper name - prioritize displayName, then format phone number
    let name = displayName;
    if (!name && phone) {
      // Format WhatsApp ID/phone for display
      name = phone.startsWith('234') ? `+${phone}` : phone;
    }
    if (!name) {
      name = 'Contact';
    }

    // Get the most recent lead data for this thread
    const leadData = api.Lead?.[0];
    const leadLabel = leadData?.label || 'NEW_LEAD';

    return {
      id: leadData?.id || api.contact.id,
      name,
      email: email || '',
      phone: phone || undefined,
      source: 'whatsapp',
      stage: (leadLabel as Stage) || 'NEW_LEAD',
      priority: 'MEDIUM',
      tags: [leadLabel], // Use the actual lead label as the primary tag
      createdAt: api.lastMessageAt,
      updatedAt: api.lastMessageAt,
    };
  };
  const toUiThread = (api: ApiThread): Thread => {
    const leadData = api.Lead?.[0];
    return {
      id: api.id,
      leadId: leadData?.id || api.contact.id, // Use actual lead ID if available
      lead: toUiLead(api),
      channel: mapChannel(api.channel.type),
      status: 'OPEN',
      priority: 'MEDIUM',
      isUnread: false,
      lastMessage: undefined,
      assignedTo: undefined,
      tags: [],
      createdAt: api.lastMessageAt,
      updatedAt: api.lastMessageAt,
    };
  };
  const toUiMessage = (m: ApiMessage): Message => ({
    id: m.id,
    threadId: m.threadId,
    content: m.text || '',
    type: 'TEXT',
    sender: m.direction === 'IN' ? 'LEAD' : 'AGENT',
    createdAt: m.sentAt,
    isRead: true,
  });

  const fetchThreads = async () => {
    setLoadingThreads(true);
    try {
      // Try to get threads with expanded contact information
      const res = await client.get(endpoints.threads, {
        params: {
          include: 'contact,channel', // Request expanded contact and channel info
          expandContact: true, // Flag to get full contact details
        },
      });
      const list = (res?.data?.data?.threads || []) as ApiThread[];

      // Debug: Log the contact data we're receiving and how it's mapped
      console.log(
        'API Threads Contact Data:',
        list.map((t) => ({
          id: t.id,
          contact: t.contact,
          channel: t.channel,
          contactFields: Object.keys(t.contact || {}),
        }))
      );

      const ui = list.map(toUiThread);
      console.log(
        'Mapped UI Leads:',
        ui.map((thread) => ({
          id: thread.id,
          leadName: thread.lead.name,
          leadPhone: thread.lead.phone,
          leadEmail: thread.lead.email,
        }))
      );

      console.log(
        'Mapped UI Leads:',
        ui.map((thread) => ({
          id: thread.id,
          leadName: thread.lead.name,
          leadPhone: thread.lead.phone,
          leadEmail: thread.lead.email,
        }))
      );
      setThreads(ui);
      if (!selectedThread && ui.length > 0) setSelectedThread(ui[0]);
    } catch (error) {
      const e = error as AxiosError<{ message?: string }>;
      toast.error(e?.response?.data?.message || 'Failed to load threads');
      console.error('Threads API Error:', error);
    } finally {
      setLoadingThreads(false);
    }
  };

  const fetchMessages = async (id: string) => {
    setLoadingMessages(true);
    try {
      const res = await client.get(endpoints.threadMessages(id));
      const list = (res?.data?.data?.messages || []) as ApiMessage[];
      setMessages(list.map(toUiMessage));
      // Scroll to bottom after messages are loaded
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      const e = error as AxiosError<{ message?: string }>;
      toast.error(e?.response?.data?.message || 'Failed to load messages');
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    fetchThreads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedThread?.id) fetchMessages(selectedThread.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedThread?.id]);

  // Periodic message refresh when Socket.IO is not connected (fallback for real-time updates)
  useEffect(() => {
    if (!selectedThread?.id || isConnected) return;

    console.log('🔄 Setting up periodic message refresh (Socket.IO fallback)');
    const interval = setInterval(() => {
      console.log('⏰ Fetching messages (Socket.IO offline fallback)');
      fetchMessages(selectedThread.id);
    }, 5000); // Refresh every 5 seconds when offline

    return () => {
      console.log('🛑 Clearing periodic message refresh');
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedThread?.id, isConnected]);

  // Socket.IO event listeners for real-time updates
  useEffect(() => {
    if (!isConnected) {
      console.log('⚠️ Socket.IO not connected, skipping event listener setup');
      return;
    }

    console.log('🔌 Setting up Socket.IO event listeners - socket connected:', {
      isConnected,
      socketError,
      selectedThreadId: selectedThread?.id,
      timestamp: new Date().toISOString(),
    });

    // Add debugging for ALL Socket.IO events
    const logAllEvents = socketOn('*', (eventName: string, ...args: unknown[]) => {
      console.log('🎯 Socket.IO Event Received:', {
        eventName,
        args,
        timestamp: new Date().toISOString(),
      });
    });

    // Handle new messages
    const unsubscribeNewMessage = socketOn('message:new', (data) => {
      const { message, thread } = data;

      console.log('🔔 Received new message via Socket.IO:', {
        messageId: message.id,
        threadId: message.threadId,
        content: message.content,
        sender: message.sender,
        selectedThreadId: selectedThread?.id,
        leadTags: thread.lead?.tags,
        leadStage: thread.lead?.stage,
        timestamp: new Date().toISOString(),
      });

      // Update messages if this is the selected thread
      if (selectedThread?.id === message.threadId) {
        console.log('📨 Message is for currently selected thread - updating UI');
        setMessages((prev) => {
          // Avoid duplicates
          const exists = prev.some((m) => m.id === message.id);
          if (exists) {
            console.log('⚠️ Duplicate message detected, skipping');
            return prev;
          }

          console.log('✅ Adding new message to thread');
          const newMessages = [...prev, message].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          // Scroll to bottom after new message is added
          setTimeout(scrollToBottom, 100);
          return newMessages;
        });
      } else {
        console.log('📝 Message is for different thread:', {
          messageThread: message.threadId,
          currentThread: selectedThread?.id,
        });
      }

      // Update thread list
      setThreads((prev) => {
        const existingIndex = prev.findIndex((t) => t.id === thread.id);
        if (existingIndex >= 0) {
          // Update existing thread
          const updated = [...prev];
          updated[existingIndex] = { ...thread, lastMessage: message };
          return updated.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        } else {
          // Add new thread
          return [{ ...thread, lastMessage: message }, ...prev];
        }
      });

      // Show toast notification if not the current thread
      if (selectedThread?.id !== message.threadId) {
        toast.success(`New message from ${thread.lead.name}`);
      }
    });

    // Handle thread updates
    const unsubscribeThreadUpdate = socketOn('thread:updated', (data) => {
      const { thread } = data;

      console.log('🔄 Thread updated via Socket.IO:', {
        threadId: thread.id,
        leadName: thread.lead?.name,
        leadTags: thread.lead?.tags,
        leadStage: thread.lead?.stage,
        timestamp: new Date().toISOString(),
        fullThread: thread,
      });

      setThreads((prev) => {
        const existingIndex = prev.findIndex((t) => t.id === thread.id);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = thread;
          return updated;
        }
        return prev;
      });

      // Update selected thread if it's the same
      if (selectedThread?.id === thread.id) {
        setSelectedThread(thread);
      }
    });

    // Handle new threads
    const unsubscribeNewThread = socketOn('thread:new', (data) => {
      const { thread } = data;

      console.log('New thread:', thread);

      setThreads((prev) => {
        // Avoid duplicates
        const exists = prev.some((t) => t.id === thread.id);
        if (exists) return prev;

        return [thread, ...prev];
      });

      toast.success(`New conversation from ${thread.lead.name}`);
    });

    // Handle typing indicators
    const unsubscribeTypingStart = socketOn('typing:start', (data) => {
      const { threadId, userId, userName } = data;

      if (selectedThread?.id === threadId) {
        setTypingUsers((prev) => {
          const updated = new Map(prev);
          updated.set(userId, userName);
          return updated;
        });
      }
    });

    const unsubscribeTypingStop = socketOn('typing:stop', (data) => {
      const { threadId, userId } = data;

      if (selectedThread?.id === threadId) {
        setTypingUsers((prev) => {
          const updated = new Map(prev);
          updated.delete(userId);
          return updated;
        });
      }
    });

    return () => {
      unsubscribeNewMessage();
      unsubscribeThreadUpdate();
      unsubscribeNewThread();
      unsubscribeTypingStart();
      unsubscribeTypingStop();
      logAllEvents();
    };
  }, [isConnected, selectedThread?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Join/leave thread rooms when selected thread changes
  useEffect(() => {
    if (!isConnected || !selectedThread?.id) return;

    console.log('Joining thread room:', selectedThread.id);
    joinThread(selectedThread.id);

    return () => {
      if (selectedThread?.id) {
        console.log('Leaving thread room:', selectedThread.id);
        leaveThread(selectedThread.id);
      }
    };
  }, [selectedThread?.id, isConnected]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle typing indicators for current user
  useEffect(() => {
    if (!selectedThread?.id || !isConnected) return;

    let typingTimeout: NodeJS.Timeout;

    const handleTyping = () => {
      startTyping(selectedThread.id);

      clearTimeout(typingTimeout);
      typingTimeout = setTimeout(() => {
        stopTyping(selectedThread.id);
      }, 1000);
    };

    // Listen for composer changes
    if (composer.length > 0) {
      handleTyping();
    }

    return () => {
      clearTimeout(typingTimeout);
      if (selectedThread?.id) {
        stopTyping(selectedThread.id);
      }
    };
  }, [composer, selectedThread?.id, isConnected, startTyping, stopTyping]);

  // REST API message sending (reliable fallback from Socket.IO issues)
  const handleSendMessage = async () => {
    if (!selectedThread || !composer.trim()) return;

    const messageText = composer.trim();
    setComposer('');

    try {
      // Use REST API for reliable message sending
      const token = localStorage.getItem('lb_access_token');
      const orgId = localStorage.getItem('lb_org_id');

      if (!token || !orgId) {
        toast.error('Authentication required. Please log in again.');
        setComposer(messageText);
        return;
      }

      // Use the client instance instead of fetch to get proper base URL and error handling
      const response = await client.post(endpoints.threadReply(selectedThread.id), {
        text: messageText,
      });

      // Check the response structure: { message: "Reply sent", data: { ok: true, externalMsgId: "..." } }
      if (response.data && response.data.data && response.data.data.ok) {
        console.log('Message sent via REST API:', response.data);
        // Success - no toast needed as real-time updates will show the message
      } else {
        throw new Error(response.data?.message || 'Failed to send message');
      }

      // Refresh messages to show the sent message
      await fetchMessages(selectedThread.id);

      // Scroll to bottom after sending message (additional delay for message processing)
      setTimeout(scrollToBottom, 200);
    } catch (error: unknown) {
      console.error('REST API message send error:', error);

      // Check for specific WhatsApp API errors
      let userFriendlyMessage = 'Failed to send message';

      // Check if it's an axios error with response
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string } } };
        const errorMessage = axiosError.response?.data?.message;

        if (errorMessage && errorMessage.includes('Recipient phone number not in allowed list')) {
          userFriendlyMessage =
            'This phone number is not in your WhatsApp Business allowed list. Please add it to your recipient list in Facebook Business Manager.';
        } else if (errorMessage && errorMessage.includes('WhatsApp')) {
          userFriendlyMessage = `WhatsApp API Error: ${errorMessage}`;
        } else if (errorMessage) {
          userFriendlyMessage = errorMessage;
        }
      } else if (error instanceof Error) {
        userFriendlyMessage = error.message;
      }

      toast.error(userFriendlyMessage);
      setComposer(messageText); // Restore message on error
    }
  };

  const filteredThreads = useMemo(
    () =>
      threads.filter((thread) => {
        const matchesSearch =
          thread.lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (thread.lead.email && thread.lead.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (thread.lead.phone && thread.lead.phone.toLowerCase().includes(searchQuery.toLowerCase()));
        switch (activeFilter) {
          case 'unread':
            return matchesSearch && thread.isUnread;
          case 'mine':
            return matchesSearch && thread.assignedTo; // Any assigned thread
          case 'hot':
            return matchesSearch && thread.priority === 'HIGH';
          default:
            return matchesSearch;
        }
      }),
    [threads, searchQuery, activeFilter]
  );

  const getChannelIcon = (channel: Thread['channel']) => {
    switch (channel) {
      case 'whatsapp':
        return <WhatsAppIcon className='h-4 w-4' />;
      case 'telegram':
        return <TelegramIcon className='h-4 w-4' />;
      case 'instagram':
        return <InstagramIcon className='h-4 w-4' />;
      case 'sms':
        return (
          <span role='img' aria-label='sms'>
            📱
          </span>
        );
      case 'email':
        return (
          <span role='img' aria-label='email'>
            ✉️
          </span>
        );
      default:
        return <WhatsAppIcon className='h-4 w-4' />;
    }
  };

  const getStatusColor = (status: Thread['status']) => {
    switch (status) {
      case 'OPEN':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'PENDING':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'CLOSED':
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
      default:
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    }
  };

  const getPriorityColor = (priority: Thread['priority']) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-500/10 text-red-400';
      case 'MEDIUM':
        return 'bg-amber-500/10 text-amber-400';
      case 'LOW':
        return 'bg-blue-500/10 text-blue-400';
      default:
        return 'bg-gray-500/10 text-gray-400';
    }
  };

  // Function to generate a consistent color based on tag text
  const getTagColor = (tag: string) => {
    // Simple hash function to generate a consistent color for each tag
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-yellow-100 text-yellow-800',
      'bg-red-100 text-red-800',
      'bg-purple-100 text-purple-800',
      'bg-pink-100 text-pink-800',
      'bg-indigo-100 text-indigo-800',
      'bg-teal-100 text-teal-800',
      'bg-orange-100 text-orange-800',
      'bg-cyan-100 text-cyan-800',
    ];

    // Simple hash function to get consistent color for each tag
    let hash = 0;
    for (let i = 0; i < tag.length; i++) {
      hash = tag.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  // 🎨 Lead Stage Color System - Context-aware colors for different lead types
  const getLeadStageColor = (stage: string) => {
    switch (stage) {
      // 🆕 New & Engagement Stages
      case 'NEW_LEAD':
      case 'NEW':
        return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300';
      case 'ENGAGED':
        return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-300';

      // 💰 Transaction & Payment Stages (Green spectrum)
      case 'TRANSACTION_SUCCESSFUL':
        return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900 dark:text-green-300';
      case 'PAYMENT_PENDING':
        return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900 dark:text-amber-300';
      case 'TRANSACTION_IN_PROGRESS':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900 dark:text-emerald-300';

      // ❌ Negative Outcomes (Red spectrum)
      case 'CLOSED_LOST_TRANSACTION':
        return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900 dark:text-red-300';
      case 'NOT_A_LEAD':
        return 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400';

      // 🎯 Interest & Inquiry Stages (Purple/Indigo spectrum)
      case 'PRICING_INQUIRY':
        return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900 dark:text-purple-300';
      case 'DEMO_REQUEST':
        return 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900 dark:text-indigo-300';
      case 'NEW_INQUIRY':
        return 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900 dark:text-violet-300';

      // 🛠️ Support & Service Stages (Orange spectrum)
      case 'TECHNICAL_SUPPORT':
        return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900 dark:text-orange-300';
      case 'FOLLOW_UP_REQUIRED':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-300';

      // 🤝 Business & Partnership (Teal spectrum)
      case 'PARTNERSHIP_OPPORTUNITY':
        return 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900 dark:text-teal-300';
      case 'FEEDBACK':
        return 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900 dark:text-cyan-300';

      // Default fallback
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  // Format lead stage for display
  const formatLeadStage = (stage: string) => {
    const stageMap: Record<string, string> = {
      NEW_LEAD: 'New Lead',
      ENGAGED: 'Engaged',
      TRANSACTION_SUCCESSFUL: 'Payment Complete',
      PAYMENT_PENDING: 'Payment Pending',
      TRANSACTION_IN_PROGRESS: 'Processing Order',
      CLOSED_LOST_TRANSACTION: 'Closed Lost',
      PRICING_INQUIRY: 'Price Inquiry',
      DEMO_REQUEST: 'Demo Request',
      NEW_INQUIRY: 'New Inquiry',
      TECHNICAL_SUPPORT: 'Tech Support',
      FOLLOW_UP_REQUIRED: 'Follow-up',
      PARTNERSHIP_OPPORTUNITY: 'Partnership',
      FEEDBACK: 'Feedback',
      NOT_A_LEAD: 'Not a Lead',
    };
    return stageMap[stage] || stage;
  };

  const handleEditContact = () => {
    if (!selectedThread) return;

    setContactForm({
      displayName: selectedThread.lead.name,
      email: selectedThread.lead.email,
      phone: selectedThread.lead.phone || '',
    });
    setEditingContact(true);
  };

  const handleSaveContact = async () => {
    if (!selectedThread) return;

    setSavingContact(true);
    try {
      // Update the contact via API - this should update both inbox and leads
      const response = await client.put(`/contacts/${selectedThread.leadId}`, {
        displayName: contactForm.displayName.trim() || null,
        email: contactForm.email.trim() || null,
        phone: contactForm.phone.trim() || null,
      });

      // Update local state to reflect changes immediately
      const updatedThreads = threads.map((thread) => {
        if (thread.id === selectedThread.id) {
          return {
            ...thread,
            lead: {
              ...thread.lead,
              name: contactForm.displayName.trim() || contactForm.phone.trim() || 'Contact',
              email: contactForm.email.trim(),
              phone: contactForm.phone.trim() || undefined,
            },
          };
        }
        return thread;
      });

      setThreads(updatedThreads);

      // Update selected thread
      const updatedSelectedThread = updatedThreads.find((t) => t.id === selectedThread.id);
      if (updatedSelectedThread) {
        setSelectedThread(updatedSelectedThread);
      }

      setEditingContact(false);
      toast.success('Contact updated successfully');
    } catch (error) {
      const e = error as AxiosError<{ message?: string }>;
      toast.error(e?.response?.data?.message || 'Failed to update contact');
    } finally {
      setSavingContact(false);
    }
  };

  const handleCancelEditContact = () => {
    setEditingContact(false);
    setContactForm({ displayName: '', email: '', phone: '' });
  };

  return (
    <div className='flex h-full bg-background relative'>
      {/* WhatsApp Connection Error */}
      {whatsappConnectionError && (
        <div className='absolute top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4'>
          <WhatsAppConnectionError onRetry={() => setWhatsappConnectionError(false)} />
        </div>
      )}

      {/* Thread List Sidebar - Desktop */}
      <div className='hidden md:flex w-96 border-r border-border flex-col'>
        {/* Header */}
        <div className='p-4 border-b border-border'>
          <div className='flex items-center justify-between mb-4'>
            <h1 className='text-2xl font-semibold text-foreground'>Inbox</h1>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='outline' size='icon'>
                  <MoreHorizontal className='h-4 w-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowNewChat(true)}>New Chat</DropdownMenuItem>
                <DropdownMenuItem>Mark all as read</DropdownMenuItem>
                <DropdownMenuItem>Archive conversations</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Export data</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Search */}
          <div className='relative mb-4'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
            <Input placeholder='Search conversations...' value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className='pl-10' />
          </div>

          {/* Filters */}
          <Tabs value={activeFilter} onValueChange={(value) => setActiveFilter(value as undefined)}>
            <TabsList className='grid w-full grid-cols-4'>
              <TabsTrigger value='all'>All</TabsTrigger>
              <TabsTrigger value='unread'>Unread</TabsTrigger>
              <TabsTrigger value='mine'>Mine</TabsTrigger>
              <TabsTrigger value='hot'>Hot</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Thread List */}
        <div className='flex-1 overflow-auto'>
          {loadingThreads ? (
            <div className='p-6 text-center text-muted-foreground'>Loading...</div>
          ) : filteredThreads.length === 0 ? (
            <div className='p-6 text-center'>
              <WhatsAppIcon className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
              <h3 className='text-lg font-medium text-foreground mb-2'>No conversations found</h3>
              <p className='text-muted-foreground'>Try adjusting your search or filters.</p>
              <div className='mt-4'>
                <Button onClick={() => setShowNewChat(true)}>Start New Chat</Button>
              </div>
            </div>
          ) : (
            filteredThreads.map((thread) => (
              <div
                key={thread.id}
                onClick={() => setSelectedThread(thread)}
                className={`p-4 border-b border-border cursor-pointer hover:bg-muted/50 transition-colors ${
                  selectedThread?.id === thread.id ? 'bg-muted border-l-4 border-l-primary' : ''
                }`}
              >
                <div className='flex items-start space-x-3'>
                  <div className='relative'>
                    <Avatar className='h-10 w-10'>
                      <AvatarImage src={thread.lead.name} />
                      <AvatarFallback>{thread.lead.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className='absolute -bottom-1 -right-1 text-lg'>{getChannelIcon(thread.channel)}</div>
                  </div>

                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center justify-between mb-1'>
                      <h3 className='font-medium text-foreground truncate'>{thread.lead.name}</h3>
                      <div className='flex items-center space-x-1'>
                        {thread.isUnread && <div className='w-2 h-2 bg-primary rounded-full' />}
                        <span className='text-xs text-muted-foreground'>{formatDistanceToNow(new Date(thread.updatedAt), { addSuffix: true })}</span>
                      </div>
                    </div>

                    <div className='flex items-center space-x-2 mb-2'>
                      <Badge variant='outline' className={getStatusColor(thread.status)}>
                        {thread.status}
                      </Badge>
                      <Badge variant='outline' className={getPriorityColor(thread.priority)}>
                        {thread.priority}
                      </Badge>
                    </div>

                    <p className='text-sm text-muted-foreground truncate'>{thread.lastMessage?.content || 'No messages yet'}</p>

                    {thread.lead.tags?.length > 0 && (
                      <div className='flex flex-wrap gap-1 mt-2'>
                        {thread.lead.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant='outline' className={`text-xs ${leadLabelUtils.getLabelStyling(tag as LeadLabel)}`}>
                            {leadLabelUtils.isValidLabel(tag) ? leadLabelUtils.getDisplayName(tag as LeadLabel) : tag}
                          </Badge>
                        ))}
                        {thread.lead.tags.length > 2 && (
                          <Badge variant='outline' className='text-xs'>
                            +{thread.lead.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Message View */}
      <div className='flex-1 flex flex-col min-w-0'>
        {showNewChat ? (
          <>
            {/* New Chat Header with phone input */}
            <div className='p-3 sm:p-4 border-b border-border bg-card sticky top-0 z-10'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3 w-full'>
                  <h2 className='text-lg font-semibold text-foreground whitespace-nowrap'>New Chat</h2>
                  <Input
                    placeholder='WhatsApp Phone (e.g., +2348012345678)'
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className='max-w-md'
                  />
                </div>
                <div className='flex items-center gap-2'>
                  <Button variant='ghost' size='icon' aria-label='Cancel new chat' onClick={() => setShowNewChat(false)}>
                    <X className='h-4 w-4' />
                  </Button>
                </div>
              </div>
            </div>

            {/* Empty timeline area with hint */}
            <div className='flex-1 overflow-auto p-4'>
              <div className='h-full grid place-items-center text-center text-muted-foreground'>
                <div>
                  <WhatsAppIcon className='h-12 w-12 mx-auto mb-3' />
                  <p>Enter a phone number above and your message below to start a conversation.</p>
                </div>
              </div>
            </div>

            {/* Composer for initial message */}
            <div className='p-3 sm:p-4 border-t border-border bg-card/50'>
              <div className='flex items-center space-x-2'>
                <Input
                  placeholder='Type your message...'
                  className='flex-1'
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (!newPhone.trim() || !newText.trim()) return;
                      (async () => {
                        try {
                          setSendingNew(true);
                          const res = await client.post(endpoints.threadStart, {
                            orgId: getOrgId(),
                            contactPhone: newPhone.trim(),
                            text: newText.trim(),
                          });
                          const threadId = res?.data?.data?.threadId as string | undefined;
                          setShowNewChat(false);
                          setNewPhone('');
                          setNewText('');
                          await fetchThreads();
                          if (threadId) {
                            const created = (threads || []).find((t) => t.id === threadId);
                            if (created) setSelectedThread(created);
                            await fetchMessages(threadId);
                          }
                        } catch (error) {
                          const e = error as AxiosError<{ message?: string }>;
                          const errorMessage = e?.response?.data?.message || 'Failed to start chat';
                          if (errorMessage.includes('WhatsApp connection') || errorMessage.includes('connect your WhatsApp')) {
                            setWhatsappConnectionError(true);
                          }
                          toast.error(errorMessage);
                        } finally {
                          setSendingNew(false);
                        }
                      })();
                    }
                  }}
                />
                <Button
                  disabled={sendingNew || !newPhone.trim() || !newText.trim()}
                  onClick={async () => {
                    try {
                      setSendingNew(true);
                      const res = await client.post(endpoints.threadStart, {
                        orgId: getOrgId(),
                        contactPhone: newPhone.trim(),
                        text: newText.trim(),
                      });
                      const threadId = res?.data?.data?.threadId as string | undefined;
                      setShowNewChat(false);
                      setNewPhone('');
                      setNewText('');
                      await fetchThreads();
                      if (threadId) {
                        const created = (threads || []).find((t) => t.id === threadId);
                        if (created) setSelectedThread(created);
                        await fetchMessages(threadId);
                      }
                    } catch (error) {
                      const e = error as AxiosError<{ message?: string }>;
                      const errorMessage = e?.response?.data?.message || 'Failed to start chat';
                      if (errorMessage.includes('WhatsApp connection') || errorMessage.includes('connect your WhatsApp')) {
                        setWhatsappConnectionError(true);
                      }
                      toast.error(errorMessage);
                    } finally {
                      setSendingNew(false);
                    }
                  }}
                >
                  Send
                </Button>
              </div>
            </div>
          </>
        ) : selectedThread ? (
          <>
            {/* Conversation Header */}
            <div className='p-3 sm:p-4 border-b border-border bg-card sticky top-0 z-10'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center space-x-3'>
                  {/* Mobile: back to conversations */}
                  <Button
                    variant='ghost'
                    size='icon'
                    className='md:hidden'
                    aria-label='Back to conversations'
                    onClick={() => setMobileThreadsOpen(true)}
                  >
                    <ChevronLeft className='h-5 w-5' />
                  </Button>
                  <div className='relative'>
                    <Avatar className='h-10 w-10'>
                      <AvatarImage src={selectedThread.lead.name} />
                      <AvatarFallback>{selectedThread.lead.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className='absolute -bottom-1 -right-1 text-lg'>{getChannelIcon(selectedThread.channel)}</div>
                    {selectedThread.tags?.length > 0 && (
                      <div className='absolute -top-1 -right-1 flex flex-wrap-reverse justify-end max-w-[80px] gap-0.5'>
                        {selectedThread.tags.slice(0, 3).map((tag, index) => (
                          <div key={tag} className={`h-1.5 w-1.5 rounded-full ${getTagColor(tag).split(' ')[0]}`} />
                        ))}
                      </div>
                    )}
                  </div>
                  <div className='flex-1 min-w-0'>
                    {editingContact ? (
                      <div className='space-y-2'>
                        <Input
                          value={contactForm.displayName}
                          onChange={(e) => setContactForm((prev) => ({ ...prev, displayName: e.target.value }))}
                          placeholder='Contact name'
                          className='text-lg font-semibold h-8'
                        />
                        <div className='flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2'>
                          <Input
                            value={contactForm.phone}
                            onChange={(e) => setContactForm((prev) => ({ ...prev, phone: e.target.value }))}
                            placeholder='+234xxxxxxxxxx'
                            className='text-sm h-7 flex-1 w-full'
                          />
                          <Input
                            type='email'
                            value={contactForm.email}
                            onChange={(e) => setContactForm((prev) => ({ ...prev, email: e.target.value }))}
                            placeholder='contact@example.com'
                            className='text-sm h-7 flex-1 w-full'
                          />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className='flex items-center gap-2 mb-1'>
                          <h2
                            className='text-lg font-semibold text-foreground cursor-pointer hover:text-primary transition-colors'
                            onClick={() => navigate(`/dashboard/leads/${selectedThread.leadId}`)}
                          >
                            {selectedThread.lead.name}
                          </h2>
                          {/* 🏷️ Lead Tags Display */}
                          <div className='flex flex-wrap gap-1'>
                            {selectedThread.lead.tags.slice(0, 2).map((tag) => (
                              <Badge key={tag} variant='outline' className={`text-xs px-2 py-1 ${leadLabelUtils.getLabelStyling(tag as LeadLabel)}`}>
                                {leadLabelUtils.isValidLabel(tag) ? leadLabelUtils.getDisplayName(tag as LeadLabel) : tag}
                              </Badge>
                            ))}
                            {selectedThread.lead.tags.length > 2 && (
                              <Badge variant='outline' className='text-xs px-2 py-1'>
                                +{selectedThread.lead.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className='flex flex-col sm:flex-row sm:items-center sm:space-x-2 space-y-1 sm:space-y-0'>
                          <div className='flex items-center space-x-2 text-sm text-muted-foreground'>
                            {selectedThread.lead.phone && selectedThread.lead.email ? (
                              <>
                                <span>{selectedThread.lead.phone}</span>
                                <span>•</span>
                                <span>{selectedThread.lead.email}</span>
                              </>
                            ) : selectedThread.lead.phone ? (
                              <span>{selectedThread.lead.phone}</span>
                            ) : selectedThread.lead.email ? (
                              <span>{selectedThread.lead.email}</span>
                            ) : (
                              <span>No contact info</span>
                            )}
                          </div>
                          {selectedThread.tags?.length > 0 && (
                            <div className='flex flex-wrap gap-1'>
                              {selectedThread.tags.slice(0, 3).map((tag) => (
                                <Badge key={tag} className={`text-xs ${getTagColor(tag)}`}>
                                  {tag}
                                </Badge>
                              ))}
                              {selectedThread.tags.length > 3 && (
                                <Badge variant='outline' className='text-xs'>
                                  +{selectedThread.tags.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className='flex items-center space-x-2'>
                  {editingContact ? (
                    <>
                      <Button variant='outline' size='sm' onClick={handleCancelEditContact}>
                        <X className='h-4 w-4 mr-1' />
                        Cancel
                      </Button>
                      <Button size='sm' onClick={handleSaveContact} disabled={savingContact}>
                        <Save className='h-4 w-4 mr-1' />
                        {savingContact ? 'Saving...' : 'Save'}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant='outline' size='icon'>
                        <Phone className='h-4 w-4' />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant='outline' size='icon'>
                            <MoreHorizontal className='h-4 w-4' />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          <DropdownMenuLabel>Contact Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={handleEditContact}>Edit Contact Details</DropdownMenuItem>
                          <DropdownMenuItem>View Lead Profile</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>Archive Conversation</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className='flex-1 overflow-auto p-3 sm:p-4 space-y-3 sm:space-y-4'>
              {loadingMessages ? (
                <div className='text-center text-muted-foreground'>Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className='text-center text-muted-foreground'>No messages yet</div>
              ) : (
                messages.map((message) => (
                  <div key={message.id} className={`flex ${message.sender === 'AGENT' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                        message.sender === 'AGENT' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
                      }`}
                    >
                      <p className='text-sm'>{message.content}</p>
                      <div className='flex items-center justify-between mt-1'>
                        <span className='text-xs opacity-70'>{formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}</span>
                        {message.sender === 'AGENT' && (
                          <div className='flex items-center space-x-1'>
                            {message.isRead ? <span className='text-xs opacity-70'>✓✓</span> : <span className='text-xs opacity-70'>✓</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
              {/* Invisible element to scroll to */}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className='p-3 sm:p-4 border-t border-border bg-card/50'>
              {/* Typing indicators */}
              {typingUsers.size > 0 && (
                <div className='mb-2 text-xs text-muted-foreground flex items-center gap-1'>
                  <div className='flex space-x-1'>
                    <div className='w-1 h-1 bg-current rounded-full animate-bounce'></div>
                    <div className='w-1 h-1 bg-current rounded-full animate-bounce' style={{ animationDelay: '0.1s' }}></div>
                    <div className='w-1 h-1 bg-current rounded-full animate-bounce' style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  {typingUsers.size === 1 ? `${Array.from(typingUsers.values())[0]} is typing...` : `${typingUsers.size} people are typing...`}
                </div>
              )}

              {/* Connection status */}
              <div className='flex items-center justify-between mb-2'>
                <div className='flex items-center gap-2 text-xs'>
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className='text-muted-foreground'>{isConnected ? 'Real-time messaging' : 'Offline mode'}</span>
                  {!isConnected && (
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => selectedThread && fetchMessages(selectedThread.id)}
                      className='ml-2 h-6 text-xs'
                    >
                      Refresh
                    </Button>
                  )}
                  {/* Socket.IO Connection Status */}
                </div>
                {socketError && <div className='text-xs text-red-500'>Connection error: {socketError}</div>}
              </div>

              <div className='flex items-center space-x-2'>
                <Input
                  placeholder='Type your message...'
                  className='flex-1'
                  value={composer}
                  onChange={(e) => setComposer(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <Button
                  disabled={!selectedThread || !composer.trim()}
                  onClick={handleSendMessage}
                  className={isConnected ? 'bg-green-600 hover:bg-green-700' : ''}
                >
                  {isConnected ? '⚡ Send' : 'Send'}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className='flex-1 flex items-center justify-center'>
            <div className='text-center'>
              <WhatsAppIcon className='h-16 w-16 text-muted-foreground mx-auto mb-4' />
              <h3 className='text-xl font-medium text-foreground mb-2'>Select a conversation</h3>
              <p className='text-muted-foreground'>Choose a conversation from the left to start messaging</p>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Threads Drawer */}
      <div
        id='mobile-threads'
        className={`md:hidden fixed inset-0 z-40 ${mobileThreadsOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
        aria-hidden={!mobileThreadsOpen}
      >
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity ${mobileThreadsOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setMobileThreadsOpen(false)}
        />
        <aside
          className={`absolute inset-y-2 left-2 w-80 max-w-[85vw] bg-card border border-border shadow-xl rounded-2xl overflow-hidden transition-transform duration-300 ease-in-out ${
            mobileThreadsOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          role='dialog'
          aria-modal='true'
          aria-label='Threads'
        >
          {/* Drawer Header */}
          <div className='p-3 border-b border-border flex items-center justify-between'>
            <h2 className='font-semibold'>Inbox</h2>
            <Button variant='ghost' size='icon' aria-label='Close threads' onClick={() => setMobileThreadsOpen(false)}>
              <X className='h-5 w-5' />
            </Button>
          </div>
          {/* Same content as desktop sidebar */}
          <div className='p-3 border-b border-border'>
            <div className='relative mb-3'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
              <Input placeholder='Search conversations...' value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className='pl-10' />
            </div>
            <Tabs value={activeFilter} onValueChange={(value) => setActiveFilter(value as undefined)}>
              <TabsList className='grid w-full grid-cols-4'>
                <TabsTrigger value='all'>All</TabsTrigger>
                <TabsTrigger value='unread'>Unread</TabsTrigger>
                <TabsTrigger value='mine'>Mine</TabsTrigger>
                <TabsTrigger value='hot'>Hot</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className='flex-1 overflow-auto'>
            {filteredThreads.length === 0 ? (
              <div className='p-6 text-center'>
                <WhatsAppIcon className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
                <h3 className='text-lg font-medium text-foreground mb-2'>No conversations found</h3>
                <p className='text-muted-foreground'>Try adjusting your search or filters.</p>
              </div>
            ) : (
              filteredThreads.map((thread) => (
                <div
                  key={thread.id}
                  onClick={() => {
                    setSelectedThread(thread);
                    setMobileThreadsOpen(false);
                  }}
                  className={`p-4 border-b border-border cursor-pointer hover:bg-muted/50 transition-colors ${
                    selectedThread?.id === thread.id ? 'bg-muted border-l-4 border-l-primary' : ''
                  }`}
                >
                  <div className='flex items-start space-x-3'>
                    <div className='relative'>
                      <Avatar className='h-10 w-10'>
                        <AvatarImage src={thread.lead.name} />
                        <AvatarFallback>{thread.lead.name.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className='absolute -bottom-1 -right-1 text-lg'>{getChannelIcon(thread.channel)}</div>
                    </div>
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center justify-between mb-1'>
                        <h3 className='font-medium text-foreground truncate'>{thread.lead.name}</h3>
                        <div className='flex items-center space-x-1'>
                          {thread.isUnread && <div className='w-2 h-2 bg-primary rounded-full' />}
                          <span className='text-xs text-muted-foreground'>
                            {formatDistanceToNow(new Date(thread.updatedAt), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                      <div className='flex items-center space-x-2 mb-2'>
                        <Badge variant='outline' className={getStatusColor(thread.status)}>
                          {thread.status}
                        </Badge>
                        <Badge variant='outline' className={getPriorityColor(thread.priority)}>
                          {thread.priority}
                        </Badge>
                      </div>
                      <p className='text-sm text-muted-foreground truncate'>{thread.lastMessage?.content || 'No messages yet'}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default InboxPage;
