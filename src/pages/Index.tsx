import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { Moon, Sun, ArrowRight, Check, Star, Zap, MessageCircle, Users, BarChart3, Shield, Globe, Smartphone, CreditCard, Activity, Lock, Clock } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { WhatsAppIcon, TelegramIcon, InstagramIcon, FacebookIcon } from '@/components/brand-icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * LeadsBox — World-class Homepage Redesign
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
    <div className='min-h-screen w-full bg-background text-foreground overflow-x-hidden selection:bg-primary/20 selection:text-primary'>
      {/* Background Gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/5 blur-[120px]" />
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
      <header className='sticky top-0 z-50 border-b border-white/10 bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60'>
        <div className='container mx-auto flex h-16 items-center justify-between px-4'>
          <a href='/' className='flex items-center gap-3 group'>
            <div className='w-8 h-8 bg-white p-1 rounded-sm flex items-center justify-center shadow-lg shadow-primary/20 transition-transform group-hover:scale-105'>
              <LogoImage className='w-full h-full object-contain' />
            </div>
            <span className='text-xl font-bold tracking-tight'>LeadsBox</span>
          </a>

          <nav className='hidden md:flex items-center gap-8'>
            {['Product', 'How it Works', 'Pricing', 'For Creators'].map((item) => (
              <a 
                key={item} 
                href={`#${item.toLowerCase().replace(/ /g, '-')}`} 
                className='text-sm font-medium text-muted-foreground hover:text-primary transition-colors'
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
              className='rounded-full hover:bg-primary/10'
            >
              <ThemeIcon className='h-4 w-4' />
            </Button>
            <div className="hidden sm:flex gap-3">
              <Button variant='ghost' onClick={() => window.location.href = '/login'}>
                Login
              </Button>
              <Button 
                onClick={() => setWaitlistOpen(true)}
                className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
              >
                Join Waitlist
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className='relative pt-24 pb-32 overflow-hidden'>
        <div className='container mx-auto px-4 relative z-10'>
          <div className='grid lg:grid-cols-12 gap-16 items-center'>
            <motion.div 
              className='lg:col-span-7 space-y-8'
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
            >
              <motion.div variants={fadeInUp}>
                <Badge variant='outline' className='bg-primary/5 border-primary/20 text-primary px-4 py-1.5 rounded-full mb-6 backdrop-blur-sm'>
                  <span className="relative flex h-2 w-2 mr-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                  New: WhatsApp & Instagram Integration Live
                </Badge>
                <h1 className='text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6'>
                  Turn Social DMs <br/>
                  <span className='text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-500 to-pink-500 animate-gradient-x'>
                    Into Revenue
                  </span>
                </h1>
                <p className='text-xl text-muted-foreground max-w-xl leading-relaxed'>
                  The unified inbox for modern businesses. AI that tags leads, automates follow-ups, and closes deals while you sleep.
                </p>
              </motion.div>

              <motion.div variants={fadeInUp} className='flex flex-col sm:flex-row gap-4'>
                <Button 
                  size='lg' 
                  onClick={() => setWaitlistOpen(true)} 
                  className='h-12 px-8 text-base rounded-full bg-primary hover:bg-primary/90 shadow-xl shadow-primary/25 transition-all hover:scale-105'
                >
                  Get Early Access <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button 
                  variant='outline' 
                  size='lg' 
                  onClick={() => setDemoOpen(true)}
                  className='h-12 px-8 text-base rounded-full border-2 hover:bg-muted/50 backdrop-blur-sm'
                >
                  Watch Demo (60s)
                </Button>
              </motion.div>

              <motion.div variants={fadeInUp} className='pt-8 flex items-center gap-6 text-sm text-muted-foreground'>
                <div className='flex -space-x-3'>
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className={`w-10 h-10 rounded-full border-2 border-background bg-gradient-to-br from-gray-100 to-gray-300 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center text-xs font-bold shadow-sm z-${10-i}`}>
                      <Users className="h-4 w-4 opacity-50" />
                    </div>
                  ))}
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1 text-foreground font-medium">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  </div>
                  <span>Trusted by 2,000+ creators</span>
                </div>
              </motion.div>
            </motion.div>

            {/* Hero Visual */}
            <motion.div 
              className='lg:col-span-5 relative'
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-purple-500/20 rounded-[2rem] blur-3xl -z-10" />
              <Card className="bg-background/40 backdrop-blur-xl border-white/10 shadow-2xl rounded-[2rem] overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-4 border-b border-white/5 flex items-center gap-3 bg-white/5">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500/80" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                      <div className="w-3 h-3 rounded-full bg-green-500/80" />
                    </div>
                    <div className="mx-auto text-xs font-medium text-muted-foreground bg-black/20 px-3 py-1 rounded-full">
                      leadsbox.app
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    {/* Chat Interface Mockup */}
                    <div className="space-y-4">
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs">JD</div>
                        <div className="bg-white/10 p-3 rounded-2xl rounded-tl-none max-w-[80%] text-sm">
                          Hi! I'm interested in the Pro plan. Do you offer team training?
                        </div>
                      </div>
                      
                      <div className="flex gap-2 justify-center my-4">
                        <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer transition-colors">
                          <Zap className="w-3 h-3 mr-1" /> High Intent Detected
                        </Badge>
                        <Badge variant="secondary" className="bg-green-500/10 text-green-500 hover:bg-green-500/20 cursor-pointer transition-colors">
                          <Check className="w-3 h-3 mr-1" /> Auto-reply Ready
                        </Badge>
                      </div>

                      <div className="flex gap-3 flex-row-reverse">
                        <div className="w-8 h-8 rounded-full bg-primary p-1.5">
                          <LogoImage className="w-full h-full object-contain" />
                        </div>
                        <div className="bg-primary p-3 rounded-2xl rounded-tr-none max-w-[80%] text-sm text-primary-foreground shadow-lg shadow-primary/20">
                          Absolutely! The Pro plan includes 2 hours of dedicated team onboarding. Would you like to book a slot?
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Bar */}
                    <div className="pt-4 mt-4 border-t border-white/10 flex gap-2">
                      <div className="h-10 flex-1 bg-white/5 rounded-full px-4 flex items-center text-sm text-muted-foreground">
                        Type a message...
                      </div>
                      <Button size="icon" className="rounded-full h-10 w-10">
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
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
