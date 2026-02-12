import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Lock, Eye, EyeOff, User, Building } from 'lucide-react';
import { API_BASE, endpoints } from '@/api/config';
import client from '@/api/client';
import { Checkbox } from '@/components/ui/checkbox';
import { clearPendingInvite, savePendingInvite } from '@/lib/inviteStorage';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getAuthErrorMessage } from '@/lib/auth-errors';
import AuthBrand from '@/components/AuthBrand';

declare global {
  interface Window {
    google: unknown;
  }
}

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    organizationName: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [agree, setAgree] = useState(false);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [inviteOrgName, setInviteOrgName] = useState<string | null>(null);
  const [inviteRole, setInviteRole] = useState<'MEMBER' | 'ADMIN'>('MEMBER');
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<'username' | 'organizationName' | 'email' | 'password' | 'confirmPassword', string>>>(
    {},
  );
  const [agreementError, setAgreementError] = useState<string | null>(null);

  const { register } = useAuth();
  const navigate = useNavigate();

  // Auto-suggest username from email when empty
  useEffect(() => {
    if (!formData.username && formData.email) {
      const local = formData.email.split('@')[0] || '';
      const suggestion = local
        .replace(/[^a-zA-Z0-9._]/g, '')
        .toLowerCase()
        .slice(0, 20);
      if (suggestion) {
        setFormData((prev) => ({ ...prev, username: suggestion }));
      }
    }
  }, [formData.email]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('invite');
    if (!tokenParam) {
      setInviteToken(null);
      setInviteOrgName(null);
      setInviteRole('MEMBER');
      setInviteError(null);
      clearPendingInvite();
      return;
    }

    setInviteToken(tokenParam);
    savePendingInvite(tokenParam);
    (async () => {
      try {
        const res = await client.get(endpoints.orgInvitePreview(tokenParam));
        const inviteData = res?.data?.data;
        const orgName = inviteData?.organization?.name || null;
        if (orgName) {
          setInviteOrgName(orgName);
          setFormData((prev) => ({ ...prev, organizationName: orgName }));
        }
        if (inviteData?.role) {
          setInviteRole(inviteData.role as 'MEMBER' | 'ADMIN');
        }
        setInviteError(null);
      } catch (err) {
        setInviteError('This invitation link is invalid or has expired.');
      }
    })();
  }, []);

  const handleGoogleRedirect = () => {
    const next = encodeURIComponent('/dashboard');
    window.location.href = `${API_BASE}${endpoints.google.login}?next=${next}`;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setFieldErrors((prev) => ({
      ...prev,
      [e.target.name]: undefined,
    }));
    if (formError) {
      setFormError(null);
    }
    if (e.target.name === 'username') {
      setUsernameAvailable(null);
    }
  };

  const checkUsername = async (username: string) => {
    const uname = (username || '').trim();
    if (!uname) return;
    setCheckingUsername(true);
    try {
      const res = await client.get(`${endpoints.checkUsername}?username=${encodeURIComponent(uname)}`);
      const available = !!res?.data?.data?.available;
      setUsernameAvailable(available);
    } catch (e) {
      setUsernameAvailable(null);
      console.error('Username check failed', e);
    } finally {
      setCheckingUsername(false);
    }
  };

  const calculateStrength = (password: string) => {
    let score = 0;
    if (!password) return 0;

    if (password.length > 6) score += 1;
    if (password.length >= 10 && /[A-Z]/.test(password) && /[0-9]/.test(password)) score += 1;
    if (password.length >= 8 && /[!@#$%^&*]/.test(password)) score += 1;

    // Cap at 3
    return Math.min(score, 3);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { username, email, password, confirmPassword, organizationName } = formData;
    const requiresOrgName = !inviteToken;

    setFormError(null);
    setFieldErrors({});
    setAgreementError(null);

    const nextFieldErrors: Partial<Record<'username' | 'organizationName' | 'email' | 'password' | 'confirmPassword', string>> = {};

    if (!username.trim()) {
      nextFieldErrors.username = 'Choose a username.';
    }

    if (!email.trim()) {
      nextFieldErrors.email = 'Enter an email address.';
    }

    if (!password) {
      nextFieldErrors.password = 'Create a password.';
    } else if (password.length < 8) {
      nextFieldErrors.password = 'Use at least 8 characters for a stronger password.';
    }

    if (!confirmPassword) {
      nextFieldErrors.confirmPassword = 'Confirm your password.';
    } else if (password !== confirmPassword) {
      nextFieldErrors.confirmPassword = 'Passwords must match.';
    }

    if (requiresOrgName && !organizationName.trim()) {
      nextFieldErrors.organizationName = 'Enter your organization name.';
    }

    if (usernameAvailable === false) {
      nextFieldErrors.username = 'That username is already taken.';
    }

    if (inviteToken && inviteError) {
      setFormError(inviteError);
    }

    if (!agree) {
      setAgreementError('You need to accept the policies before continuing.');
    }

    if (Object.keys(nextFieldErrors).length > 0 || !agree || (inviteToken && inviteError)) {
      setFieldErrors(nextFieldErrors);
      return;
    }

    setIsLoading(true);

    try {
      await register({
        email,
        password,
        username,
        organizationName: requiresOrgName ? organizationName : undefined,
        inviteToken,
      });
      clearPendingInvite();
      navigate('/dashboard');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : getAuthErrorMessage(error, 'We couldn’t create your account right now. Please try again shortly.');
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
        <div className='w-full lg:w-1/2 flex flex-col bg-white relative overflow-y-auto'>
          <div className='w-full max-w-sm mx-auto space-y-6 p-4 md:p-6 lg:p-8'>
            <div className='space-y-2'>
              <h1 className='text-[32px] font-bold text-[#111827] tracking-tight leading-tight'>Create an account</h1>
              <p className='text-[#6B7280] text-[15px]'>Sign up for your LeadsBox account</p>
            </div>

            {formError && (
              <Alert variant='destructive' className='rounded-xl'>
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}

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
              Sign up with Google
            </Button>

            <Button
              type='button'
              variant='outline'
              onClick={() => {
                const next = encodeURIComponent('/dashboard');
                window.location.href = `${API_BASE}/auth/facebook?next=${next}`;
              }}
              className='w-full h-12 text-[15px] font-semibold rounded-xl border-[#E5E7EB] text-[#374151] hover:bg-gray-50 hover:text-[#111827] transition-all bg-white gap-2'
              disabled={isLoading}
            >
              <svg className='h-5 w-5' aria-hidden='true' viewBox='0 0 24 24'>
                <path
                  d='M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.791-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z'
                  fill='#1877F2'
                />
              </svg>
              Continue with Facebook
            </Button>

            <div className='relative py-4'>
              <div className='absolute inset-0 flex items-center'>
                <span className='w-full border-t border-gray-200' />
              </div>
              <div className='relative flex justify-center text-[10px] uppercase'>
                <span className='bg-white px-3 text-gray-400 font-medium tracking-widest'>OR</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className='space-y-4'>
              <div className='space-y-1.5'>
                <Label htmlFor='username' className='text-[13px] font-bold text-[#374151]'>
                  Username*
                </Label>
                <div className='relative'>
                  <Input
                    id='username'
                    name='username'
                    type='text'
                    placeholder='Username'
                    value={formData.username}
                    onChange={handleInputChange}
                    onBlur={() => checkUsername(formData.username)}
                    className='h-12 px-4 rounded-xl border-[#E5E7EB] bg-white text-[15px] placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all'
                    disabled={isLoading}
                    aria-invalid={Boolean(fieldErrors.username)}
                  />
                  {checkingUsername && <p className='absolute right-3 top-3.5 text-xs text-muted-foreground'>Checking...</p>}
                </div>
                {usernameAvailable === true && !checkingUsername && <p className='text-xs text-green-600 font-medium mt-1'>Available</p>}
                {usernameAvailable === false && !checkingUsername && <p className='text-xs text-red-600 font-medium mt-1'>Taken</p>}
                {fieldErrors.username && <p className='text-sm text-destructive mt-1'>{fieldErrors.username}</p>}
              </div>

              {inviteToken ? (
                <div className='rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4 text-sm text-muted-foreground'>
                  {inviteError ? (
                    <span className='text-destructive'>{inviteError}</span>
                  ) : (
                    <>
                      You&apos;re joining <span className='font-medium text-foreground'>{inviteOrgName || 'this organization'}</span> as a{' '}
                      <span className='font-medium lowercase'>{inviteRole.toLowerCase()}</span>.
                    </>
                  )}
                </div>
              ) : (
                <div className='space-y-1.5'>
                  <Label htmlFor='organizationName' className='text-[13px] font-bold text-[#374151]'>
                    Organization Name*
                  </Label>
                  <Input
                    id='organizationName'
                    name='organizationName'
                    type='text'
                    placeholder='Your Company'
                    value={formData.organizationName}
                    onChange={handleInputChange}
                    className='h-12 px-4 rounded-xl border-[#E5E7EB] bg-white text-[15px] placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all'
                    disabled={isLoading}
                    aria-invalid={Boolean(fieldErrors.organizationName)}
                  />
                  {fieldErrors.organizationName && <p className='text-sm text-destructive mt-1'>{fieldErrors.organizationName}</p>}
                </div>
              )}

              <div className='space-y-1.5'>
                <Label htmlFor='email' className='text-[13px] font-bold text-[#374151]'>
                  Email*
                </Label>
                <Input
                  id='email'
                  name='email'
                  type='email'
                  placeholder='Email'
                  value={formData.email}
                  onChange={handleInputChange}
                  className='h-12 px-4 rounded-xl border-[#E5E7EB] bg-white text-[15px] placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all'
                  disabled={isLoading}
                  aria-invalid={Boolean(fieldErrors.email)}
                />
                {fieldErrors.email && <p className='text-sm text-destructive mt-1'>{fieldErrors.email}</p>}
              </div>

              <div className='space-y-4'>
                <div className='space-y-1.5'>
                  <Label htmlFor='password' className='text-[13px] font-bold text-[#374151]'>
                    Password*
                  </Label>
                  <div className='relative'>
                    <Input
                      id='password'
                      name='password'
                      type={showPassword ? 'text' : 'password'}
                      placeholder='Password'
                      value={formData.password}
                      onChange={handleInputChange}
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
                      {showPassword ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
                    </button>
                  </div>

                  {/* Password Strength Indicator */}
                  {formData.password && (
                    <div className='space-y-1 mt-2'>
                      <div className='flex gap-1 h-1.5 w-full'>
                        <div
                          className={`h-full flex-1 rounded-full transition-colors ${
                            calculateStrength(formData.password) >= 1
                              ? calculateStrength(formData.password) === 1
                                ? 'bg-red-500'
                                : calculateStrength(formData.password) === 2
                                  ? 'bg-amber-500'
                                  : 'bg-green-500'
                              : 'bg-gray-200'
                          }`}
                        />
                        <div
                          className={`h-full flex-1 rounded-full transition-colors ${
                            calculateStrength(formData.password) >= 2
                              ? calculateStrength(formData.password) === 2
                                ? 'bg-amber-500'
                                : 'bg-green-500'
                              : 'bg-gray-200'
                          }`}
                        />
                        <div
                          className={`h-full flex-1 rounded-full transition-colors ${
                            calculateStrength(formData.password) >= 3 ? 'bg-green-500' : 'bg-gray-200'
                          }`}
                        />
                      </div>
                      <p className='text-xs font-medium text-right text-muted-foreground'>
                        {calculateStrength(formData.password) === 1 && <span className='text-red-600'>Weak</span>}
                        {calculateStrength(formData.password) === 2 && <span className='text-amber-600'>Medium</span>}
                        {calculateStrength(formData.password) === 3 && <span className='text-green-600'>Strong</span>}
                      </p>
                    </div>
                  )}

                  {fieldErrors.password && <p className='text-sm text-destructive mt-1'>{fieldErrors.password}</p>}
                </div>

                <div className='space-y-1.5'>
                  <Label htmlFor='confirmPassword' className='text-[13px] font-bold text-[#374151]'>
                    Confirm*
                  </Label>
                  <div className='relative'>
                    <Input
                      id='confirmPassword'
                      name='confirmPassword'
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder='Confirm'
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className={`h-12 px-4 pr-10 rounded-xl border-[#E5E7EB] bg-white text-[15px] placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                        formData.confirmPassword && formData.password !== formData.confirmPassword ? 'border-red-500 focus:border-red-500' : ''
                      }`}
                      disabled={isLoading}
                      aria-invalid={Boolean(fieldErrors.confirmPassword)}
                    />
                    <button
                      type='button'
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className='absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors'
                      disabled={isLoading}
                    >
                      {showConfirmPassword ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
                    </button>
                  </div>
                  {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <p className='text-xs text-red-500 font-medium mt-1'>Passwords do not match</p>
                  )}
                  {fieldErrors.confirmPassword && <p className='text-sm text-destructive mt-1'>{fieldErrors.confirmPassword}</p>}
                </div>
              </div>

              <div className='space-y-3 pt-2'>
                <div className='flex items-center gap-3'>
                  <Checkbox
                    id='agree'
                    checked={agree}
                    onCheckedChange={(v) => {
                      setAgree(!!v);
                      if (agreementError) setAgreementError(null);
                    }}
                    className='rounded-[6px] border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600'
                  />
                  <Label htmlFor='agree' className='text-[13px] text-gray-600 font-medium leading-tight'>
                    I agree to the{' '}
                    <Link to='/privacy' className='text-blue-600 hover:underline'>
                      Privacy Policy
                    </Link>{' '}
                    and{' '}
                    <Link to='/terms' className='text-blue-600 hover:underline'>
                      Terms of Service
                    </Link>
                  </Label>
                </div>
                {agreementError && <p className='text-sm text-destructive'>{agreementError}</p>}
              </div>

              <Button
                type='submit'
                className='w-full h-12 text-[15px] font-semibold rounded-xl bg-[#2563EB] hover:bg-[#1d4ed8] text-white shadow-sm transition-all mt-2'
                disabled={isLoading || !agree}
              >
                {isLoading ? 'Creating account...' : 'Create Account'}
              </Button>
            </form>

            <div className='relative py-4'>
              <div className='absolute inset-0 flex items-center'>
                <span className='w-full border-t border-gray-200' />
              </div>
              <div className='relative flex justify-center text-[10px] uppercase'>
                <span className='bg-white px-3 text-gray-400 font-medium tracking-widest'>OR</span>
              </div>
            </div>

            <Link to='/login'>
              <Button
                type='button'
                variant='outline'
                className='w-full h-12 text-[15px] font-semibold rounded-xl border-[#E5E7EB] text-[#374151] hover:bg-gray-50 hover:text-[#111827] transition-all'
                disabled={isLoading}
              >
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        {/* Right Side - Image */}
        <div className='hidden lg:block lg:w-1/2 relative bg-[#F3F4F6]'>
          <img
            src='https://leadsboxapp.s3.us-east-1.amazonaws.com/registerleadsbox.webp'
            alt='LeadsBox Register'
            crossOrigin='anonymous'
            className='absolute inset-0 w-full h-full object-cover'
          />
        </div>
      </div>
    </div>
  );
};

export default Register;
