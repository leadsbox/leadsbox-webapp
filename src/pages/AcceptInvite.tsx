import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import client from '@/api/client';
import { endpoints } from '@/api/config';
import { useAuth } from '@/context/AuthContext';
import { clearPendingInvite, savePendingInvite } from '@/lib/inviteStorage';
import { Loader2, ShieldCheck, LogIn, UserPlus } from 'lucide-react';

type InvitePreview = {
  organization?: { id: string; name: string };
  role?: 'MEMBER' | 'ADMIN';
  email?: string;
};

const AcceptInvitePage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, acceptInvite } = useAuth();

  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPreview = async (inviteToken: string) => {
      try {
        setLoading(true);
        const res = await client.get(endpoints.orgInvitePreview(inviteToken));
        setPreview(res?.data?.data || null);
        setError(null);
      } catch (err) {
        console.error('Failed to preview invitation', err);
        setError('This invitation link is invalid or has expired.');
        setPreview(null);
        clearPendingInvite();
      } finally {
        setLoading(false);
      }
    };

    if (!token) {
      setError('Invitation token is missing.');
      setLoading(false);
      clearPendingInvite();
      return;
    }

    savePendingInvite(token);
    fetchPreview(token);
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;
    try {
      setAccepting(true);
      await acceptInvite(token);
      clearPendingInvite();
      navigate('/dashboard');
    } catch (err) {
      console.error('Accept invite failed', err);
      setAccepting(false);
    }
  };

  const inviteOrgName = preview?.organization?.name || 'this organization';
  const inviteRole = preview?.role?.toLowerCase() || 'member';
  const inviteEmail = preview?.email || null;

  return (
    <div className='min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4'>
      <Card className='w-full max-w-lg'>
        <CardHeader className='space-y-2 text-center'>
          <CardTitle className='text-2xl font-semibold'>Organization Invitation</CardTitle>
          <CardDescription>
            {loading
              ? 'Checking invitation details…'
              : error
              ? error
              : `You're invited to join ${inviteOrgName} as a ${inviteRole}.`}
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          {loading && (
            <div className='flex flex-col items-center justify-center py-8 text-muted-foreground'>
              <Loader2 className='h-6 w-6 animate-spin mb-2' />
              <span>Loading invitation…</span>
            </div>
          )}

          {!loading && !error && (
            <>
              <div className='rounded-md border border-muted/40 bg-muted/20 p-4 text-sm text-muted-foreground space-y-2'>
                <div className='flex items-center gap-2 text-foreground'>
                  <ShieldCheck className='h-4 w-4 text-primary' />
                  <span className='font-medium'>Invitation details</span>
                </div>
                <p>
                  Organization: <span className='font-medium text-foreground'>{inviteOrgName}</span>
                </p>
                <p>
                  Role: <span className='font-medium text-foreground'>{inviteRole}</span>
                </p>
                {inviteEmail && (
                  <p>
                    Sent to: <span className='font-medium text-foreground'>{inviteEmail}</span>
                  </p>
                )}
                <p className='text-xs text-muted-foreground'>
                  Accepting will add this workspace to your LeadsBox account.
                </p>
              </div>

              {user ? (
                <Button className='w-full' onClick={handleAccept} disabled={accepting}>
                  {accepting ? (
                    <>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      Joining…
                    </>
                  ) : (
                    'Accept invitation'
                  )}
                </Button>
              ) : (
                <div className='space-y-3'>
                  <Button asChild className='w-full' variant='default'>
                    <Link to={`/login?invite=${encodeURIComponent(token!)}`} className='flex items-center justify-center gap-2'>
                      <LogIn className='h-4 w-4' />
                      Sign in to accept
                    </Link>
                  </Button>
                  <Button asChild variant='outline' className='w-full'>
                    <Link to={`/register?invite=${encodeURIComponent(token!)}`} className='flex items-center justify-center gap-2'>
                      <UserPlus className='h-4 w-4' />
                      Create a new account
                    </Link>
                  </Button>
                </div>
              )}
            </>
          )}

          <div className='text-center text-sm text-muted-foreground'>
            Need help? Reach out to your workspace owner or{' '}
            <Link to='/' className='text-primary hover:underline'>return to the homepage</Link>.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AcceptInvitePage;
