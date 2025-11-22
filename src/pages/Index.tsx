import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { Moon, Sun, ArrowRight, Check, Star, Zap, MessageCircle, Users, BarChart3, Shield, Globe, Smartphone, CreditCard, Activity, Lock, Clock, Play, ChevronRight } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { WhatsAppIcon, TelegramIcon, InstagramIcon, FacebookIcon } from '@/components/brand-icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * LeadsBox — Hybrid Homepage
 * Hero: Crisp-Inspired (New)
 * Rest: Feature-Rich (Original)
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
  const ThemeIcon = useMemo(() => (resolvedTheme === 'dark' ? Sun : Moon), [resolvedTheme]);
  
  const logoSrc = '/leadsboxlogo.svg';
  const LogoImage = ({ className }: { className?: string }) => (
    <img src={logoSrc} alt='LeadsBox Logo' className={className} />
  );

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className='min-h-screen w-full bg-background text-foreground overflow-x-hidden selection:bg-primary/20 selection:text-primary font-sans'>
      {/* Crisp-style Background: Clean with subtle blobs */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-background">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-blue-500/5 blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-purple-500/5 blur-[100px]" />
      </div>

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
      <header className='sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl'>
        <div className='container mx-auto flex h-16 items-center justify-between px-4'>
          <a href='/' className='flex items-center gap-3 group'>
            <div className='w-8 h-8 bg-primary text-primary-foreground p-1 rounded-lg flex items-center justify-center shadow-lg shadow-primary/20 transition-transform group-hover:scale-105'>
              <LogoImage className='w-full h-full object-contain invert brightness-0' />
            </div>
            <span className='text-xl font-bold tracking-tight'>LeadsBox</span>
          </a>

          <nav className='hidden md:flex items-center gap-8'>
            {['Features', 'Pricing', 'Integrations', 'Blog'].map((item) => (
              <a 
                key={item} 
                href={`#${item.toLowerCase()}`} 
                className='text-sm font-medium text-muted-foreground hover:text-foreground transition-colors'
              >
                {item}
              </a>
            ))}
          </nav>

          <div className='flex items-center gap-4'>
            <Button
              variant='ghost'
              size='icon'
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className='rounded-full hover:bg-muted'
            >
              <ThemeIcon className='h-4 w-4' />
            </Button>
            <div className="hidden sm:flex gap-3">
              <Button variant='ghost' onClick={() => window.location.href = '/login'} className="font-medium">
                Sign in
              </Button>
              <Button 
                onClick={() => setWaitlistOpen(true)}
                className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 rounded-full px-6"
              >
                Get Started — It's Free
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section: Crisp Style (Bold, Centered, Floating Elements) */}
      <section className='relative pt-20 pb-32 overflow-hidden'>
        <div className='container mx-auto px-4 relative z-10'>
          <div className='text-center max-w-4xl mx-auto mb-16 space-y-8'>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Badge variant='secondary' className='bg-primary/10 text-primary hover:bg-primary/20 px-4 py-1.5 rounded-full mb-6 transition-colors cursor-pointer'>
                <span className="mr-2">🎉</span> New: WhatsApp & Instagram Integration
              </Badge>
              <h1 className='text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6 text-foreground'>
                The business messaging platform for <span className="text-primary">startups</span>.
              </h1>
              <p className='text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed'>
                Centralize your WhatsApp, Instagram, and Telegram chats. Automate support with AI, and turn every conversation into a customer.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className='flex flex-col sm:flex-row gap-4 justify-center items-center'
            >
              <Button 
                size='lg' 
                onClick={() => setWaitlistOpen(true)} 
                className='h-14 px-8 text-lg rounded-full bg-primary hover:bg-primary/90 shadow-xl shadow-primary/25 transition-all hover:scale-105'
              >
                Use LeadsBox for Free
              </Button>
              <Button 
                variant='outline' 
                size='lg' 
                onClick={() => setDemoOpen(true)}
                className='h-14 px-8 text-lg rounded-full border-2 hover:bg-muted/50 gap-2'
              >
                <Play className="w-4 h-4 fill-current" /> Watch Video
              </Button>
            </motion.div>
            
            <p className="text-sm text-muted-foreground">
              No credit card required • 14-day free trial • Cancel anytime
            </p>
          </div>

          {/* Hero Visual: Floating Cards "Connected" */}
          <motion.div 
            className='relative max-w-5xl mx-auto'
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {/* Main Dashboard Preview */}
            <div className="relative rounded-2xl overflow-hidden border border-border shadow-2xl bg-background">
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
        </div>
      </section>

      {/* Deep Value Proposition */}
      <section className="py-24 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">Why modern businesses choose LeadsBox</h2>
            <p className="text-xl text-muted-foreground">We don't just organize chats. We turn your DMs into a predictable revenue engine.</p>
          </div>

          <div className="space-y-24">
            {/* Feature 1 */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1">
                <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-background/50">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
                  <div className="p-8">
                    {/* Abstract UI for "Zero Leakage" */}
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-white/5 border border-white/5">
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                          <div className="h-2 w-24 bg-white/10 rounded" />
                          <div className="ml-auto h-2 w-12 bg-white/10 rounded" />
                        </div>
                      ))}
                      <div className="flex items-center gap-2 text-sm text-primary font-medium mt-4">
                        <Check className="w-4 h-4" /> All inquiries captured
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="order-1 lg:order-2 space-y-6">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-3xl font-bold">Zero Lead Leakage</h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Stop losing money to buried DMs. LeadsBox unifies every message from WhatsApp, Instagram, and Telegram into one prioritized view. If a lead writes in, you <i>will</i> see it.
                </p>
                <ul className="space-y-3">
                  {['Unified Inbox for all channels', 'Never miss a notification', 'Auto-assign to team members'].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-muted-foreground">
                      <Check className="w-5 h-5 text-primary" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-purple-500" />
                </div>
                <h3 className="text-3xl font-bold">Automated Nurturing</h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Your customers expect instant replies. Our AI agents work 24/7 to qualify leads, answer FAQs, and schedule follow-ups, so you wake up to booked meetings, not a backlog.
                </p>
                <ul className="space-y-3">
                  {['Instant AI responses', 'Smart follow-up scheduling', 'Sentiment analysis'].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-muted-foreground">
                      <Check className="w-5 h-5 text-purple-500" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-background/50">
                  <div className="absolute inset-0 bg-gradient-to-bl from-purple-500/10 to-transparent" />
                  <div className="p-8">
                     {/* Abstract UI for "Automation" */}
                     <div className="flex flex-col gap-4">
                        <div className="self-start bg-white/5 p-3 rounded-2xl rounded-tl-none max-w-[80%]">
                          <div className="h-2 w-32 bg-white/20 rounded mb-2" />
                          <div className="h-2 w-24 bg-white/10 rounded" />
                        </div>
                        <div className="self-end bg-purple-500/20 p-3 rounded-2xl rounded-tr-none max-w-[80%] border border-purple-500/20">
                          <div className="flex items-center gap-2 mb-2">
                            <Zap className="w-3 h-3 text-purple-400" />
                            <span className="text-xs text-purple-300">AI Auto-reply</span>
                          </div>
                          <div className="h-2 w-40 bg-purple-400/20 rounded" />
                        </div>
                     </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1">
                <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-background/50">
                  <div className="absolute inset-0 bg-gradient-to-tr from-green-500/10 to-transparent" />
                  <div className="p-8 flex items-center justify-center">
                     {/* Abstract UI for "Revenue" */}
                     <div className="text-center space-y-2">
                        <div className="text-4xl font-bold text-green-500">+$12,450</div>
                        <div className="text-sm text-muted-foreground">Revenue tracked this month</div>
                        <div className="flex justify-center gap-1 mt-4">
                          {[1,2,3,4,5].map(i => <div key={i} className="w-2 h-8 bg-green-500/20 rounded-full" style={{height: Math.random() * 30 + 10}} />)}
                        </div>
                     </div>
                  </div>
                </div>
              </div>
              <div className="order-1 lg:order-2 space-y-6">
                <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-green-500" />
                </div>
                <h3 className="text-3xl font-bold">Revenue Clarity</h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Stop guessing which channels work. LeadsBox tracks every conversation from "hello" to "paid", giving you crystal-clear ROI data on your social selling efforts.
                </p>
                <ul className="space-y-3">
                  {['Track sales per channel', 'Conversion rate analytics', 'Team performance metrics'].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-muted-foreground">
                      <Check className="w-5 h-5 text-green-500" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Futuristic Integration Visualization */}
      <section className="py-32 relative overflow-hidden bg-black text-white">
        {/* Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-20">
            <Badge variant="outline" className="border-primary/50 text-primary mb-4">The Ecosystem</Badge>
            <h2 className="text-4xl sm:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/50">
              Your Central Command Center
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Connect the world's most popular messaging apps into one powerful brain.
            </p>
          </div>

          <div className="relative h-[600px] w-full max-w-5xl mx-auto flex items-center justify-center">
            {/* Center Node (LeadsBox) */}
            <div className="relative z-20 w-32 h-32 bg-black rounded-full border border-white/10 shadow-[0_0_50px_-12px_rgba(var(--primary-rgb),0.5)] flex items-center justify-center group">
              <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />
              <div className="w-24 h-24 bg-gradient-to-br from-gray-900 to-black rounded-full border border-white/10 flex items-center justify-center relative z-10">
                <LogoImage className="w-12 h-12 object-contain" />
              </div>
              
              {/* Orbiting Rings */}
              <div className="absolute inset-0 -m-8 border border-white/5 rounded-full animate-[spin_10s_linear_infinite]" />
              <div className="absolute inset-0 -m-16 border border-white/5 rounded-full animate-[spin_15s_linear_infinite_reverse]" />
            </div>

            {/* Satellite Nodes */}
            {[
              { icon: WhatsAppIcon, label: 'WhatsApp', x: '-translate-x-48 -translate-y-32', color: 'text-green-500' },
              { icon: InstagramIcon, label: 'Instagram', x: 'translate-x-48 -translate-y-32', color: 'text-pink-500' },
              { icon: TelegramIcon, label: 'Telegram', x: '-translate-x-48 translate-y-32', color: 'text-blue-500' },
              { icon: FacebookIcon, label: 'Facebook', x: 'translate-x-48 translate-y-32', color: 'text-blue-600' },
            ].map((node, i) => (
              <motion.div
                key={i}
                className={`absolute ${node.x} z-20 flex flex-col items-center gap-3`}
                initial={{ opacity: 0, scale: 0 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="w-16 h-16 bg-gray-900/50 backdrop-blur-md rounded-2xl border border-white/10 flex items-center justify-center shadow-lg">
                  <node.icon className={`w-8 h-8 ${node.color}`} />
                </div>
                <span className="text-sm font-medium text-gray-400">{node.label}</span>
                
                {/* Connection Line (Simulated with absolute positioning relative to center) */}
                {/* Note: In a real production app, SVG lines would be more precise, but this works for the visual effect */}
              </motion.div>
            ))}

            {/* Animated Particles (Data Flow) */}
            <div className="absolute inset-0 pointer-events-none">
               {/* We can use SVGs for the connecting lines and particles */}
               <svg className="w-full h-full visible">
                  <defs>
                    <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="rgba(255,255,255,0)" />
                      <stop offset="50%" stopColor="rgba(255,255,255,0.1)" />
                      <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                    </linearGradient>
                  </defs>
                  {/* Lines from center to approximate node positions */}
                  {/* Top Left */}
                  <line x1="50%" y1="50%" x2="35%" y2="30%" stroke="url(#lineGradient)" strokeWidth="1" />
                  <circle r="2" fill="#fff">
                    <animateMotion dur="2s" repeatCount="indefinite" path="M 500 300 L 350 180" />
                  </circle>
                  
                  {/* Top Right */}
                  <line x1="50%" y1="50%" x2="65%" y2="30%" stroke="url(#lineGradient)" strokeWidth="1" />
                  <circle r="2" fill="#fff">
                    <animateMotion dur="2.5s" repeatCount="indefinite" path="M 650 180 L 500 300" />
                  </circle>

                  {/* Bottom Left */}
                  <line x1="50%" y1="50%" x2="35%" y2="70%" stroke="url(#lineGradient)" strokeWidth="1" />
                  <circle r="2" fill="#fff">
                    <animateMotion dur="3s" repeatCount="indefinite" path="M 350 420 L 500 300" />
                  </circle>

                  {/* Bottom Right */}
                  <line x1="50%" y1="50%" x2="65%" y2="70%" stroke="url(#lineGradient)" strokeWidth="1" />
                  <circle r="2" fill="#fff">
                    <animateMotion dur="2.2s" repeatCount="indefinite" path="M 500 300 L 650 420" />
                  </circle>
               </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid (Existing) */}
      <section id="features" className='py-24 relative'>
        <div className='container mx-auto px-4'>
          <div className='text-center max-w-3xl mx-auto mb-16'>
            <h2 className='text-3xl sm:text-4xl font-bold mb-4'>Everything you need to close more deals</h2>
            <p className='text-muted-foreground text-lg'>Stop switching apps. LeadsBox brings your entire sales workflow into one powerful, AI-enhanced dashboard.</p>
          </div>

          <div className='grid md:grid-cols-3 gap-8'>
            {[
              {
                icon: <MessageCircle className="w-6 h-6 text-primary" />,
                title: "Unified Inbox",
                desc: "Manage WhatsApp, Instagram, and Telegram chats in one place. No more tab switching."
              },
              {
                icon: <Zap className="w-6 h-6 text-yellow-500" />,
                title: "AI Auto-Tagging",
                desc: "Instantly identify high-value leads. Our AI analyzes sentiment and intent automatically."
              },
              {
                icon: <BarChart3 className="w-6 h-6 text-green-500" />,
                title: "Revenue Analytics",
                desc: "Track conversion rates, response times, and total sales directly from your dashboard."
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full bg-background/50 backdrop-blur-sm border-white/10 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5 group">
                  <CardContent className="p-8">
                    <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials - Human Touch */}
      <section className='py-24 bg-muted/30'>
        <div className='container mx-auto px-4'>
          <div className='flex flex-col md:flex-row justify-between items-end mb-12 gap-6'>
            <div>
              <h2 className='text-3xl font-bold mb-2'>Loved by modern teams</h2>
              <p className='text-muted-foreground'>Don't just take our word for it.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="rounded-full">View all stories</Button>
            </div>
          </div>

          <div className='grid md:grid-cols-3 gap-6'>
            {[
              {
                quote: "We closed 27% more deals just by following up on-time. The AI tags are scarily accurate.",
                author: "Ada T.",
                role: "Founder, DMM Studio",
                avatar: "A"
              },
              {
                quote: "Everything in one place. Our team moves leads from chat to paid with zero chaos.",
                author: "Moyo A.",
                role: "COO, GrowthCraft",
                avatar: "M"
              },
              {
                quote: "The first tool that actually understands how we sell over DMs. It's a game changer.",
                author: "Chidi O.",
                role: "Creator, 120k followers",
                avatar: "C"
              }
            ].map((t, i) => (
              <Card key={i} className="border-none shadow-none bg-transparent">
                <CardContent className="p-0">
                  <div className="bg-background p-6 rounded-2xl rounded-bl-none border border-border shadow-sm mb-4 relative">
                    <p className="text-lg leading-relaxed">"{t.quote}"</p>
                  </div>
                  <div className="flex items-center gap-3 pl-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-bold">
                      {t.avatar}
                    </div>
                    <div>
                      <div className="font-semibold">{t.author}</div>
                      <div className="text-xs text-muted-foreground">{t.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className='py-24 relative overflow-hidden'>
        <div className="absolute inset-0 bg-primary/5" />
        <div className='container mx-auto px-4 relative z-10'>
          <div className='max-w-4xl mx-auto text-center space-y-8'>
            <h2 className='text-4xl sm:text-5xl font-bold tracking-tight'>
              Ready to upgrade your inbox?
            </h2>
            <p className='text-xl text-muted-foreground max-w-2xl mx-auto'>
              Join 2,000+ businesses and creators who are closing more deals with less effort.
            </p>
            
            <div className='flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto'>
              <div className="relative flex-1">
                <input
                  type="email"
                  placeholder="Enter your work email"
                  className="w-full h-12 px-4 rounded-full border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <Button 
                size="lg" 
                onClick={submit}
                disabled={state === 'loading'}
                className="rounded-full h-12 px-8 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25"
              >
                {state === 'loading' ? 'Joining...' : 'Join Waitlist'}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              <Shield className="w-3 h-3 inline mr-1" /> No credit card required. Unsubscribe anytime.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className='border-t border-white/10 bg-background py-12'>
        <div className='container mx-auto px-4'>
          <div className='flex flex-col md:flex-row justify-between items-center gap-6'>
            <div className='flex items-center gap-2'>
              <div className='w-8 h-8 bg-white p-1 rounded-sm flex items-center justify-center shadow-sm'>
                <LogoImage className="w-full h-full object-contain" />
              </div>
              <span className='font-semibold'>LeadsBox</span>
              <span className='text-muted-foreground text-sm ml-2'>© {new Date().getFullYear()}</span>
            </div>
            <div className='flex gap-6 text-sm text-muted-foreground'>
              <a href='#' className='hover:text-primary transition-colors'>Privacy</a>
              <a href='#' className='hover:text-primary transition-colors'>Terms</a>
              <a href='#' className='hover:text-primary transition-colors'>Twitter</a>
              <a href='#' className='hover:text-primary transition-colors'>Instagram</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
