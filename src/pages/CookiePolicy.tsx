import React from 'react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/context/ThemeContext';
import { Moon, Sun } from 'lucide-react';
import { Link } from 'react-router-dom';

const CookiePolicy: React.FC = () => {
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
      {/* Navigation */}
      <header className='sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md'>
        <div className='container mx-auto flex h-16 items-center justify-between px-4'>
          <a href='/' className='flex items-center gap-3 transition-transform hover:scale-105'>
            <div className='w-8 h-8 bg-white p-1 rounded-sm flex items-center justify-center'>
              <LogoMark priority />
            </div>
            <span className='text-xl font-semibold'>LeadsBox</span>
          </a>

          <div className='flex items-center gap-2 sm:gap-3'>
            <Button variant='ghost' size='icon' aria-label='Toggle theme' onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}>
              <ThemeIcon className='h-4 w-4' />
            </Button>
            <Button variant='ghost' size='sm' asChild>
              <a href='/login'>Login</a>
            </Button>
            <Button size='sm' asChild>
              <a href='/register'>Get Started</a>
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <section aria-labelledby='cookie-heading' className='container mx-auto px-4 py-10'>
        <div className='max-w-4xl mx-auto'>
          <h1 id='cookie-heading' className='text-3xl sm:text-4xl font-bold mb-2'>
            Cookie Policy
          </h1>
          <p className='text-muted-foreground mb-8'>Last updated: {new Date().toLocaleDateString()}</p>

          <div className='prose dark:prose-invert max-w-none space-y-6'>
            <p>
              This Cookie Policy explains how LeadsBox ("we", "our", or "us") uses cookies and similar tracking technologies when you visit our website.
            </p>

            <h2>What Are Cookies?</h2>
            <p>
              Cookies are small text files stored on your device when you visit a website. They help us remember your preferences and understand how you use our service.
            </p>

            <h2>Types of Cookies We Use</h2>
            
            <h3>1. Essential Cookies</h3>
            <p>These cookies are necessary for the website to function properly. They enable core functionality like:</p>
            <ul>
              <li>User authentication and session management</li>
              <li>Security features and fraud prevention</li>
              <li>Remembering your cookie consent preferences</li>
            </ul>
            <p className='text-sm text-muted-foreground italic'>These cookies cannot be disabled as they are essential for the service.</p>

            <h3>2. Analytics Cookies</h3>
            <p>We use PostHog for analytics to understand how visitors interact with our website. This helps us:</p>
            <ul>
              <li>Measure website traffic and usage patterns</li>
              <li>Improve user experience based on behavioral data</li>
              <li>Identify and fix technical issues</li>
            </ul>
            <p className='text-sm text-muted-foreground italic'>You can opt-out of analytics cookies through our cookie banner.</p>

            <h3>3. Functional Cookies</h3>
            <p>These cookies allow us to remember your choices and provide enhanced features:</p>
            <ul>
              <li>Theme preferences (dark/light mode)</li>
              <li>Language settings</li>
              <li>Notification preferences</li>
            </ul>

            <h2>Third-Party Cookies</h2>
            <p>We may use third-party services that set their own cookies:</p>
            <ul>
              <li><strong>PostHog</strong> - Analytics and user behavior tracking</li>
              <li><strong>Paystack</strong> - Payment processing (only on payment pages)</li>
              <li><strong>Crisp</strong> - Customer support chat widget</li>
            </ul>
            <p>Each third-party service has its own privacy policy regarding cookie usage.</p>

            <h2>Your Cookie Choices</h2>
            <p>You have the right to decide whether to accept or reject cookies. You can:</p>
            <ul>
              <li><strong>Use our cookie banner</strong> - When you first visit, you'll see a banner where you can accept or reject non-essential cookies</li>
              <li><strong>Browser settings</strong> - Most browsers allow you to refuse cookies through settings. Note that disabling essential cookies may impact functionality</li>
              <li><strong>Opt-out tools</strong> - Use tools like browser extensions to block specific tracking cookies</li>
            </ul>

            <h2>Cookie Duration</h2>
            <p>We use both session cookies (deleted when you close your browser) and persistent cookies (remain until expiry or deletion):</p>
            <ul>
              <li>Authentication cookies: 30 days</li>
              <li>Analytics cookies: 1 year</li>
              <li>Preference cookies: 1 year</li>
            </ul>

            <h2>Updates to This Policy</h2>
            <p>
              We may update this Cookie Policy from time to time. Any changes will be posted on this page with an updated "Last updated" date.
            </p>

            <h2>Contact Us</h2>
            <p>
              If you have questions about our use of cookies, please contact us at{' '}
              <a href='mailto:privacy@leadsbox.app' className='text-primary hover:underline'>
                privacy@leadsbox.app
              </a>
              .
            </p>

            <div className='flex items-center justify-between pt-4 border-t mt-8'>
              <Link to='/privacy' className='text-sm text-primary hover:underline'>
                Privacy Policy
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

export default CookiePolicy;
