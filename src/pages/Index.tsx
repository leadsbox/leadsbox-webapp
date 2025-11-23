import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { Moon, Sun, Check, Star, Zap, MessageCircle, Users, BarChart3, Shield, Globe, Clock, Play, ArrowRight, Menu, X } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { WhatsAppIcon, TelegramIcon, InstagramIcon, FacebookIcon } from '@/components/brand-icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * LeadsBox — Tasklyn Clone Redesign
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

      {/* Navigation (Tasklyn Style: Minimal, Rounded) */}
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

      {/* Hero Section (Tasklyn Style: Centered, Bold, Pill Badge) */}
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

      {/* Features (Bento Grid) */}
      <section id="features" className="py-32 bg-muted/30">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <Badge variant="outline" className="mb-4 border-primary/20 text-primary bg-primary/5">Features</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Everything you need to scale.</h2>
            <p className="text-xl text-muted-foreground">
              LeadsBox gives you the superpowers to manage thousands of conversations without losing your mind.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Large Card */}
            <Card className="md:col-span-2 bg-card border-border shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
              <CardContent className="p-10 h-full flex flex-col justify-between relative">
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6">
                    <MessageCircle className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">Unified Inbox</h3>
                  <p className="text-muted-foreground text-lg max-w-md">
                    Stop switching tabs. Reply to WhatsApp, Instagram, and Telegram messages from a single, powerful dashboard.
                  </p>
                </div>
                <div className="absolute right-0 bottom-0 w-1/2 h-64 bg-gradient-to-tl from-blue-500/10 to-transparent rounded-tl-[100px]" />
              </CardContent>
            </Card>

            {/* Tall Card */}
            <Card className="md:row-span-2 bg-card border-border shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
               <CardContent className="p-10 h-full flex flex-col">
                 <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center mb-6">
                    <Zap className="w-6 h-6 text-orange-600" />
                 </div>
                 <h3 className="text-2xl font-bold mb-3">AI Automation</h3>
                 <p className="text-muted-foreground text-lg mb-8">
                   Let AI handle the repetitive stuff. Auto-qualify leads and schedule meetings 24/7.
                 </p>
                 <div className="flex-1 bg-muted/50 rounded-2xl border border-border p-4 space-y-3 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-orange-500 animate-linear-progress" />
                    {[1,2,3].map(i => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-background rounded-xl shadow-sm">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <div className="h-2 w-20 bg-muted rounded" />
                        <div className="ml-auto text-[10px] text-orange-500 font-mono bg-orange-500/10 px-2 py-1 rounded">DONE</div>
                      </div>
                    ))}
                 </div>
               </CardContent>
            </Card>

            {/* Small Card 1 */}
            <Card className="bg-card border-border shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-10">
                <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center mb-6">
                  <BarChart3 className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-xl font-bold mb-3">Revenue Tracking</h3>
                <p className="text-muted-foreground">
                  See exactly which conversations turn into cash. Track ROI per channel.
                </p>
              </CardContent>
            </Card>

            {/* Small Card 2 */}
            <Card className="bg-card border-border shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-10">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold mb-3">Team Collaboration</h3>
                <p className="text-muted-foreground">
                  Assign chats, leave internal notes, and work together to close deals.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials (Clean Cards) */}
      <section className="py-32">
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

      {/* CTA Section (Centered, Minimal) */}
      <section className="py-32 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10" />
        <div className="container mx-auto px-4 text-center relative z-10 max-w-3xl">
          <h2 className="text-4xl sm:text-6xl font-bold mb-8 tracking-tight">
            Ready to grow?
          </h2>
          <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto mb-12">
            Join the waitlist and get 3 months of LeadsBox Pro for free when we launch.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto">
            <div className="relative flex-1 w-full">
              <input
                type="email"
                placeholder="name@company.com"
                className="w-full h-14 px-6 rounded-full border-2 border-transparent bg-white text-foreground focus:outline-none focus:ring-4 focus:ring-white/30 transition-all text-lg"
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
          <p className="text-sm text-primary-foreground/60 mt-6">
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
              { title: "Product", links: ["Features", "Integrations", "Pricing", "Changelog"] },
              { title: "Resources", links: ["Blog", "Community", "Help Center", "API Docs"] },
              { title: "Company", links: ["About", "Careers", "Legal", "Contact"] },
            ].map((col, i) => (
              <div key={i}>
                <h4 className="font-bold mb-6 text-foreground">{col.title}</h4>
                <ul className="space-y-3">
                  {col.links.map(link => (
                    <li key={link}>
                      <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          
          <div className='border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4'>
            <p className='text-sm text-muted-foreground'>© {new Date().getFullYear()} LeadsBox Inc. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
