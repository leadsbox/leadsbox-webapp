import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Share2, Zap, Gift, ArrowRight, CheckCircle2, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const ReferralProgram = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 pt-4">
        <div className="container mx-auto max-w-6xl">
          <nav className="bg-background/80 backdrop-blur-xl border border-border/50 rounded-full px-6 h-16 flex items-center justify-between shadow-sm">
            <Link to="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
              <div className="w-8 h-8 bg-white p-1 rounded-sm flex items-center justify-center shadow-sm border border-border/10">
                <img src="/leadsboxlogo.svg" alt="LeadsBox Logo" className="w-full h-full object-contain" />
              </div>
              LeadsBox
            </Link>
            <div className="flex items-center gap-3">
              <Button variant="ghost" asChild className="rounded-full">
                <Link to="/login">Log in</Link>
              </Button>
              <Button asChild className="rounded-full">
                <Link to="/register">Get Started</Link>
              </Button>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-4 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-purple-500/5 to-transparent rounded-[100%] blur-3xl -z-10 pointer-events-none" />
        
        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-600 mb-8">
              <Gift className="w-4 h-4" />
              <span className="text-sm font-medium">LeadsBox Referral Program</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-8">
              Share the love. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
                Earn free months.
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Give your friends 1 free month of LeadsBox Pro. When they subscribe, you get 1 free month too. No limits.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button asChild size="lg" className="h-14 px-8 text-lg rounded-full bg-foreground text-background hover:bg-foreground/90 shadow-xl">
                <Link to="/register">
                  Start Earning
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-muted/30 border-y border-border">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">How it works</h2>
            <p className="text-muted-foreground">Three simple steps to unlimited free usage</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Share your link',
                desc: 'Sign up to get your unique referral link. Share it on social media, email, or directly with friends.',
                icon: Share2,
                color: 'text-purple-500',
                bg: 'bg-purple-500/10'
              },
              {
                step: '02',
                title: 'They subscribe',
                desc: 'Your friend signs up and subscribes to any paid plan. They get their first month completely free.',
                icon: Zap,
                color: 'text-blue-500',
                bg: 'bg-blue-500/10'
              },
              {
                step: '03',
                title: 'You get rewarded',
                desc: 'We instantly add 1 free month to your account. Stack them up for years of free LeadsBox.',
                icon: Gift,
                color: 'text-green-500',
                bg: 'bg-green-500/10'
              }
            ].map((item, i) => (
              <Card key={i} className="border-border/50 bg-background relative overflow-hidden group hover:shadow-lg transition-all">
                <CardContent className="p-8">
                  <div className={`w-14 h-14 rounded-2xl ${item.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <item.icon className={`w-7 h-7 ${item.color}`} />
                  </div>
                  <div className="absolute top-8 right-8 text-6xl font-bold text-muted/20 select-none">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {item.desc}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
          </div>

          <Accordion type="single" collapsible className="w-full">
            {[
              {
                q: "Is there a limit to how much I can earn?",
                a: "No! There is absolutely no limit. If you refer 12 people who subscribe, you get a full year of LeadsBox for free."
              },
              {
                q: "When do I get my reward?",
                a: "You receive your free month credit immediately after your referred friend makes their first successful subscription payment."
              },
              {
                q: "Can I refer myself?",
                a: "No, self-referrals are flagged by our fraud detection system and will result in account suspension."
              },
              {
                q: "Do free months expire?",
                a: "No, your earned free months stay in your account until they are used."
              }
            ].map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger className="text-left text-lg font-medium">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-20 bg-foreground text-background">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to start earning?</h2>
          <p className="text-white/80 text-lg mb-10 max-w-2xl mx-auto">
            Join thousands of creators and businesses growing with LeadsBox.
          </p>
          <Button asChild size="lg" className="h-14 px-8 rounded-full text-lg font-bold bg-background text-foreground hover:bg-background/90">
            <Link to="/register">
              Get Your Referral Link
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default ReferralProgram;
