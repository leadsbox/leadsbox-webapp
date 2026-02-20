import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { notify } from '@/lib/toast';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  const [feedbackType, setFeedbackType] = useState('bug');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) {
      notify.error({
        title: 'Error',
        description: 'Please enter a feedback message.',
      });
      return;
    }

    setIsSubmitting(true);

    // Simulate API call for sending feedback
    await new Promise((resolve) => setTimeout(resolve, 800));

    notify.success({
      title: 'Feedback Sent!',
      description: 'Thank you for your feedback. We appreciate your help in improving LeadsBox!',
    });

    setIsSubmitting(false);
    setMessage('');
    setFeedbackType('bug');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>Give Feedback</DialogTitle>
          <DialogDescription>
            Help us improve LeadsBox. Let us know what's working, what's broken, or what features you'd love to see.
          </DialogDescription>
        </DialogHeader>
        <div className='grid gap-4 py-4'>
          <div className='grid gap-2'>
            <Label htmlFor='feedback-type'>Feedback Type</Label>
            <Select value={feedbackType} onValueChange={setFeedbackType}>
              <SelectTrigger id='feedback-type'>
                <SelectValue placeholder='Select type' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='bug'>Bug Report</SelectItem>
                <SelectItem value='feature'>Feature Request</SelectItem>
                <SelectItem value='general'>General Feedback</SelectItem>
                <SelectItem value='other'>Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='message'>Message</Label>
            <Textarea
              id='message'
              placeholder='Please describe your experience or suggestion in detail...'
              className='col-span-3 min-h-[120px] resize-none'
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Sending...' : 'Send Feedback'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackModal;
