import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import client from '@/api/client';
import { endpoints } from '@/api/config';
import { Mail } from 'lucide-react';
import { notify } from '@/lib/toast';
import { Link } from 'react-router-dom';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      notify.warning({
        key: 'auth:forgot-empty',
        title: 'Email required',
        description: 'Enter your email to get a reset link.',
      });
      return;
    }
    setLoading(true);
    try {
      const res = await client.post(endpoints.forgotPassword, { email });
      const msg = res?.data?.message || 'Check your inbox for the reset link.';
      notify.success({
        key: 'auth:forgot-success',
        title: 'Reset link sent',
        description: msg,
      });
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'We couldn’t send that reset link.';
      notify.error({
        key: 'auth:forgot-error',
        title: 'Reset link failed',
        description: msg,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4'>
      <Card className='w-full max-w-md'>
        <CardHeader>
          <CardTitle className='text-2xl text-center'>Forgot Password</CardTitle>
          <CardDescription className='text-center'>Enter your email to receive a reset link</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='email'>Email</Label>
              <div className='relative'>
                <Mail className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
                <Input id='email' type='email' className='pl-10' value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} />
              </div>
            </div>
            <Button type='submit' className='w-full' disabled={loading}>
              {loading ? 'Sending…' : 'Send Reset Link'}
            </Button>
          </form>

          <div className='mt-4 text-center text-sm'>
            <Link to='/login' className='text-primary hover:underline'>Back to login</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword;
