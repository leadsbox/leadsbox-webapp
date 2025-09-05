import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Save, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import client from '@/api/client';
import { toast } from 'react-toastify';

export const ProfileTab: React.FC = () => {
  const { user, refreshAuth } = useAuth();
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');

  useEffect(() => {
    if (user) {
      const display = (user as { name?: string }).name || user.username || (user.email ? user.email.split('@')[0] : '') || '';
      setName(display);
      setAvatar((user as { profileImage?: string }).profileImage || '');
    }
  }, [user]);

  const saveProfile = async () => {
    try {
      const parts = (name || '').trim().split(/\s+/);
      const firstName = parts[0] || '';
      const lastName = parts.slice(1).join(' ');
      const payload: {
        firstName?: string;
        lastName?: string;
        profileImage?: string;
      } = {};
      if (firstName) payload.firstName = firstName;
      if (lastName) payload.lastName = lastName;
      if (avatar?.trim()) payload.profileImage = avatar.trim();
      if (Object.keys(payload).length === 0) {
        toast.info('Nothing to update');
        return;
      }
      await client.patch('/user/profile', payload);
      toast.success('Profile updated');
      await refreshAuth();
    } catch (e) {
      toast.error('Failed to update profile');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center'>
          <UserIcon className='h-5 w-5 mr-2' />
          Profile
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='grid grid-cols-1 gap-4'>
          <div>
            <Label htmlFor='name'>Full Name</Label>
            <Input id='name' value={name} onChange={(e) => setName(e.target.value)} placeholder='John Doe' />
          </div>
          <div>
            <Label htmlFor='avatar'>Avatar URL</Label>
            <Input id='avatar' value={avatar} onChange={(e) => setAvatar(e.target.value)} placeholder='https://...' />
          </div>
        </div>
        <div>
          <Button onClick={saveProfile}>
            <Save className='h-4 w-4 mr-2' /> Save Profile
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileTab;
