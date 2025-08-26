import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/**
 * LeadsBox — Modern landing page with design system integration
 */

const META = {
  title: 'LeadsBox — Turn DMs into Revenue',
  description: 'Create and send invoices from WhatsApp & Telegram. Track payments, send receipts, and organize sales—without leaving your DMs.',
  url: 'https://leadsbox.app',
};

function useDocumentMeta(meta: typeof META) {
  useEffect(() => {
    document.title = meta.title;
    const description = document.querySelector('meta[name="description"]') || document.createElement('meta');
    description.setAttribute('name', 'description');
    description.setAttribute('content', meta.description);
    if (!document.head.contains(description)) {
      document.head.appendChild(description);
    }
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
  
  const submit = async () => {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setState('error');
      return;
    }
    setState('loading');
    await new Promise((r) => setTimeout(r, 800));
    setState('ok');
  };
  
  return { email, setEmail, state, submit };
}

const Index = () => {
  useDocumentMeta(META);
  const { email, setEmail, state, submit } = useEmailCapture();

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <a href="/" className="flex items-center gap-3 transition-transform hover:scale-105">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-sm font-bold text-primary-foreground">LB</span>
            </div>
            <span className="text-xl font-semibold">LeadsBox</span>
          </a>

          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-muted-foreground hover:text-primary transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-muted-foreground hover:text-primary transition-colors">
              How it works
            </a>
            <a href="#pricing" className="text-muted-foreground hover:text-primary transition-colors">
              Pricing
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" asChild>
              <a href="/dashboard">
                <ArrowIcon className="h-4 w-4 mr-2" />
                Dashboard
              </a>
            </Button>
            <Button size="sm" asChild>
              <a href="#waitlist">Get Started</a>
            </Button>
          </div>
        </div>
      </header>

      {/* Announcement Banner */}
      <div className="container mx-auto px-4 pt-6">
        <Badge variant="secondary" className="mx-auto flex w-fit items-center gap-2 animate-fade-in">
          <WhatsAppIcon className="h-4 w-4" />
          <span>&</span>
          <TelegramIcon className="h-4 w-4" />
          <span>Chat-commerce integration now live →</span>
        </Badge>
      </div>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-8">
            <div className="space-y-6 animate-slide-in-left">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
                Turn{" "}
                <span className="bg-gradient-primary bg-clip-text text-transparent">
                  DMs
                </span>{" "}
                into revenue
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl">
                Create and send invoices from WhatsApp & Telegram. Track payments, 
                send receipts, and organize sales—without leaving your DMs.
              </p>
            </div>

            <div className="space-y-4" id="waitlist">
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@business.com"
                  className="flex-1"
                  onKeyPress={(e) => e.key === 'Enter' && submit()}
                />
                <Button onClick={submit} disabled={state === 'loading'} className="transition-all hover:scale-105">
                  {state === 'loading' ? 'Joining…' : state === 'ok' ? "You're in! ✓" : 'Join Waitlist'}
                </Button>
              </div>
              {state === 'error' && (
                <p className="text-sm text-destructive">Please enter a valid email address</p>
              )}
              <p className="text-sm text-muted-foreground">
                No spam. We'll email you when your workspace is ready.
              </p>
            </div>

            <Badge variant="outline" className="w-fit">
              <CheckIcon className="h-4 w-4 mr-2 text-success" />
              Chat. Invoice. Get paid. Repeat.
            </Badge>
          </div>

          {/* Product Demo */}
          <div className="lg:col-span-6">
            <Card className="relative overflow-hidden animate-slide-in-right">
              <div className="absolute inset-0 bg-gradient-primary opacity-5" />
              <CardContent className="p-0">
                {/* Chat Header */}
                <div className="flex items-center gap-3 p-4 border-b border-border bg-muted/50">
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-xs font-bold text-primary-foreground">LB</span>
                  </div>
                  <div>
                    <div className="font-medium">LeadsBox Bot</div>
                    <div className="text-xs text-muted-foreground">WhatsApp • Online</div>
                  </div>
                </div>

                {/* Chat Messages */}
                <div className="p-4 space-y-3 bg-background/50">
                  <div className="max-w-[80%] rounded-lg bg-muted px-4 py-2 text-sm">
                    Hi! Ready to create an invoice for John Doe?
                  </div>
                  <div className="max-w-[80%] ml-auto rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground">
                    Yes — 2x Premium Plan @ ₦25,000
                  </div>
                  <div className="max-w-[80%] rounded-lg bg-muted px-4 py-2 text-sm">
                    Invoice created ✅ PDF attached. Send now?
                  </div>
                  <div className="max-w-[80%] ml-auto rounded-lg bg-accent px-4 py-2 text-sm text-accent-foreground">
                    Send now
                  </div>
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
            { title: 'Instant Invoicing', desc: 'Generate invoices from WhatsApp & Telegram chats in seconds', icon: '⚡' },
            { title: 'Branded PDFs', desc: 'Send polished, branded PDF invoices with your logo and terms', icon: '📄' },
            { title: 'Smart Reminders', desc: 'Follow up right inside the chat — no app switching needed', icon: '🔔' },
            { title: 'Payment Tracking', desc: 'See who viewed, who paid, and who needs a nudge', icon: '📊' },
            { title: 'Contact Management', desc: 'Auto-build contacts & sales history from conversations', icon: '👥' },
            { title: 'Real‑time Alerts', desc: 'Get notified the moment an invoice is opened or paid', icon: '🚨' },
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
            { step: '1', title: 'Connect', desc: 'Secure setup — connect WhatsApp Business & Telegram in minutes' },
            { step: '2', title: 'Chat', desc: 'Keep selling where you talk. Create invoices without leaving chat' },
            { step: '3', title: 'Get Paid', desc: 'Track payments and automate reminders from your dashboard' },
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
        <Card className="max-w-4xl mx-auto">
          <CardContent className="p-8">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold mb-2">Simple pricing that scales</h3>
                  <p className="text-muted-foreground">Start free while you validate. Upgrade when you grow.</p>
                </div>
                
                <div className="space-y-3">
                  {[
                    'Unlimited invoices',
                    'Branded PDFs & receipts', 
                    'Payment tracking & reminders',
                    'WhatsApp & Telegram integration'
                  ].map((feature, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <CheckIcon className="h-5 w-5 text-success" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Card className="bg-gradient-to-br from-primary/10 to-accent/10">
                <CardContent className="p-6">
                  <Badge variant="secondary" className="mb-4">Early Access</Badge>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold">₦0</span>
                      <span className="text-muted-foreground">/ month</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Limited spots. Early users keep benefits forever.
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <Button className="w-full" asChild>
                      <a href="#waitlist">Join Waitlist</a>
                    </Button>
                    <Button variant="outline" className="w-full" asChild>
                      <a href="/dashboard">Try Dashboard</a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/50">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="h-6 w-6 rounded bg-primary flex items-center justify-center">
                <span className="text-xs font-bold text-primary-foreground">LB</span>
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
