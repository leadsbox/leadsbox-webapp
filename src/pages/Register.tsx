import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'react-toastify';
import { Mail, Lock, Eye, EyeOff, User, Building } from 'lucide-react';
import { API_BASE, endpoints } from '@/api/config';
import client from '@/api/client';
import { cn } from '@/lib/utils';

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
  const [error, setError] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

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

  const handleGoogleRedirect = () => {
    const next = encodeURIComponent('/dashboard');
    window.location.href = `${API_BASE}${endpoints.google.login}?next=${next}`;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { username, email, password, confirmPassword, organizationName } = formData;

    if (!username || !email || !password || !confirmPassword || !organizationName) {
      toast.error('Please fill in all fields');
      return;
    }

    if (usernameAvailable === false) {
      toast.error('Username is already taken. Please choose another.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);

    try {
      await register({ email, password, username, organizationName });
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create account';
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4'>
      <Card className='w-full max-w-md'>
        <CardHeader className='space-y-1'>
          <CardTitle className='text-2xl font-bold text-center'>Create account</CardTitle>
          <CardDescription className='text-center'>Sign up for your LeadsBox account</CardDescription>
        </CardHeader>
        <CardContent>
          {error && <div className='mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-md'>{error}</div>}

          <Button
            type='button'
            variant='outline'
            className='w-full flex items-center justify-center gap-2 mb-6'
            onClick={handleGoogleRedirect}
            disabled={isLoading}
          >
            <svg className='h-4 w-4' viewBox='0 0 24 24'>
              <path
                d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
                fill='#4285F4'
              />
              <path
                d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
                fill='#34A853'
              />
              <path
                d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z'
                fill='#FBBC05'
              />
              <path
                d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
                fill='#EA4335'
              />
            </svg>
            Continue with Google
          </Button>

          <div className='relative mb-6'>
            <div className='absolute inset-0 flex items-center'>
              <span className='w-full border-t' />
            </div>
            <div className='relative flex justify-center text-xs uppercase'>
              <span className='bg-background px-2 text-muted-foreground'>Or continue with email</span>
            </div>
          </div>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='username'>Username</Label>
              <div className='relative'>
                <User className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
                <Input
                  id='username'
                  name='username'
                  type='text'
                  placeholder='yourname'
                  value={formData.username}
                  onChange={handleInputChange}
                  onBlur={() => checkUsername(formData.username)}
                  className='pl-10'
                  disabled={isLoading}
                />
                {checkingUsername && <p className='mt-1 text-xs text-muted-foreground'>Checking availability…</p>}
                {usernameAvailable === true && !checkingUsername && <p className='mt-1 text-xs text-green-600'>Username is available</p>}
                {usernameAvailable === false && !checkingUsername && <p className='mt-1 text-xs text-red-600'>Username is taken</p>}
              </div>
            </div>
            {/* First/Last name moved to profile settings after registration */}

            <div className='space-y-2'>
              <Label htmlFor='organizationName'>Organization Name</Label>
              <div className='relative'>
                <Building className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
                <Input
                  id='organizationName'
                  name='organizationName'
                  type='text'
                  placeholder='Your Company'
                  value={formData.organizationName}
                  onChange={handleInputChange}
                  className='pl-10'
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='email'>Email</Label>
              <div className='relative'>
                <Mail className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
                <Input
                  id='email'
                  name='email'
                  type='email'
                  placeholder='john@company.com'
                  value={formData.email}
                  onChange={handleInputChange}
                  className='pl-10'
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='password'>Password</Label>
              <div className='relative'>
                <Lock className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
                <Input
                  id='password'
                  name='password'
                  type={showPassword ? 'text' : 'password'}
                  placeholder='Create a password'
                  value={formData.password}
                  onChange={handleInputChange}
                  className='pl-10 pr-10'
                  disabled={isLoading}
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  className='absolute right-3 top-3 text-muted-foreground hover:text-foreground'
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
                </button>
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='confirmPassword'>Confirm Password</Label>
              <div className='relative'>
                <Lock className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
                <Input
                  id='confirmPassword'
                  name='confirmPassword'
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder='Confirm your password'
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className='pl-10 pr-10'
                  disabled={isLoading}
                />
                <button
                  type='button'
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className='absolute right-3 top-3 text-muted-foreground hover:text-foreground'
                  disabled={isLoading}
                >
                  {showConfirmPassword ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
                </button>
              </div>
            </div>

            <Button type='submit' className='w-full' disabled={isLoading}>
              {isLoading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <div className='mt-4 text-center text-sm'>
            <span className='text-muted-foreground'>Already have an account? </span>
            <Link to='/login' className='text-primary hover:underline font-medium'>
              Sign in
            </Link>
          </div>

          <div className='mt-4 text-center'>
            <Link to='/' className='text-sm text-muted-foreground hover:text-foreground hover:underline'>
              ← Back to home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;
