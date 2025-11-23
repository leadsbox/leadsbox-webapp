import React, { Suspense, lazy, useEffect, useMemo, useState, useRef } from 'react';
import { Moon, Sun, Check, Star, Zap, MessageCircle, Users, BarChart3, Shield, Globe, Clock, Play, ArrowRight, Menu, X, LayoutDashboard, Search, Briefcase, ListTodo, FileText } from 'lucide-react';
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
  title: 'LeadsBox — The Customer Messaging Platform for Startups',
  description:
    'One inbox for WhatsApp, Instagram & Telegram. Automate support, close more deals, and keep your customers happy. The #1 choice for modern teams.',
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
  
  const logoSrc = '/leadsboxlogo.svg';
  const LogoImage = ({ className }: { className?: string }) => (
    <img src={logoSrc} alt='LeadsBox Logo' className={className} />
  );

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
              <Button variant='ghost' onClick={() => window.location.href = '/login'} className="font-medium hidden sm:flex rounded-full">
                Log in
              </Button>
              <Button 
                onClick={() => setWaitlistOpen(true)}
                className="bg-primary hover:bg-primary-hover text-white rounded-full px-6 font-semibold shadow-lg shadow-primary/20 transition-all hover:scale-105"
              >
                Get Started
              </Button>
              <Button
                variant='ghost'
                size='icon'
                className='md:hidden'
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
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
            className="fixed inset-x-4 top-24 z-40 bg-card border border-border rounded-2xl p-4 shadow-2xl md:hidden"
          >
            <nav className="flex flex-col gap-4">
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
              <div className="h-px bg-border my-2" />
              <Button variant='ghost' onClick={() => window.location.href = '/login'} className="justify-start">
                Log in
              </Button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section (LeadsBox Style: Centered, Bold, Pill Badge) */}
      <section className='pt-40 pb-20 md:pt-48 md:pb-32 px-4 relative overflow-hidden'>
        {/* Background Blobs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-primary/5 to-transparent rounded-[100%] blur-3xl -z-10 pointer-events-none" />

        <div className='container mx-auto max-w-5xl text-center relative z-10'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-border shadow-sm mb-8 hover:scale-105 transition-transform cursor-pointer dark:bg-white/10">
              <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-medium text-muted-foreground">New: Instagram & WhatsApp Integration</span>
              <ArrowRight className="w-3 h-3 text-muted-foreground ml-1" />
            </div>

            <h1 className='text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-8 text-foreground'>
              Turn your social DMs into <br className="hidden md:block" />
              <span className="text-primary">revenue engines.</span>
            </h1>
            
            <p className='text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed'>
              Whether you’re just starting out or scaling fast, LeadsBox helps your team work smarter on what truly matters, Sales.
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
                <Play className="w-4 h-4 fill-current" /> Watch Demo
              </Button>
            </div>

            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground mb-16 font-medium">
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-primary" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-primary" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-primary" />
                <span>Cancel anytime</span>
              </div>
            </div>

            {/* Hero Visual: Floating Cards "Connected" */}
            <motion.div 
              className='relative max-w-5xl mx-auto'
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              {/* Main Dashboard Preview */}
              <div className="relative rounded-2xl overflow-hidden border border-border shadow-2xl bg-background text-left">
                <div className="absolute top-0 left-0 right-0 h-12 bg-muted/50 border-b border-border flex items-center px-4 gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                    <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
                  </div>
                  <div className="ml-4 flex gap-4 text-xs font-medium text-muted-foreground">
                    <span className="text-foreground bg-background px-2 py-1 rounded shadow-sm">Inbox</span>
                    <span>Analytics</span>
                    <span>Settings</span>
                  </div>
                </div>
                
                <div className="pt-12 p-1 bg-muted/20 min-h-[400px] md:min-h-[500px] grid grid-cols-12 gap-1">
                  {/* Sidebar */}
                  <div className="hidden md:block col-span-3 bg-background border-r border-border p-4 space-y-4">
                    <div className="flex items-center justify-between mb-6">
                      <span className="font-bold text-sm">Messages</span>
                      <Badge variant="secondary" className="text-[10px]">12 New</Badge>
                    </div>
                    {[
                      { name: "Sarah Miller", msg: "Hey, about the pricing...", time: "2m", active: true, icon: WhatsAppIcon, color: "text-green-500" },
                      { name: "TechCorp Inc.", msg: "Can we schedule a demo?", time: "15m", active: false, icon: InstagramIcon, color: "text-pink-500" },
                      { name: "John Doe", msg: "Thanks for the help!", time: "1h", active: false, icon: TelegramIcon, color: "text-blue-500" },
                    ].map((chat, i) => (
                      <div key={i} className={`p-3 rounded-xl flex gap-3 cursor-pointer transition-colors ${chat.active ? 'bg-primary/5 border border-primary/10' : 'hover:bg-muted'}`}>
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center text-xs font-bold">
                            {chat.name[0]}
                          </div>
                          <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5">
                            <chat.icon className={`w-3 h-3 ${chat.color}`} />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-0.5">
                            <span className="font-medium text-sm truncate">{chat.name}</span>
                            <span className="text-[10px] text-muted-foreground">{chat.time}</span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{chat.msg}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Chat Area */}
                  <div className="col-span-12 md:col-span-6 bg-background flex flex-col">
                    <div className="p-4 border-b border-border flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-xs">SM</div>
                        <div>
                          <div className="font-medium text-sm">Sarah Miller</div>
                          <div className="text-xs text-muted-foreground">via WhatsApp</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0"><Check className="w-4 h-4" /></Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0"><Star className="w-4 h-4" /></Button>
                      </div>
                    </div>
                    <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-dots">
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex-shrink-0" />
                        <div className="bg-muted p-3 rounded-2xl rounded-tl-none max-w-[80%] text-sm">
                          Hi there! I saw your pricing page but I have a question about the Enterprise plan.
                        </div>
                      </div>
                      <div className="flex gap-3 flex-row-reverse">
                        <div className="w-8 h-8 rounded-full bg-primary flex-shrink-0 flex items-center justify-center">
                          <LogoImage className="w-4 h-4 invert brightness-0" />
                        </div>
                        <div className="bg-primary text-primary-foreground p-3 rounded-2xl rounded-tr-none max-w-[80%] text-sm shadow-md">
                          Hello Sarah! 👋 I'd be happy to help with that. What specific features are you looking for?
                        </div>
                      </div>
                      <div className="flex justify-center">
                        <Badge variant="outline" className="bg-background/50 backdrop-blur text-xs text-muted-foreground">
                          AI Agent is typing...
                        </Badge>
                      </div>
                    </div>
                    <div className="p-4 border-t border-border">
                      <div className="bg-muted/30 rounded-xl p-2 flex gap-2 items-center">
                        <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                          <Zap className="w-4 h-4" />
                        </div>
                        <input className="bg-transparent flex-1 text-sm outline-none" placeholder="Type a message or / for templates..." />
                        <Button size="sm" className="rounded-lg h-8 w-8 p-0"><ArrowRight className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  </div>

                  {/* Right Panel (Details) */}
                  <div className="hidden md:block col-span-3 bg-background border-l border-border p-4 space-y-6">
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Lead Details</h4>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Globe className="w-4 h-4 text-muted-foreground" />
                          <span>London, UK</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span>10:42 AM (Local)</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary" className="bg-green-500/10 text-green-600 hover:bg-green-500/20">Hot Lead</Badge>
                        <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20">Enterprise</Badge>
                      </div>
                    </div>
                    <div className="p-3 bg-primary/5 rounded-xl border border-primary/10">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="w-3 h-3 text-primary" />
                        <span className="text-xs font-medium text-primary">AI Insight</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        High intent detected. Suggest scheduling a demo call immediately.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Elements (Decorations) */}
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -left-12 top-1/4 bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-xl border border-border hidden lg:block"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white">
                    <WhatsAppIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-bold text-sm">New Order</div>
                    <div className="text-xs text-muted-foreground">+$129.00</div>
                  </div>
                </div>
              </motion.div>

              <motion.div 
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute -right-8 bottom-1/4 bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-xl border border-border hidden lg:block"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-pink-500 flex items-center justify-center text-white">
                    <InstagramIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-bold text-sm">@design_studio</div>
                    <div className="text-xs text-muted-foreground">Sent a DM</div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Trusted Brands (Static Grid) */}
      <section className="py-20 bg-background border-y border-border">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <h3 className="text-xl font-medium text-foreground">Brands That Put Trust In Us</h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 border-t border-l border-border">
            {[
              { name: 'Partner 1', url: 'https://cdn.prod.website-files.com/68a2a7fda7681f6518b88f0b/68a2d5bcccfcae2e34dfce13_30ad823d9fe87fd63c72198887a68bce_partner-logo-1.svg' },
              { name: 'Partner 2', url: 'https://cdn.prod.website-files.com/68a2a7fda7681f6518b88f0b/68a2d5bcccfcae2e34dfce16_8400bd188f97d212628b3ef62349192b_partner-logo-2.svg' },
              { name: 'Partner 3', url: 'https://cdn.prod.website-files.com/68a2a7fda7681f6518b88f0b/68a2d5bcccfcae2e34dfce14_d80fbf6ac51503d81301cd47d47dc3c4_partner-logo-3.svg' },
              { name: 'Partner 4', url: 'https://cdn.prod.website-files.com/68a2a7fda7681f6518b88f0b/68a2d5bcccfcae2e34dfce15_f0bf5458ea5bd05b4e1c508a9302dc27_partner-logo-4.svg' },
              { name: 'Company 8', url: 'https://cdn.prod.website-files.com/68a2a7fda7681f6518b88f0b/68a58fed4ebe82f3801dafd5_company-logo-8.svg' },
              { name: 'Company 7', url: 'https://cdn.prod.website-files.com/68a2a7fda7681f6518b88f0b/68a58fed107533572d97a23e_company-logo-7.svg' },
              { name: 'Company 1', url: 'https://cdn.prod.website-files.com/68a2a7fda7681f6518b88f0b/68a3187467a414c0209f58dd_company-logo-1.svg' },
              { name: 'Partner 1', url: 'https://cdn.prod.website-files.com/68a2a7fda7681f6518b88f0b/68a2d5bcccfcae2e34dfce13_30ad823d9fe87fd63c72198887a68bce_partner-logo-1.svg' }
            ].map((logo, idx) => (
              <div key={idx} className="flex items-center justify-center h-32 border-r border-b border-border p-8 hover:bg-muted/30 dark:hover:bg-white/5 transition-colors group">
                <img 
                  src={logo.url} 
                  alt={logo.name} 
                  className="max-w-full max-h-full object-contain transition-all duration-300" 
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Simplify Process Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
              Simplify complex process with LeadsBox
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Card 1: Create Account */}
            <div className="bg-muted/30 rounded-3xl p-8 text-center border border-border/50 hover:border-border transition-colors overflow-hidden relative group">
              <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-indigo-500/10 via-purple-500/5 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
              <div className="mb-8 relative h-56 w-full flex items-center justify-center">
                <img 
                  src="https://cdn.prod.website-files.com/68a2a7fda7681f6518b88f0b/68b82916e7b0f46d246b15c6_a3a534b8e7bc746ab85606267e009d9c_process-card-1.svg" 
                  alt="Sign Up Process" 
                  className="w-full h-full object-contain relative z-10"
                />
                {/* Floating Cursor: Manager */}
                <motion.div 
                  className="absolute bottom-8 right-1/4 z-20 flex items-center gap-2"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-yellow-400 drop-shadow-md">
                    <path d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z" fill="currentColor" stroke="white"/>
                  </svg>
                  <span className="bg-yellow-400 text-yellow-950 text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">Manager</span>
                </motion.div>
              </div>
              <h3 className="text-xl font-bold mb-3 relative z-10">Create Account</h3>
              <p className="text-sm text-muted-foreground leading-relaxed relative z-10">
                Kick things off in seconds. Just sign up, set up your workspace, and you're ready to go.
              </p>
            </div>

            {/* Card 2: Invite Team */}
            <div className="bg-muted/30 rounded-3xl p-8 text-center border border-border/50 hover:border-border transition-colors overflow-hidden relative group">
              <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-emerald-500/10 via-teal-500/5 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
              <div className="mb-8 relative h-56 w-full flex items-center justify-center">
                <img 
                  src="https://cdn.prod.website-files.com/68a2a7fda7681f6518b88f0b/68b2bea9a30c0622e7efb85d_5a9c5e0f33c2dd63fc417f6e977dbcbd_card-2.svg" 
                  alt="Invite Team Process" 
                  className="w-full h-full object-contain relative z-10"
                />
                {/* Floating Cursor: Team Lead */}
                <motion.div 
                  className="absolute bottom-12 right-1/3 z-20 flex items-center gap-2"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-emerald-400 drop-shadow-md">
                    <path d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z" fill="currentColor" stroke="white"/>
                  </svg>
                  <span className="bg-emerald-400 text-emerald-950 text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">Team Lead</span>
                </motion.div>
              </div>
              <h3 className="text-xl font-bold mb-3 relative z-10">Invite Team</h3>
              <p className="text-sm text-muted-foreground leading-relaxed relative z-10">
                Bring your teammates on board instantly. Manage roles, track projects, and stay aligned without the chaos.
              </p>
            </div>

            {/* Card 3: Assign & Track */}
            <div className="md:col-span-2 bg-muted/30 rounded-3xl p-8 text-center border border-border/50 hover:border-border transition-colors overflow-hidden relative group">
              <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-blue-500/10 via-cyan-500/5 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10 mb-8">
                <h3 className="text-xl font-bold mb-3">Assign & track</h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-lg mx-auto">
                  Assign tasks to the right people and track progress in real-time. Never let a lead slip through the cracks again.
                </p>
              </div>
              <div className="relative h-64 w-full flex items-center justify-center">
                <img 
                  src="https://cdn.prod.website-files.com/68a2a7fda7681f6518b88f0b/68ad6ef946ffe203b2c5979d_621ed14e4e2e7155b962f3308bae23a4_process-card-3.svg" 
                  alt="Assign & Track Process" 
                  className="w-full h-full object-contain relative z-10"
                />
                {/* Floating Cursor: Sales Rep */}
                <motion.div 
                  className="absolute bottom-10 right-1/3 z-20 flex items-center gap-2"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-blue-400 drop-shadow-md">
                    <path d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z" fill="currentColor" stroke="white"/>
                  </svg>
                  <span className="bg-blue-400 text-blue-950 text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">Sales Rep</span>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Everything you need to succeed Section */}
      <SuccessSection />

      {/* Testimonials (Clean Cards) */}
      <section className="py-32 border-b border-border">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-bold mb-6">Loved by founders & creators</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
             {[
               {
                 text: "LeadsBox completely changed how we handle support. We used to miss DMs all the time, now we're at inbox zero every day.",
                 author: "Jessica K.",
                 role: "CEO, FashionNova (Reseller)",
                 bg: "bg-blue-50 dark:bg-blue-900/10"
               },
               {
                 text: "The AI features are insane. It literally books meetings for me while I'm asleep. Best investment we made this year.",
                 author: "David R.",
                 role: "Agency Owner",
                 bg: "bg-purple-50 dark:bg-purple-900/10"
               },
               {
                 text: "Finally, a tool that understands WhatsApp marketing. The analytics helped us double our conversion rate in a month.",
                 author: "Ahmed S.",
                 role: "E-commerce Founder",
                 bg: "bg-green-50 dark:bg-green-900/10"
               }
             ].map((t, i) => (
               <Card key={i} className="border-border shadow-sm hover:shadow-lg transition-all duration-300">
                 <CardContent className="p-8">
                   <div className="flex gap-1 mb-6">
                     {[1,2,3,4,5].map(star => <Star key={star} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
                   </div>
                   <p className="text-lg font-medium mb-8 leading-relaxed text-foreground/80">"{t.text}"</p>
                   <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-bold text-sm border border-border">
                       {t.author[0]}
                     </div>
                     <div>
                       <div className="font-bold text-sm">{t.author}</div>
                       <div className="text-xs text-muted-foreground">{t.role}</div>
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
      <section className="py-32 bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 text-white relative overflow-hidden selection:bg-white/30 selection:text-white">
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10" />
        <div className="container mx-auto px-4 text-center relative z-10 max-w-3xl">
          <h2 className="text-4xl sm:text-6xl font-bold mb-8 tracking-tight">
            Ready to grow?
          </h2>
          <p className="text-xl text-white/90 max-w-2xl mx-auto mb-12">
            Join the waitlist and get 3 months of LeadsBox Pro for free when we launch.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto">
            <div className="relative flex-1 w-full">
              <input
                type="email"
                placeholder="name@company.com"
                className="w-full h-14 px-6 rounded-full border-2 border-transparent bg-white text-foreground focus:outline-none focus:ring-4 focus:ring-white/30 transition-all text-lg selection:bg-primary/20 selection:text-foreground"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button 
              size="lg" 
              onClick={submit}
              disabled={state === 'loading'}
              className="w-full sm:w-auto h-14 px-8 rounded-full text-lg font-bold bg-black text-white hover:bg-black/80 shadow-xl"
            >
              {state === 'loading' ? 'Joining...' : 'Join Waitlist'}
            </Button>
          </div>
          <p className="text-sm text-white/70 mt-6">
            No credit card required • Unsubscribe anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className='bg-background py-16 border-t border-border'>
        <div className='container mx-auto px-4 max-w-6xl'>
          <div className='grid md:grid-cols-4 gap-12 mb-12'>
            <div className='col-span-1 md:col-span-1'>
              <div className='flex items-center gap-2 mb-6'>
                <div className='w-8 h-8 bg-white p-1 rounded-sm flex items-center justify-center shadow-sm border border-border/10'>
                  <LogoImage className="w-full h-full object-contain" />
                </div>
                <span className='font-bold text-xl'>LeadsBox</span>
              </div>
              <p className='text-sm text-muted-foreground leading-relaxed mb-6'>
                The all-in-one messaging platform for modern businesses. Built with ❤️ for startups.
              </p>
              <div className="flex gap-4">
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors"><InstagramIcon className="w-5 h-5" /></a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors"><FacebookIcon className="w-5 h-5" /></a>
              </div>
            </div>
            
            {[
              { 
                title: "Product", 
                links: [
                  { label: "Features", href: "/#features" },
                  { label: "Integrations", href: "/#integrations" },
                  { label: "Pricing", href: "/#pricing" },
                  { label: "Changelog", href: "#" }
                ] 
              },
              { 
                title: "Company", 
                links: [
                  { label: "About Us", href: "/about" },
                  { label: "Contact", href: "/contact" },
                  { label: "System Status", href: "/status" },
                  { label: "Careers", href: "#" },
                  { label: "Referral Program", href: "/referral-program" },
                  { label: "Blog", href: "#" }
                ] 
              },
              { 
                title: "Legal", 
                links: [
                  { label: "Privacy Policy", href: "/privacy" },
                  { label: "Terms of Service", href: "/terms" },
                  { label: "Cookie Policy", href: "/cookies" },
                  { label: "Refund Policy", href: "/refund-policy" },
                  { label: "DPA", href: "/dpa" }
                ] 
              },
            ].map((col, i) => (
              <div key={i}>
                <h4 className="font-bold mb-6 text-foreground">{col.title}</h4>
                <ul className="space-y-3">
                  {col.links.map(link => (
                    <li key={link.label}>
                      <a href={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">{link.label}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          
          <div className='border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4'>
            <p className='text-sm text-muted-foreground'>© {new Date().getFullYear()} LeadsBox Inc. All rights reserved.</p>
            <div className='flex items-center gap-4 text-sm text-muted-foreground'>
              <a href="/privacy" className="hover:text-primary transition-colors">Privacy</a>
              <span>•</span>
              <a href="/terms" className="hover:text-primary transition-colors">Terms</a>
              <span>•</span>
              <a href="/cookies" className="hover:text-primary transition-colors">Cookies</a>
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
    { id: 'dashboard', label: 'Dashboard', icon: 'https://cdn.prod.website-files.com/68a2a7fda7681f6518b88f0b/68a419949a77d88d40d5b154_card-blue-icon-1.svg', url: 'https://cdn.prod.website-files.com/68a2a7fda7681f6518b88f0b/68a421bf367a651f79bc95dc_b06c76e3571e3d8014551abb853869ab_card-img-7.svg', description: 'See your work clearly—real-time progress, blockers, and deadlines in one customizable, distraction-free dashboard that adapts to your role.', cursor: { label: 'Admin', color: 'blue' } },
    { id: 'search', label: 'Global Search', icon: 'https://cdn.prod.website-files.com/68a2a7fda7681f6518b88f0b/68b2a15df2bef3c956db2852_color-logo-card-2.svg', url: 'https://cdn.prod.website-files.com/68a2a7fda7681f6518b88f0b/68a421bf367a651f79bc95dc_b06c76e3571e3d8014551abb853869ab_card-img-7.svg', description: 'Find anything across your workspace in seconds. Smart filters and AI-powered search help you locate tasks, messages, and files instantly.', cursor: { label: 'User', color: 'purple' } },
    { id: 'workspace', label: 'Multiple Workspace', icon: 'https://cdn.prod.website-files.com/68a2a7fda7681f6518b88f0b/68b2a0d0f38b7710f7cd35c1_color-logo-card-2.svg', url: 'https://cdn.prod.website-files.com/68a2a7fda7681f6518b88f0b/68a421bf367a651f79bc95dc_b06c76e3571e3d8014551abb853869ab_card-img-7.svg', description: 'Manage multiple projects or clients from a single account. Switch contexts instantly without losing your flow.', cursor: { label: 'Manager', color: 'emerald' } },
    { id: 'messages', label: 'Messages', icon: 'https://cdn.prod.website-files.com/68a2a7fda7681f6518b88f0b/68b2a2683090cca3785c42b4_color-logo-card-4.svg', url: 'https://cdn.prod.website-files.com/68a2a7fda7681f6518b88f0b/68a421bf367a651f79bc95dc_b06c76e3571e3d8014551abb853869ab_card-img-7.svg', description: 'Keep conversations right where the work happens. Contextual threads ensure everyone stays on the same page.', cursor: { label: 'Team', color: 'yellow' } },
    { id: 'tasks', label: 'Multiple Task view', icon: 'https://cdn.prod.website-files.com/68a2a7fda7681f6518b88f0b/68b2a2683d9c61ae25e2d678_color-logo-card-5.svg', url: 'https://cdn.prod.website-files.com/68a2a7fda7681f6518b88f0b/68a421bf367a651f79bc95dc_b06c76e3571e3d8014551abb853869ab_card-img-7.svg', description: 'Visualize your work your way. Switch between List, Kanban, Calendar, and Timeline views with a single click.', cursor: { label: 'Lead', color: 'orange' } },
    { id: 'notepad', label: 'Privet Notepad', icon: 'https://cdn.prod.website-files.com/68a2a7fda7681f6518b88f0b/68b2a268d941df603936d03e_color-logo-card-6.svg', url: 'https://cdn.prod.website-files.com/68a2a7fda7681f6518b88f0b/68a421bf367a651f79bc95dc_b06c76e3571e3d8014551abb853869ab_card-img-7.svg', description: 'Jot down quick thoughts, meeting notes, or draft ideas in your private, secure notepad accessible from anywhere.', cursor: { label: 'Writer', color: 'pink' } },
    { id: 'security', label: '2FA Security', icon: 'https://cdn.prod.website-files.com/68a2a7fda7681f6518b88f0b/68b2a2685e15888b0ecb8304_color-logo-card-7.svg', url: 'https://cdn.prod.website-files.com/68a2a7fda7681f6518b88f0b/68a421bf367a651f79bc95dc_b06c76e3571e3d8014551abb853869ab_card-img-7.svg', description: 'Secure by default—two-factor login with backup codes, device trust, and a clear, guided recovery flow when needed.', cursor: { label: 'SecOps', color: 'cyan' } },
  ];

  const activeContent = tabs.find(t => t.id === activeTab) || tabs[0];

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
    <section className="py-24 bg-background border-y border-border">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
            Everything you need to succeed. Fast.
          </h2>
        </div>

        <div className="grid md:grid-cols-12 gap-0 border border-border overflow-hidden shadow-sm">
          {/* Left Column: Tabs */}
          <div className="md:col-span-4 flex flex-col bg-white dark:bg-card border-r border-border">
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
                    <div className="absolute top-0 left-0 w-0.5 h-3 bg-blue-600 dark:bg-blue-400" />
                    <div className="absolute top-0 left-0 w-3 h-0.5 bg-blue-600 dark:bg-blue-400" />
                    
                    {/* Bottom Right Corner Accent */}
                    <div className="absolute bottom-0 right-0 w-0.5 h-3 bg-blue-600 dark:bg-blue-400" />
                    <div className="absolute bottom-0 right-0 w-3 h-0.5 bg-blue-600 dark:bg-blue-400" />
                  </>
                )}
                <div className="w-8 h-8 flex items-center justify-center">
                  <img 
                    src={tab.icon} 
                    alt={tab.label} 
                    className={`w-6 h-6 object-contain transition-all duration-300 ${
                      activeTab === tab.id 
                        ? '' 
                        : 'grayscale brightness-0 opacity-70 group-hover:grayscale-0 group-hover:brightness-100 group-hover:opacity-100'
                    }`} 
                  />
                </div>
                <span className="font-semibold text-base">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Right Column: Content */}
          <div className="md:col-span-8 bg-white dark:bg-card p-12 min-h-[600px] flex flex-col relative">
            {/* Dotted Background Pattern */}
            <div className="absolute inset-0 opacity-[0.7]" style={{
              backgroundImage: 'radial-gradient(#94a3b8 0.75px, transparent 0.75px)',
              backgroundSize: '16px 16px'
            }} />
            
            <div className="relative z-10 h-full flex flex-col">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeContent.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col h-full"
                >
                  <p className="text-xl text-black mb-12 max-w-2xl leading-relaxed">
                    {activeContent.description}
                  </p>
                  
                  <div className="flex-1 relative w-full overflow-hidden flex items-center justify-center group">
                    <img 
                      src={activeContent.url} 
                      alt={activeContent.label} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    
                    {/* Floating Cursor */}
                    <motion.div 
                      className="absolute bottom-12 right-12 z-20 flex items-center gap-2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: [0, -8, 0] }}
                      transition={{ 
                        opacity: { duration: 0.3 },
                        y: { duration: 3, repeat: Infinity, ease: "easeInOut" } 
                      }}
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${currentCursorColor.text} drop-shadow-md`}>
                        <path d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z" fill="currentColor" stroke="white"/>
                      </svg>
                      <span className={`${currentCursorColor.bg} ${currentCursorColor.textDark} text-[10px] font-bold px-2 py-1 rounded-full shadow-sm`}>
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
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { duration: 3000 });
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (isInView) {
      motionValue.set(value);
    }
  }, [isInView, value, motionValue]);

  useEffect(() => {
    springValue.on("change", (latest) => {
      setDisplayValue(Math.floor(latest));
    });
  }, [springValue]);

  return (
    <div ref={ref} className="text-center">
      <div className="text-5xl md:text-6xl font-bold text-foreground mb-2 tabular-nums tracking-tight">
        {displayValue}{suffix}
      </div>
      <div className="text-muted-foreground font-medium">{label}</div>
    </div>
  );
};

const WorkflowSection = () => {
  return (
    <section className="py-24 bg-background border-b border-border">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-6">
            Automate workflows. Unlock more wins.
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Let LeadsBox handle the repetitive tasks—from daily reminders to complex project workflows—so your team can stay focused on delivering big results.
          </p>
        </div>

        <div className="relative grid grid-cols-1 md:grid-cols-5 gap-0 mb-24 border-y border-border/50 py-12">
          <div className="md:col-span-1 flex items-center justify-center">
            <Counter value={45} suffix="K+" label="Teams worldwide" />
          </div>
          <div className="hidden md:flex items-center justify-center">
            <div className="w-px h-24 bg-border" />
          </div>
          <div className="md:col-span-1 flex items-center justify-center">
            <Counter value={20} suffix="M+" label="Tasks completed" />
          </div>
          <div className="hidden md:flex items-center justify-center">
            <div className="w-px h-24 bg-border" />
          </div>
          <div className="md:col-span-1 flex items-center justify-center">
            <Counter value={98} suffix="%" label="User satisfaction" />
          </div>
        </div>

        <div className="relative rounded-3xl overflow-hidden border border-border shadow-2xl bg-muted/20">
          <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent z-10" />
          <img 
            src="https://cdn.prod.website-files.com/68a2a7fda7681f6518b88f0b/68a2fb49288a807b15484702_302d32017f8dda4d9496925b07d3a7d7_workflow-section-image%20.svg" 
            alt="LeadsBox Workflow Interface" 
            className="w-full h-auto object-cover"
          />
        </div>
      </div>
    </section>
  );
};

const IntegrationsSection = () => {
  return (
    <section className="py-24 bg-background border-b border-border">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-6 border-primary/20 text-primary bg-primary/5">
            Integrations
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-6">
            Seamless integrations,
            <br />
            zero friction
          </h2>
        </div>

        {/* Integration Diagram */}
        <div className="relative mb-12 flex items-center justify-center min-h-[400px]">
          {/* Central Hub */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative z-20 w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center shadow-2xl ring-8 ring-blue-100 dark:ring-blue-950">
              <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          {/* Integration Nodes - Top Row */}
          <div className="absolute top-0 left-1/4 w-16 h-16 rounded-full bg-muted flex items-center justify-center shadow-md border border-border">
            <div className="w-8 h-8 rounded-full bg-gray-400" />
          </div>
          <div className="absolute top-0 right-1/4 w-16 h-16 rounded-full bg-muted flex items-center justify-center shadow-md border border-border">
            <div className="w-8 h-8 rounded-full bg-gray-400" />
          </div>

          {/* Integration Nodes - Middle Row */}
          <div className="absolute top-1/2 -translate-y-1/2 left-8 w-16 h-16 rounded-full bg-muted flex items-center justify-center shadow-md border border-border">
            <div className="w-8 h-8 rounded-full bg-gray-400" />
          </div>
          <div className="absolute top-1/2 -translate-y-1/2 right-8 w-16 h-16 rounded-full bg-muted flex items-center justify-center shadow-md border border-border">
            <div className="w-8 h-8 rounded-full bg-gray-400" />
          </div>

          {/* Integration Nodes - Bottom Row */}
          <div className="absolute bottom-0 left-1/3 w-16 h-16 rounded-full bg-muted flex items-center justify-center shadow-md border border-border">
            <div className="w-8 h-8 rounded-full bg-gray-400" />
          </div>
          <div className="absolute bottom-0 right-1/3 w-16 h-16 rounded-full bg-muted flex items-center justify-center shadow-md border border-border">
            <div className="w-8 h-8 rounded-full bg-gray-400" />
          </div>

          {/* Connection Lines (SVG) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
            <path d="M 50% 50% L 25% 10%" stroke="currentColor" strokeWidth="2" className="text-border" fill="none" />
            <path d="M 50% 50% L 75% 10%" stroke="currentColor" strokeWidth="2" className="text-border" fill="none" />
            <path d="M 50% 50% L 8% 50%" stroke="currentColor" strokeWidth="2" className="text-border" fill="none" />
            <path d="M 50% 50% L 92% 50%" stroke="currentColor" strokeWidth="2" className="text-border" fill="none" />
            <path d="M 50% 50% L 33% 90%" stroke="currentColor" strokeWidth="2" className="text-border" fill="none" />
            <path d="M 50% 50% L 67% 90%" stroke="currentColor" strokeWidth="2" className="text-border" fill="none" />
          </svg>
        </div>

        <div className="text-center max-w-2xl mx-auto">
          <p className="text-xl text-muted-foreground leading-relaxed">
            Plug LeadsBox into your workflow in just a click.
          </p>
          <p className="text-xl text-muted-foreground leading-relaxed">
            No messy setups, no dev time needed—just instant productivity.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Index;
