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
      fetchPriority={priority ? 'high' : undefined}
      loading={priority ? 'eager' : 'lazy'}
    />
  );

  return (
    <div className='min-h-screen w-full bg-background text-foreground'>
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
          </div>
        </div>
      </header>

      <section className='container mx-auto px-4 py-10 max-w-4xl'>
        <h1 className='text-4xl font-bold mb-2'>Terms of Service</h1>
        <p className='text-muted-foreground mb-8'>Effective Date: February 1, 2026 | Last Updated: {new Date().toLocaleDateString()}</p>

        <div className='prose dark:prose-invert max-w-none space-y-8'>
          <div>
            <p className='text-lg'>
              Welcome to LeadsBox! These Terms of Service ("Terms") govern your use of our WhatsApp-first CRM platform. By accessing or using
              LeadsBox, you agree to these Terms.
            </p>
            <p className='text-sm text-muted-foreground mt-2'>
              Operated by: <strong>TRIBUS GLOBAL LTD</strong> (RC 9204949), Woji, Port Harcourt, Nigeria
            </p>
          </div>

          <div>
            <h2 className='text-2xl font-bold mb-3'>1. Account Registration</h2>
            <ul className='list-disc pl-6 space-y-2'>
              <li>You must be 18+ or the legal age in your jurisdiction</li>
              <li>Provide accurate, complete information</li>
              <li>Keep credentials secure—you're responsible for account activity</li>
              <li>One account per user; no account sharing</li>
            </ul>
          </div>

          <div>
            <h2 className='text-2xl font-bold mb-3'>2. Acceptable Use Policy</h2>
            <p className='mb-3'>You may NOT use LeadsBox to:</p>
            <ul className='list-disc pl-6 space-y-2'>
              <li>Send spam, unsolicited messages, or phishing attempts</li>
              <li>Violate WhatsApp, Instagram, or Telegram Terms of Service</li>
              <li>Infringe intellectual property rights</li>
              <li>Distribute malware, viruses, or harmful code</li>
              <li>Harass, abuse, or harm others</li>
              <li>Engage in illegal activities or fraud</li>
            </ul>
            <p className='mt-3 text-sm text-muted-foreground'>
              <strong>Violation may result in immediate account suspension.</strong>
            </p>
          </div>

          <div>
            <h2 className='text-2xl font-bold mb-3'>3. Subscription & Billing</h2>
            <ul className='list-disc pl-6 space-y-2'>
              <li>
                <strong>Free Plan:</strong> Limited features, subject to usage caps
              </li>
              <li>
                <strong>Paid Plans:</strong> Billed monthly or annually in advance
              </li>
              <li>
                <strong>Auto-Renewal:</strong> Plans renew automatically unless canceled
              </li>
              <li>
                <strong>Cancellation:</strong> Cancel anytime; access until period end
              </li>
              <li>
                <strong>Refunds:</strong> No refunds except as required by law or our{' '}
                <Link to='/refund-policy' className='text-primary'>
                  Refund Policy
                </Link>
              </li>
              <li>
                <strong>Price Changes:</strong> 30-day notice for existing subscribers
              </li>
            </ul>
          </div>

          <div>
            <h2 className='text-2xl font-bold mb-3'>4. Your Data & Content</h2>
            <p className='mb-3'>
              <strong>You own your data.</strong> We process it only to provide services, as detailed in our{' '}
              <Link to='/privacy' className='text-primary'>
                Privacy Policy
              </Link>
              .
            </p>
            <ul className='list-disc pl-6 space-y-2'>
              <li>You grant us a license to process messages, contacts, and media to deliver our service</li>
              <li>You're responsible for content legality and compliance</li>
              <li>We may remove content violating these Terms or applicable laws</li>
              <li>Data retention: See Privacy Policy for details</li>
            </ul>
          </div>

          <div>
            <h2 className='text-2xl font-bold mb-3'>5. Service Availability</h2>
            <ul className='list-disc pl-6 space-y-2'>
              <li>We aim for 99.9% uptime but don't guarantee uninterrupted access</li>
              <li>Scheduled maintenance will be announced in advance when possible</li>
              <li>We're not liable for third-party service disruptions (WhatsApp, Instagram, etc.)</li>
            </ul>
          </div>

          <div>
            <h2 className='text-2xl font-bold mb-3'>6. Intellectual Property</h2>
            <p>
              LeadsBox, our logo, and all platform features are proprietary. You may not copy, modify, or reverse-engineer our software without
              written permission.
            </p>
          </div>

          <div>
            <h2 className='text-2xl font-bold mb-3'>7. Third-Party Integrations</h2>
            <p className='mb-3'>LeadsBox integrates with:</p>
            <ul className='list-disc pl-6 space-y-2'>
              <li>
                <strong>WhatsApp Business API:</strong> Subject to Meta's Terms
              </li>
              <li>
                <strong>Instagram Messaging:</strong> Subject to Meta's Terms
              </li>
              <li>
                <strong>Payment Processors:</strong> Stripe, Paystack (subject to their terms)
              </li>
              <li>
                <strong>OpenAI (GPT-4):</strong> For AI features
              </li>
            </ul>
            <p className='mt-3 text-sm'>You must comply with all third-party terms when using integrations.</p>
          </div>

          <div>
            <h2 className='text-2xl font-bold mb-3'>8. Termination</h2>
            <p className='mb-3'>
              <strong>You may:</strong> Cancel your subscription anytime from account settings.
            </p>
            <p className='mb-3'>
              <strong>We may:</strong> Suspend or terminate your account for:
            </p>
            <ul className='list-disc pl-6 space-y-2'>
              <li>Breach of these Terms or Acceptable Use Policy</li>
              <li>Non-payment of fees</li>
              <li>Illegal activity or fraud</li>
              <li>Repeated user complaints or reports</li>
            </ul>
            <p className='mt-3'>
              <strong>Upon termination:</strong> You may export your data within 30 days. After 30 days, data may be deleted.
            </p>
          </div>

          <div>
            <h2 className='text-2xl font-bold mb-3'>9. Disclaimers</h2>
            <p className='mb-3'>
              <strong>THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND.</strong>
            </p>
            <ul className='list-disc pl-6 space-y-2'>
              <li>We don't guarantee specific results or outcomes</li>
              <li>We're not responsible for third-party service failures</li>
              <li>AI features may contain errors or inaccuracies</li>
              <li>You're responsible for compliance with messaging laws (GDPR, TCPA, etc.)</li>
            </ul>
          </div>

          <div>
            <h2 className='text-2xl font-bold mb-3'>10. Limitation of Liability</h2>
            <p>
              <strong>TO THE MAXIMUM EXTENT PERMITTED BY LAW:</strong> TRIBUS GLOBAL LTD is not liable for indirect, incidental, or consequential
              damages, including lost profits, data loss, or business interruption. Our total liability is limited to fees paid in the 12 months prior
              to the claim.
            </p>
          </div>

          <div>
            <h2 className='text-2xl font-bold mb-3'>11. Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless TRIBUS GLOBAL LTD from claims arising from your use of the service, violation of these Terms,
              or infringement of third-party rights.
            </p>
          </div>

          <div>
            <h2 className='text-2xl font-bold mb-3'>12. Dispute Resolution</h2>
            <ul className='list-disc pl-6 space-y-2'>
              <li>
                <strong>Governing Law:</strong> Laws of Nigeria
              </li>
              <li>
                <strong>Jurisdiction:</strong> Courts of Port Harcourt, Nigeria
              </li>
              <li>
                <strong>Informal Resolution:</strong> Contact{' '}
                <a href='mailto:support@leadsbox.com' className='text-primary'>
                  support@leadsbox.com
                </a>{' '}
                to resolve disputes
              </li>
            </ul>
          </div>

          <div>
            <h2 className='text-2xl font-bold mb-3'>13. Changes to Terms</h2>
            <p>
              We may update these Terms. Material changes will be notified via email or platform notice 30 days in advance. Continued use after
              changes = acceptance.
            </p>
          </div>

          <div>
            <h2 className='text-2xl font-bold mb-3'>14. Contact Us</h2>
            <p className='mb-2'>
              <strong>TRIBUS GLOBAL LTD</strong>
            </p>
            <p className='text-sm'>
              Email:{' '}
              <a href='mailto:hello@leadsbox.com' className='text-primary'>
                hello@leadsbox.com
              </a>
            </p>
            <p className='text-sm'>
              Support:{' '}
              <a href='mailto:support@leadsbox.com' className='text-primary'>
                support@leadsbox.com
              </a>
            </p>
            <p className='text-sm'>
              Legal:{' '}
              <a href='mailto:legal@leadsbox.com' className='text-primary'>
                legal@leadsbox.com
              </a>
            </p>
          </div>

          <div className='border-t border-border pt-6 mt-8'>
            <p className='text-sm text-muted-foreground'>
              By using LeadsBox, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
            </p>
          </div>

          <div className='flex items-center justify-between pt-4'>
            <Link to='/privacy' className='text-sm text-primary hover:underline'>
              Privacy Policy
            </Link>
            <Link to='/' className='text-sm text-primary hover:underline'>
              Back to Home
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Terms;
