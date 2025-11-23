import React from 'react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/context/ThemeContext';
import { Moon, Sun, Download } from 'lucide-react';
import { Link } from 'react-router-dom';

const DataProcessingAgreement: React.FC = () => {
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
      <section aria-labelledby='dpa-heading' className='container mx-auto px-4 py-10'>
        <div className='max-w-4xl mx-auto'>
          <div className='flex items-start justify-between mb-8'>
            <div>
              <h1 id='dpa-heading' className='text-3xl sm:text-4xl font-bold mb-2'>
                Data Processing Agreement (DPA)
              </h1>
              <p className='text-muted-foreground'>Last updated: {new Date().toLocaleDateString()}</p>
            </div>
            <Button variant='outline' size='sm' className='gap-2' asChild>
              <a href='/api/legal/dpa/download' download>
                <Download className='h-4 w-4' />
                Download PDF
              </a>
            </Button>
          </div>

          <div className='bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-8'>
            <p className='text-sm'>
              <strong>Enterprise Customers:</strong> For a signed copy of our DPA, please contact our legal team at{' '}
              <a href='mailto:legal@leadsbox.app' className='text-primary hover:underline'>
                legal@leadsbox.app
              </a>
            </p>
          </div>

          <div className='prose dark:prose-invert max-w-none space-y-6'>
            <p>
              This Data Processing Agreement ("DPA") forms part of the Terms of Service between you ("Customer") and LeadsBox Inc. ("LeadsBox", "we", "us") and governs the processing of Personal Data in accordance with applicable data protection laws, including the General Data Protection Regulation (EU) 2016/679 ("GDPR").
            </p>

            <h2>1. Definitions</h2>
            <p>In this DPA:</p>
            <ul>
              <li><strong>"Personal Data"</strong> means any information relating to an identified or identifiable natural person processed by LeadsBox on behalf of Customer</li>
              <li><strong>"Data Subject"</strong> means the individual to whom Personal Data relates</li>
              <li><strong>"Processing"</strong> has the meaning given in applicable data protection laws</li>
              <li><strong>"Controller"</strong> means the entity that determines the purposes and means of Processing Personal Data</li>
              <li><strong>"Processor"</strong> means the entity that Processes Personal Data on behalf of the Controller</li>
            </ul>

            <h2>2. Roles and Scope</h2>
            <p>
              <strong>2.1</strong> Customer acts as the Controller and LeadsBox acts as the Processor of Personal Data processed through the LeadsBox service.
            </p>
            <p>
              <strong>2.2</strong> This DPA applies to the Processing of Personal Data by LeadsBox for the purpose of providing the services described in the Terms of Service.
            </p>
            <p>
              <strong>2.3</strong> The nature, purpose, and types of Personal Data processed are detailed in <strong>Appendix A</strong> below.
            </p>

            <h2>3. Customer's Obligations</h2>
            <p>Customer warrants that:</p>
            <ul>
              <li>It has a lawful basis for Processing Personal Data and sharing it with LeadsBox</li>
              <li>It has provided all necessary notices to Data Subjects</li>
              <li>Its Processing instructions comply with applicable data protection laws</li>
              <li>It has obtained all necessary consents from Data Subjects</li>
            </ul>

            <h2>4. LeadsBox's Obligations</h2>
            <p>LeadsBox shall:</p>
            <ul>
              <li>Process Personal Data only on documented instructions from Customer</li>
              <li>Ensure persons authorized to process Personal Data are bound by confidentiality obligations</li>
              <li>Implement appropriate technical and organizational measures to protect Personal Data</li>
              <li>Notify Customer without undue delay upon becoming aware of a Personal Data breach</li>
              <li>Assist Customer in responding to Data Subject requests</li>
              <li>Delete or return Personal Data upon termination of services</li>
            </ul>

            <h2>5. Sub-Processors</h2>
            <p>
              <strong>5.1</strong> Customer grants LeadsBox general authorization to engage sub-processors for specific Processing activities.
            </p>
            <p>
              <strong>5.2</strong> Current sub-processors include:
            </p>
            <ul>
              <li><strong>Amazon Web Services (AWS)</strong> - Cloud infrastructure and data storage</li>
              <li><strong>Render</strong> - Application hosting</li>
              <li><strong>PostgreSQL (Managed Database)</strong> - Database services</li>
              <li><strong>OpenAI</strong> - AI-powered features processing</li>
              <li><strong>Paystack</strong> - Payment processing</li>
              <li><strong>PostHog</strong> - Analytics</li>
            </ul>
            <p>
              <strong>5.3</strong> LeadsBox will notify Customer of any new sub-processor at least 30 days before engagement. Customer may object on reasonable grounds.
            </p>

            <h2>6. Security Measures</h2>
            <p>LeadsBox implements industry-standard security measures including:</p>
            <ul>
              <li>Encryption of data in transit (TLS 1.2+) and at rest (AES-256)</li>
              <li>Regular security assessments and penetration testing</li>
              <li>Access controls and authentication mechanisms</li>
              <li>Regular data backups with encryption</li>
              <li>Employee security training and background checks</li>
              <li>Incident response and breach notification procedures</li>
            </ul>

            <h2>7. Data Subject Rights</h2>
            <p>
              <strong>7.1</strong> LeadsBox will assist Customer in fulfilling Data Subject requests, including:
            </p>
            <ul>
              <li>Right of access</li>
              <li>Right to rectification</li>
              <li>Right to erasure ("right to be forgotten")</li>
              <li>Right to data portability</li>
              <li>Right to object to Processing</li>
            </ul>
            <p>
              <strong>7.2</strong> LeadsBox will respond to Data Subject requests within 30 days or as required by applicable law.
            </p>

            <h2>8. Data Transfers</h2>
            <p>
              <strong>8.1</strong> Personal Data may be transferred to and processed in countries outside the European Economic Area (EEA).
            </p>
            <p>
              <strong>8.2</strong> For transfers from the EEA to third countries, LeadsBox relies on:
            </p>
            <ul>
              <li>Standard Contractual Clauses (SCCs) approved by the European Commission</li>
              <li>Adequacy decisions by the European Commission</li>
              <li>Appropriate safeguards as required by GDPR Article 46</li>
            </ul>

            <h2>9. Data Breach Notification</h2>
            <p>
              <strong>9.1</strong> LeadsBox will notify Customer without undue delay (and in any event within 72 hours) after becoming aware of a Personal Data breach.
            </p>
            <p>
              <strong>9.2</strong> Notifications will include:
            </p>
            <ul>
              <li>Nature of the breach</li>
              <li>Categories and approximate number of affected Data Subjects</li>
              <li>Likely consequences of the breach</li>
              <li>Measures taken or proposed to address the breach</li>
            </ul>

            <h2>10. Audits and Inspections</h2>
            <p>
              <strong>10.1</strong> LeadsBox will make available to Customer information necessary to demonstrate compliance with this DPA.
            </p>
            <p>
              <strong>10.2</strong> Customer may conduct audits or inspections upon reasonable notice (at least 30 days) and no more than once per year, unless required by law or following a data breach.
            </p>

            <h2>11. Data Retention and Deletion</h2>
            <p>
              <strong>11.1</strong> Upon termination of services, LeadsBox will:
            </p>
            <ul>
              <li>Delete all Personal Data within 30 days, unless legally required to retain it</li>
              <li>Provide Customer with a copy of Personal Data upon request (at no additional cost)</li>
              <li>Certify deletion in writing upon Customer request</li>
            </ul>

            <h2>12. Liability and Indemnification</h2>
            <p>
              Each party's liability under this DPA is subject to the limitations and exclusions of liability set out in the Terms of Service.
            </p>

            <h2>13. Term and Termination</h2>
            <p>
              This DPA will remain in effect for as long as LeadsBox Processes Personal Data on behalf of Customer or until termination of the Terms of Service.
            </p>

            <div className='bg-muted p-6 rounded-lg mt-8'>
              <h2 className='text-xl font-bold mb-4'>Appendix A: Details of Processing</h2>
              
              <div className='space-y-4'>
                <div>
                  <h3 className='font-semibold mb-2'>Nature and Purpose of Processing</h3>
                  <p className='text-sm'>
                    LeadsBox processes Personal Data to provide multi-channel messaging, CRM, invoicing, and analytics services to Customer.
                  </p>
                </div>

                <div>
                  <h3 className='font-semibold mb-2'>Duration of Processing</h3>
                  <p className='text-sm'>
                    For the duration of the Terms of Service, plus 30 days for data deletion.
                  </p>
                </div>

                <div>
                  <h3 className='font-semibold mb-2'>Categories of Data Subjects</h3>
                  <ul className='text-sm list-disc list-inside'>
                    <li>Customer's end-users and contacts</li>
                    <li>Customer's employees and team members</li>
                    <li>Message senders and recipients</li>
                  </ul>
                </div>

                <div>
                  <h3 className='font-semibold mb-2'>Types of Personal Data</h3>
                  <ul className='text-sm list-disc list-inside'>
                    <li>Contact information (name, email, phone number)</li>
                    <li>Message content (text, images, files)</li>
                    <li>Transaction data (invoices, payments, receipts)</li>
                    <li>Usage data (IP addresses, browser information, timestamps)</li>
                    <li>Social media identifiers (WhatsApp ID, Instagram handle, etc.)</li>
                  </ul>
                </div>

                <div>
                  <h3 className='font-semibold mb-2'>Special Categories of Data</h3>
                  <p className='text-sm'>
                    Customer must not submit special categories of personal data (sensitive data) unless explicitly agreed in writing.
                  </p>
                </div>
              </div>
            </div>

            <div className='flex items-center justify-between pt-8 border-t mt-8'>
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

export default DataProcessingAgreement;
