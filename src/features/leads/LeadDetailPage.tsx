// Lead Detail Page Component for LeadsBox Dashboard

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Save,
  X,
  Mail,
  Phone,
  Building,
  Tag,
  Calendar,
  DollarSign,
  MessageCircle,
  MoreHorizontal,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
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

const LeadDetailPage: React.FC = () => {
  const { leadId } = useParams<{ leadId: string }>();
  const navigate = useNavigate();
  const [lead, setLead] = useState<Lead | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Lead>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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

  const getAssignedUser = (userId: string) => {
    return mockUsers.find((user) => user.id === userId);
  };

  const getStageColor = (stage: Stage) => {
    switch (stage) {
      case 'NEW':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'QUALIFIED':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'IN_PROGRESS':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'WON':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'LOST':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: 'HIGH' | 'MEDIUM' | 'LOW') => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSourceIcon = (source: Lead['source']) => {
    switch (source) {
      case 'whatsapp':
        return <WhatsAppIcon className='h-4 w-4' />;
      case 'telegram':
        return <TelegramIcon className='h-4 w-4' />;
      case 'website':
        return <Building className='h-4 w-4' />;
      case 'manual':
        return <MessageCircle className='h-4 w-4' />;
      default:
        return <MessageCircle className='h-4 w-4' />;
    }
  };

  // Load lead data
  useEffect(() => {
    const loadLead = async () => {
      if (!leadId) return;
      
      try {
        setIsLoading(true);
        const resp = await client.get(endpoints.leads);
        const list: BackendLead[] = resp?.data?.data?.leads || resp?.data || [];
        const backendLead = list.find((l: BackendLead) => l.id === leadId);
        
        if (backendLead) {
          const mappedLead: Lead = {
            id: backendLead.id,
            name: backendLead.providerId ? `Lead ${String(backendLead.providerId).slice(0, 6)}` : backendLead.conversationId || 'Lead',
            email: '',
            phone: undefined,
            company: undefined,
            source: (String(backendLead.provider || 'manual').toLowerCase() as Lead['source']) || 'manual',
            stage: labelToStage(backendLead.label),
            priority: 'MEDIUM',
            tags: backendLead.label ? [backendLead.label] : [],
            assignedTo: mockUsers[0]?.id,
            createdAt: backendLead.createdAt,
            updatedAt: backendLead.updatedAt,
            lastActivity: backendLead.lastMessageAt || backendLead.updatedAt,
            notes: '',
            value: 0,
            conversationId: backendLead.conversationId,
            providerId: backendLead.providerId,
          };
          setLead(mappedLead);
        } else {
          toast({
            title: 'Error',
            description: 'Lead not found',
            variant: 'destructive',
          });
          navigate('/leads');
        }
      } catch (error) {
        console.error('Error loading lead:', error);
        toast({
          title: 'Error',
          description: 'Failed to load lead details',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadLead();
  }, [leadId, navigate]);

  const handleEditLead = (lead: Lead) => {
    setEditForm(lead);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm({});
  };

  const handleSaveLead = async () => {
    if (!lead) return;
    
    setIsSaving(true);
    try {
      // Here you would make API call to update the lead
      // For now, just update local state
      const updatedLead = { ...lead, ...editForm };
      setLead(updatedLead);
      setIsEditing(false);
      setEditForm({});
      
      toast({
        title: 'Success',
        description: 'Lead updated successfully',
      });
    } catch (error) {
      console.error('Error updating lead:', error);
      toast({
        title: 'Error',
        description: 'Failed to update lead',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleWhatsAppClick = (lead: Lead) => {
    if (lead.conversationId) {
      const whatsappUrl = `https://web.whatsapp.com/send?phone=${lead.phone}&text=`;
      window.open(whatsappUrl, '_blank');
    } else if (lead.providerId) {
      toast({
        title: 'WhatsApp Chat',
        description: `Opening chat for provider ID: ${lead.providerId}`,
      });
    }
  };

  if (isLoading) {
    return (
      <div className='container mx-auto py-8'>
        <div className='flex items-center justify-center h-64'>
          <div className='text-center'>
            <div className='animate-pulse'>Loading lead details...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className='container mx-auto py-8'>
        <div className='flex items-center justify-center h-64'>
          <div className='text-center'>
            <div className='text-muted-foreground'>Lead not found</div>
            <Button onClick={() => navigate('/leads')} className='mt-4'>
              Back to Leads
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='container mx-auto py-6 space-y-6'>
      {/* Header with Back Button */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center space-x-4'>
          <Button variant='outline' size='sm' onClick={() => navigate('/leads')}>
            <ArrowLeft className='h-4 w-4 mr-2' />
            Back to Leads
          </Button>
          <div>
            <h1 className='text-2xl font-bold'>Lead Details</h1>
            <p className='text-muted-foreground'>View and manage lead information</p>
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
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </>
          ) : (
            <Button variant='outline' size='sm' onClick={() => handleEditLead(lead)}>
              <Edit className='h-4 w-4 mr-2' />
              Edit Lead
            </Button>
          )}
        </div>
      </div>

      {/* Lead Profile Header */}
      <Card>
        <CardContent className='p-8'>
          <div className='flex items-center space-x-6'>
            <Avatar className='h-24 w-24'>
              <AvatarFallback className='bg-primary text-primary-foreground text-4xl'>
                {(isEditing ? editForm.name : lead.name)?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className='flex-1'>
              {isEditing ? (
                <div className='space-y-4'>
                  <Input
                    value={editForm.name || ''}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder='Lead name'
                    className='text-2xl font-semibold h-12'
                  />
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
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
                    <Input
                      value={editForm.company || ''}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, company: e.target.value }))}
                      placeholder='Company'
                    />
                    <Input
                      value={editForm.value?.toString() || ''}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
                      placeholder='Deal value'
                      type='number'
                    />
                  </div>
                </div>
              ) : (
                <div className='space-y-2'>
                  <h2 className='text-3xl font-bold'>{lead.name}</h2>
                  <div className='flex flex-wrap items-center gap-4 text-muted-foreground'>
                    {lead.email && (
                      <div className='flex items-center space-x-2'>
                        <Mail className='h-4 w-4' />
                        <span>{lead.email}</span>
                      </div>
                    )}
                    {lead.phone && (
                      <div className='flex items-center space-x-2'>
                        <Phone className='h-4 w-4' />
                        <span>{lead.phone}</span>
                      </div>
                    )}
                    {lead.company && (
                      <div className='flex items-center space-x-2'>
                        <Building className='h-4 w-4' />
                        <span>{lead.company}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className='flex flex-col space-y-2'>
              {isEditing ? (
                <>
                  <Select
                    value={editForm.stage || lead.stage}
                    onValueChange={(value: Stage) => setEditForm((prev) => ({ ...prev, stage: value }))}
                  >
                    <SelectTrigger className='w-[160px]'>
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
                    value={editForm.priority || lead.priority}
                    onValueChange={(value: 'HIGH' | 'MEDIUM' | 'LOW') => setEditForm((prev) => ({ ...prev, priority: value }))}
                  >
                    <SelectTrigger className='w-[160px]'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='HIGH'>High Priority</SelectItem>
                      <SelectItem value='MEDIUM'>Medium Priority</SelectItem>
                      <SelectItem value='LOW'>Low Priority</SelectItem>
                    </SelectContent>
                  </Select>
                </>
              ) : (
                <>
                  <Badge variant='outline' className={getStageColor(lead.stage)}>
                    {lead.stage}
                  </Badge>
                  <Badge variant='outline' className={getPriorityColor(lead.priority)}>
                    {lead.priority} Priority
                  </Badge>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Grid */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center'>
              <Mail className='h-5 w-5 mr-2' />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='flex items-center space-x-3'>
              <Mail className='h-4 w-4 text-muted-foreground' />
              <span className='text-sm'>{lead.email || 'No email provided'}</span>
            </div>
            <div className='flex items-center space-x-3'>
              <Phone className='h-4 w-4 text-muted-foreground' />
              <span className='text-sm'>{lead.phone || 'No phone provided'}</span>
            </div>
            <div className='flex items-center space-x-3'>
              <Building className='h-4 w-4 text-muted-foreground' />
              <span className='text-sm'>{lead.company || 'No company specified'}</span>
            </div>
            <div className='flex items-center space-x-3'>
              <DollarSign className='h-4 w-4 text-muted-foreground' />
              <span className='text-sm'>{lead.value ? `$${lead.value.toLocaleString()}` : 'No deal value'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Activity Information */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center'>
              <Calendar className='h-5 w-5 mr-2' />
              Activity Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='flex items-center space-x-3'>
              <Calendar className='h-4 w-4 text-muted-foreground' />
              <div>
                <div className='text-sm font-medium'>Created</div>
                <div className='text-sm text-muted-foreground'>
                  {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true })}
                </div>
              </div>
            </div>
            <div className='flex items-center space-x-3'>
              <Calendar className='h-4 w-4 text-muted-foreground' />
              <div>
                <div className='text-sm font-medium'>Last Updated</div>
                <div className='text-sm text-muted-foreground'>
                  {formatDistanceToNow(new Date(lead.updatedAt), { addSuffix: true })}
                </div>
              </div>
            </div>
            <div className='flex items-center space-x-3'>
              {getSourceIcon(lead.source)}
              <div>
                <div className='text-sm font-medium'>Source</div>
                <div className='text-sm text-muted-foreground capitalize'>{lead.source}</div>
              </div>
            </div>
            <div className='flex items-center space-x-3'>
              <MessageCircle className='h-4 w-4 text-muted-foreground' />
              <div>
                <div className='text-sm font-medium'>Last Activity</div>
                <div className='text-sm text-muted-foreground'>
                  {lead.lastActivity
                    ? formatDistanceToNow(new Date(lead.lastActivity), { addSuffix: true })
                    : 'No activity recorded'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assignment Information */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center'>
              <Tag className='h-5 w-5 mr-2' />
              Assignment & Tags
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div>
              <div className='text-sm font-medium mb-2'>Assigned To</div>
              {isEditing ? (
                <Select
                  value={editForm.assignedTo || lead.assignedTo || ''}
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
                  {lead.assignedTo ? (
                    <div className='flex items-center space-x-3'>
                      <Avatar className='h-8 w-8'>
                        <AvatarImage src={getAssignedUser(lead.assignedTo)?.avatar} />
                        <AvatarFallback className='text-xs'>
                          {getAssignedUser(lead.assignedTo)?.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className='text-sm'>{getAssignedUser(lead.assignedTo)?.name}</span>
                    </div>
                  ) : (
                    <span className='text-sm text-muted-foreground'>Unassigned</span>
                  )}
                </>
              )}
            </div>

            <div>
              <div className='text-sm font-medium mb-2'>Tags</div>
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
                  {lead.tags.length > 0 ? (
                    lead.tags.map((tag) => (
                      <Badge key={tag} variant='secondary'>
                        {tag}
                      </Badge>
                    ))
                  ) : (
                    <span className='text-sm text-muted-foreground'>No tags</span>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notes Section */}
      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <Textarea
              value={editForm.notes || ''}
              onChange={(e) => setEditForm((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder='Add notes about this lead...'
              rows={6}
              className='resize-none'
            />
          ) : (
            <div className='min-h-[120px] p-4 bg-muted/50 rounded-md'>
              <p className='text-sm whitespace-pre-wrap'>{lead.notes || 'No notes available for this lead.'}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      {!isEditing && (
        <Card>
          <CardContent className='p-6'>
            <div className='flex justify-between items-center'>
              <h3 className='text-lg font-semibold'>Quick Actions</h3>
              <div className='flex space-x-3'>
                {lead.source === 'whatsapp' && (lead.conversationId || lead.providerId) && (
                  <Button onClick={() => handleWhatsAppClick(lead)}>
                    <WhatsAppIcon className='h-4 w-4 mr-2' />
                    Open WhatsApp Chat
                  </Button>
                )}
                <Button variant='outline'>
                  <Mail className='h-4 w-4 mr-2' />
                  Send Email
                </Button>
                <Button variant='outline'>
                  <Phone className='h-4 w-4 mr-2' />
                  Make Call
                </Button>
                <Button variant='outline' size='icon'>
                  <MoreHorizontal className='h-4 w-4' />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LeadDetailPage;