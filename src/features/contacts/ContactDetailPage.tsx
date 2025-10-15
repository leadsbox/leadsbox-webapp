// Contact Detail Page - Central Hub for Contact Management

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Save, X, Mail, Phone, MessageCircle, User, Calendar, Building } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { WhatsAppIcon, TelegramIcon } from '@/components/brand-icons';
import client from '@/api/client';
import { endpoints } from '@/api/config';
import { notify } from '@/lib/toast';
import { formatDistanceToNow } from 'date-fns';
import { LeadLabel, leadLabelUtils } from '../../types';

interface Contact {
  id: string;
  displayName?: string;
  phone?: string;
  email?: string;
  waId?: string;
  igUsername?: string;
  fbPsid?: string;
  country?: string;
  lastSeenAt?: string;
  createdAt: string;
  updatedAt: string;
  Lead: Array<{
    id: string;
    label?: string;
    createdAt: string;
    Deal: Array<{
      id: string;
      title: string;
      stage: string;
      amountCents: number;
    }>;
  }>;
  Thread: Array<{
    id: string;
    status: string;
    lastMessageAt: string;
    channel: {
      type: string;
      displayName?: string;
    };
  }>;
}

const ContactDetailPage: React.FC = () => {
  const { contactId } = useParams<{ contactId: string }>();
  const navigate = useNavigate();
  const [contact, setContact] = useState<Contact | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Contact>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load contact data
  useEffect(() => {
    const loadContact = async () => {
      if (!contactId) return;

      try {
        setIsLoading(true);
        const resp = await client.get(endpoints.contact(contactId));
        const contactData: Contact = resp?.data?.contact;

        if (contactData) {
          setContact(contactData);
        } else {
          notify.error({
            key: `contact:${contactId}:missing`,
            title: 'Contact not found',
            description: 'We could not locate that contact record.',
          });
          navigate('/contacts');
        }
      } catch (error) {
        console.error('Error loading contact:', error);
        notify.error({
          key: `contact:${contactId}:load-error`,
          title: 'Unable to load contact',
          description: 'Please refresh and try again.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadContact();
  }, [contactId, navigate]);

  const handleEditContact = () => {
    if (!contact) return;
    setEditForm({
      displayName: contact.displayName,
      email: contact.email,
      phone: contact.phone,
    });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm({});
  };

  const handleSaveContact = async () => {
    if (!contact) return;

    setIsSaving(true);
    try {
      await client.put(endpoints.contact(contact.id), {
        displayName: editForm.displayName?.trim() || null,
        email: editForm.email?.trim() || null,
        phone: editForm.phone?.trim() || null,
      });

      // Update local state
      const updatedContact = {
        ...contact,
        displayName: editForm.displayName?.trim() || undefined,
        email: editForm.email?.trim() || undefined,
        phone: editForm.phone?.trim() || undefined,
      };
      setContact(updatedContact);
      setIsEditing(false);
      setEditForm({});

      notify.success({
        key: `contact:${contact.id}:updated`,
        title: 'Contact updated',
        description: 'Changes saved successfully.',
      });
    } catch (error) {
      console.error('Error updating contact:', error);
      notify.error({
        key: `contact:${contact.id}:update-error`,
        title: 'Unable to update contact',
        description: 'Please try again shortly.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getChannelIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'whatsapp':
        return <WhatsAppIcon className='h-4 w-4' />;
      case 'telegram':
        return <TelegramIcon className='h-4 w-4' />;
      default:
        return <MessageCircle className='h-4 w-4' />;
    }
  };

  const getDisplayName = (contact: Contact) => {
    if (contact.displayName) return contact.displayName;
    if (contact.phone) return contact.phone.startsWith('234') ? `+${contact.phone}` : contact.phone;
    if (contact.waId) return contact.waId.startsWith('234') ? `+${contact.waId}` : contact.waId;
    return 'Contact';
  };

  if (isLoading) {
    return (
      <div className='container mx-auto py-8'>
        <div className='flex items-center justify-center h-64'>
          <div className='text-center'>
            <div className='animate-pulse'>Loading contact details...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className='container mx-auto py-8'>
        <div className='flex items-center justify-center h-64'>
          <div className='text-center'>
            <div className='text-muted-foreground'>Contact not found</div>
            <Button onClick={() => navigate('/contacts')} className='mt-4'>
              Back to Contacts
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
          <h1 className='text-2xl font-bold'>Contact Details</h1>
          <p className='text-muted-foreground'>Central hub for all contact information and activities</p>
        </div>
        <div className='flex items-center justify-between sm:justify-start gap-2'>
          <Button variant='outline' size='sm' onClick={() => navigate('/contacts')}>
            <ArrowLeft className='h-4 w-4 mr-2' />
            Back to Contacts
          </Button>
          {isEditing ? (
            <div className='flex items-center gap-2'>
              <Button variant='outline' size='sm' onClick={handleCancelEdit}>
                <X className='h-4 w-4 mr-2' />
                Cancel
              </Button>
              <Button size='sm' onClick={handleSaveContact} disabled={isSaving}>
                <Save className='h-4 w-4 mr-2' />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          ) : (
            <Button variant='outline' size='sm' onClick={handleEditContact}>
              <Edit className='h-4 w-4 mr-2' />
              Edit Contact
            </Button>
          )}
        </div>
      </div>

      {/* Contact Profile Header */}
      <Card>
        <CardContent className='p-4 sm:p-6 lg:p-8'>
          <div className='flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6'>
            <Avatar className='h-16 w-16 sm:h-20 sm:w-20 lg:h-24 lg:w-24 mx-auto sm:mx-0'>
              <AvatarFallback className='bg-primary text-primary-foreground text-2xl sm:text-3xl lg:text-4xl'>
                {getDisplayName(isEditing ? { ...contact, ...editForm } : contact)
                  .charAt(0)
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className='flex-1 text-center sm:text-left'>
              {isEditing ? (
                <div className='space-y-4'>
                  <Input
                    value={editForm.displayName || ''}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, displayName: e.target.value }))}
                    placeholder='Contact name'
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
                  </div>
                  <p className='text-xs text-muted-foreground text-center sm:text-left'>
                    <MessageCircle className='h-3 w-3 inline mr-1' />
                    Changes will sync across all leads and conversations
                  </p>
                </div>
              ) : (
                <div className='space-y-2'>
                  <h2 className='text-xl sm:text-2xl lg:text-3xl font-bold'>{getDisplayName(contact)}</h2>
                  <div className='flex flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-4 text-muted-foreground text-sm'>
                    {contact.email && (
                      <div className='flex items-center space-x-2'>
                        <Mail className='h-4 w-4' />
                        <span>{contact.email}</span>
                      </div>
                    )}
                    {(contact.phone || contact.waId) && (
                      <div className='flex items-center space-x-2'>
                        <Phone className='h-4 w-4' />
                        <span>{contact.phone || contact.waId}</span>
                      </div>
                    )}
                    {contact.lastSeenAt && (
                      <div className='flex items-center space-x-2'>
                        <Calendar className='h-4 w-4' />
                        <span>Last seen {formatDistanceToNow(new Date(contact.lastSeenAt), { addSuffix: true })}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Tabs */}
      <Tabs defaultValue='overview' className='w-full'>
        <TabsList className='grid w-full grid-cols-4'>
          <TabsTrigger value='overview'>Overview</TabsTrigger>
          <TabsTrigger value='leads'>Leads ({contact.Lead.length})</TabsTrigger>
          <TabsTrigger value='conversations'>Conversations ({contact.Thread.length})</TabsTrigger>
          <TabsTrigger value='activity'>Activity</TabsTrigger>
        </TabsList>

        <TabsContent value='overview' className='space-y-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {/* Contact Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center'>
                  <User className='h-5 w-5 mr-2' />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='flex items-center space-x-3'>
                  <Mail className='h-4 w-4 text-muted-foreground' />
                  <span className='text-sm'>{contact.email || 'No email provided'}</span>
                </div>
                <div className='flex items-center space-x-3'>
                  <Phone className='h-4 w-4 text-muted-foreground' />
                  <span className='text-sm'>{contact.phone || contact.waId || 'No phone provided'}</span>
                </div>
                <div className='flex items-center space-x-3'>
                  <Building className='h-4 w-4 text-muted-foreground' />
                  <span className='text-sm'>{contact.country || 'No country specified'}</span>
                </div>
              </CardContent>
            </Card>

            {/* Leads Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Leads & Deals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-2'>
                  <div className='flex justify-between'>
                    <span className='text-sm text-muted-foreground'>Total Leads</span>
                    <span className='font-medium'>{contact.Lead.length}</span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-sm text-muted-foreground'>Active Deals</span>
                    <span className='font-medium'>{contact.Lead.reduce((acc, lead) => acc + lead.Deal.length, 0)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Communication Channels */}
            <Card>
              <CardHeader>
                <CardTitle>Communication</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-2'>
                  {contact.Thread.map((thread) => (
                    <div key={thread.id} className='flex items-center space-x-3'>
                      {getChannelIcon(thread.channel.type)}
                      <span className='text-sm'>{thread.channel.displayName || thread.channel.type}</span>
                      <Badge variant='outline' className='ml-auto'>
                        {thread.status}
                      </Badge>
                    </div>
                  ))}
                  {contact.Thread.length === 0 && <span className='text-sm text-muted-foreground'>No active conversations</span>}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value='leads' className='space-y-4'>
          {contact.Lead.map((lead) => (
            <Card key={lead.id}>
              <CardContent className='p-4'>
                <div className='flex items-center justify-between'>
                  <div>
                    <h3 className='font-medium'>Lead {lead.id.slice(0, 8)}</h3>
                    <p className='text-sm text-muted-foreground'>Created {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true })}</p>
                  </div>
                  <div className='flex items-center space-x-2'>
                    {lead.label && (
                      <Badge variant='outline' className={leadLabelUtils.getLabelStyling(lead.label as LeadLabel)}>
                        {leadLabelUtils.isValidLabel(lead.label) ? leadLabelUtils.getDisplayName(lead.label as LeadLabel) : lead.label}
                      </Badge>
                    )}
                    <Button variant='outline' size='sm' onClick={() => navigate(`/dashboard/leads/${lead.id}`)}>
                      View Lead
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {contact.Lead.length === 0 && (
            <Card>
              <CardContent className='p-8 text-center'>
                <p className='text-muted-foreground'>No leads associated with this contact</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value='conversations' className='space-y-4'>
          {contact.Thread.map((thread) => (
            <Card key={thread.id}>
              <CardContent className='p-4'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center space-x-3'>
                    {getChannelIcon(thread.channel.type)}
                    <div>
                      <h3 className='font-medium'>{thread.channel.displayName || thread.channel.type}</h3>
                      <p className='text-sm text-muted-foreground'>
                        Last message {formatDistanceToNow(new Date(thread.lastMessageAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <Badge variant='outline'>{thread.status}</Badge>
                    <Button variant='outline' size='sm' onClick={() => navigate(`/dashboard/inbox?thread=${thread.id}`)}>
                      Open Chat
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {contact.Thread.length === 0 && (
            <Card>
              <CardContent className='p-8 text-center'>
                <p className='text-muted-foreground'>No conversations with this contact</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value='activity' className='space-y-4'>
          <Card>
            <CardContent className='p-8 text-center'>
              <p className='text-muted-foreground'>Activity timeline coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ContactDetailPage;
