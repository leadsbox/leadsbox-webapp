// Leads Page Component for LeadsBox Dashboard

import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Filter,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  ExternalLink,
  Mail,
  Phone,
  Building,
  Tag,
  Calendar,
  DollarSign,
  MessageCircle,
  Save,
  X,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '../../components/ui/sheet';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { mockUsers } from '../../data/mockData';
import { Lead, Stage } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import { WhatsAppIcon, TelegramIcon } from '@/components/brand-icons';
import client from '@/api/client';
import { endpoints } from '@/api/config';
import { toast } from '../../hooks/use-toast';

// Backend lead type
interface BackendLead {
  id: string;
  conversationId?: string;
  providerId?: string;
  provider?: string;
  label?: string;
  createdAt: string;
  updatedAt: string;
  lastMessageAt?: string;
}

const LeadsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [stageFilter, setStageFilter] = useState<Stage | 'ALL'>('ALL');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Lead>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const labelToStage = (label?: string): Stage => {
    switch ((label || '').toUpperCase()) {
      case 'NEW':
        return 'NEW';
      case 'QUALIFIED':
        return 'QUALIFIED';
      case 'CUSTOMER':
        return 'WON';
      case 'CONTACTED':
        return 'IN_PROGRESS';
      case 'UNQUALIFIED':
      case 'LOST':
        return 'LOST';
      default:
        return 'NEW';
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const resp = await client.get(endpoints.leads);
        const list: BackendLead[] = resp?.data?.data?.leads || resp?.data || [];
        const mapped: Lead[] = list.map((l: BackendLead) => ({
          id: l.id,
          name: l.providerId ? `Lead ${String(l.providerId).slice(0, 6)}` : l.conversationId || 'Lead',
          email: '',
          phone: undefined,
          company: undefined,
          source: (String(l.provider || 'manual').toLowerCase() as Lead['source']) || 'manual',
          stage: labelToStage(l.label),
          priority: 'MEDIUM',
          tags: l.label ? [l.label] : [], // Show the actual lead classification as a tag
          assignedTo: '',
          value: undefined,
          createdAt: l.createdAt,
          updatedAt: l.updatedAt,
          lastActivity: l.lastMessageAt,
          // Store original conversation info for WhatsApp navigation
          conversationId: l.conversationId,
          providerId: l.providerId,
          from: l.providerId || l.conversationId,
        }));
        setLeads(mapped);
      } catch (e) {
        console.error('Failed to load leads', e);
        setLeads([]);
      }
    })();
  }, []);

  const filteredLeads = useMemo(
    () =>
      leads.filter((lead) => {
        const matchesSearch =
          lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          lead.company?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStage = stageFilter === 'ALL' || lead.stage === stageFilter;

        return matchesSearch && matchesStage;
      }),
    [leads, searchQuery, stageFilter]
  );

  const getStageColor = (stage: Stage) => {
    switch (stage) {
      case 'NEW':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'QUALIFIED':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'IN_PROGRESS':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'WON':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'LOST':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const getPriorityColor = (priority: Lead['priority']) => {
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

  const getSourceIcon = (source: Lead['source']) => {
    switch (source) {
      case 'whatsapp':
        return <WhatsAppIcon className='h-4 w-4' />;
      case 'telegram':
        return <TelegramIcon className='h-4 w-4' />;
      case 'website':
        return (
          <span role='img' aria-label='website'>
            🌐
          </span>
        );
      case 'manual':
        return (
          <span role='img' aria-label='manual'>
            📝
          </span>
        );
      default:
        return (
          <span role='img' aria-label='manual'>
            📝
          </span>
        );
    }
  };

  const getAssignedUser = (userId: string) => {
    return mockUsers.find((user) => user.id === userId);
  };

  const handleLeadSelection = (lead: Lead) => {
    setSelectedLead(lead);
    setIsEditing(false);
    setEditForm({});
    setIsSheetOpen(true);
  };

  const handleSheetOpenChange = (open: boolean) => {
    setIsSheetOpen(open);
    if (!open) {
      setIsEditing(false);
      setEditForm({});
      setSelectedLead(null);
    }
  };

  const handleEditLead = (lead: Lead) => {
    setSelectedLead(lead);
    setEditForm({
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      company: lead.company,
      stage: lead.stage,
      priority: lead.priority,
      tags: [...lead.tags],
      notes: lead.notes,
      value: lead.value,
      assignedTo: lead.assignedTo,
    });
    setIsEditing(true);
  };

  const handleSaveLead = async () => {
    if (!selectedLead) return;

    setIsSaving(true);
    try {
      const response = await client.put(endpoints.lead(selectedLead.id), editForm);
      if (response.data) {
        // Update the lead in our local state
        setLeads((prev) => prev.map((lead) => (lead.id === selectedLead.id ? ({ ...lead, ...editForm } as Lead) : lead)));
        setSelectedLead({ ...selectedLead, ...editForm } as Lead);
        setIsEditing(false);
        toast({
          title: 'Lead updated',
          description: 'Lead information has been saved successfully.',
        });
      }
    } catch (error) {
      console.error('Failed to update lead:', error);
      toast({
        title: 'Error',
        description: 'Failed to update lead. Please try again.',
        variant: 'destructive',
      });
    }
    setIsSaving(false);
  };

  const handleCancelEdit = () => {
    setEditForm({});
    setIsEditing(false);
  };

  const handleWhatsAppClick = (lead: Lead) => {
    // Navigate to WhatsApp conversation
    // This will depend on how your WhatsApp integration works
    // For now, we'll construct a URL or trigger a navigation
    if (lead.source === 'whatsapp') {
      // Extract conversation/provider ID from lead data
      // We'll need to store this data when we create the lead
      const leadData = lead as Lead & { conversationId?: string; providerId?: string };
      const conversationId = leadData.conversationId || leadData.providerId;
      if (conversationId) {
        // Navigate to inbox with this conversation selected
        window.location.href = `/dashboard/inbox?conversation=${conversationId}`;
      } else {
        toast({
          title: 'Conversation not found',
          description: 'Unable to locate the original WhatsApp conversation.',
          variant: 'destructive',
        });
      }
    }
  };

  return (
    <div className='p-4 sm:p-6 space-y-4 sm:space-y-6'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
        <div>
          <h1 className='text-2xl sm:text-3xl font-bold text-foreground'>Leads</h1>
          <p className='text-sm sm:text-base text-muted-foreground'>Manage and track your leads</p>
        </div>
        <Button>
          <Plus className='h-4 w-4 mr-2' />
          Add Lead
        </Button>
      </div>

      {/* Filters and Search */}
      <div className='flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4'>
        <div className='relative flex-1'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
          <Input placeholder='Search leads...' value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className='pl-10' />
        </div>

        <Tabs value={stageFilter} onValueChange={(value: Stage | 'ALL') => setStageFilter(value)}>
          <TabsList className='flex flex-wrap sm:flex-nowrap gap-2 overflow-x-auto'>
            <TabsTrigger value='ALL'>All</TabsTrigger>
            <TabsTrigger value='NEW'>New</TabsTrigger>
            <TabsTrigger value='QUALIFIED'>Qualified</TabsTrigger>
            <TabsTrigger value='IN_PROGRESS'>In Progress</TabsTrigger>
            <TabsTrigger value='WON'>Won</TabsTrigger>
            <TabsTrigger value='LOST'>Lost</TabsTrigger>
          </TabsList>
        </Tabs>

        <Button variant='outline'>
          <Filter className='h-4 w-4 mr-2' />
          Filter
        </Button>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Total Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{leads.length}</div>
            <p className='text-xs text-muted-foreground'>+12% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Qualified</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{leads.filter((l) => l.stage === 'QUALIFIED').length}</div>
            <p className='text-xs text-muted-foreground'>+8% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Conversion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>24.5%</div>
            <p className='text-xs text-muted-foreground'>+2.1% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Active Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{filteredLeads.length}</div>
            <p className='text-xs text-muted-foreground'>Based on current filters</p>
          </CardContent>
        </Card>
      </div>

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle>Leads ({filteredLeads.length})</CardTitle>
        </CardHeader>
        <CardContent className='overflow-x-auto'>
          <Table className='min-w-[800px]'>
            <TableHeader>
              <TableRow>
                <TableHead>Lead</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>From</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Last Activity</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.map((lead) => {
                const assignedUser = getAssignedUser(lead.assignedTo || '');

                return (
                  <TableRow key={lead.id} className='cursor-pointer hover:bg-muted/50' onClick={() => handleLeadSelection(lead)}>
                    <TableCell>
                      <div className='flex items-center space-x-3'>
                        <Avatar className='h-8 w-8'>
                          <AvatarFallback className='bg-primary/10 text-primary'>{lead.name.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className='font-medium'>{lead.name}</div>
                          <div className='text-sm text-muted-foreground'>{lead.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center'>
                        {lead.company && (
                          <>
                            <Building className='h-3 w-3 mr-1 text-muted-foreground' />
                            <span className='text-sm'>{lead.company}</span>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center'>
                        {getSourceIcon(lead.source)}
                        <span className='capitalize text-sm ml-1'>{lead.source}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className='text-sm text-muted-foreground'>
                        {(() => {
                          const leadData = lead as Lead & { from?: string; providerId?: string; conversationId?: string };
                          return leadData.from || leadData.providerId || leadData.conversationId || '—';
                        })()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant='outline' className={getStageColor(lead.stage)}>
                        {lead.stage}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className='flex flex-wrap gap-1'>
                        {lead.tags.map((tag, index) => (
                          <Badge key={index} variant='secondary' className='text-xs'>
                            {tag}
                          </Badge>
                        ))}
                        {lead.tags.length === 0 && <span className='text-sm text-muted-foreground'>—</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant='outline' className={getPriorityColor(lead.priority)}>
                        {lead.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {assignedUser && (
                        <div className='flex items-center space-x-2'>
                          <Avatar className='h-6 w-6'>
                            <AvatarImage src={assignedUser.avatar} />
                            <AvatarFallback className='text-xs'>{assignedUser.name.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span className='text-sm'>{assignedUser.name}</span>
                        </div>
                      )}
                    </TableCell>

                    <TableCell>
                      <span className='text-sm text-muted-foreground'>
                        {lead.lastActivity && formatDistanceToNow(new Date(lead.lastActivity), { addSuffix: true })}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant='ghost'
                        size='icon'
                        onClick={(event) => {
                          event.stopPropagation();
                          handleLeadSelection(lead);
                        }}
                      >
                        <ExternalLink className='h-4 w-4' />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Sheet open={isSheetOpen} onOpenChange={handleSheetOpenChange}>
        <SheetContent className='w-[600px] sm:w-[600px] flex h-full flex-col overflow-hidden'>
          <SheetHeader>
            <SheetTitle>Lead Profile</SheetTitle>
            <SheetDescription>View and manage lead information</SheetDescription>
          </SheetHeader>

          {selectedLead && (
            <div className='mt-6 flex-1 space-y-6 overflow-y-auto pr-4 pb-6'>
              {/* Header with Edit Toggle */}
              <div className='flex items-center justify-between'>
                <div className='flex items-center space-x-4'>
                  <Avatar className='h-16 w-16'>
                    <AvatarFallback className='bg-primary text-primary-foreground text-2xl'>
                      {(isEditing ? editForm.name : selectedLead.name)?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className='flex-1'>
                    {isEditing ? (
                      <div className='space-y-2'>
                        <Input
                          value={editForm.name || ''}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                          placeholder='Lead name'
                          className='text-xl font-semibold'
                        />
                        <div className='flex space-x-2'>
                          <Input
                            value={editForm.email || ''}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
                            placeholder='Email'
                            type='email'
                          />
                          <Input
                            value={editForm.phone || ''}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))}
                            placeholder='Phone'
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <h2 className='text-2xl font-semibold'>{selectedLead.name}</h2>
                        <div className='flex items-center space-x-4 mt-1'>
                          <span className='text-muted-foreground'>{selectedLead.email}</span>
                          {selectedLead.phone && <span className='text-muted-foreground'>{selectedLead.phone}</span>}
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div className='flex space-x-2'>
                  {isEditing ? (
                    <>
                      <Button variant='outline' size='sm' onClick={handleCancelEdit}>
                        <X className='h-4 w-4 mr-2' />
                        Cancel
                      </Button>
                      <Button size='sm' onClick={handleSaveLead} disabled={isSaving}>
                        <Save className='h-4 w-4 mr-2' />
                        {isSaving ? 'Saving...' : 'Save'}
                      </Button>
                    </>
                  ) : (
                    <Button variant='outline' size='sm' onClick={() => handleEditLead(selectedLead)}>
                      <Edit className='h-4 w-4 mr-2' />
                      Edit
                    </Button>
                  )}
                </div>
              </div>

              {/* Status and Priority */}
              <div className='flex items-center space-x-4'>
                {isEditing ? (
                  <>
                    <Select
                      value={editForm.stage || selectedLead.stage}
                      onValueChange={(value: Stage) => setEditForm((prev) => ({ ...prev, stage: value }))}
                    >
                      <SelectTrigger className='w-[140px]'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='NEW'>New</SelectItem>
                        <SelectItem value='QUALIFIED'>Qualified</SelectItem>
                        <SelectItem value='IN_PROGRESS'>In Progress</SelectItem>
                        <SelectItem value='WON'>Won</SelectItem>
                        <SelectItem value='LOST'>Lost</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={editForm.priority || selectedLead.priority}
                      onValueChange={(value: 'HIGH' | 'MEDIUM' | 'LOW') => setEditForm((prev) => ({ ...prev, priority: value }))}
                    >
                      <SelectTrigger className='w-[140px]'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='HIGH'>High</SelectItem>
                        <SelectItem value='MEDIUM'>Medium</SelectItem>
                        <SelectItem value='LOW'>Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </>
                ) : (
                  <>
                    <Badge variant='outline' className={getStageColor(selectedLead.stage)}>
                      {selectedLead.stage}
                    </Badge>
                    <Badge variant='outline' className={getPriorityColor(selectedLead.priority)}>
                      {selectedLead.priority}
                    </Badge>
                  </>
                )}
              </div>

              {/* Contact Info */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <Card>
                  <CardHeader className='pb-3'>
                    <CardTitle className='text-sm flex items-center'>
                      <Mail className='h-4 w-4 mr-2' />
                      Contact Info
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-2'>
                    <div className='flex items-center space-x-2 text-sm text-muted-foreground'>
                      <Mail className='h-4 w-4' />
                      <span>{selectedLead.email || 'No email provided'}</span>
                    </div>
                    <div className='flex items-center space-x-2 text-sm text-muted-foreground'>
                      <Phone className='h-4 w-4' />
                      <span>{selectedLead.phone || 'No phone provided'}</span>
                    </div>
                    <div className='flex items-center space-x-2 text-sm text-muted-foreground'>
                      <Building className='h-4 w-4' />
                      <span>{selectedLead.company || 'No company specified'}</span>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className='pb-3'>
                    <CardTitle className='text-sm flex items-center'>
                      <Calendar className='h-4 w-4 mr-2' />
                      Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-2 text-sm text-muted-foreground'>
                    <div className='flex items-center space-x-2'>
                      <Calendar className='h-4 w-4' />
                      <span>Created {formatDistanceToNow(new Date(selectedLead.createdAt), { addSuffix: true })}</span>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <Calendar className='h-4 w-4' />
                      <span>Updated {formatDistanceToNow(new Date(selectedLead.updatedAt), { addSuffix: true })}</span>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <DollarSign className='h-4 w-4' />
                      <span>{selectedLead.value ? `$${selectedLead.value.toLocaleString()}` : 'No deal value'}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Assigned To */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <Card>
                  <CardHeader className='pb-3'>
                    <CardTitle className='text-sm flex items-center'>
                      <MessageCircle className='h-4 w-4 mr-2' />
                      Source & Engagement
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-2 text-sm text-muted-foreground'>
                    <div className='flex items-center space-x-2'>
                      {getSourceIcon(selectedLead.source)}
                      <span className='capitalize'>{selectedLead.source}</span>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <Calendar className='h-4 w-4' />
                      <span>
                        Last activity{' '}
                        {selectedLead.lastActivity
                          ? formatDistanceToNow(new Date(selectedLead.lastActivity), { addSuffix: true })
                          : 'No activity recorded'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className='pb-3'>
                    <CardTitle className='text-sm flex items-center'>
                      <Tag className='h-4 w-4 mr-2' />
                      Assignment
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isEditing ? (
                      <Select
                        value={editForm.assignedTo || selectedLead.assignedTo || ''}
                        onValueChange={(value) => setEditForm((prev) => ({ ...prev, assignedTo: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder='Assign to user' />
                        </SelectTrigger>
                        <SelectContent>
                          {mockUsers.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              <div className='flex items-center space-x-2'>
                                <Avatar className='h-6 w-6'>
                                  <AvatarImage src={user.avatar} />
                                  <AvatarFallback className='text-xs'>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <span>{user.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <>
                        {selectedLead.assignedTo ? (
                          <div className='flex items-center space-x-2'>
                            <Avatar className='h-8 w-8'>
                              <AvatarImage src={getAssignedUser(selectedLead.assignedTo)?.avatar} />
                              <AvatarFallback className='text-xs'>
                                {getAssignedUser(selectedLead.assignedTo)?.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span>{getAssignedUser(selectedLead.assignedTo)?.name}</span>
                          </div>
                        ) : (
                          <span className='text-muted-foreground'>Unassigned</span>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Tags */}
              <Card>
                <CardHeader className='pb-3'>
                  <CardTitle className='text-sm flex items-center'>
                    <Tag className='h-4 w-4 mr-2' />
                    Tags
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <Input
                      value={editForm.tags?.join(', ') || ''}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          tags: e.target.value
                            .split(',')
                            .map((tag) => tag.trim())
                            .filter((tag) => tag),
                        }))
                      }
                      placeholder='Enter tags separated by commas'
                    />
                  ) : (
                    <div className='flex flex-wrap gap-2'>
                      {selectedLead.tags.length > 0 ? (
                        selectedLead.tags.map((tag) => (
                          <Badge key={tag} variant='secondary'>
                            {tag}
                          </Badge>
                        ))
                      ) : (
                        <span className='text-muted-foreground text-sm'>No tags</span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Notes */}
              <Card>
                <CardHeader className='pb-3'>
                  <CardTitle className='text-sm'>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <Textarea
                      value={editForm.notes || ''}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, notes: e.target.value }))}
                      placeholder='Add notes about this lead...'
                      rows={3}
                    />
                  ) : (
                    <p className='text-sm text-muted-foreground whitespace-pre-wrap'>{selectedLead.notes || 'No notes'}</p>
                  )}
                </CardContent>
              </Card>

              {/* Actions */}
              {!isEditing && (
                <div className='flex space-x-2 pt-4 border-t'>
                  {selectedLead.source === 'whatsapp' && (selectedLead.conversationId || selectedLead.providerId) && (
                    <Button className='flex-1' onClick={() => handleWhatsAppClick(selectedLead)}>
                      <WhatsAppIcon className='h-4 w-4 mr-2' />
                      Open WhatsApp Chat
                    </Button>
                  )}
                  <Button variant='outline' size='icon'>
                    <MoreHorizontal className='h-4 w-4' />
                  </Button>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default LeadsPage;
