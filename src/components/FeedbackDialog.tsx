import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MessageSquare } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';
import { notify } from '@/lib/toast';
import * as Sentry from '@sentry/react';

export function FeedbackDialog({ collapsed }: { collapsed?: boolean }) {
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!feedback.trim()) return;
    
    setSending(true);
    try {
      // 1. Track in PostHog
      trackEvent('user_feedback_submitted', {
        message: feedback,
        url: window.location.href
      });

      // 2. Send to Sentry as a user report or message
      Sentry.captureMessage(`User Feedback: ${feedback}`, {
        level: 'info',
        tags: { type: 'user_feedback' },
      });

      notify.success({
        title: 'Feedback Sent',
        description: 'Thank you for helping us improve LeadsBox!',
      });
      
      setFeedback('');
      setOpen(false);
    } catch (error) {
      notify.error({
        title: 'Error',
        description: 'Failed to send feedback. Please try again.',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size={collapsed ? "icon" : "sm"} 
          className={collapsed ? "h-8 w-8" : "gap-2 w-full"}
          title="Send Feedback"
        >
          <MessageSquare className="h-4 w-4" />
          {!collapsed && "Feedback"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Send Feedback</DialogTitle>
          <DialogDescription>
            Found a bug? Have a suggestion? Let us know!
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="feedback">Your Message</Label>
            <Textarea
              id="feedback"
              placeholder="I noticed that..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={5}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!feedback.trim() || sending}>
            {sending ? 'Sending...' : 'Send Feedback'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
