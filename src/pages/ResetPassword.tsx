import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import client from '@/api/client';
import { endpoints } from '@/api/config';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getAuthErrorMessage } from '@/lib/auth-errors';
import AuthBrand from '@/components/AuthBrand';

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirm?: string }>({});

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});

    if (!token) {
      setFormError('This reset link is invalid or has expired. Request a new one from the forgot password page.');
      return;
    }

    const nextFieldErrors: { password?: string; confirm?: string } = {};

    if (!password) {
      nextFieldErrors.password = 'Enter a new password.';
    } else if (password.length < 8) {
      nextFieldErrors.password = 'Use at least 8 characters for a stronger password.';
    }

    if (!confirm) {
      nextFieldErrors.confirm = 'Confirm your new password.';
    } else if (password !== confirm) {
      nextFieldErrors.confirm = 'Passwords must match.';
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      return;
    }

    setLoading(true);
    try {
      const res = await client.post(endpoints.resetPassword, { token, newPassword: password });

      const rawMessage: unknown = res?.data?.message;
      const sensitivePattern = /(password|user|account|credential)/i;
      const successMessage =
        typeof rawMessage === 'string' && rawMessage.trim() && !sensitivePattern.test(rawMessage)
          ? rawMessage.trim()
          : 'Your password has been updated. Sign in with your new credentials.';
      navigate('/login', {
        replace: true,
        state: {
          authNotice: 'password-reset',
          message: successMessage,
        },
      });
    } catch (err: any) {
      const message = getAuthErrorMessage(err, 'We couldn’t update that password. Please request a new reset link.');
      setFormError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4'>
      <Card className='w-full max-w-md'>
        <CardHeader className='space-y-2'>
          <AuthBrand />
          <CardTitle className='text-2xl text-center'>Reset Password</CardTitle>
          <CardDescription className='text-center'>Enter a new password for your account</CardDescription>
        </CardHeader>
        <CardContent>
          {formError && (
            <Alert variant='destructive' className='mb-4'>
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={onSubmit} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='password'>New Password</Label>
              <div className='relative'>
                <Lock className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
                <Input
                  id='password'
                  type={show ? 'text' : 'password'}
                  className='pl-10 pr-10'
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) {
                      setFieldErrors((prev) => ({ ...prev, password: undefined }));
                    }
                    if (formError) {
                      setFormError(null);
                    }
                  }}
                  disabled={loading}
                  aria-invalid={Boolean(fieldErrors.password)}
                  aria-describedby={fieldErrors.password ? 'reset-password-error' : undefined}
                />
                <button type='button' onClick={() => setShow(!show)} className='absolute right-3 top-3 text-muted-foreground hover:text-foreground' disabled={loading}>
                  {show ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
                </button>
              </div>
              {fieldErrors.password && (
                <p id='reset-password-error' className='text-sm text-destructive'>
                  {fieldErrors.password}
                </p>
              )}
            </div>
            <div className='space-y-2'>
              <Label htmlFor='confirm'>Confirm Password</Label>
              <div className='relative'>
                <Lock className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
                <Input
                  id='confirm'
                  type={showConfirm ? 'text' : 'password'}
                  className='pl-10 pr-10'
                  value={confirm}
                  onChange={(e) => {
                    setConfirm(e.target.value);
                    if (fieldErrors.confirm) {
                      setFieldErrors((prev) => ({ ...prev, confirm: undefined }));
                    }
                    if (formError) {
                      setFormError(null);
                    }
                  }}
                  disabled={loading}
                  aria-invalid={Boolean(fieldErrors.confirm)}
                  aria-describedby={fieldErrors.confirm ? 'reset-confirm-error' : undefined}
                />
                <button type='button' onClick={() => setShowConfirm(!showConfirm)} className='absolute right-3 top-3 text-muted-foreground hover:text-foreground' disabled={loading}>
                  {showConfirm ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
                </button>
              </div>
              {fieldErrors.confirm && (
                <p id='reset-confirm-error' className='text-sm text-destructive'>
                  {fieldErrors.confirm}
                </p>
              )}
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
