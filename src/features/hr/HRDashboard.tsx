import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import client from '@/api/client';
import { FileText, Calendar, PlusCircle } from 'lucide-react';
import { format } from 'date-fns';
import { notify } from '@/lib/toast';

interface User {
  id: string;
  firstName: string;
  lastName: string;
}

interface LeaveRequest {
  id: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string;
  user?: User;
}

interface Appraisal {
  id: string;
  period: string;
  status: string;
  user?: User;
}

export default function HRDashboard() {
  const [activeTab, setActiveTab] = useState('leave');

  const { data: leavesData, isLoading: leadsLoading } = useQuery({
    queryKey: ['hr-leaves'],
    queryFn: async () => {
      const res = await client.get('/hr/leave');
      return res.data?.data?.leaves || [];
    },
  });

  const { data: appraisalsData, isLoading: appraisalsLoading } = useQuery({
    queryKey: ['hr-appraisals'],
    queryFn: async () => {
      const res = await client.get('/hr/appraisals');
      return res.data?.data?.appraisals || [];
    },
  });

  return (
    <div className='p-6 space-y-6 max-w-7xl mx-auto'>
      <div className='flex justify-between items-center'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>HR Workflow Hub</h1>
          <p className='text-muted-foreground'>Manage leave requests and performance appraisals.</p>
        </div>
        <div className='flex gap-2'>
          <Button variant='outline'>
            <PlusCircle className='mr-2 h-4 w-4' /> Request Leave
          </Button>
          <Button>
            <PlusCircle className='mr-2 h-4 w-4' /> Start Appraisal
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className='grid w-[400px] grid-cols-2'>
          <TabsTrigger value='leave'>Leave Requests</TabsTrigger>
          <TabsTrigger value='appraisals'>Appraisals</TabsTrigger>
        </TabsList>

        <TabsContent value='leave' className='mt-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Calendar className='h-5 w-5' /> Leave Queue
              </CardTitle>
              <CardDescription>View and approve team leave requests</CardDescription>
            </CardHeader>
            <CardContent>
              {leadsLoading ? (
                <div className='py-8 text-center text-muted-foreground'>Loading leave requests...</div>
              ) : leavesData?.length === 0 ? (
                <div className='py-8 text-center text-muted-foreground border border-dashed rounded-lg'>No leave requests found.</div>
              ) : (
                <div className='space-y-4'>
                  {leavesData.map((leave: LeaveRequest) => (
                    <div key={leave.id} className='flex items-center justify-between p-4 border rounded-lg'>
                      <div>
                        <p className='font-semibold'>
                          {leave.user?.firstName} {leave.user?.lastName}
                        </p>
                        <p className='text-sm text-muted-foreground'>
                          {leave.type} • {format(new Date(leave.startDate), 'MMM d, yyyy')} - {format(new Date(leave.endDate), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <div className='flex items-center gap-4'>
                        <Badge variant={leave.status === 'APPROVED' ? 'default' : leave.status === 'REJECTED' ? 'destructive' : 'secondary'}>
                          {leave.status}
                        </Badge>
                        {leave.status === 'PENDING' && (
                          <div className='flex gap-2'>
                            <Button size='sm' variant='outline'>
                              Approve
                            </Button>
                            <Button size='sm' variant='ghost' className='text-destructive'>
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='appraisals' className='mt-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <FileText className='h-5 w-5' /> Performance Appraisals
              </CardTitle>
              <CardDescription>Current and past performance reviews</CardDescription>
            </CardHeader>
            <CardContent>
              {appraisalsLoading ? (
                <div className='py-8 text-center text-muted-foreground'>Loading appraisals...</div>
              ) : appraisalsData?.length === 0 ? (
                <div className='py-8 text-center text-muted-foreground border border-dashed rounded-lg'>No appraisals found.</div>
              ) : (
                <div className='space-y-4'>
                  {appraisalsData.map((appraisal: Appraisal) => (
                    <div key={appraisal.id} className='flex items-center justify-between p-4 border rounded-lg'>
                      <div>
                        <p className='font-semibold'>
                          {appraisal.user?.firstName} {appraisal.user?.lastName}
                        </p>
                        <p className='text-sm text-muted-foreground'>Period: {appraisal.period}</p>
                      </div>
                      <Badge variant='outline'>{appraisal.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
