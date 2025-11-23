import React from 'react';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const plans = [
  {
    name: 'Starter',
    price: 'Free',
    description: 'Essential tools for getting started with WhatsApp messaging.',
    features: [
      '1 Seat',
      'Unlimited inbox messaging (24h window)',
      'Basic contact management',
      'Single WhatsApp integration',
      'Community support',
    ],
    limitations: [
      'No automations',
      'No broadcast messaging',
    ],
    cta: 'Get Started',
    popular: false,
  },
  {
    name: 'Growth',
    price: '₦4,500',
    period: '/month',
    description: 'Automation and analytics for scaling teams.',
    features: [
      '5 Seats',
      'Everything in Starter',
      'Automations & Workflows',
      'Pipeline & Task Management',
      'Up to 3 WhatsApp numbers',
      'Email support (24h SLA)',
    ],
    cta: 'Start Free Trial',
    popular: true,
  },
  {
    name: 'Scale',
    price: '₦9,900',
    period: '/month',
    description: 'Advanced collaboration, reporting, and priority support.',
    features: [
      '15 Seats',
      'Everything in Growth',
      'Advanced Analytics Dashboards',
      'Unlimited WhatsApp numbers',
      'Role-based permissions',
      'Priority chat & phone support',
    ],
    cta: 'Contact Sales',
    popular: false,
  },
];

const PricingSection = () => {
  return (
    <section id="pricing" className="py-24 bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 max-w-6xl relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="outline" className="mb-4 border-primary/20 text-primary bg-primary/5">Pricing</Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Simple, transparent pricing</h2>
          <p className="text-xl text-muted-foreground">
            Start for free, upgrade as you grow. No hidden fees.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              className={`relative flex flex-col border-border transition-all duration-300 hover:shadow-xl ${
                plan.popular 
                  ? 'border-primary shadow-lg scale-105 z-10 bg-card' 
                  : 'bg-card/50 hover:bg-card'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground hover:bg-primary px-4 py-1">
                    Most Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="pb-8">
                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                <CardDescription className="mt-2 text-base min-h-[50px]">
                  {plan.description}
                </CardDescription>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.period && (
                    <span className="text-muted-foreground">{plan.period}</span>
                  )}
                </div>
              </CardHeader>

              <CardContent className="flex-1">
                <div className="space-y-4">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-3 text-sm">
                      <Check className="w-5 h-5 text-green-500 shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                  {plan.limitations?.map((limitation, i) => (
                    <div key={i} className="flex items-start gap-3 text-sm text-muted-foreground/70">
                      <X className="w-5 h-5 shrink-0" />
                      <span>{limitation}</span>
                    </div>
                  ))}
                </div>
              </CardContent>

              <CardFooter className="pt-8">
                <Button 
                  className={`w-full h-12 text-base font-semibold rounded-xl ${
                    plan.popular 
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20' 
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                  onClick={() => window.location.href = '/register'}
                >
                  {plan.cta}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
