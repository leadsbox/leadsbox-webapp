import React, { ButtonHTMLAttributes, DetailedHTMLProps, InputHTMLAttributes, Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { WhatsAppIcon, TelegramIcon, InstagramIcon, FacebookIcon, CheckIcon } from '@/components/brand-icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

/**
 * LeadsBox — Modern landing page with design system integration
 */

const META = {
  title: 'LeadsBox — Turn Social DMs into Revenue',
  description:
    'One inbox for WhatsApp + Instagram. AI tags leads, schedules follow-ups, and tracks deals to “paid”. Built for creators and modern businesses.',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://leadsbox.app',
  image: '/leadboxlogo.webp',
};

function useDocumentMeta(meta: typeof META) {
  useEffect(() => {
    document.title = meta.title;
    const upsert = (name: string, content: string) => {
      const el = document.querySelector(`meta[name="${name}"]`) || document.createElement('meta');
      el.setAttribute('name', name);
      el.setAttribute('content', content);
      if (!document.head.contains(el)) document.head.appendChild(el);
    };
    const upsertProperty = (property: string, content: string) => {
      const el = document.querySelector(`meta[property="${property}"]`) || document.createElement('meta');
      el.setAttribute('property', property);
      el.setAttribute('content', content);
      if (!document.head.contains(el)) document.head.appendChild(el);
    };
    upsert('description', meta.description);
    upsertProperty('og:title', meta.title);
    upsertProperty('og:description', meta.description);
    upsertProperty('og:type', 'website');
    upsertProperty('og:url', meta.url);
    upsertProperty('og:image', meta.image);
    upsert('twitter:card', 'summary_large_image');
    upsert('twitter:title', meta.title);
    upsert('twitter:description', meta.description);
    upsert('twitter:image', meta.image);

    // JSON-LD
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'LeadsBox',
      applicationCategory: 'BusinessApplication',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      publisher: { '@type': 'Organization', name: 'LeadsBox' },
      url: meta.url,
      description: meta.description,
    };
    const scriptId = 'seo-jsonld';
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.text = JSON.stringify(jsonLd);
  }, [meta]);
}

function useEmailCapture() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [role, setRole] = useState<'business' | 'creator' | ''>('');
  const [handle, setHandle] = useState('');

  const submit = async () => {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setState('error');
      return;
    }
    setState('loading');
    await new Promise((r) => setTimeout(r, 800));
    setState('ok');
  };

  return { email, setEmail, role, setRole, handle, setHandle, state, submit };
}

const WaitlistDialog = lazy(() => import('./landing/WaitlistDialog'));
const DemoDialog = lazy(() => import('./landing/DemoDialog'));

const cx = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' ');

type LpButtonProps = DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> & {
  variant?: 'solid' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
};

const buttonSize: Record<NonNullable<LpButtonProps['size']>, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-6 text-base',
};

const buttonVariant: Record<NonNullable<LpButtonProps['variant']>, string> = {
  solid: 'bg-primary text-primary-foreground hover:bg-primary/90',
  ghost: 'bg-transparent hover:bg-muted text-muted-foreground',
  outline: 'border border-border bg-transparent text-foreground hover:bg-muted',
};

const buttonBase =
  'inline-flex items-center justify-center rounded-md font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-60 disabled:pointer-events-none';

const buildButtonClass = (variant: NonNullable<LpButtonProps['variant']>, size: NonNullable<LpButtonProps['size']>, className?: string) =>
  cx(buttonBase, buttonSize[size], buttonVariant[variant], className);

const LpButton = ({ className, variant = 'solid', size = 'md', ...props }: LpButtonProps) => (
  <button className={buildButtonClass(variant, size, className)} {...props} />
);

type LpLinkButtonProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: LpButtonProps['variant'];
  size?: LpButtonProps['size'];
};

const LpLinkButton = ({ className, variant = 'solid', size = 'md', ...props }: LpLinkButtonProps) => (
  <a className={buildButtonClass(variant, size, className)} {...props} />
);

type LpInputProps = DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>;
const LpInput = ({ className, ...props }: LpInputProps) => (
  <input
    className={cx(
      'flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm transition placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
      className
    )}
    {...props}
  />
);

const LpBadge = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span
    className={cx(
      'inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground',
      className
    )}
    {...props}
  />
);

const LpCard = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cx('rounded-xl border border-border bg-card shadow-sm', className)} {...props} />
);

const LpCardContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div className={cx('p-6', className)} {...props} />;

const Index = () => {
  useDocumentMeta(META);
  const { email, setEmail, role, setRole, handle, setHandle, state, submit } = useEmailCapture();
  const { resolvedTheme, setTheme } = useTheme();
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const ThemeIcon = useMemo(() => (resolvedTheme === 'dark' ? Sun : Moon), [resolvedTheme]);
  const logoSrc = '/leadsboxlogo.svg';
  const LogoImage = ({ priority = false, className }: { priority?: boolean; className?: string }) => (
    <img
      src={logoSrc}
      alt='LeadsBox Logo'
      width={24}
      height={24}
      className={className ?? 'h-full w-full object-contain'}
      decoding='async'
      fetchPriority={priority ? 'high' : undefined}
      loading={priority ? 'eager' : 'lazy'}
    />
  );

  return (
    <div className='min-h-screen w-full bg-background text-foreground'>
      {waitlistOpen && (
        <Suspense fallback={null}>
          <WaitlistDialog
            open={waitlistOpen}
            onOpenChange={setWaitlistOpen}
            email={email}
            onEmailChange={setEmail}
            role={role}
            onRoleChange={setRole}
            handle={handle}
            onHandleChange={setHandle}
            state={state}
            onSubmit={submit}
          />
        </Suspense>
      )}
      {demoOpen && (
        <Suspense fallback={null}>
          <DemoDialog open={demoOpen} onOpenChange={setDemoOpen} />
        </Suspense>
      )}
      {/* Navigation */}
      <header className='sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md'>
        <div className='container mx-auto flex h-16 items-center justify-between px-4'>
          <a href='/' className='flex items-center gap-3 transition-transform hover:scale-105'>
            <div className='w-8 h-8 bg-white p-1 rounded-sm flex items-center justify-center'>
              <LogoImage priority />
            </div>
            <span className='text-xl font-semibold'>LeadsBox</span>
          </a>

          <nav className='hidden md:flex items-center gap-6'>
            <a href='#product' className='text-muted-foreground hover:text-primary transition-colors'>
              Product
            </a>
            <a href='#how-it-works' className='text-muted-foreground hover:text-primary transition-colors'>
              How it Works
            </a>
            <a href='#pricing' className='text-muted-foreground hover:text-primary transition-colors'>
              Pricing
            </a>
            <a href='#creators' className='text-muted-foreground hover:text-primary transition-colors'>
              For Creators
            </a>
          </nav>

          <div className='flex items-center gap-2 sm:gap-3'>
            <LpButton
              variant='ghost'
              size='sm'
              aria-label='Toggle theme'
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className='h-9 w-9 p-0 rounded-full'
            >
              <ThemeIcon className='h-4 w-4' />
            </LpButton>
            <LpLinkButton variant='ghost' size='sm' href='/login' className='px-2'>
              Login
            </LpLinkButton>
            <LpButton size='sm' data-cta='nav_join_waitlist' onClick={() => setWaitlistOpen(true)}>
              Join Waitlist
            </LpButton>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className='container mx-auto px-4 py-16' id='product'>
        <div className='grid lg:grid-cols-12 gap-12 items-center'>
          <div className='lg:col-span-6 space-y-8'>
            <div className='space-y-6 animate-slide-in-left'>
              <div className='-mt-4'>
                <Badge variant='secondary' className='flex w-fit items-center gap-2'>
                  <WhatsAppIcon className='h-4 w-4' />
                  <span>&</span>
                  <TelegramIcon className='h-4 w-4' />
                  <span>Chat-commerce integration now live →</span>
                </Badge>
              </div>
              <h1 className='text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight'>Turn social DMs into revenue.</h1>
              <p className='text-lg text-muted-foreground max-w-xl'>
                One inbox for WhatsApp + Instagram with AI that tags, follows up, and nudges deals to paid.
              </p>
            </div>

            <div className='space-y-4' id='waitlist'>
              <div className='flex flex-col sm:flex-row gap-3'>
                <Button className='w-full sm:w-auto' size='lg' onClick={() => setWaitlistOpen(true)} data-cta='hero_join_waitlist'>
                  Join the Waitlist
                </Button>
                <Button variant='outline' size='lg' className='w-full sm:w-auto' data-cta='hero_demo' onClick={() => setDemoOpen(true)}>
                  See a 60-sec Demo
                </Button>
              </div>
              {/* Social proof stripe */}
              <div className='flex items-center gap-3 text-sm text-muted-foreground'>
                <div className='flex -space-x-2'>
                  {['A', 'J', 'S', 'M', 'P'].map((ch, i) => (
                    <div
                      key={i}
                      className='h-6 w-6 rounded-full border border-border bg-gradient-to-br from-primary/50 to-accent/50 text-[10px] font-bold text-foreground flex items-center justify-center'
                      aria-hidden
                    >
                      {ch}
                    </div>
                  ))}
                </div>
                <span>2,000+ conversations organized last month</span>
              </div>
            </div>

            <Badge variant='outline' className='w-fit'>
              Reply faster • Never miss a lead • Know what works
            </Badge>
          </div>

          {/* Product Demo */}
          <div className='lg:col-span-6'>
            <LpCard className='relative overflow-hidden animate-slide-in-right'>
              <div className='absolute inset-0 bg-gradient-primary opacity-5' />
              <LpCardContent className='p-0'>
                {/* Chat Header */}
                <div className='flex items-center gap-3 p-4 border-b border-border bg-muted/50'>
                  <div className='w-8 h-8 bg-white p-1 rounded-sm flex items-center justify-center'>
                    <LogoImage />
                  </div>
                  <div>
                    <div className='font-medium'>LeadsBox Bot</div>
                    <div className='text-xs text-muted-foreground'>WhatsApp • Online</div>
                  </div>
                </div>

                {/* Chat Messages */}
                <div className='p-4 space-y-3 bg-background/50'>
                  <div className='max-w-[80%] rounded-lg bg-muted px-4 py-2 text-sm'>New DM: “Is the Pro Plan still available?”</div>
                  <div className='max-w-[80%] ml-auto rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground'>
                    Tag: High intent • Add follow‑up
                  </div>
                  <div className='max-w-[80%] rounded-lg bg-muted px-4 py-2 text-sm'>Auto‑follow‑up scheduled for tomorrow 9:00am ✅</div>
                  <div className='max-w-[80%] ml-auto rounded-lg bg-accent px-4 py-2 text-sm text-accent-foreground'>
                    Move to “Qualified → Demo scheduled”
                  </div>
                </div>

                {/* Chat Input */}
                <div className='p-4 border-t border-border bg-background/80'>
                  <div className='flex gap-2'>
                    <LpInput placeholder='Type a message...' className='flex-1' />
                    <LpButton size='sm'>Send</LpButton>
                  </div>
                </div>
              </LpCardContent>
            </LpCard>
            <p className='mt-4 text-xs text-muted-foreground text-center'>Live demo of WhatsApp integration</p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className='container mx-auto px-4 py-16 bg-muted/30'>
        <div className='grid lg:grid-cols-3 gap-6'>
          {[
            {
              quote: 'We closed 27% more deals just by following up on-time. The AI tags are scarily accurate.',
              name: 'Ada — Founder, DMM Studio',
            },
            {
              quote: 'Everything in one place. Our team moves leads from chat to paid with zero chaos.',
              name: 'Moyo — COO, GrowthCraft',
            },
            {
              quote: 'The first tool that actually understands how we sell over DMs.',
              name: 'Chidi — Creator, 120k followers',
            },
          ].map((t, i) => (
            <LpCard key={i} className='h-full'>
              <LpCardContent className='p-6 space-y-3'>
                <p className='text-sm leading-relaxed'>“{t.quote}”</p>
                <p className='text-xs text-muted-foreground'>{t.name}</p>
              </LpCardContent>
            </LpCard>
          ))}
        </div>
      </section>

      {/* Businesses vs Creators */}
      <section id='creators' className='container mx-auto px-4 py-16'>
        <div className='grid lg:grid-cols-2 gap-6'>
          <LpCard>
            <LpCardContent className='p-6 space-y-3'>
              <LpBadge className='bg-muted text-foreground'>For Businesses</LpBadge>
              <h2 className='text-2xl font-semibold'>Never miss money in the DMs</h2>
              <p className='text-muted-foreground'>Reply faster, keep context, and track chats to “paid”.</p>
              <div className='flex gap-3 pt-2'>
                <LpButton onClick={() => setWaitlistOpen(true)} data-cta='business_join'>
                  Join as Business
                </LpButton>
                <LpLinkButton variant='outline' href='/dashboard'>
                  Try Dashboard
                </LpLinkButton>
              </div>
            </LpCardContent>
          </LpCard>
          <LpCard>
            <LpCardContent className='p-6 space-y-3'>
              <LpBadge className='bg-muted text-foreground'>For Creators</LpBadge>
              <h2 className='text-2xl font-semibold'>Earn on referrals, get a VIP inbox</h2>
              <p className='text-muted-foreground'>Partner with LeadsBox brands and own your upside.</p>
              <div className='flex gap-3 pt-2'>
                <LpButton variant='outline' onClick={() => setWaitlistOpen(true)} data-cta='creator_join'>
                  Join as Creator
                </LpButton>
                <LpLinkButton href='#waitlist'>Get Early Access</LpLinkButton>
              </div>
            </LpCardContent>
          </LpCard>
        </div>
      </section>

      {/* Integrations */}
      <section className='container mx-auto px-4 py-12'>
        <div className='flex flex-col items-center gap-4 text-center'>
          <p className='text-sm text-muted-foreground'>Works with your channels</p>
          <div className='flex flex-wrap items-center justify-center gap-3'>
            <LpBadge className='flex items-center gap-2'>
              <WhatsAppIcon className='h-4 w-4' /> WhatsApp Business
            </LpBadge>
            <LpBadge className='flex items-center gap-2'>
              <TelegramIcon className='h-4 w-4' /> Telegram
            </LpBadge>
            <LpBadge className='flex items-center gap-2 opacity-80 bg-muted text-muted-foreground'>
              <InstagramIcon className='h-4 w-4' /> Instagram • Coming soon
            </LpBadge>
            <LpBadge className='flex items-center gap-2 opacity-80 bg-muted text-muted-foreground'>
              <FacebookIcon className='h-4 w-4' /> Facebook • Coming soon
            </LpBadge>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id='features' className='container mx-auto px-4 py-16 bg-muted/30'>
        <div className='text-center space-y-4 mb-12'>
          <h2 className='text-3xl font-bold'>Built for chat‑commerce</h2>
          <p className='text-muted-foreground max-w-2xl mx-auto'>Invoice where the conversation happens. Stop copying & pasting. Start cashing in.</p>
        </div>

        <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
          {[
            { title: 'Unified Inbox', desc: 'One place for WhatsApp + Instagram. See context, not chaos.', icon: '📥' },
            { title: 'AI Lead Tagging', desc: 'Auto‑detect intent and prioritize hot leads instantly.', icon: '🤖' },
            { title: 'Smart Follow‑ups', desc: 'Schedule nudges that feel human and convert more.', icon: '🔔' },
            { title: 'Pipeline Stages', desc: 'Move chats from “new” to “paid” with clarity.', icon: '🧭' },
            { title: 'Essential Analytics', desc: 'Know what responses drive revenue. Track time to close.', icon: '📊' },
            { title: 'Team Ready', desc: 'Assign owners, mention teammates, never drop a lead.', icon: '👥' },
          ].map((feature, i) => (
            <LpCard key={i} className='group hover:shadow-lg transition-all duration-300 hover:-translate-y-1'>
              <LpCardContent className='p-6'>
                <div className='flex items-start gap-4'>
                  <div className='text-2xl'>{feature.icon}</div>
                  <div>
                    <h3 className='font-semibold mb-2 group-hover:text-primary transition-colors'>{feature.title}</h3>
                    <p className='text-sm text-muted-foreground'>{feature.desc}</p>
                  </div>
                </div>
              </LpCardContent>
            </LpCard>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id='how-it-works' className='container mx-auto px-4 py-16'>
        <div className='text-center space-y-4 mb-12'>
          <h2 className='text-3xl font-bold'>How it works</h2>
        </div>

        <div className='grid md:grid-cols-3 gap-8'>
          {[
            { step: '1', title: 'Connect', desc: 'Secure setup — connect WhatsApp Business & Instagram in minutes.' },
            { step: '2', title: 'Organize', desc: 'AI tags intent, auto‑assigns owners, and creates follow‑ups.' },
            { step: '3', title: 'Convert', desc: 'Pipeline + nudges move conversations toward “paid”.' },
          ].map((step, i) => (
            <div key={i} className='relative text-center group'>
              <div className='absolute -top-4 left-1/2 -translate-x-1/2'>
                <Badge className='bg-primary text-primary-foreground px-3 py-1'>Step {step.step}</Badge>
              </div>
              <Card className='pt-8 group-hover:shadow-lg transition-all duration-300'>
                <CardContent className='p-6'>
                  <h3 className='text-xl font-semibold mb-3'>{step.title}</h3>
                  <p className='text-muted-foreground'>{step.desc}</p>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id='pricing' className='container mx-auto px-4 py-16 bg-muted/30'>
        <div className='max-w-6xl mx-auto grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
          {[
            {
              name: 'Starter',
              badgeVariant: 'secondary' as const,
              price: '₦0',
              subtitle: '/ month',
              features: ['Unified inbox', 'AI tagging (starter)', 'Basic pipeline', 'Simple analytics'],
              ctaVariant: 'default' as const,
              blurb: 'Get your team onboarded in minutes.',
              ctaEvent: 'pricing_starter',
            },
            {
              name: 'Pro',
              badgeVariant: 'default' as const,
              price: '₦4,500',
              subtitle: '/ month',
              features: ['Everything in Starter', 'Advanced AI follow-ups', 'Team assignments', 'Detailed analytics'],
              ctaVariant: 'outline' as const,
              blurb: 'Influencer partners get special rev-share.',
              ctaEvent: 'pricing_pro',
            },
            {
              name: 'Enterprise',
              badgeVariant: 'default' as const,
              price: '₦10,000',
              subtitle: '/ month',
              features: ['Unlimited seats & workspaces', 'Custom integrations & SLAs', 'Dedicated success manager', 'Advanced security & reporting'],
              ctaVariant: 'outline' as const,
              blurb: 'Tailored for high-volume teams that need white-glove support.',
              ctaEvent: 'pricing_enterprise',
            },
          ].map((plan) => (
            <Card key={plan.name} className={plan.name === 'Pro' ? 'border-primary/30' : undefined}>
              <CardContent className='p-6 space-y-4'>
                <Badge variant={plan.badgeVariant}>{plan.name}</Badge>
                <div className='flex items-baseline gap-2'>
                  <span className='text-4xl font-bold'>{plan.price}</span>
                  <span className='text-muted-foreground'>{plan.subtitle}</span>
                </div>
                <ul className='space-y-2 text-sm'>
                  {plan.features.map((feature) => (
                    <li key={feature} className='flex items-center gap-2'>
                      <CheckIcon className='h-4 w-4 text-success' /> {feature}
                    </li>
                  ))}
                </ul>
                <Button variant={plan.ctaVariant} className='w-full' onClick={() => setWaitlistOpen(true)} data-cta={plan.ctaEvent}>
                  Lock Early Access
                </Button>
                <p className='text-xs text-muted-foreground'>{plan.blurb}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className='container mx-auto px-4 py-16'>
        <div className='max-w-3xl mx-auto'>
          <h2 className='text-3xl font-bold mb-6'>FAQ</h2>
          <div className='divide-y'>
            {[
              ['Is my data secure?', 'Yes. We use industry‑standard encryption and never sell your data.'],
              ['How long to onboard?', 'Minutes. Connect channels and start organizing conversations.'],
              ['Which channels are supported?', 'WhatsApp and Instagram today. Telegram and Facebook soon.'],
              ['Does AI send messages for me?', 'You control it. Create friendly nudges and reminders that feel human.'],
              ['How does early access pricing work?', 'Lock in discounts now. We’ll honor them when we launch billing.'],
              ['Can creators partner with LeadsBox?', 'Yes. Join the waitlist and we’ll send partner details.'],
            ].map(([q, a], i) => (
              <details key={i} className='group py-4'>
                <summary className='cursor-pointer list-none font-medium flex items-center justify-between'>
                  <span>{q}</span>
                  <span className='text-muted-foreground group-open:rotate-180 transition-transform'>⌄</span>
                </summary>
                <p className='mt-2 text-sm text-muted-foreground'>{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className='container mx-auto px-4 pb-16' id='waitlist-cta'>
        <LpCard className='max-w-3xl mx-auto'>
          <LpCardContent className='p-6 space-y-4'>
            <h2 className='text-2xl font-semibold'>Ready to turn DMs into revenue?</h2>
            <div className='flex flex-col sm:flex-row gap-3'>
              <LpInput
                type='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder='you@business.com'
                className='flex-1'
                onKeyPress={(e) => e.key === 'Enter' && submit()}
              />
              <LpButton onClick={submit} disabled={state === 'loading'} className='transition-all hover:scale-105' data-cta='footer_join_waitlist'>
                {state === 'loading' ? 'Joining…' : state === 'ok' ? "You're in! ✓" : 'Join Waitlist'}
              </LpButton>
            </div>
            {state === 'error' && <p className='text-sm text-destructive'>Please enter a valid email address</p>}
            <p className='text-sm text-muted-foreground'>No spam. We’ll email you when your workspace is ready.</p>
          </LpCardContent>
        </LpCard>
      </section>

      {/* Footer */}
      <footer className='border-t border-border bg-muted/50'>
        <div className='container mx-auto px-4 py-12'>
          <div className='flex flex-col md:flex-row items-center justify-between gap-6'>
            <div className='flex items-center gap-3'>
              <div className='w-8 h-8 bg-white p-1 rounded-sm flex items-center justify-center'>
                <LogoImage />
              </div>
              <span className='font-semibold'>LeadsBox</span>
              <span className='text-muted-foreground'>© {new Date().getFullYear()}</span>
            </div>

            <nav className='flex flex-wrap items-center gap-6 text-sm'>
              <a href='#features' className='text-muted-foreground hover:text-primary transition-colors'>
                Features
              </a>
              <a href='#how-it-works' className='text-muted-foreground hover:text-primary transition-colors'>
                How it works
              </a>
              <a href='#pricing' className='text-muted-foreground hover:text-primary transition-colors'>
                Pricing
              </a>
              <a href='/dashboard' className='text-muted-foreground hover:text-primary transition-colors'>
                Dashboard
              </a>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
