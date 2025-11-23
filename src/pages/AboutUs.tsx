import React from 'react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/context/ThemeContext';
import { Moon, Sun, Users, Target, Heart, Zap, Globe, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';

const AboutUs: React.FC = () => {
  const { resolvedTheme, setTheme } = useTheme();
  const ThemeIcon = resolvedTheme === 'dark' ? Sun : Moon;
  const LogoMark = ({ priority = false }: { priority?: boolean }) => (
    <img
      src='/leadsboxlogo.svg'
      alt='LeadsBox Logo'
      width={24}
      height={24}
      className='h-full w-full object-contain'
      decoding='async'
      fetchPriority={priority ? 'high' : undefined}
      loading={priority ? 'eager' : 'lazy'}
    />
  );

  return (
    <div className='min-h-screen w-full bg-background text-foreground'>
      {/* Navigation */}
      <header className='sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md'>
        <div className='container mx-auto flex h-16 items-center justify-between px-4'>
          <a href='/' className='flex items-center gap-3 transition-transform hover:scale-105'>
            <div className='w-8 h-8 bg-white p-1 rounded-sm flex items-center justify-center'>
              <LogoMark priority />
            </div>
            <span className='text-xl font-semibold'>LeadsBox</span>
         </a>

          <div className='flex items-center gap-2 sm:gap-3'>
            <Button variant='ghost' size='icon' aria-label='Toggle theme' onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}>
              <ThemeIcon className='h-4 w-4' />
            </Button>
            <Button variant='ghost' size='sm' asChild>
              <a href='/login'>Login</a>
            </Button>
            <Button size='sm' asChild>
              <a href='/register'>Get Started</a>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className='pt-20 pb-12 px-4 bg-gradient-to-b from-primary/5 to-transparent'>
        <div className='container mx-auto max-w-4xl text-center'>
          <h1 className='text-4xl sm:text-5xl font-bold mb-6'>About LeadsBox</h1>
          <p className='text-xl text-muted-foreground max-w-2xl mx-auto'>
            We're building the revenue engine that helps businesses turn social conversations into sales.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className='py-16 px-4'>
        <div className='container mx-auto max-w-6xl'>
          <div className='grid md:grid-cols-3 gap-8'>
            <Card className='border-border'>
              <CardContent className='p-8 text-center'>
                <div className='w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-4'>
                  <Target className='w-6 h-6 text-blue-600' />
                </div>
                <h3 className='text-xl font-bold mb-3'>Our Mission</h3>
                <p className='text-muted-foreground'>
                  Empower businesses to sell more with less effort by unifying their messaging channels into one intelligent platform.
                </p>
              </CardContent>
            </Card>

            <Card className='border-border'>
              <CardContent className='p-8 text-center'>
                <div className='w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-4'>
                  <Heart className='w-6 h-6 text-purple-600' />
                </div>
                <h3 className='text-xl font-bold mb-3'>Our Values</h3>
                <p className='text-muted-foreground'>
                  Customer success, simplicity, transparency, and innovation drive everything we do.
                </p>
              </CardContent>
            </Card>

            <Card className='border-border'>
              <CardContent className='p-8 text-center'>
                <div className='w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4'>
                  <Zap className='w-6 h-6 text-green-600' />
                </div>
                <h3 className='text-xl font-bold mb-3'>Our Vision</h3>
                <p className='text-muted-foreground'>
                  Become the #1 revenue platform for businesses leveraging social messaging to grow.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className='py-16 px-4 bg-muted/30'>
        <div className='container mx-auto max-w-4xl'>
          <h2 className='text-3xl font-bold mb-6 text-center'>Our Story</h2>
          <div className='prose dark:prose-invert max-w-none'>
            <p>
              LeadsBox was born out of frustration. Our founders were running a small e-commerce business and spending hours every day juggling WhatsApp, Instagram DMs, and Telegram messages from customers. They were missing leads, losing track of conversations, and struggling to turn chats into revenue.
            </p>
            <p>
              Existing CRM tools were either too expensive, too complicated, or didn't understand the unique needs of businesses selling through social media. So we decided to build our own solution.
            </p>
            <p>
              Today, LeadsBox helps thousands of businesses across Africa and beyond manage their customer conversations, track sales, and grow their revenue—all from one simple, powerful platform.
            </p>
            <p>
              We're still a small team, but we're obsessed with building the best messaging CRM on the planet. Every feature we ship is designed to help you sell more and stress less.
            </p>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className='py-16 px-4'>
        <div className='container mx-auto max-w-4xl'>
          <h2 className='text-3xl font-bold mb-8 text-center'>Why Choose LeadsBox?</h2>
          <div className='grid md:grid-cols-2 gap-6'>
            <div className='flex gap-4'>
              <div className='flex-shrink-0 w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center'>
                <Globe className='w-5 h-5 text-blue-600' />
              </div>
              <div>
                <h3 className='font-bold mb-2'>Built for Africa, Ready for the World</h3>
                <p className='text-sm text-muted-foreground'>
                  Native Paystack integration, multi-currency support, and features designed for emerging markets.
                </p>
              </div>
            </div>

            <div className='flex gap-4'>
              <div className='flex-shrink-0 w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center'>
                <Shield className='w-5 h-5 text-purple-600' />
              </div>
              <div>
                <h3 className='font-bold mb-2'>Privacy & Security First</h3>
                <p className='text-sm text-muted-foreground'>
                  GDPR-compliant, encrypted data, PII redaction, and transparent data practices.
                </p>
              </div>
            </div>

            <div className='flex gap-4'>
              <div className='flex-shrink-0 w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center'>
                <Users className='w-5 h-5 text-green-600' />
              </div>
              <div>
                <h3 className='font-bold mb-2'>Built by Operators, for Operators</h3>
                <p className='text-sm text-muted-foreground'>
                  We use LeadsBox ourselves every day. Every feature solves a real problem we've experienced.
                </p>
              </div>
            </div>

            <div className='flex gap-4'>
              <div className='flex-shrink-0 w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center'>
                <Zap className='w-5 h-5 text-orange-600' />
              </div>
              <div>
                <h3 className='font-bold mb-2'>AI-Powered Simplicity</h3>
                <p className='text-sm text-muted-foreground'>
                  Our AI handles the busy work so you can focus on closing deals and growing your business.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className='py-16 px-4 bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 text-white'>
        <div className='container mx-auto max-w-3xl text-center'>
          <h2 className='text-3xl sm:text-4xl font-bold mb-6'>Ready to Transform Your Sales?</h2>
          <p className='text-xl mb-8 text-white/90'>
            Join thousands of businesses already using LeadsBox to grow their revenue.
          </p>
          <div className='flex flex-col sm:flex-row gap-4 justify-center'>
            <Button size='lg' asChild className='bg-white text-primary hover:bg-white/90 rounded-full px-8'>
              <a href='/register'>Start Free Trial</a>
            </Button>
            <Button size='lg' variant='outline' asChild className='border-white text-white hover:bg-white/10 rounded-full px-8'>
              <a href='/contact'>Contact Sales</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer Navigation */}
      <section className='py-8 px-4 border-t border-border'>
        <div className='container mx-auto max-w-4xl'>
          <div className='flex flex-wrap justify-center gap-4 text-sm text-muted-foreground'>
            <Link to='/' className='hover:text-primary'>Home</Link>
            <span>•</span>
            <Link to='/contact' className='hover:text-primary'>Contact</Link>
            <span>•</span>
            <Link to='/privacy' className='hover:text-primary'>Privacy</Link>
            <span>•</span>
            <Link to='/terms' className='hover:text-primary'>Terms</Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutUs;
