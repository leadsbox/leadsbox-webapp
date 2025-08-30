import React, { useEffect, useMemo, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Play, Moon, Sun } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

/**
 * LeadsBox — Modern landing page with design system integration
 */

const META = {
  title: 'LeadsBox — Turn Social DMs into Revenue',
  description:
    'One inbox for WhatsApp + Instagram. AI tags leads, schedules follow-ups, and tracks deals to “paid”. Built for creators and modern businesses.',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://leadsbox.app',
  image: '/leadboxlogo.png',
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

function WhatsAppIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox='0 0 32 32' aria-hidden='true' {...props}>
      <path
        fill='#25D366'
        d='M.5 16C.5 7.44 7.44.5 16 .5S31.5 7.44 31.5 16 24.56 31.5 16 31.5c-2.69 0-5.2-.68-7.39-1.88L.5 31.5l1.96-7.88A15.4 15.4 0 0 1 .5 16Z'
      />
      <path
        fill='#fff'
        d='M22.87 18.78c-.13-.21-.48-.34-1-.6-.52-.26-3.05-1.5-3.53-1.67-.48-.17-.83-.26-1.17.26-.34.52-1.34 1.67-1.64 2.01-.3.34-.6.39-1.12.13-.52-.26-2.2-.81-4.2-2.57-1.56-1.39-2.61-3.12-2.92-3.64-.3-.52-.03-.8.23-1.06.24-.24.52-.61.78-.91.26-.3.34-.52.52-.87.17-.35.09-.65-.05-.91-.13-.26-1.17-2.83-1.6-3.88-.42-1.06-.85-.9-1.17-.91-.3-.02-.65-.02-1-.02-.35 0-.91.13-1.39.65-.48.52-1.83 1.78-1.83 4.35s1.88 5.05 2.14 5.4c.26.35 3.7 5.65 8.97 7.9 1.25.54 2.22.86 2.99 1.1 1.26.4 2.41.34 3.32.2 1.01-.15 3.05-1.25 3.48-2.46.43-1.22.43-2.26.3-2.48Z'
      />
    </svg>
  );
}

function TelegramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox='0 0 240 240' aria-hidden='true' {...props}>
      <circle cx='120' cy='120' r='120' fill='#2AABEE' />
      <path
        fill='#fff'
        d='M50 118l125-48c6-2 12 3 10 9l-24 113c-1 5-7 8-12 5l-45-33-23 22c-2 2-6 1-7-2l-8-38 93-59c3-2-.5-6-3-4l-107 67-37-13c-6-2-6-10 0-12Z'
      />
    </svg>
  );
}

function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox='0 0 24 24' aria-hidden='true' {...props}>
      <defs>
        <linearGradient id='ig' x1='0%' y1='0%' x2='100%' y2='100%'>
          <stop offset='0%' stopColor='#F58529' />
          <stop offset='50%' stopColor='#DD2A7B' />
          <stop offset='100%' stopColor='#8134AF' />
        </linearGradient>
      </defs>
      <rect x='2' y='2' width='20' height='20' rx='5' fill='url(#ig)' />
      <circle cx='12' cy='12' r='4' fill='#fff' />
      <circle cx='17.5' cy='6.5' r='1.2' fill='#fff' />
      <circle cx='12' cy='12' r='2.5' fill='url(#ig)' />
    </svg>
  );
}

function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox='0 0 24 24' aria-hidden='true' {...props}>
      <path fill='currentColor' d='M9.5 16.2 4.8 11.5l-1.3 1.3 6 6 11-11-1.3-1.3-9.7 9.7Z' />
    </svg>
  );
}

function ArrowIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox='0 0 24 24' aria-hidden='true' {...props}>
      <path fill='currentColor' d='M12 4v2.8l4.6.1-8.7 8.7 2 2 8.7-8.7.1 4.6H22V4h-10Z' />
    </svg>
  );
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

const Index = () => {
  useDocumentMeta(META);
  const { email, setEmail, role, setRole, handle, setHandle, state, submit } = useEmailCapture();
  const { theme, setTheme } = useTheme();
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const ThemeIcon = useMemo(() => (theme === 'dark' ? Sun : Moon), [theme]);

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <a href="/" className="flex items-center gap-3 transition-transform hover:scale-105">
            <div className="w-8 h-8 bg-white p-1 rounded-sm flex items-center justify-center">
              <img src="/leadsboxlogo.svg" alt="LeadsBox Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-xl font-semibold">LeadsBox</span>
          </a>

          <nav className="hidden md:flex items-center gap-6">
            <a href="#product" className="text-muted-foreground hover:text-primary transition-colors">Product</a>
            <a href="#how-it-works" className="text-muted-foreground hover:text-primary transition-colors">How it Works</a>
            <a href="#pricing" className="text-muted-foreground hover:text-primary transition-colors">Pricing</a>
            <a href="#creators" className="text-muted-foreground hover:text-primary transition-colors">For Creators</a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Button variant="ghost" size="icon" aria-label="Toggle theme" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              <ThemeIcon className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <a href="/login">Login</a>
            </Button>
            <Dialog open={waitlistOpen} onOpenChange={setWaitlistOpen}>
              <DialogTrigger asChild>
                <Button size="sm" data-cta="nav_join_waitlist">Join Waitlist</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Join the Waitlist</DialogTitle>
                  <DialogDescription>Be first to access the unified DM inbox.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="wl-email">Email</Label>
                    <Input id="wl-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@business.com" />
                  </div>
                  <div className="grid gap-2">
                    <Label>Role</Label>
                    <Select value={role} onValueChange={(v: undefined) => setRole(v)}>
                      <SelectTrigger aria-label="Select your role">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="business">Business</SelectItem>
                        <SelectItem value="creator">Creator</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="wl-handle">Handle or link (optional)</Label>
                    <Input id="wl-handle" value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="@yourhandle or site" />
                  </div>
                  <Button className="w-full" onClick={submit} data-cta="modal_join_waitlist">
                    {state === 'loading' ? 'Submitting…' : state === 'ok' ? 'Added ✓' : 'Join Waitlist'}
                  </Button>
                  <p className="text-xs text-muted-foreground">No spam. We’ll reach out with early access details.</p>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16" id="product">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-8">
            <div className="space-y-6 animate-slide-in-left">
              <div className="-mt-4">
                <Badge variant="secondary" className="flex w-fit items-center gap-2">
                  <WhatsAppIcon className="h-4 w-4" />
                  <span>&</span>
                  <InstagramIcon className="h-4 w-4" />
                  <span>&</span>
                  <TelegramIcon className="h-4 w-4" />
                  <span>Chat-commerce integration now live →</span>
                </Badge>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">Turn social DMs into revenue.</h1>
              <p className="text-lg text-muted-foreground max-w-xl">One inbox for WhatsApp + Instagram with AI that tags, follows up, and nudges deals to paid.</p>
            </div>

            <div className="space-y-4" id="waitlist">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button className="w-full sm:w-auto" size="lg" onClick={() => setWaitlistOpen(true)} data-cta="hero_join_waitlist">Join the Waitlist</Button>
                <Dialog open={demoOpen} onOpenChange={setDemoOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="lg" className="w-full sm:w-auto" data-cta="hero_demo">
                      <Play className="h-4 w-4 mr-2" /> See a 60‑sec Demo
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>LeadsBox in 60 seconds</DialogTitle>
                      <DialogDescription>Quick walkthrough of the unified inbox and AI follow‑ups.</DialogDescription>
                    </DialogHeader>
                    <div className="aspect-video w-full overflow-hidden rounded-md border">
                      <iframe
                        title="LeadsBox demo"
                        className="h-full w-full"
                        src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              {/* Social proof stripe */}
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="flex -space-x-2">
                  {["A","J","S","M","P"].map((ch, i) => (
                    <div key={i} className="h-6 w-6 rounded-full border border-border bg-gradient-to-br from-primary/50 to-accent/50 text-[10px] font-bold text-foreground flex items-center justify-center" aria-hidden>
                      {ch}
                    </div>
                  ))}
                </div>
                <span>2,000+ conversations organized last month</span>
              </div>
            </div>
            
            <Badge variant="outline" className="w-fit">Reply faster • Never miss a lead • Know what works</Badge>
          </div>

          {/* Product Demo */}
          <div className="lg:col-span-6">
            <Card className="relative overflow-hidden animate-slide-in-right">
              <div className="absolute inset-0 bg-gradient-primary opacity-5" />
              <CardContent className="p-0">
                {/* Chat Header */}
                <div className="flex items-center gap-3 p-4 border-b border-border bg-muted/50">
                  <div className="w-8 h-8 bg-white p-1 rounded-sm flex items-center justify-center">
                    <img src="/leadsboxlogo.svg" alt="LeadsBox Logo" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <div className="font-medium">LeadsBox Bot</div>
                    <div className="text-xs text-muted-foreground">WhatsApp • Online</div>
                  </div>
                </div>

                {/* Chat Messages */}
                <div className="p-4 space-y-3 bg-background/50">
                  <div className="max-w-[80%] rounded-lg bg-muted px-4 py-2 text-sm">New DM: “Is the Pro Plan still available?”</div>
                  <div className="max-w-[80%] ml-auto rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground">Tag: High intent • Add follow‑up</div>
                  <div className="max-w-[80%] rounded-lg bg-muted px-4 py-2 text-sm">Auto‑follow‑up scheduled for tomorrow 9:00am ✅</div>
                  <div className="max-w-[80%] ml-auto rounded-lg bg-accent px-4 py-2 text-sm text-accent-foreground">Move to “Qualified → Demo scheduled”</div>
                </div>

                {/* Chat Input */}
                <div className="p-4 border-t border-border bg-background/80">
                  <div className="flex gap-2">
                    <Input placeholder="Type a message..." className="flex-1" />
                    <Button size="sm">Send</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            <p className="mt-4 text-xs text-muted-foreground text-center">
              Live demo of WhatsApp integration
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="container mx-auto px-4 py-16 bg-muted/30">
        <div className="grid lg:grid-cols-3 gap-6">
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
            <Card key={i} className="h-full">
              <CardContent className="p-6 space-y-3">
                <p className="text-sm leading-relaxed">“{t.quote}”</p>
                <p className="text-xs text-muted-foreground">{t.name}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Businesses vs Creators */}
      <section id="creators" className="container mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6 space-y-3">
              <Badge variant="secondary">For Businesses</Badge>
              <h3 className="text-2xl font-semibold">Never miss money in the DMs</h3>
              <p className="text-muted-foreground">Reply faster, keep context, and track chats to “paid”.</p>
              <div className="flex gap-3 pt-2">
                <Button onClick={() => setWaitlistOpen(true)} data-cta="business_join">Join as Business</Button>
                <Button variant="outline" asChild>
                  <a href="/dashboard">Try Dashboard</a>
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 space-y-3">
              <Badge variant="secondary">For Creators</Badge>
              <h3 className="text-2xl font-semibold">Earn on referrals, get a VIP inbox</h3>
              <p className="text-muted-foreground">Partner with LeadsBox brands and own your upside.</p>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setWaitlistOpen(true)} data-cta="creator_join">Join as Creator</Button>
                <Button asChild>
                  <a href="#waitlist">Get Early Access</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Integrations */}
      <section className="container mx-auto px-4 py-12">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-sm text-muted-foreground">Works with your channels</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Badge variant="outline" className="flex items-center gap-2">
              <WhatsAppIcon className="h-4 w-4" /> WhatsApp Business
            </Badge>
            <Badge variant="outline" className="flex items-center gap-2">
              <InstagramIcon className="h-4 w-4" /> Instagram
            </Badge>
            <Badge variant="outline" className="flex items-center gap-2">
              <TelegramIcon className="h-4 w-4" /> Telegram
            </Badge>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-16 bg-muted/30">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl font-bold">Built for chat‑commerce</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Invoice where the conversation happens. Stop copying & pasting. Start cashing in.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[
            { title: 'Unified Inbox', desc: 'One place for WhatsApp + Instagram. See context, not chaos.', icon: '📥' },
            { title: 'AI Lead Tagging', desc: 'Auto‑detect intent and prioritize hot leads instantly.', icon: '🤖' },
            { title: 'Smart Follow‑ups', desc: 'Schedule nudges that feel human and convert more.', icon: '🔔' },
            { title: 'Pipeline Stages', desc: 'Move chats from “new” to “paid” with clarity.', icon: '🧭' },
            { title: 'Essential Analytics', desc: 'Know what responses drive revenue. Track time to close.', icon: '📊' },
            { title: 'Team Ready', desc: 'Assign owners, mention teammates, never drop a lead.', icon: '👥' },
          ].map((feature, i) => (
            <Card key={i} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="text-2xl">{feature.icon}</div>
                  <div>
                    <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">{feature.desc}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="container mx-auto px-4 py-16">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl font-bold">How it works</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            { step: '1', title: 'Connect', desc: 'Secure setup — connect WhatsApp Business & Instagram in minutes.' },
            { step: '2', title: 'Organize', desc: 'AI tags intent, auto‑assigns owners, and creates follow‑ups.' },
            { step: '3', title: 'Convert', desc: 'Pipeline + nudges move conversations toward “paid”.' },
          ].map((step, i) => (
            <div key={i} className="relative text-center group">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground px-3 py-1">
                  Step {step.step}
                </Badge>
              </div>
              <Card className="pt-8 group-hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground">{step.desc}</p>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="container mx-auto px-4 py-16 bg-muted/30">
        <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <Badge variant="secondary">Starter</Badge>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">₦0</span>
                <span className="text-muted-foreground">/ month</span>
              </div>
              <ul className="space-y-2 text-sm">
                {['Unified inbox', 'AI tagging (starter)', 'Basic pipeline', 'Simple analytics'].map((f, i) => (
                  <li key={i} className="flex items-center gap-2"><CheckIcon className="h-4 w-4 text-success" /> {f}</li>
                ))}
              </ul>
              <Button className="w-full" onClick={() => setWaitlistOpen(true)} data-cta="pricing_starter">Lock Early Access</Button>
            </CardContent>
          </Card>
          <Card className="border-primary/30">
            <CardContent className="p-6 space-y-4">
              <Badge>Pro</Badge>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">₦</span>
                <span className="text-muted-foreground">Early-bird</span>
              </div>
              <ul className="space-y-2 text-sm">
                {['Everything in Starter', 'Advanced AI follow‑ups', 'Team assignments', 'Detailed analytics'].map((f, i) => (
                  <li key={i} className="flex items-center gap-2"><CheckIcon className="h-4 w-4 text-success" /> {f}</li>
                ))}
              </ul>
              <Button variant="outline" className="w-full" onClick={() => setWaitlistOpen(true)} data-cta="pricing_pro">Lock Early Access</Button>
              <p className="text-xs text-muted-foreground">Influencer partners get special rev‑share.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FAQ */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-6">FAQ</h2>
          <div className="divide-y">
            {[
              ['Is my data secure?', 'Yes. We use industry‑standard encryption and never sell your data.'],
              ['How long to onboard?', 'Minutes. Connect channels and start organizing conversations.'],
              ['Which channels are supported?', 'WhatsApp and Instagram today. Telegram and Facebook soon.'],
              ['Does AI send messages for me?', 'You control it. Create friendly nudges and reminders that feel human.'],
              ['How does early access pricing work?', 'Lock in discounts now. We’ll honor them when we launch billing.'],
              ['Can creators partner with LeadsBox?', 'Yes. Join the waitlist and we’ll send partner details.'],
            ].map(([q, a], i) => (
              <details key={i} className="group py-4">
                <summary className="cursor-pointer list-none font-medium flex items-center justify-between">
                  <span>{q}</span>
                  <span className="text-muted-foreground group-open:rotate-180 transition-transform">⌄</span>
                </summary>
                <p className="mt-2 text-sm text-muted-foreground">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="container mx-auto px-4 pb-16" id="waitlist-cta">
        <Card className="max-w-3xl mx-auto">
          <CardContent className="p-6 space-y-4">
            <h3 className="text-2xl font-semibold">Ready to turn DMs into revenue?</h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@business.com"
                className="flex-1"
                onKeyPress={(e) => e.key === 'Enter' && submit()}
              />
              <Button onClick={submit} disabled={state === 'loading'} className="transition-all hover:scale-105" data-cta="footer_join_waitlist">
                {state === 'loading' ? 'Joining…' : state === 'ok' ? "You're in! ✓" : 'Join Waitlist'}
              </Button>
            </div>
            {state === 'error' && (
              <p className="text-sm text-destructive">Please enter a valid email address</p>
            )}
            <p className="text-sm text-muted-foreground">No spam. We’ll email you when your workspace is ready.</p>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/50">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white p-1 rounded-sm flex items-center justify-center">
                <img src="/leadsboxlogo.svg" alt="LeadsBox Logo" className="w-full h-full object-contain" />
              </div>
              <span className="font-semibold">LeadsBox</span>
              <span className="text-muted-foreground">© {new Date().getFullYear()}</span>
            </div>
            
            <nav className="flex flex-wrap items-center gap-6 text-sm">
              <a href="#features" className="text-muted-foreground hover:text-primary transition-colors">
                Features
              </a>
              <a href="#how-it-works" className="text-muted-foreground hover:text-primary transition-colors">
                How it works
              </a>
              <a href="#pricing" className="text-muted-foreground hover:text-primary transition-colors">
                Pricing
              </a>
              <a href="/dashboard" className="text-muted-foreground hover:text-primary transition-colors">
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
