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
    <svg viewBox='0 0 24 24' aria-hidden='true' {...props}>
      <path d='M20.52 3.449c-2.28-2.204-5.28-3.449-8.475-3.449-9.17 0-14.928 9.935-10.349 17.838l-1.696 6.162 6.335-1.652c2.76 1.491 5.021 1.359 5.716 1.447 10.633 0 15.926-12.864 8.454-20.307z' fill='#eceff1'/>
      <path d='M12.067 21.751l-.006-.001h-.016c-3.182 0-5.215-1.507-5.415-1.594l-3.75.975 1.005-3.645-.239-.375c-.99-1.576-1.516-3.391-1.516-5.26 0-8.793 10.745-13.19 16.963-6.975 6.203 6.15 1.848 16.875-7.026 16.875z' fill='#4caf50'/>
      <path d='M17.507 14.307l-.009.075c-.301-.15-1.767-.867-2.04-.966-.613-.227-.44-.036-1.617 1.312-.175.195-.349.21-.646.075-.3-.15-1.263-.465-2.403-1.485-.888-.795-1.484-1.77-1.66-2.07-.293-.506.32-.578.878-1.634.1-.21.049-.375-.025-.524-.075-.15-.672-1.62-.922-2.206-.24-.584-.487-.51-.672-.51-.576-.05-.997-.042-1.368.344-1.614 1.774-1.207 3.604.174 5.55 2.714 3.552 4.16 4.206 6.804 5.114.714.227 1.365.195 1.88.121.574-.091 1.767-.721 2.016-1.426.255-.705.255-1.29.18-1.425-.074-.135-.27-.21-.57-.345z' fill='#fafafa'/>
    </svg>
  );
}

function TelegramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox='0 0 152 152' aria-hidden='true' {...props}>
      <defs>
        <linearGradient id='tgGradient' x1='76' x2='76' y1='0' y2='152' gradientUnits='userSpaceOnUse'>
          <stop offset='0' stopColor='#09c4f9'/>
          <stop offset='1' stopColor='#07b0f6'/>
        </linearGradient>
      </defs>
      <circle cx='76' cy='76' r='76' fill='url(#tgGradient)' />
      <path fill='#fff' d='M111.77 45.32c-.45.13-.87.33-1.3.5l-59.78 24.56q-6.43 2.62-12.85 5.39a1.57 1.57 0 0 0-.84.93c0 .2.47.6.79.81a8.09 8.09 0 0 0 1.28.55c7.13 2.88 14.25 5.79 21.39 8.62l.26.12 1.69 18.46a1.91 1.91 0 0 0 .21.74 1.31 1.31 0 0 0 2 .45c4-3.35 8-6.71 12-10.15a2 2 0 0 1 2.63-.24c5.61 3 11.26 6 16.9 9 3.34 1.77 3.36 1.76 4.19-1.94l10.14-45.63c.83-3.71 1.64-7.43 2.45-11.09.14-.91-.35-1.33-1.16-1.08zm-13.25 14.43q-13.52 14.88-26.99 29.76a9.56 9.56 0 0 0-1.3 1.86c-1.72 3.26-3.39 6.53-5.09 9.8l-1.29-14.12a1.76 1.76 0 0 1 .46-.62q18.48-15.24 37-30.4c.09-.07.21-.12.32-.19l.2.17q-1.63 1.88-3.31 3.74z'/>
    </svg>
  );
}

function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox='0 0 512 512' aria-hidden='true' {...props}>
      <defs>
        <linearGradient id='igGradient2' x1='328.27' y1='508.05' x2='183.73' y2='3.95' gradientUnits='userSpaceOnUse'>
          <stop offset='0' stopColor='#ffdb73'/>
          <stop offset='0.08' stopColor='#fdad4e'/>
          <stop offset='0.15' stopColor='#fb832e'/>
          <stop offset='0.19' stopColor='#fa7321'/>
          <stop offset='0.23' stopColor='#f6692f'/>
          <stop offset='0.37' stopColor='#e84a5a'/>
          <stop offset='0.48' stopColor='#e03675'/>
          <stop offset='0.55' stopColor='#dd2f7f'/>
          <stop offset='0.68' stopColor='#b43d97'/>
          <stop offset='0.97' stopColor='#4d60d4'/>
          <stop offset='1' stopColor='#4264db'/>
        </linearGradient>
      </defs>
      <rect x='23.47' y='23.47' width='465.06' height='465.06' rx='107.23' ry='107.23' fill='url(#igGradient2)' />
      <path fill='#fff' d='M331 115.22a66.92 66.92 0 0 1 66.65 66.65V330.13A66.92 66.92 0 0 1 331 396.78H181a66.92 66.92 0 0 1-66.65-66.65V181.87A66.92 66.92 0 0 1 181 115.22H331m0-31H181c-53.71 0-97.66 44-97.66 97.66V330.13c0 53.71 44 97.66 97.66 97.66H331c53.71 0 97.66-44 97.66-97.66V181.87c0-53.71-43.95-97.66-97.66-97.66Z'/>
      <path fill='#fff' d='M256 198.13A57.87 57.87 0 1 1 198.13 256 57.94 57.94 0 0 1 256 198.13m0-31A88.87 88.87 0 1 0 344.87 256 88.87 88.87 0 0 0 256 167.13Z'/>
      <circle cx='346.81' cy='163.23' r='21.07' fill='#fff'/>
    </svg>
  );
}

function FacebookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox='0 0 100 100' aria-hidden='true' {...props}>
      <path d='M50 2.5C-8.892 4.225-14.898 86.863 42.54 97.5H50h7.46C114.911 86.853 108.879 4.219 50 2.5z' fill='#1877f2'/>
      <path d='M57.46 64.104h11.125l2.117-13.814H57.46v-8.965c0-3.779 1.85-7.463 7.781-7.463h6.021V21.101c-12.894-2.323-28.385-1.616-28.722 17.66v10.529H30.417v13.814h12.123V86.5H50h7.46z' fill='#f1f1f1'/>
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
              <TelegramIcon className="h-4 w-4" /> Telegram
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-2 opacity-80">
              <InstagramIcon className="h-4 w-4" /> Instagram • Coming soon
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-2 opacity-80">
              <FacebookIcon className="h-4 w-4" /> Facebook • Coming soon
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
