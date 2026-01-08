import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { API_BASE, endpoints } from '@/api/config';
import client from '@/api/client';
import { loadPendingInvite, savePendingInvite } from '@/lib/inviteStorage';
import { getAuthErrorMessage } from '@/lib/auth-errors';
import AuthBrand from '@/components/AuthBrand';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [inviteOrg, setInviteOrg] = useState<string | null>(null);
  const [inviteRole, setInviteRole] = useState<'MEMBER' | 'ADMIN'>('MEMBER');
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('invite');
    const stored = loadPendingInvite();
    const activeToken = tokenParam || stored || null;

    if (tokenParam) {
      savePendingInvite(tokenParam);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (!activeToken) {
      setInviteToken(null);
      setInviteOrg(null);
      setInviteRole('MEMBER');
      setInviteError(null);
      return;
    }

    setInviteToken(activeToken);
    (async () => {
      try {
        const res = await client.get(endpoints.orgInvitePreview(activeToken));
        const data = res?.data?.data;
        setInviteOrg(data?.organization?.name || null);
        if (data?.role) {
          setInviteRole((data.role as 'MEMBER' | 'ADMIN') ?? 'MEMBER');
        }
        setInviteError(null);
      } catch (error) {
        console.error('Failed to preview invite', error);
        setInviteError('This invitation looks invalid or has expired.');
      }
    })();
  }, []);

  useEffect(() => {
    const state = location.state as { authNotice?: string; message?: string } | null;
    if (state?.authNotice === 'password-reset') {
      setFormSuccess(state.message || 'Your password has been updated. Sign in with your new credentials.');
      navigate(location.pathname + location.search, { replace: true });
    }
  }, [location, navigate]);

  const handleGoogleRedirect = () => {
    // Land on home dashboard after OAuth
    const next = encodeURIComponent('/dashboard');
    window.location.href = `${API_BASE}${endpoints.google.login}?next=${next}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setFormError(null);
    setFormSuccess(null);

    const nextFieldErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      nextFieldErrors.email = 'Enter your email or username.';
    }

    if (!password) {
      nextFieldErrors.password = 'Enter your password.';
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      return;
    }

    setFieldErrors({});
    setIsLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : getAuthErrorMessage(error, 'We couldn’t sign you in. Check your email and password and try again.', {
              unauthorizedMessage: 'We couldn’t verify those details. Check your email and password and try again.',
            });
      setFormError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-[#F0F4F8] flex flex-col items-center justify-center p-4 gap-8'>
      {/* Brand Logo - Centered above card */}
      <div className='flex justify-center items-center gap-3'>
        <Link to='/' className='flex items-center gap-3 hover:opacity-80 transition-opacity'>
          <AuthBrand />
          <span className='text-2xl font-bold text-gray-900 tracking-tight'>LeadsBox</span>
        </Link>
      </div>

      <div className='w-full max-w-[1100px] h-auto lg:h-[700px] bg-white rounded-[32px] shadow-sm overflow-hidden flex'>
        {/* Left Side - Form */}
        <div className='w-full lg:w-1/2 p-10 md:p-14 lg:p-16 flex flex-col justify-center bg-white relative'>
          <div className='w-full max-w-sm mx-auto space-y-6'>
            <div className='space-y-2'>
              <h1 className='text-[32px] font-bold text-[#111827] tracking-tight leading-tight'>Welcome back!</h1>
              <p className='text-[#6B7280] text-[15px]'>Sign in to your LeadsBox account</p>
            </div>

            {inviteToken && (
              <div className='rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4 text-sm text-muted-foreground'>
                {inviteError ? (
                  <span className='text-destructive'>{inviteError}</span>
                ) : (
                  <>
                    After signing in we&apos;ll add you to{' '}
                    <span className='font-medium text-foreground'>{inviteOrg || 'the invited organization'}</span> as a{' '}
                    <span className='font-medium lowercase'>{inviteRole.toLowerCase()}</span>.
                  </>
                )}
              </div>
            )}

            {formError && (
              <Alert variant='destructive' className='rounded-xl'>
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}

            {formSuccess && (
              <Alert className='rounded-xl bg-green-50 text-green-700 border-green-200'>
                <AlertTitle>Password updated</AlertTitle>
                <AlertDescription>{formSuccess}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className='space-y-5'>
              <div className='space-y-1.5'>
                <Label htmlFor='email' className='text-[13px] font-bold text-[#374151]'>
                  Email*
                </Label>
                <Input
                  id='email'
                  type='text'
                  placeholder='Email'
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
                    if (formError) setFormError(null);
                  }}
                  className='h-12 px-4 rounded-xl border-[#E5E7EB] bg-white text-[15px] placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all'
                  disabled={isLoading}
                  aria-invalid={Boolean(fieldErrors.email)}
                />
                {fieldErrors.email && <p className='text-sm text-destructive mt-1'>{fieldErrors.email}</p>}
              </div>

              <div className='space-y-1.5'>
                <Label htmlFor='password' className='text-[13px] font-bold text-[#374151]'>
                  Password*
                </Label>
                <div className='relative'>
                  <Input
                    id='password'
                    type={showPassword ? 'text' : 'password'}
                    placeholder='Password'
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
                      if (formError) setFormError(null);
                    }}
                    className='h-12 px-4 pr-10 rounded-xl border-[#E5E7EB] bg-white text-[15px] placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all'
                    disabled={isLoading}
                    aria-invalid={Boolean(fieldErrors.password)}
                  />
                  <button
                    type='button'
                    onClick={() => setShowPassword(!showPassword)}
                    className='absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors'
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className='h-5 w-5' /> : <Eye className='h-5 w-5' />}
                  </button>
                </div>
                {fieldErrors.password && <p className='text-sm text-destructive mt-1'>{fieldErrors.password}</p>}
              </div>

              <Button
                type='submit'
                className='w-full h-12 text-[15px] font-semibold rounded-xl bg-[#2563EB] hover:bg-[#1d4ed8] text-white shadow-sm transition-all mt-2'
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Continue'}
              </Button>

              <Button
                type='button'
                variant='outline'
                onClick={handleGoogleRedirect}
                className='w-full h-12 text-[15px] font-semibold rounded-xl border-[#E5E7EB] text-[#374151] hover:bg-gray-50 hover:text-[#111827] transition-all bg-white gap-2'
                disabled={isLoading}
              >
                <svg className='h-5 w-5' aria-hidden='true' viewBox='0 0 24 24'>
                  <path
                    d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
                    fill='#4285F4'
                  />
                  <path
                    d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
                    fill='#34A853'
                  />
                  <path
                    d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.23.81-.61z'
                    fill='#FBBC05'
                  />
                  <path
                    d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
                    fill='#EA4335'
                  />
                </svg>
                Sign in with Google
              </Button>
            </form>

            <div className='flex items-center gap-1 text-[13px] text-[#374151] font-medium'>
              <span>Forgot your password?</span>
              <Link to='/forgot-password' className='text-[#111827] underline decoration-1 underline-offset-2 hover:text-blue-600 transition-colors'>
                Reset
              </Link>
            </div>

            <div className='relative py-4'>
              <div className='absolute inset-0 flex items-center'>
                <span className='w-full border-t border-gray-200' />
              </div>
              <div className='relative flex justify-center text-[10px] uppercase'>
                <span className='bg-white px-3 text-gray-400 font-medium tracking-widest'>OR</span>
              </div>
            </div>

            <Link to='/register'>
              <Button
                type='button'
                variant='outline'
                className='w-full h-12 text-[15px] font-semibold rounded-xl border-[#E5E7EB] text-[#374151] hover:bg-gray-50 hover:text-[#111827] transition-all'
                disabled={isLoading}
              >
                Sign Up
              </Button>
            </Link>
          </div>
        </div>

        {/* Right Side - Image */}
        <div className='hidden lg:block lg:w-1/2 relative bg-[#F3F4F6]'>
          <img
            src='https://leadsboxapp.s3.us-east-1.amazonaws.com/loginleadsbox.webp'
            alt='LeadsBox Login'
            crossOrigin='anonymous'
            className='absolute inset-0 w-full h-full object-cover'
          />
        </div>
      </div>
    </div>
  );
};

export default Login;
