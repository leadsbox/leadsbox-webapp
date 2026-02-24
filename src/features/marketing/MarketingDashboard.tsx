import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import client from '@/api/client';
import { Megaphone, PlusCircle, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

interface BlogPost {
  id: string;
  title: string;
  content: string;
  status: string;
  createdAt: string;
  author?: { firstName: string; lastName: string };
}

export default function MarketingDashboard() {
  const { data: blogsData, isLoading } = useQuery({
    queryKey: ['marketing-blogs'],
    queryFn: async () => {
      const res = await client.get('/marketing/blogs');
      return res.data?.data?.posts || [];
    },
  });

  return (
    <div className='p-6 space-y-6 max-w-7xl mx-auto'>
      <div className='flex justify-between items-center'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Marketing Portal</h1>
          <p className='text-muted-foreground'>Submit internally written blog posts for review.</p>
        </div>
        <Button>
          <PlusCircle className='mr-2 h-4 w-4' /> Submit Content
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Megaphone className='h-5 w-5' /> Content Submissions Queue
          </CardTitle>
          <CardDescription>Review and publish staff-submitted marketing material</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='py-8 text-center text-muted-foreground'>Loading submissions...</div>
          ) : blogsData?.length === 0 ? (
            <div className='py-8 text-center text-muted-foreground border border-dashed rounded-lg'>No content in the queue.</div>
          ) : (
            <div className='space-y-4'>
              {blogsData.map((blog: BlogPost) => (
                <div key={blog.id} className='flex items-start justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors'>
                  <div className='space-y-1 w-2/3'>
                    <p className='font-semibold text-lg'>{blog.title}</p>
                    <p className='text-sm text-muted-foreground line-clamp-2'>{blog.content}</p>
                    <p className='text-xs text-muted-foreground pt-2'>
                      By {blog.author?.firstName} {blog.author?.lastName} on {format(new Date(blog.createdAt), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div className='flex flex-col items-end gap-2'>
                    <Badge variant={blog.status === 'PUBLISHED' ? 'default' : 'secondary'}>{blog.status}</Badge>
                    {blog.status !== 'PUBLISHED' && (
                      <Button size='sm' variant='outline' className='w-full'>
                        Review <ExternalLink className='ml-2 h-3 w-3' />
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
