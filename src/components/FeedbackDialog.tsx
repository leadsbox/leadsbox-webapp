import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { trackEvent } from '@/lib/analytics';
import { notify } from '@/lib/toast';
import * as Sentry from '@sentry/react';

export function FeedbackDialog() {
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
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <motion.button
            className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-green-600 text-white shadow-lg opacity-60 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center"
            whileHover={{ 
              scale: 1.1,
              boxShadow: '0 0 20px rgba(34, 197, 94, 0.6)'
            }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            title="Send Feedback"
            aria-label="Send Feedback"
          >
            <MessageCircle className="h-6 w-6" />
          </motion.button>
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
    </>
  );
}
