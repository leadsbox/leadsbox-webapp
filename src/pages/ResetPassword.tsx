import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import client from '@/api/client';
import { endpoints } from '@/api/config';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-toastify';

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
      toast.error('Missing reset token');
      return;
    }
    if (!password || password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (password !== confirm) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const res = await client.post(endpoints.resetPassword, { token, newPassword: password });
      const msg = res?.data?.message || 'Password reset successful';
      toast.success(msg);
      navigate('/login');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to reset password';
      toast.error(msg);
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

