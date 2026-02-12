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
              <a href='/register'>Start Free Trial</a>
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
          <p className='text-muted-foreground mb-8'>Last updated: February 2, 2026</p>

          <div className='prose dark:prose-invert max-w-none space-y-6'>
            {/* Introduction */}
            <section>
              <h2 className='text-2xl font-semibold mb-3'>1. Who We Are</h2>
              <p>
                TRIBUS GLOBAL LTD (RC 9204949) operates LeadsBox, a customer relationship management (CRM) platform that helps Nigerian businesses
                manage customer communications across WhatsApp, Instagram, and Telegram.
              </p>
              <div className='bg-muted/50 p-4 rounded-lg mt-3'>
                <p className='font-medium mb-2'>Registered Address:</p>
                <p className='text-sm'>
                  Road 21, Block 19, Plot 2X
                  <br />
                  Federal Housing Estate, Woji
                  <br />
                  Port Harcourt, Rivers State, Nigeria
                </p>
                <p className='font-medium mt-3 mb-2'>Contact:</p>
                <p className='text-sm'>
                  Email:{' '}
                  <a href='mailto:privacy@leadsbox.com' className='text-primary'>
                    privacy@leadsbox.com
                  </a>
                  <br />
                  Phone: +234 813 818 5331
                </p>
              </div>
            </section>

            {/* Data Collection */}
            <section>
              <h2 className='text-2xl font-semibold mb-3'>2. What Data We Collect</h2>
              <p>When businesses use LeadsBox, we collect:</p>

              <h3 className='text-lg font-medium mt-4 mb-2'>Customer Messages:</h3>
              <ul className='list-disc pl-6 space-y-1'>
                <li>WhatsApp conversations sent to business phone numbers</li>
                <li>Instagram Direct Messages sent to business accounts</li>
                <li>Telegram messages</li>
                <li>Message timestamps and read status</li>
              </ul>

              <h3 className='text-lg font-medium mt-4 mb-2'>Business Information:</h3>
              <ul className='list-disc pl-6 space-y-1'>
                <li>Company name and contact details</li>
                <li>User account information (email, password hash)</li>
                <li>WhatsApp Business Account details</li>
                <li>Instagram account details</li>
              </ul>

              <h3 className='text-lg font-medium mt-4 mb-2'>Usage Data:</h3>
              <ul className='list-disc pl-6 space-y-1'>
                <li>Login timestamps and IP addresses</li>
                <li>Feature usage analytics</li>
                <li>Device and browser information</li>
              </ul>
            </section>

            {/* How We Use Data */}
            <section>
              <h2 className='text-2xl font-semibold mb-3'>3. How We Use Your Data</h2>
              <p>We use your data to:</p>
              <ul className='list-disc pl-6 space-y-1'>
                <li>Display customer messages in your CRM inbox</li>
                <li>Enable you to reply to customers from LeadsBox</li>
                <li>Generate AI-powered insights and invoice suggestions</li>
                <li>Process payments via Paystack</li>
                <li>Provide analytics and usage reports</li>
                <li>Improve our service and fix bugs</li>
                <li>Send important service notifications</li>
              </ul>
            </section>

            {/* Data Sharing */}
            <section>
              <h2 className='text-2xl font-semibold mb-3'>4. Data Sharing</h2>
              <div className='bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg mb-4'>
                <p className='font-semibold text-yellow-900 dark:text-yellow-100'>WE DO NOT SELL YOUR DATA.</p>
              </div>

              <p className='mb-3'>We share data only with these trusted third parties:</p>

              <div className='space-y-3'>
                <div className='border border-border p-3 rounded-lg'>
                  <p className='font-medium'>OpenAI (USA)</p>
                  <p className='text-sm text-muted-foreground'>Purpose: AI analysis of messages to detect sales opportunities</p>
                  <p className='text-sm text-muted-foreground'>Data Shared: Message content (anonymized, no phone numbers or names)</p>
                  <p className='text-sm text-muted-foreground'>Protection: Encrypted API calls, no data storage by OpenAI</p>
                </div>

                <div className='border border-border p-3 rounded-lg'>
                  <p className='font-medium'>Paystack (Nigeria)</p>
                  <p className='text-sm text-muted-foreground'>Purpose: Process customer payments</p>
                  <p className='text-sm text-muted-foreground'>Data Shared: Payment amounts, customer email addresses</p>
                  <p className='text-sm text-muted-foreground'>Protection: PCI-DSS compliant, encrypted transactions</p>
                </div>

                <div className='border border-border p-3 rounded-lg'>
                  <p className='font-medium'>Meta/Facebook (USA)</p>
                  <p className='text-sm text-muted-foreground'>Purpose: WhatsApp and Instagram messaging functionality</p>
                  <p className='text-sm text-muted-foreground'>Data Shared: Messages to/from connected business accounts only</p>
                  <p className='text-sm text-muted-foreground'>Protection: Official WhatsApp Business API, OAuth 2.0</p>
                </div>

                <div className='border border-border p-3 rounded-lg'>
                  <p className='font-medium'>Cloud Infrastructure (Render.com, AWS)</p>
                  <p className='text-sm text-muted-foreground'>Purpose: Application hosting and data storage</p>
                  <p className='text-sm text-muted-foreground'>Data Shared: All application data</p>
                  <p className='text-sm text-muted-foreground'>Protection: Encryption at rest and in transit, ISO 27001 certified</p>
                </div>
              </div>

              <p className='mt-3 text-sm'>All third-party providers are bound by strict data protection agreements.</p>
            </section>

            {/* Security */}
            <section>
              <h2 className='text-2xl font-semibold mb-3'>5. Data Security</h2>
              <p className='mb-2'>We protect your data with:</p>
              <ul className='list-disc pl-6 space-y-1'>
                <li>
                  <strong>Encryption in transit:</strong> All data sent over HTTPS/TLS 1.3
                </li>
                <li>
                  <strong>Encryption at rest:</strong> Database encryption using AES-256
                </li>
                <li>
                  <strong>Access controls:</strong> Secure authentication with JWT tokens
                </li>
                <li>
                  <strong>Regular security audits:</strong> Quarterly vulnerability scans
                </li>
                <li>
                  <strong>Secure infrastructure:</strong> SOC 2 certified hosting providers
                </li>
                <li>
                  <strong>Backup protection:</strong> Encrypted backups, 30-day retention
                </li>
              </ul>
            </section>

            {/* User Rights */}
            <section>
              <h2 className='text-2xl font-semibold mb-3'>6. Your Rights (GDPR & NDPR Compliance)</h2>
              <p className='mb-3'>Under Nigerian Data Protection Regulation (NDPR) and GDPR, you have the right to:</p>

              <div className='grid gap-3'>
                <div className='border border-border p-3 rounded-lg'>
                  <p className='font-medium'>Access</p>
                  <p className='text-sm text-muted-foreground'>Export all your data in CSV/JSON format (available in Settings)</p>
                </div>

                <div className='border border-border p-3 rounded-lg'>
                  <p className='font-medium'>Delete</p>
                  <p className='text-sm text-muted-foreground'>Request account deletion (all data deleted within 30 days)</p>
                </div>

                <div className='border border-border p-3 rounded-lg'>
                  <p className='font-medium'>Update</p>
                  <p className='text-sm text-muted-foreground'>Modify your information at any time</p>
                </div>

                <div className='border border-border p-3 rounded-lg'>
                  <p className='font-medium'>Withdraw Consent</p>
                  <p className='text-sm text-muted-foreground'>Disconnect channels or delete account</p>
                </div>

                <div className='border border-border p-3 rounded-lg'>
                  <p className='font-medium'>Data Portability</p>
                  <p className='text-sm text-muted-foreground'>Download your data to use with other services</p>
                </div>

                <div className='border border-border p-3 rounded-lg'>
                  <p className='font-medium'>Object</p>
                  <p className='text-sm text-muted-foreground'>Opt-out of marketing communications</p>
                </div>
              </div>

              <p className='mt-3'>
                To exercise these rights, contact:{' '}
                <a href='mailto:privacy@leadsbox.com' className='text-primary'>
                  privacy@leadsbox.com
                </a>
              </p>
            </section>

            {/* Data Retention */}
            <section>
              <h2 className='text-2xl font-semibold mb-3'>7. Data Retention</h2>
              <ul className='list-disc pl-6 space-y-1'>
                <li>
                  <strong>Active Accounts:</strong> Data retained while your account is active
                </li>
                <li>
                  <strong>Deleted Accounts:</strong> All data permanently deleted within 30 days
                </li>
                <li>
                  <strong>Backups:</strong> Retained for 90 days for disaster recovery only
                </li>
                <li>
                  <strong>Logs:</strong> System logs retained for 30 days for security purposes
                </li>
              </ul>
            </section>

            {/* WhatsApp & Instagram Data */}
            <section>
              <h2 className='text-2xl font-semibold mb-3'>8. WhatsApp & Instagram Data</h2>
              <div className='bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg'>
                <p className='font-medium mb-2'>Important:</p>
                <p className='text-sm'>
                  We only access messages sent TO or FROM WhatsApp Business numbers and Instagram accounts that you explicitly connect to LeadsBox via
                  OAuth authorization.
                </p>
              </div>

              <p className='mt-3 mb-2'>We do NOT access:</p>
              <ul className='list-disc pl-6 space-y-1'>
                <li>Personal WhatsApp conversations</li>
                <li>Messages not sent to your business numbers</li>
                <li>Instagram accounts you haven't connected</li>
                <li>Any data without your explicit consent</li>
              </ul>
            </section>

            {/* Children's Privacy */}
            <section>
              <h2 className='text-2xl font-semibold mb-3'>9. Children's Privacy</h2>
              <p>LeadsBox is a business tool not intended for individuals under 18 years of age. We do not knowingly collect data from children.</p>
            </section>

            {/* International Transfers */}
            <section>
              <h2 className='text-2xl font-semibold mb-3'>10. International Data Transfers</h2>
              <p className='mb-2'>
                Your data may be transferred to and processed in countries outside Nigeria (USA for OpenAI, cloud infrastructure). We ensure adequate
                protection through:
              </p>
              <ul className='list-disc pl-6 space-y-1'>
                <li>Standard Contractual Clauses (SCCs)</li>
                <li>Privacy Shield frameworks</li>
                <li>Encryption and security measures</li>
              </ul>
            </section>

            {/* Cookies */}
            <section>
              <h2 className='text-2xl font-semibold mb-3'>11. Cookies</h2>
              <p className='mb-2'>We use essential cookies for:</p>
              <ul className='list-disc pl-6 space-y-1'>
                <li>Authentication (keeping you logged in)</li>
                <li>Security (CSRF protection)</li>
                <li>Preferences (language, theme)</li>
              </ul>
              <p className='mt-2 text-sm text-muted-foreground'>You can disable cookies in your browser, but this may affect functionality.</p>
            </section>

            {/* Changes to Policy */}
            <section>
              <h2 className='text-2xl font-semibold mb-3'>12. Changes to This Policy</h2>
              <p className='mb-2'>We may update this privacy policy. Material changes will be notified via:</p>
              <ul className='list-disc pl-6 space-y-1'>
                <li>Email to your registered address</li>
                <li>In-app notification</li>
                <li>Notice on this page</li>
              </ul>
              <p className='mt-2'>
                <strong>Current Version:</strong> February 2, 2026
              </p>
            </section>

            {/* Complaints */}
            <section>
              <h2 className='text-2xl font-semibold mb-3'>13. Complaints</h2>
              <p className='mb-3'>
                If you have privacy concerns, contact us first:{' '}
                <a href='mailto:privacy@leadsbox.com' className='text-primary'>
                  privacy@leadsbox.com
                </a>
              </p>
              <p className='mb-2'>If unresolved, you may file a complaint with:</p>
              <div className='bg-muted/50 p-4 rounded-lg'>
                <p className='font-medium'>Nigeria Data Protection Commission (NDPC)</p>
                <p className='text-sm'>Email: info@ndpb.gov.ng</p>
                <p className='text-sm'>
                  Website:{' '}
                  <a href='https://ndpb.gov.ng' target='_blank' rel='noopener noreferrer' className='text-primary'>
                    https://ndpb.gov.ng
                  </a>
                </p>
              </div>
            </section>

            {/* Contact */}
            <section>
              <h2 className='text-2xl font-semibold mb-3'>14. Contact Us</h2>
              <div className='bg-muted/50 p-4 rounded-lg'>
                <p className='font-medium mb-2'>TRIBUS GLOBAL LTD</p>
                <p className='text-sm'>
                  Road 21, Block 19, Plot 2X
                  <br />
                  Federal Housing Estate, Woji
                  <br />
                  Port Harcourt, Rivers State, Nigeria
                </p>
                <p className='text-sm mt-3'>
                  <strong>Privacy Inquiries:</strong>{' '}
                  <a href='mailto:privacy@leadsbox.com' className='text-primary'>
                    privacy@leadsbox.com
                  </a>
                  <br />
                  <strong>General Support:</strong>{' '}
                  <a href='mailto:support@leadsbox.com' className='text-primary'>
                    support@leadsbox.com
                  </a>
                  <br />
                  <strong>Phone:</strong> +234 813 818 5331
                </p>
              </div>
            </section>

            <div className='flex items-center justify-between pt-8 mt-8 border-t border-border'>
              <Link to='/register' className='text-sm text-primary hover:underline'>
                ← Back to Register
              </Link>
              <Link to='/' className='text-sm text-primary hover:underline'>
                Back to Home →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PrivacyPolicy;
