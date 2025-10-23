import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

type Role = 'business' | 'creator' | '';
type SubmitState = 'idle' | 'loading' | 'ok' | 'error';

type WaitlistDialogProps = {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  email: string;
  onEmailChange: (value: string) => void;
  role: Role;
  onRoleChange: (value: Role) => void;
  handle: string;
  onHandleChange: (value: string) => void;
  state: SubmitState;
  onSubmit: () => void;
};

const WaitlistDialog = ({
  open,
  onOpenChange,
  email,
  onEmailChange,
  role,
  onRoleChange,
  handle,
  onHandleChange,
  state,
  onSubmit,
}: WaitlistDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join the Waitlist</DialogTitle>
          <DialogDescription>Be first to access the unified DM inbox.</DialogDescription>
        </DialogHeader>
        <div className='space-y-4'>
          <div className='grid gap-2'>
            <Label htmlFor='wl-email'>Email</Label>
            <Input id='wl-email' type='email' value={email} onChange={(e) => onEmailChange(e.target.value)} placeholder='you@business.com' />
          </div>
          <div className='grid gap-2'>
            <Label>Role</Label>
            <Select value={role} onValueChange={(value) => onRoleChange(value as Role)}>
              <SelectTrigger aria-label='Select your role'>
                <SelectValue placeholder='Select role' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='business'>Business</SelectItem>
                <SelectItem value='creator'>Creator</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='wl-handle'>Handle or link (optional)</Label>
            <Input id='wl-handle' value={handle} onChange={(e) => onHandleChange(e.target.value)} placeholder='@yourhandle or site' />
          </div>
          <Button className='w-full' onClick={onSubmit} data-cta='modal_join_waitlist'>
            {state === 'loading' ? 'Submitting…' : state === 'ok' ? 'Added ✓' : 'Join Waitlist'}
          </Button>
          <p className='text-xs text-muted-foreground'>No spam. We’ll reach out with early access details.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WaitlistDialog;
