import React, { Suspense, lazy, useEffect, useMemo, useState, useRef } from 'react';
import {
  Moon,
  Sun,
  Check,
  Star,
  Zap,
  MessageCircle,
  Users,
  BarChart3,
  Shield,
  Globe,
  Clock,
  Play,
  ArrowRight,
  Menu,
  X,
  LayoutDashboard,
  Search,
  Briefcase,
  ListTodo,
  FileText,
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { WhatsAppIcon, TelegramIcon, InstagramIcon, FacebookIcon } from '@/components/brand-icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { motion, AnimatePresence, useInView, useMotionValue, useSpring } from 'framer-motion';
import CookieConsent from '@/components/CookieConsent';

/**
 * LeadsBox — LeadsBox Clone Redesign
 * Font: Manrope
 * Style: Clean, Rounded, Centered, Blue Accent
 */

const META = {
  title: 'LeadsBox — The WhatsApp-First CRM for Growing Businesses',
  description:
    'Multi-channel inbox for WhatsApp, Instagram & Telegram. AI-powered sales detection, invoice generation, and team collaboration. Join 1,000+ businesses worldwide.',
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

function usePartialTypewriter(staticText: string, endings: string[], typingSpeed = 100, deletingSpeed = 50, pauseTime = 2000) {
  const [displayEnding, setDisplayEnding] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const currentEnding = endings[currentIndex];

    if (isPaused) {
      const pauseTimeout = setTimeout(() => {
        setIsPaused(false);
        setIsDeleting(true);
      }, pauseTime);
      return () => clearTimeout(pauseTimeout);
    }

    if (isDeleting) {
      if (displayEnding === '') {
        setIsDeleting(false);
        setCurrentIndex((prev) => (prev + 1) % endings.length);
        return;
      }
      const timeout = setTimeout(() => {
        setDisplayEnding(currentEnding.substring(0, displayEnding.length - 1));
      }, deletingSpeed);
      return () => clearTimeout(timeout);
    } else {
      if (displayEnding === currentEnding) {
        setIsPaused(true);
        return;
      }
      const timeout = setTimeout(() => {
        setDisplayEnding(currentEnding.substring(0, displayEnding.length + 1));
      }, typingSpeed);
      return () => clearTimeout(timeout);
    }
  }, [displayEnding, currentIndex, isDeleting, isPaused, endings, typingSpeed, deletingSpeed, pauseTime]);

  return { staticText, displayEnding };
}

const WaitlistDialog = lazy(() => import('./landing/WaitlistDialog'));
const DemoDialog = lazy(() => import('./landing/DemoDialog'));
import PricingSection from '@/components/landing/PricingSection';
import ReferralBanner from '@/components/landing/ReferralBanner';
import ScaleSection from '@/components/landing/ScaleSection';

const Index = () => {
  useDocumentMeta(META);
  const { email, setEmail, role, setRole, handle, setHandle, state, submit } = useEmailCapture();
  const { resolvedTheme, setTheme } = useTheme();
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const ThemeIcon = useMemo(() => (resolvedTheme === 'dark' ? Sun : Moon), [resolvedTheme]);

  const staticHeadline = 'Turn WhatsApp Conversations Into';
  const rotatingEndings = ['Revenue', 'Invoices', 'Closed Deals', 'Happy Customers'];
  const { staticText, displayEnding } = usePartialTypewriter(staticHeadline, rotatingEndings, 80, 40, 2500);

  const logoSrc = '/leadsboxlogo.svg';
  const LogoImage = ({ className }: { className?: string }) => <img src={logoSrc} alt='LeadsBox Logo' className={className} />;

  return (
    <div className='min-h-screen w-full bg-background text-foreground overflow-x-hidden font-sans selection:bg-primary/20 selection:text-primary'>
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

      {/* Navigation (LeadsBox Style: Minimal, Rounded) */}
      <header className='fixed top-0 left-0 right-0 z-50 px-4 pt-4'>
        <div className='container mx-auto max-w-6xl'>
          <nav className='bg-background/80 backdrop-blur-xl border border-border/50 rounded-full px-6 h-16 flex items-center justify-between shadow-sm'>
            <a href='/' className='flex items-center gap-2 font-bold text-xl tracking-tight'>
              <div className='w-8 h-8 bg-white p-1 rounded-sm flex items-center justify-center shadow-sm border border-border/10'>
                <LogoImage className='w-full h-full object-contain' />
              </div>
              LeadsBox
            </a>

            <div className='hidden md:flex items-center gap-8'>
              {['Features', 'Integrations', 'Pricing', 'Blog'].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className='text-sm font-medium text-muted-foreground hover:text-foreground transition-colors'
                >
                  {item}
                </a>
              ))}
            </div>

            <div className='flex items-center gap-3'>
              <Button
                variant='ghost'
                size='icon'
                onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                className='rounded-full hover:bg-muted hidden sm:flex'
              >
                <ThemeIcon className='h-4 w-4' />
              </Button>
              <Button variant='ghost' onClick={() => (window.location.href = '/login')} className='font-medium hidden sm:flex rounded-full'>
                Log in
              </Button>
              <Button
                onClick={() => setWaitlistOpen(true)}
                className='bg-primary hover:bg-primary-hover text-white rounded-full px-6 font-semibold shadow-lg shadow-primary/20 transition-all hover:scale-105'
              >
                Get Started
              </Button>
              <Button variant='ghost' size='icon' className='md:hidden' onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X className='w-5 h-5' /> : <Menu className='w-5 h-5' />}
              </Button>
            </div>
          </nav>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className='fixed inset-x-4 top-24 z-40 bg-card border border-border rounded-2xl p-4 shadow-2xl md:hidden'
          >
            <nav className='flex flex-col gap-4'>
              {['Features', 'Integrations', 'Pricing', 'Blog'].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className='text-lg font-medium p-2 hover:bg-muted rounded-lg'
                >
                  {item}
                </a>
              ))}
              <div className='h-px bg-border my-2' />
              <Button variant='ghost' onClick={() => (window.location.href = '/login')} className='justify-start'>
                Log in
              </Button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section (LeadsBox Style: Centered, Bold, Pill Badge) */}
      <section className='pt-24 pb-20 md:pt-32 md:pb-32 px-4 relative overflow-hidden'>
        {/* Background Blobs */}
        <div className='absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-primary/5 to-transparent rounded-[100%] blur-3xl -z-10 pointer-events-none' />

        <div className='container mx-auto max-w-5xl text-center relative z-10'>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className='inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-border shadow-sm mb-8 hover:scale-105 transition-transform cursor-pointer dark:bg-white/10'>
              <span className='flex h-2 w-2 rounded-full bg-green-500 animate-pulse' />
              <span className='text-sm font-medium text-muted-foreground'>Join 1,000+ Businesses in 50+ Countries</span>
              <ArrowRight className='w-3 h-3 text-muted-foreground ml-1' />
            </div>

            <h1 className='text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-8 text-foreground min-h-[8rem] md:min-h-[10rem] flex flex-col items-center justify-center'>
              <span className='text-foreground text-center'>{staticText}</span>
              <span className='text-primary text-center'>
                {displayEnding}
                <span className='animate-pulse ml-1'>|</span>
              </span>
            </h1>

            <p className='text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed px-4'>
              Manage WhatsApp, Instagram, and Telegram conversations in one powerful inbox. AI-powered sales detection and invoice generation
              included.
            </p>

            <div className='flex flex-col sm:flex-row gap-4 justify-center items-center mb-8'>
              <Button
                size='lg'
                onClick={() => setWaitlistOpen(true)}
                className='h-14 px-8 text-lg rounded-full bg-primary hover:bg-primary-hover text-white shadow-xl shadow-primary/25 transition-all hover:scale-105 font-bold'
              >
                Start for free
              </Button>
              <Button
                variant='secondary'
                size='lg'
                onClick={() => setDemoOpen(true)}
                className='h-14 px-8 text-lg rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 font-bold gap-2'
              >
                <Play className='w-4 h-4 fill-current' /> Watch Demo
              </Button>
            </div>

            <div className='flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground mb-16 font-medium'>
              <div className='flex items-center gap-1.5'>
                <Check className='w-4 h-4 text-primary' />
                <span>No credit card required</span>
              </div>
              <div className='flex items-center gap-1.5'>
                <Check className='w-4 h-4 text-primary' />
                <span>14-day free trial</span>
              </div>
              <div className='flex items-center gap-1.5'>
                <Check className='w-4 h-4 text-primary' />
                <span>Cancel anytime</span>
              </div>
            </div>

            {/* Hero Visual: Dashboard Screenshot */}
            <motion.div
              className='relative max-w-5xl mx-auto mt-12'
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <img
                src='https://leadsboxapp.s3.us-east-1.amazonaws.com/leadsbox_dashboard.png'
                alt='LeadsBox Dashboard Preview'
                className='w-full h-auto rounded-2xl shadow-2xl border border-border'
                loading='eager'
              />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Problem Statement + Stats */}
      <section className='py-24 bg-muted/30 border-y border-border'>
        <div className='container mx-auto px-4 max-w-6xl'>
          <div className='text-center mb-16'>
            <div className='inline-block bg-primary/5 border border-primary/10 rounded-full px-6 py-2 mb-6'>
              <span className='text-sm font-medium text-primary'>The Problem</span>
            </div>
            <h2 className='text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-6 max-w-4xl mx-auto'>
              <span className='text-primary'>73%</span> of customers prefer messaging businesses on WhatsApp*
            </h2>
            <p className='text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-8'>
              But managing conversations across WhatsApp, Instagram, and Telegram is chaos. Meet{' '}
              <span className='font-semibold text-foreground'>LeadsBox</span>.
            </p>
            <div className='grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-12'>
              <div className='bg-background border border-border rounded-2xl p-6 text-center hover:shadow-lg transition-shadow'>
                <div className='w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4'>
                  <MessageCircle className='w-6 h-6 text-red-600 dark:text-red-400' />
                </div>
                <h3 className='font-bold text-lg mb-2'>Lost Messages</h3>
                <p className='text-sm text-muted-foreground'>Customers slipping through notification hell</p>
              </div>
              <div className='bg-background border border-border rounded-2xl p-6 text-center hover:shadow-lg transition-shadow'>
                <div className='w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center mx-auto mb-4'>
                  <Clock className='w-6 h-6 text-yellow-600 dark:text-yellow-400' />
                </div>
                <h3 className='font-bold text-lg mb-2'>Manual Work</h3>
                <p className='text-sm text-muted-foreground'>Hours wasted creating invoices manually</p>
              </div>
              <div className='bg-background border border-border rounded-2xl p-6 text-center hover:shadow-lg transition-shadow'>
                <div className='w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mx-auto mb-4'>
                  <Users className='w-6 h-6 text-blue-600 dark:text-blue-400' />
                </div>
                <h3 className='font-bold text-lg mb-2'>Team Chaos</h3>
                <p className='text-sm text-muted-foreground'>No way to collaborate or assign leads</p>
              </div>
            </div>
            <p className='text-xs text-muted-foreground mt-8'>*Source: Meta Business Messaging Report 2024</p>
          </div>
        </div>
      </section>

      {/* Features Overview */}
      <section className='py-24 bg-background border-b border-border'>
        <div className='container mx-auto px-4 max-w-6xl'>
          <div className='text-center mb-16'>
            <div className='inline-block bg-primary/5 border border-primary/10 rounded-full px-6 py-2 mb-6'>
              <span className='text-sm font-medium text-primary'>Everything You Need</span>
            </div>
            <h2 className='text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-6'>Powerful Features for Modern Businesses</h2>
          </div>

          <div className='grid md:grid-cols-2 gap-8 max-w-5xl mx-auto'>
            <div className='bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 border border-green-200 dark:border-green-800 rounded-2xl p-8 hover:shadow-xl transition-shadow'>
              <div className='w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center mb-4'>
                <MessageCircle className='w-6 h-6 text-white' />
              </div>
              <h3 className='text-xl font-bold mb-3'>Multi-Channel Inbox</h3>
              <p className='text-muted-foreground mb-4'>WhatsApp, Instagram, Telegram, and more—all in one unified inbox</p>
              <div className='flex gap-2'>
                <WhatsAppIcon className='w-5 h-5 text-green-600' />
                <InstagramIcon className='w-5 h-5 text-pink-600' />
                <TelegramIcon className='w-5 h-5 text-blue-600' />
              </div>
            </div>

            <div className='bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/10 dark:to-indigo-900/10 border border-purple-200 dark:border-purple-800 rounded-2xl p-8 hover:shadow-xl transition-shadow'>
              <div className='w-12 h-12 rounded-xl bg-purple-500 flex items-center justify-center mb-4'>
                <Zap className='w-6 h-6 text-white' />
              </div>
              <h3 className='text-xl font-bold mb-3'>AI-Powered Sales Detection</h3>
              <p className='text-muted-foreground mb-4'>Automatically detect sales opportunities and generate invoices from conversations</p>
              <Badge className='bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'>Powered by GPT-4</Badge>
            </div>

            <div className='bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/10 dark:to-cyan-900/10 border border-blue-200 dark:border-blue-800 rounded-2xl p-8 hover:shadow-xl transition-shadow'>
              <div className='w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center mb-4'>
                <Users className='w-6 h-6 text-white' />
              </div>
              <h3 className='text-xl font-bold mb-3'>Team Collaboration</h3>
              <p className='text-muted-foreground mb-4'>Assign leads, add notes, and collaborate with your team in real-time</p>
            </div>

            <div className='bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-8 hover:shadow-xl transition-shadow'>
              <div className='w-12 h-12 rounded-xl bg-yellow-500 flex items-center justify-center mb-4'>
                <BarChart3 className='w-6 h-6 text-white' />
              </div>
              <h3 className='text-xl font-bold mb-3'>Analytics & Insights</h3>
              <p className='text-muted-foreground mb-4'>Track response times, conversion rates, and revenue—all in one dashboard</p>
            </div>
          </div>

          <div className='text-center mt-12'>
            <div className='inline-flex flex-wrap justify-center gap-3 text-sm text-muted-foreground'>
              <div className='flex items-center gap-2'>
                <Check className='w-4 h-4 text-primary' />
                <span>Payment Integration (Stripe, Paystack)</span>
              </div>
              <div className='flex items-center gap-2'>
                <Check className='w-4 h-4 text-primary' />
                <span>Automated Workflows</span>
              </div>
              <div className='flex items-center gap-2'>
                <Check className='w-4 h-4 text-primary' />
                <span>Mobile Apps Coming Soon</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted Brands (Static Grid) - TODO: Re-enable when we have actual users */}
      {/* <section className='py-20 bg-background border-b border-border'>
        <div className='container mx-auto px-4 max-w-6xl'>
          <div className='text-center mb-12'>
            <h3 className='text-xl font-medium text-foreground'>Trusted by Businesses Worldwide</h3>
          </div>

          <div className='grid grid-cols-2 md:grid-cols-4 border-t border-l border-border'>
            {[
              {
                name: 'Partner 1',
                url: 'https://cdn.prod.website-files.com/68a2a7fda7681f6518b88f0b/68a2d5bcccfcae2e34dfce13_30ad823d9fe87fd63c72198887a68bce_partner-logo-1.svg',
              },
              {
                name: 'Partner 2',
                url: 'https://cdn.prod.website-files.com/68a2a7fda7681f6518b88f0b/68a2d5bcccfcae2e34dfce16_8400bd188f97d212628b3ef62349192b_partner-logo-2.svg',
              },
              {
                name: 'Partner 3',
                url: 'https://cdn.prod.website-files.com/68a2a7fda7681f6518b88f0b/68a2d5bcccfcae2e34dfce14_d80fbf6ac51503d81301cd47d47dc3c4_partner-logo-3.svg',
              },
              {
                name: 'Partner 4',
                url: 'https://cdn.prod.website-files.com/68a2a7fda7681f6518b88f0b/68a2d5bcccfcae2e34dfce15_f0bf5458ea5bd05b4e1c508a9302dc27_partner-logo-4.svg',
              },
              { name: 'Company 8', url: 'https://cdn.prod.website-files.com/68a2a7fda7681f6518b88f0b/68a58fed4ebe82f3801dafd5_company-logo-8.svg' },
              { name: 'Company 7', url: 'https://cdn.prod.website-files.com/68a2a7fda7681f6518b88f0b/68a58fed107533572d97a23e_company-logo-7.svg' },
              { name: 'Company 1', url: 'https://cdn.prod.website-files.com/68a2a7fda7681f6518b88f0b/68a3187467a414c0209f58dd_company-logo-1.svg' },
              {
                name: 'Partner 1',
                url: 'https://cdn.prod.website-files.com/68a2a7fda7681f6518b88f0b/68a2d5bcccfcae2e34dfce13_30ad823d9fe87fd63c72198887a68bce_partner-logo-1.svg',
              },
            ].map((logo, idx) => (
              <div
                key={idx}
                className='flex items-center justify-center h-32 border-r border-b border-border p-8 hover:bg-muted/30 dark:hover:bg-white/5 transition-colors group'
              >
                <img src={logo.url} alt={logo.name} className='max-w-full max-h-full object-contain transition-all duration-300' />
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* Simplify Process Section */}
      <section className='py-24 bg-background'>
        <div className='container mx-auto px-4 max-w-6xl'>
          <div className='text-center mb-16'>
            <h2 className='text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4'>Simplify complex process with LeadsBox</h2>
          </div>

          <div className='grid md:grid-cols-2 gap-8'>
            {/* Card 1: Create Account */}
            <div className='bg-muted/30 rounded-3xl p-8 text-center border border-border/50 hover:border-border transition-colors overflow-hidden relative group'>
              <div className='absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-indigo-500/10 via-purple-500/5 to-transparent opacity-50 group-hover:opacity-100 transition-opacity' />
              <div className='mb-8 relative min-h-56 w-full flex items-center justify-center'>
                <img
                  src='https://leadsboxapp.s3.us-east-1.amazonaws.com/leadsbox_signup.svg'
                  alt='Sign Up Process'
                  crossOrigin='anonymous'
                  className='w-full max-h-56 object-scale-down relative z-10'
                />
                {/* Floating Cursor: Manager */}
                <motion.div
                  className='absolute bottom-8 right-1/4 z-20 flex items-center gap-2'
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <svg
                    width='24'
                    height='24'
                    viewBox='0 0 24 24'
                    fill='none'
                    xmlns='http://www.w3.org/2000/svg'
                    className='text-yellow-400 drop-shadow-md'
                  >
                    <path
                      d='M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z'
                      fill='currentColor'
                      stroke='white'
                    />
                  </svg>
                  <span className='bg-yellow-400 text-yellow-950 text-[10px] font-bold px-2 py-1 rounded-full shadow-sm'>Manager</span>
                </motion.div>
              </div>
              <h3 className='text-xl font-bold mb-3 relative z-10'>Create Account</h3>
              <p className='text-sm text-muted-foreground leading-relaxed relative z-10'>
                Kick things off in seconds. Just sign up, set up your workspace, and you're ready to go.
              </p>
            </div>

            {/* Card 2: Invite Team */}
            <div className='bg-muted/30 rounded-3xl p-8 text-center border border-border/50 hover:border-border transition-colors overflow-hidden relative group'>
              <div className='absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-emerald-500/10 via-teal-500/5 to-transparent opacity-50 group-hover:opacity-100 transition-opacity' />
              <div className='mb-8 relative min-h-56 w-full flex items-center justify-center'>
                <img
                  src='https://leadsboxapp.s3.us-east-1.amazonaws.com/leadsbox_invite_members.svg'
                  alt='Invite Team Process'
                  crossOrigin='anonymous'
                  className='w-full max-h-56 object-scale-down relative z-10'
                />
                {/* Floating Cursor: Team Lead */}
                <motion.div
                  className='absolute bottom-12 right-1/3 z-20 flex items-center gap-2'
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                >
                  <svg
                    width='24'
                    height='24'
                    viewBox='0 0 24 24'
                    fill='none'
                    xmlns='http://www.w3.org/2000/svg'
                    className='text-emerald-400 drop-shadow-md'
                  >
                    <path
                      d='M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z'
                      fill='currentColor'
                      stroke='white'
                    />
                  </svg>
                  <span className='bg-emerald-400 text-emerald-950 text-[10px] font-bold px-2 py-1 rounded-full shadow-sm'>Team Lead</span>
                </motion.div>
              </div>
              <h3 className='text-xl font-bold mb-3 relative z-10'>Invite Team</h3>
              <p className='text-sm text-muted-foreground leading-relaxed relative z-10'>
                Bring your teammates on board instantly. Manage roles, track projects, and stay aligned without the chaos.
              </p>
            </div>

            {/* Card 3: Assign & Track */}
            <div className='md:col-span-2 bg-muted/30 rounded-3xl p-8 text-center border border-border/50 hover:border-border transition-colors overflow-hidden relative group'>
              <div className='absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-blue-500/10 via-cyan-500/5 to-transparent opacity-50 group-hover:opacity-100 transition-opacity' />
              <div className='relative z-10 mb-8'>
                <h3 className='text-xl font-bold mb-3'>Track Sales with AI from Social Commerce</h3>
                <p className='text-sm text-muted-foreground leading-relaxed max-w-lg mx-auto'>
                  Automatically detect sales opportunities from WhatsApp, Instagram, and Telegram. AI-powered tracking turns social conversations into
                  revenue insights.
                </p>
              </div>
              <div className='relative h-80 w-full max-w-5xl mx-auto flex items-center justify-center'>
                <img
                  src='https://leadsboxapp.s3.us-east-1.amazonaws.com/leadsbox_sales.png'
                  alt='Assign & Track Process'
                  crossOrigin='anonymous'
                  className='w-full h-full object-cover object-top relative z-10 rounded-xl'
                />
                {/* Floating Cursor: Sales Rep */}
                <motion.div
                  className='absolute bottom-10 right-1/3 z-20 flex items-center gap-2'
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                >
                  <svg
                    width='24'
                    height='24'
                    viewBox='0 0 24 24'
                    fill='none'
                    xmlns='http://www.w3.org/2000/svg'
                    className='text-blue-400 drop-shadow-md'
                  >
                    <path
                      d='M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z'
                      fill='currentColor'
                      stroke='white'
                    />
                  </svg>
                  <span className='bg-blue-400 text-blue-950 text-[10px] font-bold px-2 py-1 rounded-full shadow-sm'>Sales Rep</span>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Everything you need to succeed Section */}
      <SuccessSection />

      {/* Testimonials (Clean Cards) */}
      <section className='py-32 border-b border-border'>
        <div className='container mx-auto px-4 max-w-6xl'>
          <div className='text-center mb-16'>
            <h2 className='text-3xl sm:text-5xl font-bold mb-6'>Loved by founders & creators</h2>
          </div>

          <div className='grid md:grid-cols-3 gap-8'>
            {[
              {
                text: 'We went from losing 30% of WhatsApp inquiries to capturing every single one. Our sales are up 45% since using LeadsBox.',
                author: 'Priya M.',
                role: 'Fashion Store Owner, Mumbai 🇮🇳',
                bg: 'bg-blue-50 dark:bg-blue-900/10',
              },
              {
                text: 'The AI invoice generation is a game-changer. What used to take 15 minutes per order now happens automatically in seconds.',
                author: 'Carlos R.',
                role: 'E-commerce Manager, São Paulo 🇧🇷',
                bg: 'bg-purple-50 dark:bg-purple-900/10',
              },
              {
                text: "Managing Instagram DMs and WhatsApp in one place saved us 3 hours every day. Best $29/month we've ever spent.",
                author: 'Sarah K.',
                role: 'Online Boutique Owner, Lagos 🇳🇬',
                bg: 'bg-green-50 dark:bg-green-900/10',
              },
            ].map((t, i) => (
              <Card key={i} className='border-border shadow-sm hover:shadow-lg transition-all duration-300'>
                <CardContent className='p-8'>
                  <div className='flex gap-1 mb-6'>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className='w-4 h-4 fill-yellow-400 text-yellow-400' />
                    ))}
                  </div>
                  <p className='text-lg font-medium mb-8 leading-relaxed text-foreground/80'>"{t.text}"</p>
                  <div className='flex items-center gap-4'>
                    <div className='w-10 h-10 rounded-full bg-muted flex items-center justify-center font-bold text-sm border border-border'>
                      {t.author[0]}
                    </div>
                    <div>
                      <div className='font-bold text-sm'>{t.author}</div>
                      <div className='text-xs text-muted-foreground'>{t.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <WorkflowSection />

      {/* Scale Section (Features) */}
      <ScaleSection />

      {/* Pricing Section */}
      <PricingSection />

      {/* Referral Banner */}
      <ReferralBanner />

      {/* CTA Section (Centered, Minimal) */}
      <section className='py-32 bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 text-white relative overflow-hidden selection:bg-white/30 selection:text-white'>
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10" />
        <div className='container mx-auto px-4 text-center relative z-10 max-w-3xl'>
          <h2 className='text-4xl sm:text-6xl font-bold mb-8 tracking-tight'>Ready to grow?</h2>
          <p className='text-xl text-white/90 max-w-2xl mx-auto mb-12'>Get product updates, growth playbooks, and early access to new features.</p>

          <div className='flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto'>
            <div className='relative flex-1 w-full'>
              <input
                type='email'
                placeholder='name@company.com'
                className='w-full h-14 px-6 rounded-full border-2 border-transparent bg-white text-foreground focus:outline-none focus:ring-4 focus:ring-white/30 transition-all text-lg selection:bg-primary/20 selection:text-foreground'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button
              size='lg'
              onClick={submit}
              disabled={state === 'loading'}
              className='w-full sm:w-auto h-14 px-8 rounded-full text-lg font-bold bg-black text-white hover:bg-black/80 shadow-xl'
            >
              {state === 'loading' ? 'Submitting...' : 'Get Updates'}
            </Button>
          </div>
          <p className='text-sm text-white/70 mt-6'>No credit card required • Unsubscribe anytime</p>
        </div>
      </section>

      {/* Footer */}
      <footer className='bg-background py-16 border-t border-border'>
        <div className='container mx-auto px-4 max-w-6xl'>
          <div className='grid md:grid-cols-4 gap-12 mb-12'>
            <div className='col-span-1 md:col-span-1'>
              <div className='flex items-center gap-2 mb-6'>
                <div className='w-8 h-8 bg-white p-1 rounded-sm flex items-center justify-center shadow-sm border border-border/10'>
                  <LogoImage className='w-full h-full object-contain' />
                </div>
                <span className='font-bold text-xl'>LeadsBox</span>
              </div>
              <p className='text-sm text-muted-foreground leading-relaxed mb-6'>
                The all-in-one messaging platform for modern businesses. Built with ❤️ for startups.
              </p>
              <div className='flex gap-4'>
                <a href='#' className='text-muted-foreground hover:text-primary transition-colors'>
                  <InstagramIcon className='w-5 h-5' />
                </a>
                <a href='#' className='text-muted-foreground hover:text-primary transition-colors'>
                  <FacebookIcon className='w-5 h-5' />
                </a>
              </div>
            </div>

            {[
              {
                title: 'Product',
                links: [
                  { label: 'Features', href: '/#features' },
                  { label: 'Integrations', href: '/#integrations' },
                  { label: 'Pricing', href: '/#pricing' },
                  { label: 'Changelog', href: '#' },
                ],
              },
              {
                title: 'Company',
                links: [
                  { label: 'About Us', href: '/about' },
                  { label: 'Contact', href: '/contact' },
                  { label: 'System Status', href: '/status' },
                  { label: 'Careers', href: '#' },
                  { label: 'Referral Program', href: '/referral-program' },
                  { label: 'Blog', href: '#' },
                ],
              },
              {
                title: 'Legal',
                links: [
                  { label: 'Privacy Policy', href: '/privacy' },
                  { label: 'Terms of Service', href: '/terms' },
                  { label: 'Cookie Policy', href: '/cookies' },
                  { label: 'Refund Policy', href: '/refund-policy' },
                  { label: 'DPA', href: '/dpa' },
                ],
              },
            ].map((col, i) => (
              <div key={i}>
                <h4 className='font-bold mb-6 text-foreground'>{col.title}</h4>
                <ul className='space-y-3'>
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <a href={link.href} className='text-sm text-muted-foreground hover:text-primary transition-colors'>
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className='border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4'>
            <p className='text-sm text-muted-foreground'>© {new Date().getFullYear()} LeadsBox Inc. All rights reserved.</p>
            <div className='flex items-center gap-4 text-sm text-muted-foreground'>
              <a href='/privacy' className='hover:text-primary transition-colors'>
                Privacy
              </a>
              <span>•</span>
              <a href='/terms' className='hover:text-primary transition-colors'>
                Terms
              </a>
              <span>•</span>
              <a href='/cookies' className='hover:text-primary transition-colors'>
                Cookies
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Cookie Consent Banner */}
      <CookieConsent />
    </div>
  );
};

const SuccessSection = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const tabs = [
    {
      id: 'dashboard',
      label: 'Unified Inbox',
      icon: 'https://cdn.prod.website-files.com/68a2a7fda7681f6518b88f0b/68a419949a77d88d40d5b154_card-blue-icon-1.svg',
      url: 'https://cdn.prod.website-files.com/68a2a7fda7681f6518b88f0b/68a421bf367a651f79bc95dc_b06c76e3571e3d8014551abb853869ab_card-img-7.svg',
      description:
        'All your customer conversations in one place. WhatsApp, Instagram, and Telegram messages unified in a single, powerful inbox that keeps you in control.',
      cursor: { label: 'Admin', color: 'blue' },
    },
    {
      id: 'search',
      label: 'AI Sales Detection',
      icon: 'https://cdn.prod.website-files.com/68a2a7fda7681f6518b88f0b/68b2a15df2bef3c956db2852_color-logo-card-2.svg',
      url: 'https://cdn.prod.website-files.com/68a2a7fda7681f6518b88f0b/68a421bf367a651f79bc95dc_b06c76e3571e3d8014551abb853869ab_card-img-7.svg',
      description:
        'AI automatically detects sales opportunities from conversations and generates invoices instantly. Turn chats into revenue without lifting a finger.',
      cursor: { label: 'Sales', color: 'purple' },
    },
    {
      id: 'workspace',
      label: 'Team Collaboration',
      icon: 'https://cdn.prod.website-files.com/68a2a7fda7681f6518b88f0b/68b2a0d0f38b7710f7cd35c1_color-logo-card-2.svg',
      url: 'https://cdn.prod.website-files.com/68a2a7fda7681f6518b88f0b/68a421bf367a651f79bc95dc_b06c76e3571e3d8014551abb853869ab_card-img-7.svg',
      description:
        'Assign conversations to team members, add internal notes, and collaborate in real-time. Everyone stays aligned on every customer interaction.',
      cursor: { label: 'Manager', color: 'emerald' },
    },
    {
      id: 'messages',
      label: 'Multi-Channel Support',
      icon: 'https://cdn.prod.website-files.com/68a2a7fda7681f6518b88f0b/68b2a2683090cca3785c42b4_color-logo-card-4.svg',
      url: 'https://cdn.prod.website-files.com/68a2a7fda7681f6518b88f0b/68a421bf367a651f79bc95dc_b06c76e3571e3d8014551abb853869ab_card-img-7.svg',
      description: 'Connect WhatsApp Business, Instagram Direct Messages, and Telegram all in one platform. Respond to customers wherever they are.',
      cursor: { label: 'Support', color: 'yellow' },
    },
    {
      id: 'tasks',
      label: 'Lead Management',
      icon: 'https://cdn.prod.website-files.com/68a2a7fda7681f6518b88f0b/68b2a2683d9c61ae25e2d678_color-logo-card-5.svg',
      url: 'https://cdn.prod.website-files.com/68a2a7fda7681f6518b88f0b/68a421bf367a651f79bc95dc_b06c76e3571e3d8014551abb853869ab_card-img-7.svg',
      description:
        'Track every lead from first message to closed deal. Tag customers, view conversation history, and monitor sales pipeline all in one view.',
      cursor: { label: 'Sales', color: 'orange' },
    },
    {
      id: 'notepad',
      label: 'Product Catalog',
      icon: 'https://cdn.prod.website-files.com/68a2a7fda7681f6518b88f0b/68b2a268d941df603936d03e_color-logo-card-6.svg',
      url: 'https://cdn.prod.website-files.com/68a2a7fda7681f6518b88f0b/68a421bf367a651f79bc95dc_b06c76e3571e3d8014551abb853869ab_card-img-7.svg',
      description:
        'Manage your product catalog with prices and descriptions. AI auto-detects products from sales conversations to keep your inventory updated.',
      cursor: { label: 'Catalog', color: 'pink' },
    },
    {
      id: 'security',
      label: 'Enterprise Security',
      icon: 'https://cdn.prod.website-files.com/68a2a7fda7681f6518b88f0b/68b2a2685e15888b0ecb8304_color-logo-card-7.svg',
      url: 'https://cdn.prod.website-files.com/68a2a7fda7681f6518b88f0b/68a421bf367a651f79bc95dc_b06c76e3571e3d8014551abb853869ab_card-img-7.svg',
      description:
        'Bank-level security with two-factor authentication, role-based access control, and encrypted data storage. Your customer data stays protected.',
      cursor: { label: 'Secure', color: 'cyan' },
    },
  ];

  const activeContent = tabs.find((t) => t.id === activeTab) || tabs[0];

  const cursorColors: Record<string, { text: string; bg: string; textDark: string }> = {
    blue: { text: 'text-blue-400', bg: 'bg-blue-400', textDark: 'text-blue-950' },
    purple: { text: 'text-purple-400', bg: 'bg-purple-400', textDark: 'text-purple-950' },
    emerald: { text: 'text-emerald-400', bg: 'bg-emerald-400', textDark: 'text-emerald-950' },
    yellow: { text: 'text-yellow-400', bg: 'bg-yellow-400', textDark: 'text-yellow-950' },
    orange: { text: 'text-orange-400', bg: 'bg-orange-400', textDark: 'text-orange-950' },
    pink: { text: 'text-pink-400', bg: 'bg-pink-400', textDark: 'text-pink-950' },
    cyan: { text: 'text-cyan-400', bg: 'bg-cyan-400', textDark: 'text-cyan-950' },
  };

  const currentCursorColor = cursorColors[activeContent.cursor.color];

  return (
    <section className='py-24 bg-background border-y border-border'>
      <div className='container mx-auto px-4 max-w-6xl'>
        <div className='text-center mb-16'>
          <h2 className='text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4'>Everything you need to succeed. Fast.</h2>
        </div>

        <div className='grid md:grid-cols-12 gap-0 border border-border overflow-hidden shadow-sm'>
          {/* Left Column: Tabs */}
          <div className='md:col-span-4 flex flex-col bg-white dark:bg-card border-r border-border'>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onMouseEnter={() => setActiveTab(tab.id)}
                onClick={() => setActiveTab(tab.id)}
                className={`group flex items-center gap-4 p-4 text-left transition-all focus:outline-none relative overflow-hidden border-b border-border ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-50/80 to-transparent text-blue-600 dark:from-blue-500/10 dark:text-blue-400'
                    : 'hover:bg-muted/50 text-black hover:text-blue-600'
                }`}
              >
                {activeTab === tab.id && (
                  <>
                    {/* Top Left Corner Accent */}
                    <div className='absolute top-0 left-0 w-0.5 h-3 bg-blue-600 dark:bg-blue-400' />
                    <div className='absolute top-0 left-0 w-3 h-0.5 bg-blue-600 dark:bg-blue-400' />

                    {/* Bottom Right Corner Accent */}
                    <div className='absolute bottom-0 right-0 w-0.5 h-3 bg-blue-600 dark:bg-blue-400' />
                    <div className='absolute bottom-0 right-0 w-3 h-0.5 bg-blue-600 dark:bg-blue-400' />
                  </>
                )}
                <div className='w-8 h-8 flex items-center justify-center'>
                  {tab.id === 'dashboard' ? (
                    <svg
                      width='24'
                      height='24'
                      viewBox='0 0 24 24'
                      fill='none'
                      xmlns='http://www.w3.org/2000/svg'
                      className={`transition-all duration-300 ${
                        activeTab === tab.id
                          ? ''
                          : 'grayscale brightness-0 opacity-70 group-hover:grayscale-0 group-hover:brightness-100 group-hover:opacity-100'
                      }`}
                    >
                      <path
                        d='M18.75 11.25V15C18.75 15.3978 18.592 15.7794 18.3107 16.0607C18.0294 16.342 17.6478 16.5 17.25 16.5H4.5C4.10218 16.5 3.72064 16.342 3.43934 16.0607C3.15804 15.7794 3 15.3978 3 15V11.25C3 10.8522 3.15804 10.4706 3.43934 10.1893C3.72064 9.90804 4.10218 9.75 4.5 9.75H17.25C17.6478 9.75 18.0294 9.90804 18.3107 10.1893C18.592 10.4706 18.75 10.8522 18.75 11.25ZM0.75 0C0.551088 0 0.360322 0.0790178 0.21967 0.21967C0.0790178 0.360322 0 0.551088 0 0.75V17.25C0 17.4489 0.0790178 17.6397 0.21967 17.7803C0.360322 17.921 0.551088 18 0.75 18C0.948912 18 1.13968 17.921 1.28033 17.7803C1.42098 17.6397 1.5 17.4489 1.5 17.25V0.75C1.5 0.551088 1.42098 0.360322 1.28033 0.21967C1.13968 0.0790178 0.948912 0 0.75 0ZM4.5 8.25H13.5C13.8978 8.25 14.2794 8.09196 14.5607 7.81066C14.842 7.52936 15 7.14782 15 6.75V3C15 2.60218 14.842 2.22064 14.5607 1.93934C14.2794 1.65804 13.8978 1.5 13.5 1.5H4.5C4.10218 1.5 3.72064 1.65804 3.43934 1.93934C3.15804 2.22064 3 2.60218 3 3V6.75C3 7.14782 3.15804 7.52936 3.43934 7.81066C3.72064 8.09196 4.10218 8.25 4.5 8.25Z'
                        fill='#335FFF'
                      />
                    </svg>
                  ) : tab.id === 'search' ? (
                    <svg
                      width='24'
                      height='24'
                      viewBox='0 0 24 24'
                      fill='#335FFF'
                      xmlns='http://www.w3.org/2000/svg'
                      className={`transition-all duration-300 ${
                        activeTab === tab.id
                          ? ''
                          : 'grayscale brightness-0 opacity-70 group-hover:grayscale-0 group-hover:brightness-100 group-hover:opacity-100'
                      }`}
                    >
                      <path d='M22.2391 14.2405V14.2311C22.2375 14.2241 22.2353 14.2172 22.2325 14.2105C22.1703 14.0407 22.098 13.8748 22.016 13.7136L18.1188 4.85613C18.0813 4.77081 18.0282 4.69324 17.9622 4.62738C17.6836 4.34873 17.3529 4.12769 16.9889 3.97688C16.6248 3.82608 16.2347 3.74846 15.8406 3.74846C15.4466 3.74846 15.0565 3.82608 14.6924 3.97688C14.3284 4.12769 13.9977 4.34873 13.7191 4.62738C13.5789 4.76769 13.5001 4.95781 13.4997 5.15613V7.49988H10.4997V5.15613C10.4998 5.05761 10.4805 4.96004 10.4428 4.86899C10.4052 4.77795 10.35 4.69521 10.2803 4.6255C10.0018 4.34686 9.671 4.12582 9.30698 3.97501C8.94296 3.8242 8.5528 3.74658 8.15877 3.74658C7.76475 3.74658 7.37459 3.8242 7.01057 3.97501C6.64654 4.12582 6.3158 4.34686 6.03721 4.6255C5.97126 4.69136 5.91817 4.76894 5.88065 4.85425L1.98721 13.7136C1.9052 13.8748 1.83288 14.0407 1.77065 14.2105C1.76804 14.2169 1.76585 14.2235 1.76409 14.2302C1.76409 14.2302 1.76409 14.2377 1.76409 14.2405C1.37689 15.3593 1.44616 16.5856 1.95689 17.6536C2.46763 18.7216 3.37867 19.5454 4.49258 19.9463C5.6065 20.3473 6.83354 20.2931 7.90779 19.7956C8.98204 19.298 9.81696 18.3972 10.2316 17.2883C10.4142 16.7902 10.5062 16.2635 10.5035 15.733V8.99988H13.5035V15.7339C13.5007 16.2644 13.5928 16.7912 13.7753 17.2893C14.19 18.3981 15.0249 19.299 16.0991 19.7965C17.1734 20.2941 18.4004 20.3482 19.5143 19.9473C20.6283 19.5463 21.5393 18.7226 22.05 17.6545C22.5608 16.5865 22.63 15.3602 22.2428 14.2414L22.2391 14.2405ZM8.81877 16.7718C8.54182 17.5107 7.98484 18.1108 7.26851 18.442C6.55219 18.7732 5.73422 18.8088 4.99185 18.541C4.24947 18.2733 3.64249 17.7238 3.30241 17.0117C2.96234 16.2996 2.91657 15.4821 3.17502 14.7364L3.34471 14.3493C3.65659 13.7564 4.15791 13.285 4.7688 13.0102C5.37968 12.7353 6.06498 12.6728 6.7155 12.8327C7.36602 12.9925 7.94434 13.3654 8.3583 13.8921C8.77227 14.4187 8.99806 15.0688 8.99971 15.7386V15.7499C8.99966 16.0997 8.93842 16.4468 8.81877 16.7755V16.7718ZM19.031 18.5689C18.5775 18.7349 18.0906 18.789 17.6118 18.7266C17.1329 18.6641 16.6762 18.487 16.2805 18.2103C15.8847 17.9335 15.5616 17.5653 15.3387 17.137C15.1157 16.7086 14.9994 16.2328 14.9997 15.7499V15.7396C15.0022 15.07 15.2286 14.4205 15.6428 13.8945C16.0571 13.3685 16.6354 12.9962 17.2857 12.8369C17.936 12.6775 18.621 12.7403 19.2315 13.0152C19.842 13.2901 20.343 13.7614 20.6547 14.3539L20.8244 14.7411C21.0912 15.4867 21.0523 16.3075 20.7164 17.0246C20.3804 17.7416 19.7746 18.2968 19.031 18.5689Z' />
                    </svg>
                  ) : tab.id === 'workspace' ? (
                    <svg
                      width='24'
                      height='24'
                      viewBox='0 0 24 24'
                      fill='none'
                      xmlns='http://www.w3.org/2000/svg'
                      className={`transition-all duration-300 ${
                        activeTab === tab.id
                          ? ''
                          : 'grayscale brightness-0 opacity-70 group-hover:grayscale-0 group-hover:brightness-100 group-hover:opacity-100'
                      }`}
                    >
                      <path
                        d='M14.25 10.5C14.25 10.6989 14.171 10.8897 14.0303 11.0303C13.8897 11.171 13.6989 11.25 13.5 11.25H10.5C10.3011 11.25 10.1103 11.171 9.96967 11.0303C9.82902 10.8897 9.75 10.6989 9.75 10.5C9.75 10.3011 9.82902 10.1103 9.96967 9.96967C10.1103 9.82902 10.3011 9.75 10.5 9.75H13.5C13.6989 9.75 13.8897 9.82902 14.0303 9.96967C14.171 10.1103 14.25 10.3011 14.25 10.5ZM21.75 6.75V18.75C21.75 19.1478 21.592 19.5294 21.3107 19.8107C21.0294 20.092 20.6478 20.25 20.25 20.25H3.75C3.35218 20.25 2.97064 20.092 2.68934 19.8107C2.40804 19.5294 2.25 19.1478 2.25 18.75V6.75C2.25 6.35218 2.40804 5.97064 2.68934 5.68934C2.97064 5.40804 3.35218 5.25 3.75 5.25H7.5V4.5C7.5 3.90326 7.73705 3.33097 8.15901 2.90901C8.58097 2.48705 9.15326 2.25 9.75 2.25H14.25C14.8467 2.25 15.419 2.48705 15.841 2.90901C16.2629 3.33097 16.5 3.90326 16.5 4.5V5.25H20.25C20.6478 5.25 21.0294 5.40804 21.3107 5.68934C21.592 5.97064 21.75 6.35218 21.75 6.75ZM9 5.25H15V4.5C15 4.30109 14.921 4.11032 14.7803 3.96967C14.6397 3.82902 14.4489 3.75 14.25 3.75H9.75C9.55109 3.75 9.36032 3.82902 9.21967 3.96967C9.07902 4.11032 9 4.30109 9 4.5V5.25ZM20.25 10.6509V6.75H3.75V10.6509C6.28146 12.0289 9.11783 12.7505 12 12.75C14.8822 12.7505 17.7185 12.0289 20.25 10.6509Z'
                        fill='#335FFF'
                      />
                    </svg>
                  ) : tab.id === 'messages' ? (
                    <svg
                      width='24'
                      height='24'
                      viewBox='0 0 24 24'
                      fill='none'
                      xmlns='http://www.w3.org/2000/svg'
                      className={`transition-all duration-300 ${
                        activeTab === tab.id
                          ? ''
                          : 'grayscale brightness-0 opacity-70 group-hover:grayscale-0 group-hover:brightness-100 group-hover:opacity-100'
                      }`}
                    >
                      <path
                        d='M20.25 4.5H3.75003C3.3522 4.5 2.97067 4.65804 2.68937 4.93934C2.40806 5.22064 2.25003 5.60218 2.25003 6V21C2.2483 21.286 2.32921 21.5665 2.48305 21.8076C2.63689 22.0488 2.8571 22.2404 3.11721 22.3594C3.31543 22.4517 3.53138 22.4997 3.75003 22.5C4.10216 22.4992 4.4426 22.3736 4.71096 22.1456L4.7194 22.1391L7.78128 19.5H20.25C20.6479 19.5 21.0294 19.342 21.3107 19.0607C21.592 18.7794 21.75 18.3978 21.75 18V6C21.75 5.60218 21.592 5.22064 21.3107 4.93934C21.0294 4.65804 20.6479 4.5 20.25 4.5ZM15 14.25H9.00003C8.80111 14.25 8.61035 14.171 8.4697 14.0303C8.32905 13.8897 8.25003 13.6989 8.25003 13.5C8.25003 13.3011 8.32905 13.1103 8.4697 12.9697C8.61035 12.829 8.80111 12.75 9.00003 12.75H15C15.1989 12.75 15.3897 12.829 15.5304 12.9697C15.671 13.1103 15.75 13.3011 15.75 13.5C15.75 13.6989 15.671 13.8897 15.5304 14.0303C15.3897 14.171 15.1989 14.25 15 14.25ZM15 11.25H9.00003C8.80111 11.25 8.61035 11.171 8.4697 11.0303C8.32905 10.8897 8.25003 10.6989 8.25003 10.5C8.25003 10.3011 8.32905 10.1103 8.4697 9.96967C8.61035 9.82902 8.80111 9.75 9.00003 9.75H15C15.1989 9.75 15.3897 9.82902 15.5304 9.96967C15.671 10.1103 15.75 10.3011 15.75 10.5C15.75 10.6989 15.671 10.8897 15.5304 11.0303C15.3897 11.171 15.1989 11.25 15 11.25Z'
                        fill='#335FFF'
                      />
                    </svg>
                  ) : tab.id === 'tasks' ? (
                    <svg
                      width='24'
                      height='24'
                      viewBox='0 0 24 24'
                      fill='none'
                      xmlns='http://www.w3.org/2000/svg'
                      className={`transition-all duration-300 ${
                        activeTab === tab.id
                          ? ''
                          : 'grayscale brightness-0 opacity-70 group-hover:grayscale-0 group-hover:brightness-100 group-hover:opacity-100'
                      }`}
                    >
                      <path
                        d='M15 12.75V12H8.25V18C8.25 18.1989 8.32902 18.3897 8.46967 18.5303C8.61032 18.671 8.80109 18.75 9 18.75H15V18C15 17.6022 15.158 17.2206 15.4393 16.9393C15.7206 16.658 16.1022 16.5 16.5 16.5H19.5C19.8978 16.5 20.2794 16.658 20.5607 16.9393C20.842 17.2206 21 17.6022 21 18V21C21 21.3978 20.842 21.7794 20.5607 22.0607C20.2794 22.342 19.8978 22.5 19.5 22.5H16.5C16.1022 22.5 15.7206 22.342 15.4393 22.0607C15.158 21.7794 15 21.3978 15 21V20.25H9C8.40326 20.25 7.83097 20.0129 7.40901 19.591C6.98705 19.169 6.75 18.5967 6.75 18V7.5H6C5.60218 7.5 5.22064 7.34196 4.93934 7.06066C4.65804 6.77936 4.5 6.39782 4.5 6V3C4.5 2.60218 4.65804 2.22064 4.93934 1.93934C5.22064 1.65804 5.60218 1.5 6 1.5H9C9.39782 1.5 9.77936 1.65804 10.0607 1.93934C10.342 2.22064 10.5 2.60218 10.5 3V6C10.5 6.39782 10.342 6.77936 10.0607 7.06066C9.77936 7.34196 9.39782 7.5 9 7.5H8.25V10.5H15V9.75C15 9.35218 15.158 8.97064 15.4393 8.68934C15.7206 8.40804 16.1022 8.25 16.5 8.25H19.5C19.8978 8.25 20.2794 8.40804 20.5607 8.68934C20.842 8.97064 21 9.35218 21 9.75V12.75C21 13.1478 20.842 13.5294 20.5607 13.8107C20.2794 14.092 19.8978 14.25 19.5 14.25H16.5C16.1022 14.25 15.7206 14.092 15.4393 13.8107C15.158 13.5294 15 13.1478 15 12.75Z'
                        fill='#335FFF'
                      />
                    </svg>
                  ) : tab.id === 'notepad' ? (
                    <svg
                      width='24'
                      height='24'
                      viewBox='0 0 24 24'
                      fill='none'
                      xmlns='http://www.w3.org/2000/svg'
                      className={`transition-all duration-300 ${
                        activeTab === tab.id
                          ? ''
                          : 'grayscale brightness-0 opacity-70 group-hover:grayscale-0 group-hover:brightness-100 group-hover:opacity-100'
                      }`}
                    >
                      <path
                        d='M19.5 3H4.5C4.10218 3 3.72064 3.15804 3.43934 3.43934C3.15804 3.72064 3 4.10218 3 4.5V19.5C3 19.8978 3.15804 20.2794 3.43934 20.5607C3.72064 20.842 4.10218 21 4.5 21H14.6897C14.8867 21.0006 15.082 20.9621 15.264 20.8866C15.446 20.8111 15.6112 20.7002 15.75 20.5603L20.5603 15.75C20.7002 15.6112 20.8111 15.446 20.8866 15.264C20.9621 15.082 21.0006 14.8867 21 14.6897V4.5C21 4.10218 20.842 3.72064 20.5607 3.43934C20.2794 3.15804 19.8978 3 19.5 3ZM15 19.1897V15H19.1897L15 19.1897Z'
                        fill='#335FFF'
                      />
                    </svg>
                  ) : tab.id === 'security' ? (
                    <svg
                      width='24'
                      height='24'
                      viewBox='0 0 24 24'
                      fill='none'
                      xmlns='http://www.w3.org/2000/svg'
                      className={`transition-all duration-300 ${
                        activeTab === tab.id
                          ? ''
                          : 'grayscale brightness-0 opacity-70 group-hover:grayscale-0 group-hover:brightness-100 group-hover:opacity-100'
                      }`}
                    >
                      <path
                        d='M19.5 3.75H4.5C4.10218 3.75 3.72064 3.90804 3.43934 4.18934C3.15804 4.47064 3 4.85218 3 5.25V10.5C3 15.4425 5.3925 18.4378 7.39969 20.0803C9.56156 21.8484 11.7122 22.4494 11.8059 22.4738C11.9348 22.5088 12.0708 22.5088 12.1997 22.4738C12.2934 22.4494 14.4413 21.8484 16.6059 20.0803C18.6075 18.4378 21 15.4425 21 10.5V5.25C21 4.85218 20.842 4.47064 20.5607 4.18934C20.2794 3.90804 19.8978 3.75 19.5 3.75ZM16.0312 11.9466L13.1897 13.0828L14.85 15.3C14.9693 15.4591 15.0206 15.6592 14.9925 15.8561C14.9643 16.053 14.8591 16.2307 14.7 16.35C14.5409 16.4693 14.3408 16.5206 14.1439 16.4925C13.947 16.4643 13.7693 16.3591 13.65 16.2L12 13.9997L10.35 16.2C10.2909 16.2788 10.2169 16.3452 10.1321 16.3954C10.0474 16.4455 9.95357 16.4785 9.85607 16.4925C9.75856 16.5064 9.65927 16.501 9.56386 16.4765C9.46845 16.4521 9.37879 16.4091 9.3 16.35C9.22121 16.2909 9.15482 16.2169 9.10464 16.1321C9.05446 16.0474 9.02147 15.9536 9.00754 15.8561C8.99361 15.7586 8.99902 15.6593 9.02346 15.5639C9.04791 15.4685 9.09091 15.3788 9.15 15.3L10.8131 13.0828L7.96875 11.9466C7.78401 11.872 7.63647 11.727 7.55858 11.5437C7.52002 11.4529 7.49971 11.3554 7.49883 11.2567C7.49795 11.1581 7.5165 11.0602 7.55344 10.9688C7.59037 10.8773 7.64496 10.794 7.71409 10.7236C7.78322 10.6532 7.86553 10.5971 7.95633 10.5586C8.13971 10.4807 8.34651 10.4788 8.53125 10.5534L11.25 11.6419V9C11.25 8.80109 11.329 8.61032 11.4697 8.46967C11.6103 8.32902 11.8011 8.25 12 8.25C12.1989 8.25 12.3897 8.32902 12.5303 8.46967C12.671 8.61032 12.75 8.80109 12.75 9V11.6419L15.4688 10.5534C15.5602 10.5165 15.6581 10.4979 15.7567 10.4988C15.8554 10.4997 15.9529 10.52 16.0437 10.5586C16.1345 10.5971 16.2168 10.6532 16.2859 10.7236C16.355 10.794 16.4096 10.8773 16.4466 10.9688C16.4835 11.0602 16.5021 11.1581 16.5012 11.2567C16.5003 11.3554 16.48 11.4529 16.4414 11.5437C16.4029 11.6345 16.3468 11.7168 16.2764 11.7859C16.206 11.855 16.1227 11.9096 16.0312 11.9466Z'
                        fill='#335FFF'
                      />
                    </svg>
                  ) : (
                    <img
                      src={tab.icon}
                      alt={tab.label}
                      className={`w-6 h-6 object-contain transition-all duration-300 ${
                        activeTab === tab.id
                          ? ''
                          : 'grayscale brightness-0 opacity-70 group-hover:grayscale-0 group-hover:brightness-100 group-hover:opacity-100'
                      }`}
                    />
                  )}
                </div>
                <span className='font-semibold text-base'>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Right Column: Content */}
          <div className='md:col-span-8 bg-white dark:bg-card p-12 min-h-[600px] flex flex-col relative'>
            {/* Dotted Background Pattern */}
            <div
              className='absolute inset-0 opacity-[0.7]'
              style={{
                backgroundImage: 'radial-gradient(#94a3b8 0.75px, transparent 0.75px)',
                backgroundSize: '16px 16px',
              }}
            />

            <div className='relative z-10 h-full flex flex-col'>
              <AnimatePresence mode='wait'>
                <motion.div
                  key={activeContent.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className='flex flex-col h-full'
                >
                  <p className='text-xl text-black mb-12 max-w-2xl leading-relaxed'>{activeContent.description}</p>

                  <div className='flex-1 relative w-full overflow-hidden flex items-center justify-center group'>
                    <img
                      src={activeContent.url}
                      alt={activeContent.label}
                      className='w-full h-full object-cover transition-transform duration-700 group-hover:scale-105'
                    />

                    {/* Floating Cursor */}
                    <motion.div
                      className='absolute bottom-12 right-12 z-20 flex items-center gap-2'
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: [0, -8, 0] }}
                      transition={{
                        opacity: { duration: 0.3 },
                        y: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
                      }}
                    >
                      <svg
                        width='24'
                        height='24'
                        viewBox='0 0 24 24'
                        fill='none'
                        xmlns='http://www.w3.org/2000/svg'
                        className={`${currentCursorColor.text} drop-shadow-md`}
                      >
                        <path
                          d='M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z'
                          fill='currentColor'
                          stroke='white'
                        />
                      </svg>
                      <span
                        className={`${currentCursorColor.bg} ${currentCursorColor.textDark} text-[10px] font-bold px-2 py-1 rounded-full shadow-sm`}
                      >
                        {activeContent.cursor.label}
                      </span>
                    </motion.div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const Counter = ({ value, label, suffix = '' }: { value: number; label: string; suffix?: string }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { duration: 3000 });
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (isInView) {
      motionValue.set(value);
    }
  }, [isInView, value, motionValue]);

  useEffect(() => {
    springValue.on('change', (latest) => {
      setDisplayValue(Math.floor(latest));
    });
  }, [springValue]);

  return (
    <div ref={ref} className='text-center'>
      <div className='text-5xl md:text-6xl font-bold text-foreground mb-2 tabular-nums tracking-tight'>
        {displayValue}
        {suffix}
      </div>
      <div className='text-muted-foreground font-medium'>{label}</div>
    </div>
  );
};

const WorkflowSection = () => {
  return (
    <section className='py-24 bg-background border-b border-border'>
      <div className='container mx-auto px-4 max-w-6xl'>
        <div className='text-center mb-20'>
          <h2 className='text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-6'>Automate workflows. Unlock more wins.</h2>
          <p className='text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed'>
            Let LeadsBox handle the repetitive tasks—from daily reminders to complex project workflows—so your team can stay focused on delivering big
            results.
          </p>
        </div>

        <div className='relative grid grid-cols-1 md:grid-cols-5 gap-0 mb-24 border-y border-border/50 py-12'>
          <div className='md:col-span-1 flex items-center justify-center'>
            <Counter value={45} suffix='K+' label='Teams worldwide' />
          </div>
          <div className='hidden md:flex items-center justify-center'>
            <div className='w-px h-24 bg-border' />
          </div>
          <div className='md:col-span-1 flex items-center justify-center'>
            <Counter value={20} suffix='M+' label='Tasks completed' />
          </div>
          <div className='hidden md:flex items-center justify-center'>
            <div className='w-px h-24 bg-border' />
          </div>
          <div className='md:col-span-1 flex items-center justify-center'>
            <Counter value={98} suffix='%' label='User satisfaction' />
          </div>
        </div>

        <div className='relative rounded-3xl overflow-hidden border border-border shadow-2xl bg-muted/20'>
          <div className='absolute inset-0 bg-gradient-to-t from-background/20 to-transparent z-10' />
          <img
            src='https://cdn.prod.website-files.com/68a2a7fda7681f6518b88f0b/68a2fb49288a807b15484702_302d32017f8dda4d9496925b07d3a7d7_workflow-section-image%20.svg'
            alt='LeadsBox Workflow Interface'
            className='w-full h-auto object-cover'
          />
        </div>
      </div>
    </section>
  );
};

const IntegrationsSection = () => {
  return (
    <section className='py-24 bg-background border-b border-border'>
      <div className='container mx-auto px-4 max-w-6xl'>
        <div className='text-center mb-16'>
          <Badge variant='outline' className='mb-6 border-primary/20 text-primary bg-primary/5'>
            Integrations
          </Badge>
          <h2 className='text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-6'>
            Seamless integrations,
            <br />
            zero friction
          </h2>
        </div>

        {/* Integration Diagram */}
        <div className='relative mb-12 flex items-center justify-center min-h-[400px]'>
          {/* Central Hub */}
          <div className='absolute inset-0 flex items-center justify-center'>
            <div className='relative z-20 w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center shadow-2xl ring-8 ring-blue-100 dark:ring-blue-950'>
              <svg className='w-12 h-12 text-white' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={3} d='M5 13l4 4L19 7' />
              </svg>
            </div>
          </div>

          {/* Integration Nodes - Top Row */}
          <div className='absolute top-0 left-1/4 w-16 h-16 rounded-full bg-muted flex items-center justify-center shadow-md border border-border'>
            <div className='w-8 h-8 rounded-full bg-gray-400' />
          </div>
          <div className='absolute top-0 right-1/4 w-16 h-16 rounded-full bg-muted flex items-center justify-center shadow-md border border-border'>
            <div className='w-8 h-8 rounded-full bg-gray-400' />
          </div>

          {/* Integration Nodes - Middle Row */}
          <div className='absolute top-1/2 -translate-y-1/2 left-8 w-16 h-16 rounded-full bg-muted flex items-center justify-center shadow-md border border-border'>
            <div className='w-8 h-8 rounded-full bg-gray-400' />
          </div>
          <div className='absolute top-1/2 -translate-y-1/2 right-8 w-16 h-16 rounded-full bg-muted flex items-center justify-center shadow-md border border-border'>
            <div className='w-8 h-8 rounded-full bg-gray-400' />
          </div>

          {/* Integration Nodes - Bottom Row */}
          <div className='absolute bottom-0 left-1/3 w-16 h-16 rounded-full bg-muted flex items-center justify-center shadow-md border border-border'>
            <div className='w-8 h-8 rounded-full bg-gray-400' />
          </div>
          <div className='absolute bottom-0 right-1/3 w-16 h-16 rounded-full bg-muted flex items-center justify-center shadow-md border border-border'>
            <div className='w-8 h-8 rounded-full bg-gray-400' />
          </div>

          {/* Connection Lines (SVG) */}
          <svg className='absolute inset-0 w-full h-full pointer-events-none' style={{ zIndex: 1 }}>
            <path d='M 50% 50% L 25% 10%' stroke='currentColor' strokeWidth='2' className='text-border' fill='none' />
            <path d='M 50% 50% L 75% 10%' stroke='currentColor' strokeWidth='2' className='text-border' fill='none' />
            <path d='M 50% 50% L 8% 50%' stroke='currentColor' strokeWidth='2' className='text-border' fill='none' />
            <path d='M 50% 50% L 92% 50%' stroke='currentColor' strokeWidth='2' className='text-border' fill='none' />
            <path d='M 50% 50% L 33% 90%' stroke='currentColor' strokeWidth='2' className='text-border' fill='none' />
            <path d='M 50% 50% L 67% 90%' stroke='currentColor' strokeWidth='2' className='text-border' fill='none' />
          </svg>
        </div>

        <div className='text-center max-w-2xl mx-auto'>
          <p className='text-xl text-muted-foreground leading-relaxed'>Plug LeadsBox into your workflow in just a click.</p>
          <p className='text-xl text-muted-foreground leading-relaxed'>No messy setups, no dev time needed—just instant productivity.</p>
        </div>
      </div>
    </section>
  );
};

export default Index;
