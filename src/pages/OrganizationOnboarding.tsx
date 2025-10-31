import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Building2, Loader2, LogOut } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/useAuth';
import client from '@/api/client';
import { notify } from '@/lib/toast';

type LocationState = {
  from?: {
    pathname?: string;
    search?: string;
  };
};

const OrganizationOnboarding: React.FC = () => {
  const { user, setOrg, logout, refreshAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const hasOrganization = useMemo(() => {
    if (!user) return false;
    return (
      Boolean(user.orgId) ||
      Boolean(user.currentOrgId) ||
      (Array.isArray(user.organizations) && user.organizations.length > 0)
    );
  }, [user]);

  const redirectTarget = useMemo(() => {
    const state = (location.state as LocationState | null) || null;
    const candidate = state?.from;
    if (candidate?.pathname && !candidate.pathname.startsWith('/onboarding')) {
      return `${candidate.pathname}${candidate.search ?? ''}`;
    }
    return '/dashboard';
  }, [location.state]);

  useEffect(() => {
    if (hasOrganization) {
      navigate(redirectTarget, { replace: true });
    }
  }, [hasOrganization, navigate, redirectTarget]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();

    if (!trimmedName) {
      setFormError('Give your organization a name to continue.');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const response = await client.post('/orgs', {
        name: trimmedName,
        description: description.trim() || undefined,
      });
      const org = response?.data?.data?.org || response?.data?.org;
      if (!org?.id) {
        throw new Error('Missing organization identifier');
      }

      setOrg(String(org.id));
      try {
        window.dispatchEvent(new CustomEvent('lb:org-changed'));
      } catch {
        // noop
      }
      await refreshAuth();

      notify.success({
        key: 'onboarding:organization:created',
        title: 'Workspace ready',
        description: 'Your organization has been created. Let’s get to work.',
      });
    } catch (error) {
      console.error('Failed to create organization during onboarding', error);
      setFormError('We couldn’t create that organization. Please try again.');
      notify.error({
        key: 'onboarding:organization:error',
        title: 'Unable to create organization',
        description: 'Something went wrong – please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-background via-background to-muted px-4 py-10'>
      <div className='mx-auto flex w-full max-w-lg flex-col gap-6'>
        <div className='flex items-center justify-between text-sm text-muted-foreground'>
          <span>Signed in as {user?.email}</span>
          <Button variant='ghost' size='sm' onClick={() => void logout()} className='gap-2'>
            <LogOut className='h-4 w-4' />
            Log out
          </Button>
        </div>
        <Card>
          <CardHeader className='space-y-2 text-center'>
            <div className='mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary'>
              <Building2 className='h-6 w-6' />
            </div>
            <CardTitle className='text-2xl font-semibold'>Create your organization</CardTitle>
            <CardDescription>
              Every workspace in LeadsBox belongs to an organization. Set one up now so we can invite teammates and route
              conversations correctly.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className='space-y-6'>
              <div className='space-y-2 text-left'>
                <Label htmlFor='org-name'>Organization name</Label>
                <Input
                  id='org-name'
                  placeholder="e.g. Acme Growth Team"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  disabled={submitting}
                  autoFocus
                  required
                />
              </div>
              <div className='space-y-2 text-left'>
                <Label htmlFor='org-description'>Description (optional)</Label>
                <Textarea
                  id='org-description'
                  placeholder='Tell us what this workspace is for so teammates know they’re in the right place.'
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  disabled={submitting}
                  resize='y'
                  density='comfy'
                />
              </div>
              {formError && <p className='text-sm text-destructive'>{formError}</p>}
            </CardContent>
            <CardFooter className='flex flex-col items-stretch gap-3'>
              <Button type='submit' disabled={submitting} className='w-full'>
                {submitting ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Creating organization…
                  </>
                ) : (
                  'Create organization'
                )}
              </Button>
              <p className='text-xs text-muted-foreground text-center'>
                You can tweak settings, invite teammates, and connect channels once the workspace is ready.
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default OrganizationOnboarding;
