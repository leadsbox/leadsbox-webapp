import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, MessageSquare, Plus, Trash2 } from 'lucide-react';

export const TemplatesTab: React.FC = () => {
  const templates = [
    { name: 'Welcome Message', content: 'Hi there! Thanks for reaching out. How can I help you today?' },
    { name: 'Follow Up', content: 'Hi {name}, I wanted to follow up on our previous conversation...' },
    { name: 'Meeting Reminder', content: 'This is a reminder about our meeting scheduled for {date} at {time}.' },
  ];

  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between'>
        <CardTitle className='flex items-center'>
          <MessageSquare className='h-5 w-5 mr-2' />
          Message Templates
        </CardTitle>
        <Button>
          <Plus className='h-4 w-4 mr-2' />
          Add Template
        </Button>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          {templates.map((template, index) => (
            <Card key={index} className='border-muted'>
              <CardContent className='p-4'>
                <div className='flex items-start justify-between'>
                  <div className='flex-1'>
                    <h4 className='font-medium mb-2'>{template.name}</h4>
                    <p className='text-sm text-muted-foreground'>{template.content}</p>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <Button variant='ghost' size='icon'>
                      <Edit className='h-4 w-4' />
                    </Button>
                    <Button variant='ghost' size='icon' className='text-destructive'>
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TemplatesTab;

