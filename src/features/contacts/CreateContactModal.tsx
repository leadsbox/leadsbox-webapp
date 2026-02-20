import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import client from '@/api/client';
import { endpoints } from '@/api/config';
import { notify } from '@/lib/toast';

interface CreateContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateContactModal: React.FC<CreateContactModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    phone: '',
    waId: '',
    igUsername: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.displayName.trim()) {
      notify.error({
        title: 'Name required',
        description: 'Please enter a name for the contact.',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await client.post(endpoints.contacts, formData);
      notify.success({
        title: 'Contact created',
        description: 'The contact was successfully created.',
      });
      onSuccess();
      onClose();
      // Reset form
      setFormData({
        displayName: '',
        email: '',
        phone: '',
        waId: '',
        igUsername: '',
      });
    } catch (err) {
      const error = err as any;
      console.error('Failed to create contact:', error);
      notify.error({
        title: 'Error',
        description: error?.response?.data?.message || 'Failed to create contact.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-[425px]'>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Contact</DialogTitle>
            <DialogDescription>Add a new contact manually to your directory.</DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='grid gap-2'>
              <Label htmlFor='displayName'>Name *</Label>
              <Input id='displayName' placeholder='e.g. John Doe' value={formData.displayName} onChange={handleChange} required />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='phone'>Phone Number</Label>
              <Input id='phone' placeholder='e.g. +1234567890' value={formData.phone} onChange={handleChange} />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='email'>Email Address</Label>
              <Input id='email' type='email' placeholder='john@example.com' value={formData.email} onChange={handleChange} />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='waId'>WhatsApp ID (Optional)</Label>
              <Input id='waId' placeholder='e.g. 1234567890' value={formData.waId} onChange={handleChange} />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='igUsername'>Instagram Username (Optional)</Label>
              <Input id='igUsername' placeholder='e.g. johndoe' value={formData.igUsername} onChange={handleChange} />
            </div>
          </div>
          <DialogFooter>
            <Button type='button' variant='outline' onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type='submit' disabled={isSubmitting || !formData.displayName.trim()}>
              {isSubmitting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              Save Contact
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
