import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import client from '@/api/client';
import { MonitorPlay, PlusCircle } from 'lucide-react';
import { format } from 'date-fns';

interface ITTicket {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  createdAt: string;
  user?: { firstName: string; lastName: string };
}

export default function ITDashboard() {
  const { data: ticketsData, isLoading } = useQuery({
    queryKey: ['it-tickets'],
    queryFn: async () => {
      const res = await client.get('/it/tickets');
      return res.data?.data?.tickets || [];
    },
  });

  return (
    <div className='p-6 space-y-6 max-w-7xl mx-auto'>
      <div className='flex justify-between items-center'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>IT Helpdesk</h1>
          <p className='text-muted-foreground'>Submit and track corporate IT issues.</p>
        </div>
        <Button>
          <PlusCircle className='mr-2 h-4 w-4' /> New Ticket
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <MonitorPlay className='h-5 w-5' /> Open Tickets
          </CardTitle>
          <CardDescription>All reported IT infrastructure issues</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='py-8 text-center text-muted-foreground'>Loading tickets...</div>
          ) : ticketsData?.length === 0 ? (
            <div className='py-8 text-center text-muted-foreground border border-dashed rounded-lg'>You're all caught up! No active tickets.</div>
          ) : (
            <div className='space-y-4'>
              {ticketsData.map((ticket: ITTicket) => (
                <div key={ticket.id} className='flex items-start justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors'>
                  <div className='space-y-1 w-2/3'>
                    <p className='font-semibold text-lg'>{ticket.title}</p>
                    <p className='text-sm text-muted-foreground line-clamp-2'>{ticket.description}</p>
                    <p className='text-xs text-muted-foreground pt-2'>
                      Reported by {ticket.user?.firstName} {ticket.user?.lastName} on {format(new Date(ticket.createdAt), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div className='flex flex-col items-end gap-2'>
                    <Badge variant={ticket.priority === 'HIGH' ? 'destructive' : ticket.priority === 'MEDIUM' ? 'default' : 'secondary'}>
                      {ticket.priority} Priority
                    </Badge>
                    <Badge variant='outline' className='uppercase'>
                      {ticket.status}
                    </Badge>
                    {ticket.status !== 'RESOLVED' && (
                      <Button size='sm' variant='ghost' className='mt-2 text-primary'>
                        Mark Resolved
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
