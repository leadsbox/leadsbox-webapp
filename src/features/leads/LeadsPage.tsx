// Leads Page Component for LeadsBox Dashboard

import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { mockUsers } from '../../data/mockData';
import { Lead, Stage, LeadLabel, leadLabelUtils } from '../../types';
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
  const [stageFilter, setStageFilter] = useState<Stage | 'ALL'>('ALL');
  const [leads, setLeads] = useState<Lead[]>([]);
  const navigate = useNavigate();

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

  const labelToPriority = (label?: string): 'HIGH' | 'MEDIUM' | 'LOW' => {
    const labelUpper = (label || '').toUpperCase();

    // High priority labels that need immediate attention
    if (
      labelUpper.includes('PAYMENT_PENDING') ||
      labelUpper.includes('FOLLOW_UP_REQUIRED') ||
      labelUpper.includes('DEMO_REQUEST') ||
      labelUpper.includes('TECHNICAL_SUPPORT')
    ) {
      return 'HIGH';
    }

    // Low priority labels
    if (labelUpper.includes('FEEDBACK') || labelUpper.includes('NOT_A_LEAD') || labelUpper.includes('CLOSED_LOST_TRANSACTION')) {
      return 'LOW';
    }

    // Default to medium for everything else
    return 'MEDIUM';
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
          priority: labelToPriority(l.label),
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
    navigate(`/dashboard/leads/${lead.id}`);
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
                          <Badge key={index} variant='outline' className={`text-xs ${leadLabelUtils.getLabelStyling(tag as LeadLabel)}`}>
                            {leadLabelUtils.isValidLabel(tag) ? leadLabelUtils.getDisplayName(tag as LeadLabel) : tag}
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
    </div>
  );
};

export default LeadsPage;
