import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import client from '@/api/client';
import { endpoints } from '@/api/config';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const VerifyEmail: React.FC = () => {
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();
  const { user, refreshAuth } = useAuth();

  useEffect(() => {
    const run = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Missing verification token.');
        return;
      }
      setStatus('verifying');
      try {
        const res = await client.get(endpoints.verifyEmailByToken(token));
        const ok = res?.data?.data?.verified === true;
        if (ok) {
          setStatus('success');
          setMessage('Email verified successfully.');
          try {
            if (user) await refreshAuth();
          } catch (error) {
            console.error('Failed to refresh auth:', error);
          }
        } else {
          setStatus('error');
          setMessage(res?.data?.message || 'Verification failed.');
        }
      } catch (e: unknown) {
        setStatus('error');
        const errorMessage =
          e &&
          typeof e === 'object' &&
          'response' in e &&
          e.response &&
          typeof e.response === 'object' &&
          'data' in e.response &&
          e.response.data &&
          typeof e.response.data === 'object' &&
          'message' in e.response.data &&
          typeof e.response.data.message === 'string'
            ? e.response.data.message
            : 'Verification link is invalid or expired.';
        setMessage(errorMessage);
      }
    };
    run();
  }, [token]);

  const goNext = () => {
    if (user) navigate('/dashboard');
    else navigate('/login');
  };

  return (
    <div className='min-h-screen flex items-center justify-center p-4'>
      <Card className='w-full max-w-md'>
        <CardHeader>
          <CardTitle className='text-center'>Verify Email</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4 text-center'>
          {status === 'verifying' && (
            <div className='flex flex-col items-center gap-3'>
              <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
              <p className='text-muted-foreground'>Verifying your email…</p>
            </div>
          )}
          {status === 'success' && (
            <div className='flex flex-col items-center gap-3'>
              <CheckCircle className='h-10 w-10 text-green-600' />
              <p className='text-foreground font-medium'>{message || 'Email verified successfully.'}</p>
              <Button onClick={goNext} className='mt-2'>
                Continue
              </Button>
            </div>
          )}
          {status === 'error' && (
            <div className='flex flex-col items-center gap-3'>
              <XCircle className='h-10 w-10 text-red-600' />
              <p className='text-foreground font-medium'>{message || 'Verification failed.'}</p>
              <Button onClick={() => navigate('/login')} variant='outline' className='mt-2'>
                Go to Login
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyEmail;
