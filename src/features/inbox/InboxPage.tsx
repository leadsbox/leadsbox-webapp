// Inbox Page Component for LeadsBox Dashboard

import React, { useEffect, useState } from 'react';
import { Search, Filter, MoreHorizontal, MessageCircle, Phone, Clock, X, ChevronLeft } from 'lucide-react';
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
import { mockThreads, mockMessages } from '../../data/mockData';
import { Thread, Message } from '../../types';
import { formatDistanceToNow } from 'date-fns';

const InboxPage: React.FC = () => {
  const [selectedThread, setSelectedThread] = useState<Thread | null>(mockThreads[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'mine' | 'hot'>('all');
  const [mobileThreadsOpen, setMobileThreadsOpen] = useState(false);

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

  const filteredThreads = mockThreads.filter(thread => {
    const matchesSearch = thread.lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         thread.lead.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    switch (activeFilter) {
      case 'unread':
        return matchesSearch && thread.isUnread;
      case 'mine':
        return matchesSearch && thread.assignedTo === '2'; // Current user
      case 'hot':
        return matchesSearch && thread.priority === 'HIGH';
      default:
        return matchesSearch;
    }
  });

  const getChannelIcon = (channel: Thread['channel']) => {
    switch (channel) {
      case 'whatsapp':
        return '💬';
      case 'telegram':
        return '✈️';
      case 'sms':
        return '📱';
      case 'email':
        return '✉️';
      default:
        return '💬';
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

  return (
    <div className="flex h-full bg-background">
      {/* Thread List Sidebar - Desktop */}
      <div className="hidden md:flex w-96 border-r border-border flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-semibold text-foreground">Inbox</h1>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Mark all as read</DropdownMenuItem>
                <DropdownMenuItem>Archive conversations</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Export data</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters */}
          <Tabs value={activeFilter} onValueChange={(value) => setActiveFilter(value as undefined)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="unread">Unread</TabsTrigger>
              <TabsTrigger value="mine">Mine</TabsTrigger>
              <TabsTrigger value="hot">Hot</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Thread List */}
        <div className="flex-1 overflow-auto">
          {filteredThreads.length === 0 ? (
            <div className="p-6 text-center">
              <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No conversations found</h3>
              <p className="text-muted-foreground">Try adjusting your search or filters.</p>
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
                <div className="flex items-start space-x-3">
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={thread.lead.name} />
                      <AvatarFallback>
                        {thread.lead.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 text-lg">
                      {getChannelIcon(thread.channel)}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-foreground truncate">
                        {thread.lead.name}
                      </h3>
                      <div className="flex items-center space-x-1">
                        {thread.isUnread && (
                          <div className="w-2 h-2 bg-primary rounded-full" />
                        )}
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(thread.updatedAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 mb-2">
                      <Badge variant="outline" className={getStatusColor(thread.status)}>
                        {thread.status}
                      </Badge>
                      <Badge variant="outline" className={getPriorityColor(thread.priority)}>
                        {thread.priority}
                      </Badge>
                    </div>

                    <p className="text-sm text-muted-foreground truncate">
                      {thread.lastMessage?.content || 'No messages yet'}
                    </p>

                    {thread.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {thread.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {thread.tags.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{thread.tags.length - 2}
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
      <div className="flex-1 flex flex-col min-w-0">
        {selectedThread ? (
          <>
            {/* Conversation Header */}
            <div className="p-3 sm:p-4 border-b border-border bg-card sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {/* Mobile: back to conversations */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    aria-label="Back to conversations"
                    onClick={() => setMobileThreadsOpen(true)}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedThread.lead.name} />
                    <AvatarFallback>
                      {selectedThread.lead.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">
                      {selectedThread.lead.name}
                    </h2>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <span>{selectedThread.lead.email}</span>
                      {selectedThread.lead.phone && (
                        <>
                          <span>•</span>
                          <span>{selectedThread.lead.phone}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="icon">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
              {mockMessages
                .filter((msg) => msg.threadId === selectedThread.id)
                .map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.sender === 'AGENT' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.sender === 'AGENT'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-foreground'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs opacity-70">
                          {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                        </span>
                        {message.sender === 'AGENT' && (
                          <div className="flex items-center space-x-1">
                            {message.isRead ? (
                              <span className="text-xs opacity-70">✓✓</span>
                            ) : (
                              <span className="text-xs opacity-70">✓</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            {/* Message Input */}
            <div className="p-3 sm:p-4 border-t border-border bg-card/50">
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="Type your message..."
                  className="flex-1"
                />
                <Button>Send</Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-medium text-foreground mb-2">
                Select a conversation
              </h3>
              <p className="text-muted-foreground">
                Choose a conversation from the left to start messaging
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Threads Drawer */}
      <div
        id="mobile-threads"
        className={`md:hidden fixed inset-0 z-40 ${mobileThreadsOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
        aria-hidden={!mobileThreadsOpen}
      >
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity ${mobileThreadsOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setMobileThreadsOpen(false)}
        />
        <aside
          className={`absolute inset-y-0 left-0 w-80 max-w-[85vw] bg-card border-r border-border shadow-lg transition-transform duration-300 ease-in-out ${mobileThreadsOpen ? 'translate-x-0' : '-translate-x-full'}`}
          role="dialog"
          aria-modal="true"
          aria-label="Threads"
        >
          {/* Drawer Header */}
          <div className="p-3 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold">Inbox</h2>
            <Button variant="ghost" size="icon" aria-label="Close threads" onClick={() => setMobileThreadsOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          {/* Same content as desktop sidebar */}
          <div className="p-3 border-b border-border">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Tabs value={activeFilter} onValueChange={(value) => setActiveFilter(value as undefined)}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="unread">Unread</TabsTrigger>
                <TabsTrigger value="mine">Mine</TabsTrigger>
                <TabsTrigger value="hot">Hot</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="flex-1 overflow-auto">
            {filteredThreads.length === 0 ? (
              <div className="p-6 text-center">
                <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No conversations found</h3>
                <p className="text-muted-foreground">Try adjusting your search or filters.</p>
              </div>
            ) : (
              filteredThreads.map((thread) => (
                <div
                  key={thread.id}
                  onClick={() => { setSelectedThread(thread); setMobileThreadsOpen(false); }}
                  className={`p-4 border-b border-border cursor-pointer hover:bg-muted/50 transition-colors ${
                    selectedThread?.id === thread.id ? 'bg-muted border-l-4 border-l-primary' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={thread.lead.name} />
                        <AvatarFallback>
                          {thread.lead.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 text-lg">
                        {getChannelIcon(thread.channel)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-medium text-foreground truncate">
                          {thread.lead.name}
                        </h3>
                        <div className="flex items-center space-x-1">
                          {thread.isUnread && <div className="w-2 h-2 bg-primary rounded-full" />}
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(thread.updatedAt), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge variant="outline" className={getStatusColor(thread.status)}>
                          {thread.status}
                        </Badge>
                        <Badge variant="outline" className={getPriorityColor(thread.priority)}>
                          {thread.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {thread.lastMessage?.content || 'No messages yet'}
                      </p>
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
