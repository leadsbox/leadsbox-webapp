import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import client from '@/api/client';
import { endpoints } from '@/api/config';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { notify } from '@/lib/toast';

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      notify.error({
        key: 'auth:reset-missing-token',
        title: 'Link invalid',
        description: 'Copy the full reset link from your email and try again.',
      });
      return;
    }
    if (!password || password.length < 8) {
      notify.warning({
        key: 'auth:reset-weak-password',
        title: 'Password too short',
        description: 'Use at least 8 characters for a stronger password.',
      });
      return;
    }
    if (password !== confirm) {
      notify.warning({
        key: 'auth:reset-mismatch',
        title: 'Passwords differ',
        description: 'Make sure both password fields match exactly.',
      });
      return;
    }
    setLoading(true);
    try {
      const res = await client.post(endpoints.resetPassword, { token, newPassword: password });
      const msg = res?.data?.message || 'Sign in with your new password.';
      notify.success({
        key: 'auth:reset-success',
        title: 'Password updated',
        description: msg,
      });
      navigate('/login');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'We couldn’t update that password.';
      notify.error({
        key: 'auth:reset-error',
        title: 'Reset failed',
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
          <CardTitle className='text-2xl text-center'>Reset Password</CardTitle>
          <CardDescription className='text-center'>Enter a new password for your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='password'>New Password</Label>
              <div className='relative'>
                <Lock className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
                <Input id='password' type={show ? 'text' : 'password'} className='pl-10 pr-10' value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} />
                <button type='button' onClick={() => setShow(!show)} className='absolute right-3 top-3 text-muted-foreground hover:text-foreground' disabled={loading}>
                  {show ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
                </button>
              </div>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='confirm'>Confirm Password</Label>
              <div className='relative'>
                <Lock className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
                <Input id='confirm' type={showConfirm ? 'text' : 'password'} className='pl-10 pr-10' value={confirm} onChange={(e) => setConfirm(e.target.value)} disabled={loading} />
                <button type='button' onClick={() => setShowConfirm(!showConfirm)} className='absolute right-3 top-3 text-muted-foreground hover:text-foreground' disabled={loading}>
                  {showConfirm ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
                </button>
              </div>
            </div>
            <Button type='submit' className='w-full' disabled={loading}>
              {loading ? 'Resetting…' : 'Reset Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
