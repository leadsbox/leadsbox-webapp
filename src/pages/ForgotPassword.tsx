import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import client from '@/api/client';
import { endpoints } from '@/api/config';
import { Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getAuthErrorMessage } from '@/lib/auth-errors';
import AuthBrand from '@/components/AuthBrand';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!email.trim()) {
      setFieldError('Enter your email to receive a reset link.');
      return;
    }
    setFieldError(null);
    setLoading(true);
    try {
      const res = await client.post(endpoints.forgotPassword, { email });
      const msg = res?.data?.message || 'Check your inbox for the reset link.';
      setFormSuccess(msg);
    } catch (err: unknown) {
      const message = getAuthErrorMessage(err as Error, 'We couldn’t send that reset link. Please try again later.');
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
          <CardTitle className='text-2xl text-center'>Forgot Password</CardTitle>
          <CardDescription className='text-center'>Enter your email to receive a reset link</CardDescription>
        </CardHeader>
        <CardContent>
          {formError && (
            <Alert variant='destructive' className='mb-4'>
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}
          {formSuccess && (
            <Alert className='mb-4'>
              <AlertTitle>Reset link sent</AlertTitle>
              <AlertDescription>{formSuccess}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={onSubmit} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='email'>Email</Label>
              <div className='relative'>
                <Mail className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
                <Input
                  id='email'
                  type='email'
                  className='pl-10'
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldError) {
                      setFieldError(null);
                    }
                    if (formError) {
                      setFormError(null);
                    }
                  }}
                  disabled={loading}
                  aria-invalid={Boolean(fieldError)}
                  aria-describedby={fieldError ? 'forgot-email-error' : undefined}
                />
              </div>
              {fieldError && (
                <p id='forgot-email-error' className='text-sm text-destructive'>
                  {fieldError}
                </p>
              )}
            </div>
            <Button type='submit' className='w-full' disabled={loading}>
              {loading ? 'Sending…' : 'Send Reset Link'}
            </Button>
          </form>

          <div className='mt-4 text-center text-sm'>
            <Link to='/login' className='text-primary hover:underline'>
              Back to login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword;
