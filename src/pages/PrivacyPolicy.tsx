import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useTheme } from '@/context/ThemeContext';
import { Moon, Sun } from 'lucide-react';

const PrivacyPolicy: React.FC = () => {
  const { resolvedTheme, setTheme } = useTheme();
  const ThemeIcon = resolvedTheme === 'dark' ? Sun : Moon;
  const LogoMark = ({ priority = false }: { priority?: boolean }) => (
    <img
      src='/leadsboxlogo.svg'
      alt='LeadsBox Logo'
      width={24}
      height={24}
      className='h-full w-full object-contain'
      decoding='async'
      fetchPriority={priority ? 'high' : undefined}
      loading={priority ? 'eager' : 'lazy'}
    />
  );

  return (
    <div className='min-h-screen w-full bg-background text-foreground'>
      {/* Navigation (same style as landing) */}
      <header className='sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md'>
        <div className='container mx-auto flex h-16 items-center justify-between px-4'>
          <a href='/' className='flex items-center gap-3 transition-transform hover:scale-105'>
            <div className='w-8 h-8 bg-white p-1 rounded-sm flex items-center justify-center'>
              <LogoMark priority />
            </div>
            <span className='text-xl font-semibold'>LeadsBox</span>
          </a>

          <nav className='hidden md:flex items-center gap-6'>
            <a href='/#product' className='text-muted-foreground hover:text-primary transition-colors'>
              Product
            </a>
            <a href='/#how-it-works' className='text-muted-foreground hover:text-primary transition-colors'>
              How it Works
            </a>
            <a href='/#pricing' className='text-muted-foreground hover:text-primary transition-colors'>
              Pricing
            </a>
            <a href='/#creators' className='text-muted-foreground hover:text-primary transition-colors'>
              For Creators
            </a>
          </nav>

          <div className='flex items-center gap-2 sm:gap-3'>
            <Button variant='ghost' size='icon' aria-label='Toggle theme' onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}>
              <ThemeIcon className='h-4 w-4' />
            </Button>
            <Button variant='ghost' size='sm' asChild>
              <a href='/login'>Login</a>
            </Button>
            <Button size='sm' asChild>
              <a href='/#waitlist'>Join Waitlist</a>
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <section aria-labelledby='privacy-heading' className='container mx-auto px-4 py-10'>
        <div className='max-w-4xl mx-auto'>
          <h1 id='privacy-heading' className='text-3xl sm:text-4xl font-bold mb-2'>
            Privacy Policy
          </h1>
          <p className='text-muted-foreground mb-8'>Last updated: {new Date().toLocaleDateString()}</p>

          <div className='prose dark:prose-invert max-w-none space-y-6'>
            <p>
              At LeadsBox, we take your privacy seriously. This policy explains what information we collect, how we use it, and the choices you have.
            </p>

            <h2>Information We Collect</h2>
            <ul>
              <li>Account data such as email, username, and profile details you provide</li>
              <li>Organization information you create or manage in LeadsBox</li>
              <li>Usage data including device, browser, and interaction events</li>
              <li>Service data (e.g., leads, messages, tasks) you store in the platform</li>
            </ul>

            <h2>How We Use Information</h2>
            <ul>
              <li>Provide, maintain, and improve the LeadsBox service</li>
              <li>Secure your account and prevent abuse</li>
              <li>Send transactional emails (e.g., verification, password resets)</li>
              <li>Comply with legal obligations</li>
            </ul>

            <h2>Data Sharing</h2>
            <p>
              We do not sell your personal data. We may share data with trusted service providers who help us operate LeadsBox (e.g., cloud hosting,
              email delivery), strictly under data processing agreements.
            </p>

            <h2>Data Retention</h2>
            <p>
              We retain data for as long as your account is active or as needed to provide the service and meet legal requirements. You can request
              deletion of your account data at any time.
            </p>

            <h2>Your Rights</h2>
            <ul>
              <li>Access, update, or delete your personal data</li>
              <li>Export your data where applicable</li>
              <li>Withdraw consent for optional communications</li>
            </ul>

            <h2>Security</h2>
            <p>
              We use industry-standard measures to protect your data. No method of transmission or storage is 100% secure; we continuously improve our
              safeguards.
            </p>

            <h2>Contact</h2>
            <p>
              For privacy questions or requests, contact us at{' '}
              <a href='mailto:support@leadsbox.app' className='text-primary'>
                support@leadsbox.app
              </a>
              .
            </p>

            <div className='flex items-center justify-between pt-4'>
              <Link to='/register' className='text-sm text-primary hover:underline'>
                Back to Register
              </Link>
              <Link to='/' className='text-sm text-primary hover:underline'>
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PrivacyPolicy;
