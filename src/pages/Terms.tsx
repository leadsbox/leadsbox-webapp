import React from 'react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/context/ThemeContext';
import { Moon, Sun } from 'lucide-react';
import { Link } from 'react-router-dom';

const Terms: React.FC = () => {
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
      fetchpriority={priority ? 'high' : undefined}
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
      <section aria-labelledby='terms-heading' className='container mx-auto px-4 py-10'>
        <div className='max-w-4xl mx-auto'>
          <h1 id='terms-heading' className='text-3xl sm:text-4xl font-bold mb-2'>
            Terms of Service
          </h1>
          <p className='text-muted-foreground mb-8'>Last updated: {new Date().toLocaleDateString()}</p>

          <div className='prose dark:prose-invert max-w-none space-y-6'>
            <p>
              These Terms of Service ("Terms") govern your use of LeadsBox. By creating an account or using our services, you agree to these Terms.
            </p>

            <h2>Use of Service</h2>
            <ul>
              <li>You must provide accurate account information and keep it updated.</li>
              <li>You are responsible for activity on your account and for maintaining the confidentiality of your credentials.</li>
              <li>You may not abuse, harm, or disrupt the service or other users.</li>
            </ul>

            <h2>Subscription and Billing</h2>
            <p>
              Some features may require a paid subscription. Pricing and features are subject to change with notice. Fees are non‑refundable except
              where required by law.
            </p>

            <h2>Content and Data</h2>
            <p>
              You retain ownership of your content. You grant us a limited license to process your data to deliver the service, subject to our{' '}
              <Link to='/privacy' className='text-primary'>
                Privacy Policy
              </Link>
              .
            </p>

            <h2>Acceptable Use</h2>
            <ul>
              <li>No unlawful, harmful, or infringing content.</li>
              <li>No reverse engineering or unauthorized access.</li>
              <li>No spamming or misuse of integrated messaging channels.</li>
            </ul>

            <h2>Termination</h2>
            <p>We may suspend or terminate your access for breach of these Terms. You may stop using the service at any time.</p>

            <h2>Disclaimer and Limitation of Liability</h2>
            <p>
              The service is provided "as is" without warranties of any kind. To the maximum extent permitted by law, LeadsBox will not be liable for
              indirect or consequential damages.
            </p>

            <h2>Changes to Terms</h2>
            <p>We may update these Terms occasionally. Continued use after changes constitutes acceptance of the new Terms.</p>

            <h2>Contact</h2>
            <p>
              Questions? Contact us at{' '}
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

export default Terms;
