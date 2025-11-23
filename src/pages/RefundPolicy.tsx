import React from 'react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/context/ThemeContext';
import { Moon, Sun } from 'lucide-react';
import { Link } from 'react-router-dom';

const RefundPolicy: React.FC = () => {
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
      <section aria-labelledby='refund-heading' className='container mx-auto px-4 py-10'>
        <div className='max-w-4xl mx-auto'>
          <h1 id='refund-heading' className='text-3xl sm:text-4xl font-bold mb-2'>
            Refund Policy
          </h1>
          <p className='text-muted-foreground mb-8'>Last updated: {new Date().toLocaleDateString()}</p>

          <div className='prose dark:prose-invert max-w-none space-y-6'>
            <p>
              At LeadsBox, we want you to be completely satisfied with our service. This Refund Policy explains our approach to refunds and cancellations.
            </p>

            <h2>14-Day Free Trial</h2>
            <p>
              All new customers receive a <strong>14-day free trial</strong> to explore LeadsBox without any payment. No credit card is required to start your trial. This gives you ample time to test all features before committing to a paid plan.
            </p>

            <h2>Subscription Billing</h2>
            <p>
              After your trial ends, you'll be billed according to your chosen plan (monthly or annual). Billing occurs automatically on your renewal date unless you cancel before the renewal.
            </p>

            <h2>Refund Eligibility</h2>
            
            <h3>Monthly Subscriptions</h3>
            <p>
              For monthly paid subscriptions, we offer a <strong>7-day money-back guarantee</strong> from the date of your first payment. To be eligible:
            </p>
            <ul>
              <li>You must request a refund within 7 days of your initial payment</li>
              <li>This applies only to your first payment (not renewals)</li>
              <li>You must not have violated our Terms of Service or Acceptable Use Policy</li>
            </ul>
            <p className='text-sm bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded p-3'>
              <strong>Note:</strong> Subsequent monthly renewals are non-refundable. Please cancel before your renewal date if you wish to discontinue service.
            </p>

            <h3>Annual Subscriptions</h3>
            <p>
              For annual paid subscriptions, we offer a <strong>30-day money-back guarantee</strong> from the date of your first annual payment. To be eligible:
            </p>
            <ul>
              <li>You must request a refund within 30 days of your initial annual payment</li>
              <li>This applies only to your first annual payment (not renewals)</li>
              <li>You must not have violated our Terms of Service or Acceptable Use Policy</li>
            </ul>
            <p className='text-sm bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded p-3'>
              <strong>Note:</strong> After 30 days, annual subscriptions are non-refundable. We recommend trying our free trial or monthly plan first if you're unsure about committing to an annual subscription.
            </p>

            <h2>Non-Refundable Situations</h2>
            <p>Refunds will <strong>not</strong> be provided in the following cases:</p>
            <ul>
              <li>Renewal payments (monthly or annual)</li>
              <li>Partial months or unused subscription time</li>
              <li>Account violations or Terms of Service breaches</li>
              <li>Failure to cancel before the renewal date</li>
              <li>Change of mind after the guarantee period</li>
              <li>Third-party fees (e.g., payment processor fees, SMS charges)</li>
            </ul>

            <h2>How to Request a Refund</h2>
            <p>To request a refund within the eligible period:</p>
            <ol>
              <li>Email us at <a href='mailto:billing@leadsbox.app' className='text-primary hover:underline'>billing@leadsbox.app</a></li>
              <li>Include your account email and subscription details</li>
              <li>Briefly explain the reason for your refund request</li>
            </ol>
            <p>
              We aim to process refund requests within <strong>5-7 business days</strong>. Refunds are issued to the original payment method.
            </p>

            <h2>Cancellation Policy</h2>
            <p>
              You may cancel your subscription at any time from your account settings or by contacting support. When you cancel:
            </p>
            <ul>
              <li>Your subscription will remain active until the end of your current billing period</li>
              <li>You will not be charged for subsequent periods</li>
              <li>You can continue using LeadsBox until your paid period ends</li>
              <li>After expiration, your account will be downgraded to the free tier (if available) or deactivated</li>
            </ul>
            <p className='text-sm bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded p-3'>
              <strong>Tip:</strong> If you're unsure about canceling, you can pause your subscription or downgrade to a lower plan instead.
            </p>

            <h2>Proration and Upgrades</h2>
            
            <h3>Plan Upgrades</h3>
            <p>
              When you upgrade to a higher-tier plan mid-cycle, you'll receive a <strong>prorated credit</strong> for the unused portion of your current plan. The credit is applied immediately to your new plan's cost.
            </p>

            <h3>Plan Downgrades</h3>
            <p>
              When you downgrade to a lower-tier plan, the change takes effect at the start of your next billing cycle. You will <strong>not</strong> receive a refund for the current period.
            </p>

            <h2>Technical Issues and Service Interruptions</h2>
            <p>
              If you experience significant service disruptions or technical issues that prevent you from using LeadsBox:
            </p>
            <ul>
              <li>Contact our support team immediately at <a href='mailto:support@leadsbox.app' className='text-primary hover:underline'>support@leadsbox.app</a></li>
              <li>We will work to resolve the issue as quickly as possible</li>
              <li>In cases of extended outages (24+ hours), we may provide service credits or refunds on a case-by-case basis</li>
            </ul>

            <h2>Exceptional Circumstances</h2>
            <p>
              We understand that exceptional circumstances may arise. If you believe you have a valid reason for a refund outside of our standard policy, please contact us at <a href='mailto:billing@leadsbox.app' className='text-primary hover:underline'>billing@leadsbox.app</a>. We review each request individually and may make exceptions in certain cases.
            </p>

            <h2>Payment Disputes and Chargebacks</h2>
            <p>
              If you dispute a charge with your payment provider (chargeback) without first contacting us, your account may be suspended or terminated. Please reach out to us first to resolve any billing concerns.
            </p>

            <h2>Changes to This Policy</h2>
            <p>
              We may update this Refund Policy from time to time. Any changes will be posted on this page with an updated "Last updated" date. Continued use of LeadsBox after changes constitutes acceptance of the updated policy.
            </p>

            <h2>Contact Us</h2>
            <p>
              For questions about refunds, billing, or cancellations, please contact us at:
            </p>
            <ul>
              <li>Email: <a href='mailto:billing@leadsbox.app' className='text-primary hover:underline'>billing@leadsbox.app</a></li>
              <li>Support: <a href='mailto:support@leadsbox.app' className='text-primary hover:underline'>support@leadsbox.app</a></li>
            </ul>

            <div className='flex items-center justify-between pt-4 border-t mt-8'>
              <Link to='/terms' className='text-sm text-primary hover:underline'>
                Terms of Service
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

export default RefundPolicy;
