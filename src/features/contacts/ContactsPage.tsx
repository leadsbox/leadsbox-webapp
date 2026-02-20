import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search, Loader2, Users } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { WhatsAppIcon } from '@/components/brand-icons';
import { Link } from 'react-router-dom';
import client from '@/api/client';
import { endpoints } from '@/api/config';
import { formatDistanceToNow } from 'date-fns';
import { CreateContactModal } from './CreateContactModal';

interface Contact {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  source?: string;
  tags?: string[];
  lastActivity?: string;
  leads?: Array<{ id: string; stage: string }>;
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    setIsLoading(true);
    try {
      // Temporarily use /leads endpoint or specific /contacts endpoint if it exists
      // Assuming a standard GET /contacts or similar structure.
      // If /contacts doesn't exist yet, we will map leads to contacts for now as a fallback
      try {
        const response = await client.get('/contacts');
        const data = response?.data?.data?.contacts || response?.data || [];
        setContacts(Array.isArray(data) ? data : []);
      } catch (err) {
        // Fallback: If contacts endpoint isn't ready, mock it using leads
        const leadsRes = await client.get(endpoints.leads);
        const data = leadsRes?.data?.data?.leads || leadsRes?.data || [];
        const mockContacts = data.map((l: Record<string, any>) => ({
          id: l.contactId || l.id,
          name: l.name,
          phone: l.phone,
          email: l.email,
          source: l.source,
          tags: l.tags,
          lastActivity: l.createdAt, // Fallback
          leads: [{ id: l.id, stage: l.stage }],
        }));
        // Deduplicate mock contacts by name/phone
        const unique = Array.from(new Map(mockContacts.map((c: Record<string, any>) => [c.phone || c.name, c])).values()) as Contact[];
        setContacts(unique);
      }
    } catch (error) {
      console.error('Failed to load contacts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredContacts = contacts.filter((c) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return c.name?.toLowerCase().includes(query) || c.phone?.toLowerCase().includes(query);
  });

  return (
    <div className='flex flex-col h-full bg-background'>
      <div className='flex-none p-4 sm:p-6 pb-4 space-y-4'>
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
          <div>
            <h1 className='text-3xl font-bold tracking-tight text-foreground'>Contacts</h1>
            <p className='text-muted-foreground mt-1'>View and manage all your customer conversations.</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>New Contact</Button>
        </div>

        <div className='relative'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
          <Input
            placeholder='Search contacts by name or phone...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='pl-9 bg-muted/40 border-muted-foreground/20 max-w-md'
          />
        </div>
      </div>

      <div className='flex-1 p-4 sm:p-6 pt-0 overflow-auto'>
        <Card className='border-muted-foreground/20 shadow-sm'>
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status / Tags</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Last Activity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={`skeleton-${i}`}>
                      <TableCell>
                        <div className='h-10 bg-muted/50 rounded animate-pulse w-48' />
                      </TableCell>
                      <TableCell>
                        <div className='h-6 bg-muted/50 rounded-full animate-pulse w-24' />
                      </TableCell>
                      <TableCell>
                        <div className='h-6 bg-muted/50 rounded animate-pulse w-8' />
                      </TableCell>
                      <TableCell>
                        <div className='h-4 bg-muted/50 rounded animate-pulse w-24' />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredContacts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className='h-48 text-center'>
                      <div className='flex flex-col items-center justify-center space-y-3 text-muted-foreground'>
                        <Users className='h-10 w-10 opacity-20' />
                        <p>No contacts found.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredContacts.map((contact) => (
                    <TableRow key={contact.id} className='cursor-pointer hover:bg-muted/30 transition-colors'>
                      <TableCell className='font-medium'>
                        <Link to={`/dashboard/contacts/${contact.id}`} className='flex items-center gap-3'>
                          <Avatar className='h-9 w-9 border'>
                            <AvatarFallback className='bg-primary/5'>{contact.name?.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className='flex flex-col'>
                            <span className='font-medium text-foreground'>{contact.name}</span>
                            <span className='text-xs text-muted-foreground'>{contact.phone || contact.email || 'No details'}</span>
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className='flex flex-wrap gap-1'>
                          {contact.leads?.[0] ? (
                            <Badge variant='outline'>{contact.leads[0].stage}</Badge>
                          ) : (
                            <span className='text-xs text-muted-foreground'>No active lead</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {contact.source === 'whatsapp' ? (
                          <WhatsAppIcon className='h-5 w-5 text-green-500' />
                        ) : (
                          <span className='text-xs capitalize text-muted-foreground'>{contact.source || 'Manual'}</span>
                        )}
                      </TableCell>
                      <TableCell className='text-muted-foreground text-sm'>
                        {contact.lastActivity ? formatDistanceToNow(new Date(contact.lastActivity), { addSuffix: true }) : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
      <CreateContactModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={fetchContacts} />
    </div>
  );
}
