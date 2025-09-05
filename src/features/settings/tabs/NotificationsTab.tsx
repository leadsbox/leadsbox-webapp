import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Bell } from 'lucide-react';
import type { Organization } from '@/features/settings/types';

interface Props {
  organization: Organization;
}

export const NotificationsTab: React.FC<Props> = ({ organization }) => {
  const notifications = organization?.settings?.notifications as any;
  const email = notifications?.email as
    | { newLeads?: boolean; taskReminders?: boolean; systemUpdates?: boolean }
    | undefined;
  const push = notifications?.push as
    | { newMessages?: boolean; taskDeadlines?: boolean; leadUpdates?: boolean }
    | undefined;
  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center'>
          <Bell className='h-5 w-5 mr-2' />
          Notification Preferences
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-6'>
        <div>
          <h4 className='font-medium mb-4'>Email Notifications</h4>
          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <div>
                <Label>New Leads</Label>
                <p className='text-sm text-muted-foreground'>Receive emails when new leads are created</p>
              </div>
              <Switch checked={!!email?.newLeads} />
            </div>
            <div className='flex items-center justify-between'>
              <div>
                <Label>Task Reminders</Label>
                <p className='text-sm text-muted-foreground'>Get reminded about upcoming tasks</p>
              </div>
              <Switch checked={!!email?.taskReminders} />
            </div>
            <div className='flex items-center justify-between'>
              <div>
                <Label>System Updates</Label>
                <p className='text-sm text-muted-foreground'>Product updates and announcements</p>
              </div>
              <Switch checked={!!email?.systemUpdates} />
            </div>
          </div>
        </div>

        <div>
          <h4 className='font-medium mb-4'>Push Notifications</h4>
          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <div>
                <Label>New Messages</Label>
                <p className='text-sm text-muted-foreground'>Instant notifications for new messages</p>
              </div>
              <Switch checked={!!push?.newMessages} />
            </div>
            <div className='flex items-center justify-between'>
              <div>
                <Label>Task Deadlines</Label>
                <p className='text-sm text-muted-foreground'>Alerts for approaching deadlines</p>
              </div>
              <Switch checked={!!push?.taskDeadlines} />
            </div>
            <div className='flex items-center justify-between'>
              <div>
                <Label>Lead Updates</Label>
                <p className='text-sm text-muted-foreground'>Notifications when leads change status</p>
              </div>
              <Switch checked={!!push?.leadUpdates} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationsTab;
