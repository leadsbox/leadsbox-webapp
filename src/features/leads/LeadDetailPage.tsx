// Lead Detail Page Component for LeadsBox Dashboard

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Save, X, Mail, Phone, Building, Tag, Calendar, DollarSign, MessageCircle, MoreHorizontal, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../../components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import { mockUsers } from '../../data/mockData';
import { Lead, Stage, LEAD_LABELS, LeadLabel, leadLabelUtils } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import { WhatsAppIcon, TelegramIcon } from '@/components/brand-icons';
import client from '@/api/client';
import { endpoints } from '@/api/config';
import { toast } from '../../hooks/use-toast';
import { AxiosError } from 'axios';

// Safe date formatting helper to prevent Invalid time value errors
const safeFormatDistance = (dateValue: string | Date | null | undefined): string => {
  if (!dateValue) return 'N/A';

  try {
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;

    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }

    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    console.warn('Date formatting error:', error, 'for value:', dateValue);
    return 'Invalid date';
  }
};

// Backend lead type matching Prisma schema
interface BackendLead {
  id: string;
  conversationId?: string;
  userId: string;
  provider?: string;
  providerId?: string;
  createdAt: string;
  updatedAt: string;
  label?: string;
  lastMessageAt?: string;
  organizationId: string;
  contactId?: string;
  threadId?: string;
  // Included relations
  contact?: {
    id: string;
    displayName?: string;
    phone?: string;
    email?: string;
    waId?: string;
    igUsername?: string;
    fbPsid?: string;
    createdAt: string;
    updatedAt: string;
  };
  thread?: {
    id: string;
    status: string;
    lastMessageAt: string;
    contact?: {
      id: string;
      displayName?: string;
      phone?: string;
      email?: string;
      waId?: string;
    };
    channel?: {
      type: string;
      displayName?: string;
    };
  };
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

  const getPriorityColor = (priority: 'HIGH' | 'MEDIUM' | 'LOW') => {
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
        console.log('Loading lead with ID:', leadId);

        // Try to get the lead directly from the leads API
        // This should return lead with contact and thread relations included
        let backendLead: BackendLead | null = null;

        try {
          console.log('Fetching lead from leads API...');
          const resp = await client.get(endpoints.lead(leadId));
          console.log('Lead API response:', resp?.data);
          console.log('Lead API response structure keys:', Object.keys(resp?.data || {}));

          // The backend returns {message: '...', data: {...}}
          // Extract the actual lead data from the nested structure
          backendLead = resp?.data?.data || resp?.data?.lead || resp?.data;
          console.log('Extracted backend lead:', backendLead);
          console.log('Backend lead keys:', Object.keys(backendLead || {}));

          if (backendLead) {
            console.log('Successfully loaded lead:', backendLead);
            console.log('Lead contact:', backendLead.contact);
            console.log('Lead thread:', backendLead.thread);
            console.log('Lead contactId:', backendLead.contactId);
            console.log('Lead threadId:', backendLead.threadId);
          }
        } catch (leadError) {
          console.log('Lead API failed:', leadError);

          // If lead API fails, this might be a contact ID or thread ID being used as leadId
          // Let's try to find if there are leads associated with this contact
          try {
            console.log('Trying contact API as fallback...');
            const contactResp = await client.get(endpoints.contact(leadId));
            console.log('Contact API response:', contactResp?.data);

            const contactData = contactResp?.data?.contact || contactResp?.data;
            if (contactData && contactData.Lead && contactData.Lead.length > 0) {
              // If contact has leads, redirect to the first lead
              const firstLead = contactData.Lead[0];
              console.log('Found lead via contact, redirecting to:', firstLead.id);
              navigate(`/dashboard/leads/${firstLead.id}`, { replace: true });
              return;
            } else if (contactData) {
              // Contact exists but no leads - show error
              throw new Error('This contact does not have any associated leads.');
            }
          } catch (contactError) {
            console.log('Contact API also failed:', contactError);
            throw leadError; // Re-throw original lead error
          }
        }

        if (backendLead) {
          // Use contact information if available - check both direct contact and thread contact
          const contact = backendLead.contact || backendLead.thread?.contact;

          const displayName = contact?.displayName;
          let phone = contact?.phone || contact?.waId;
          let email = contact?.email;

          // If we don't have contact data, try to fetch it from the thread/lead
          if (!contact || (!displayName && !phone && !email)) {
            // Try to extract contact info from other fields
            if (backendLead.providerId && backendLead.providerId.includes('@')) {
              email = backendLead.providerId;
            } else if (backendLead.providerId && /^\d+$/.test(backendLead.providerId)) {
              phone = backendLead.providerId;
            }
          }

          // Build proper name from contact data
          let name = displayName;
          if (!name && phone) {
            // Format phone number properly
            name = phone.startsWith('234') ? `+${phone}` : phone;
            // If it's a Nigerian number, try to make it more readable
            if (phone.startsWith('234') && phone.length > 3) {
              name = `+${phone}`;
            }
          }
          if (!name && email) {
            // Use email username as name
            name = email.split('@')[0];
          }
          if (!name) {
            name = backendLead.providerId || backendLead.conversationId || 'Contact';
          }

          // Determine source from provider or thread
          let source: Lead['source'] = 'manual';
          if (backendLead.provider) {
            source = backendLead.provider.toLowerCase() as Lead['source'];
          } else if (backendLead.thread?.channel?.type) {
            source = backendLead.thread.channel.type.toLowerCase() as Lead['source'];
          }

          const mappedLead: Lead = {
            id: backendLead.id,
            name,
            email: email || '',
            phone: phone || '',
            company: undefined,
            source,
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
            threadId: backendLead.threadId,
            providerId: backendLead.providerId,
            contactId: backendLead.contactId,
          };

          console.log('Final mapped lead:', mappedLead);
          console.log('Lead ID being set:', mappedLead.id);

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
        const errorMessage = error instanceof Error ? error.message : 'Failed to load lead details';

        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });

        // Navigate back to leads list
        navigate('/dashboard/leads');
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
      // Update contact information if contactId exists
      if (lead.contactId && (editForm.name || editForm.email || editForm.phone)) {
        await client.put(`/contacts/${lead.contactId}`, {
          displayName: editForm.name?.trim() || null,
          email: editForm.email?.trim() || null,
          phone: editForm.phone?.trim() || null,
        });
      }

      // Update lead information if tags (lead type) changed
      if (editForm.tags && editForm.tags.length > 0) {
        const leadType = editForm.tags[0] as LeadLabel;
        await client.put(endpoints.lead(lead.id), {
          label: leadType,
        });
      }

      // Update local state
      const updatedLead = { ...lead, ...editForm };
      setLead(updatedLead);
      setIsEditing(false);
      setEditForm({});

      toast({
        title: 'Success',
        description: 'Lead and contact updated successfully',
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

  const handleArchiveLead = async () => {
    if (!lead) return;

    try {
      // Try to archive the lead instead of deleting
      await client.put(endpoints.archiveLead(lead.id), { archived: true });

      toast({
        title: 'Success',
        description: 'Lead archived successfully',
      });

      // Navigate back to leads list
      navigate('/dashboard/leads');
    } catch (error) {
      console.error('Error archiving lead:', error);
      toast({
        title: 'Error',
        description: 'Failed to archive lead',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteLead = async () => {
    if (!lead) return;

    // Check if lead ID is valid before attempting deletion
    if (!lead.id || lead.id === 'undefined') {
      toast({
        title: 'Error',
        description: 'Cannot delete lead: Invalid lead ID. Please refresh the page and try again.',
        variant: 'destructive',
      });
      return;
    }

    try {
      console.log('Attempting to delete with ID:', lead.id);
      console.log('Lead contactId:', lead.contactId);
      console.log('Lead conversationId:', lead.conversationId);
      console.log('Lead createdAt:', lead.createdAt);

      // Check if this is a proper lead with backend relationships
      const hasProperLeadData = lead.contactId || lead.threadId || lead.conversationId;
      console.log('Has proper lead data:', hasProperLeadData);

      if (!hasProperLeadData) {
        throw new Error('This does not appear to be a valid lead record. Please ensure you are accessing a proper lead.');
      }

      let deleteSuccess = false;

      // Strategy 1: Try deleting as a lead first
      try {
        console.log('Trying to delete as lead...');
        const response = await client.delete(endpoints.deleteLead(lead.id));
        console.log('Lead delete response:', response);
        deleteSuccess = true;
      } catch (leadDeleteError) {
        console.log('Lead delete failed:', leadDeleteError);

        // Strategy 2: If lead delete fails with 500 error, it might be a contact ID
        if (leadDeleteError instanceof AxiosError && leadDeleteError.response?.status === 500) {
          // Backend error suggests this might be a contact ID being treated as lead ID
          throw new Error('This appears to be contact data rather than a lead. Contact deletion is not currently supported through this interface.');
        } else {
          throw leadDeleteError;
        }
      }

      if (deleteSuccess) {
        toast({
          title: 'Success',
          description: 'Lead deleted successfully',
        });

        // Navigate back to leads list
        navigate('/dashboard/leads');
      }
    } catch (error) {
      console.error('Error deleting:', error);
      console.log('Lead data:', lead);

      // Handle specific error cases
      let errorMessage = 'Failed to delete';
      let errorDescription = '';

      if (error instanceof Error && error.message.includes('contact data rather than a lead')) {
        errorMessage = 'Cannot delete contact';
        errorDescription =
          'This appears to be contact information rather than a lead record. Contact deletion is not currently supported. You can edit the contact information instead.';
      } else if (error instanceof AxiosError && error.response?.data?.message) {
        const backendMessage = error.response.data.message;
        console.log('Backend error message:', backendMessage);

        if (backendMessage.includes('not found')) {
          errorMessage = 'Record not found';
          errorDescription = 'This record may have already been deleted or does not exist in the database.';
        } else if (backendMessage.includes('depends on one or more records') || backendMessage.includes('foreign key constraint')) {
          errorMessage = 'Cannot delete';
          errorDescription =
            'This record has related conversations or data. Would you like to archive it instead? Archiving will hide the record but preserve all related data.';

          // Show option to archive instead
          setTimeout(() => {
            if (confirm('Would you like to archive this record instead of deleting it? This will preserve all related data.')) {
              handleArchiveLead();
            }
          }, 2000);
        } else {
          errorMessage = 'Delete failed';
          errorDescription = backendMessage;
        }
      } else {
        errorDescription = 'An unexpected error occurred while trying to delete the record.';
      }

      toast({
        title: errorMessage,
        description: errorDescription,
        variant: 'destructive',
      });
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
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold'>Lead Details</h1>
          <p className='text-muted-foreground'>View and manage lead information</p>
        </div>
        <div className='flex items-center justify-between sm:justify-start gap-2'>
          <Button variant='outline' size='sm' onClick={() => navigate('/dashboard/leads')}>
            <ArrowLeft className='h-4 w-4 mr-2' />
            Back to Leads
          </Button>
          {isEditing ? (
            <div className='flex items-center gap-2'>
              <Button variant='outline' size='sm' onClick={handleCancelEdit}>
                <X className='h-4 w-4 mr-2' />
                Cancel
              </Button>
              <Button size='sm' onClick={handleSaveLead} disabled={isSaving}>
                <Save className='h-4 w-4 mr-2' />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          ) : (
            <div className='flex items-center gap-2'>
              <Button variant='outline' size='sm' onClick={() => handleEditLead(lead)}>
                <Edit className='h-4 w-4 mr-2' />
                Edit Lead
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant='outline' size='sm' className='text-red-600 hover:text-red-700'>
                    <Trash2 className='h-4 w-4 mr-2' />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Lead</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete lead "<strong>{lead.name}</strong>"? This will permanently remove the lead data. If the lead has
                      related conversations or data, you'll be offered the option to archive it instead.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteLead} className='bg-red-600 hover:bg-red-700'>
                      Delete Lead
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
      </div>

      {/* Lead Profile Header - Contact Information (syncs with Inbox) */}
      <Card>
        <CardContent className='p-4 sm:p-6 lg:p-8'>
          <div className='flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6'>
            <Avatar className='h-16 w-16 sm:h-20 sm:w-20 lg:h-24 lg:w-24 mx-auto sm:mx-0'>
              <AvatarFallback className='bg-primary text-primary-foreground text-2xl sm:text-3xl lg:text-4xl'>
                {(isEditing ? editForm.name : lead.name)?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className='flex-1 text-center sm:text-left'>
              {isEditing ? (
                <div className='space-y-4'>
                  <Input
                    value={editForm.name || ''}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder='Lead name'
                    className='text-lg sm:text-xl lg:text-2xl font-semibold h-10 sm:h-12'
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
                  {lead.contactId && (
                    <p className='text-xs text-muted-foreground text-center sm:text-left'>
                      <MessageCircle className='h-3 w-3 inline mr-1' />
                      Contact changes will sync with inbox conversations
                    </p>
                  )}
                </div>
              ) : (
                <div className='space-y-2'>
                  <h2 className='text-xl sm:text-2xl lg:text-3xl font-bold'>{lead.name}</h2>
                  <div className='flex flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-4 text-muted-foreground text-sm'>
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
                    <div className='flex items-center space-x-2'>
                      {getSourceIcon(lead.source)}
                      <span className='capitalize'>{lead.source}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className='flex flex-row sm:flex-col justify-center gap-2'>
              {isEditing ? (
                <>
                  <Select value={editForm.stage || lead.stage} onValueChange={(value: Stage) => setEditForm((prev) => ({ ...prev, stage: value }))}>
                    <SelectTrigger className='w-[140px] sm:w-[160px]'>
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
                    <SelectTrigger className='w-[140px] sm:w-[160px]'>
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
                  <Badge variant='outline' className={getStageColor(lead.stage)}>
                    {lead.stage}
                  </Badge>
                  <Badge variant='outline' className={getPriorityColor(lead.priority)}>
                    {lead.priority}
                  </Badge>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      {!isEditing && (
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex flex-col sm:flex-row gap-3'>
              {lead.source === 'whatsapp' && (lead.conversationId || lead.providerId) && (
                <Button onClick={() => handleWhatsAppClick(lead)} className='w-full sm:w-auto'>
                  <WhatsAppIcon className='h-4 w-4 mr-2' />
                  Open WhatsApp Chat
                </Button>
              )}
              <Button variant='outline' className='w-full sm:w-auto'>
                <Mail className='h-4 w-4 mr-2' />
                Send Email
              </Button>
              <Button variant='outline' className='w-full sm:w-auto'>
                <Phone className='h-4 w-4 mr-2' />
                Make Call
              </Button>
              <Button variant='outline' size='icon' className='w-full sm:w-auto sm:px-3'>
                <MoreHorizontal className='h-4 w-4' />
                <span className='ml-2 sm:hidden'>More Actions</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
                <div className='text-sm text-muted-foreground'>{safeFormatDistance(lead.createdAt)}</div>
              </div>
            </div>
            <div className='flex items-center space-x-3'>
              <Calendar className='h-4 w-4 text-muted-foreground' />
              <div>
                <div className='text-sm font-medium'>Last Updated</div>
                <div className='text-sm text-muted-foreground'>{safeFormatDistance(lead.updatedAt)}</div>
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
                  {lead.lastActivity ? safeFormatDistance(lead.lastActivity) : 'No activity recorded'}
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
                        <AvatarFallback className='text-xs'>{getAssignedUser(lead.assignedTo)?.name.charAt(0).toUpperCase()}</AvatarFallback>
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
              <div className='text-sm font-medium mb-2'>Lead Type</div>
              {isEditing ? (
                <Select
                  value={editForm.tags?.[0] || lead.tags[0] || 'NEW_LEAD'}
                  onValueChange={(value: LeadLabel) => setEditForm((prev) => ({ ...prev, tags: [value] }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select lead type' />
                  </SelectTrigger>
                  <SelectContent>
                    {leadLabelUtils.getAllLabelOptions().map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className='flex flex-wrap gap-2'>
                  {lead.tags.length > 0 ? (
                    lead.tags.map((tag) => (
                      <Badge key={tag} variant='secondary' className={`bg-${leadLabelUtils.getLabelColor(tag as LeadLabel)}-500/10 text-${leadLabelUtils.getLabelColor(tag as LeadLabel)}-400`}>
                        {leadLabelUtils.isValidLabel(tag) ? leadLabelUtils.getDisplayName(tag as LeadLabel) : tag}
                      </Badge>
                    ))
                  ) : (
                    <Badge variant='secondary'>New Lead</Badge>
                  )}
                </div>
              )}
            </div>

            <div>
              <div className='text-sm font-medium mb-2'>Custom Tags</div>
              {isEditing ? (
                <Input
                  value={editForm.tags?.slice(1).join(', ') || ''}
                  onChange={(e) => {
                    const customTags = e.target.value
                      .split(',')
                      .map((tag) => tag.trim())
                      .filter((tag) => tag);
                    const leadType = editForm.tags?.[0] || lead.tags[0] || 'NEW_LEAD';
                    setEditForm((prev) => ({
                      ...prev,
                      tags: [leadType, ...customTags],
                    }));
                  }}
                  placeholder='Enter custom tags separated by commas'
                />
              ) : (
                <div className='flex flex-wrap gap-2'>
                  {lead.tags.slice(1).length > 0 ? (
                    lead.tags.slice(1).map((tag) => (
                      <Badge key={tag} variant='outline'>
                        {tag}
                      </Badge>
                    ))
                  ) : (
                    <span className='text-sm text-muted-foreground'>No custom tags</span>
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
    </div>
  );
};

export default LeadDetailPage;
