import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/context/ThemeContext';
import { Moon, Sun, Mail, MessageCircle, MapPin, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const Contact: React.FC = () => {
  const { resolvedTheme, setTheme } = useTheme();
  const ThemeIcon = resolvedTheme === 'dark' ? Sun : Moon;
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      toast.success('Message sent! We\'ll get back to you within 24 hours.');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      console.error('Contact form error:', error);
      toast.error('Failed to send message. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

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
          <h1 className='text-4xl sm:text-5xl font-bold mb-6'>Get in Touch</h1>
          <p className='text-xl text-muted-foreground max-w-2xl mx-auto'>
            Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </div>
      </section>

      {/* Contact Info & Form */}
      <section className='py-16 px-4'>
        <div className='container mx-auto max-w-6xl'>
          <div className='grid md:grid-cols-3 gap-8'>
            {/* Contact Cards */}
            <div className='space-y-6'>
              <Card className='border-border'>
                <CardContent className='p-6'>
                  <div className='w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-4'>
                    <Mail className='w-6 h-6 text-blue-600' />
                  </div>
                  <h3 className='font-bold mb-2'>Email Us</h3>
                  <p className='text-sm text-muted-foreground mb-3'>
                    Our team typically responds within 24 hours.
                  </p>
                  <a href='mailto:support@leadsbox.app' className='text-sm text-primary hover:underline'>
                    support@leadsbox.app
                  </a>
                </CardContent>
              </Card>

              <Card className='border-border'>
                <CardContent className='p-6'>
                  <div className='w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mb-4'>
                    <MessageCircle className='w-6 h-6 text-green-600' />
                  </div>
                  <h3 className='font-bold mb-2'>Live Chat</h3>
                  <p className='text-sm text-muted-foreground mb-3'>
                    Chat with our support team in real-time.
                  </p>
                  <button className='text-sm text-primary hover:underline' onClick={() => {
                    // @ts-ignore - Crisp chat integration
                    if (window.$crisp) window.$crisp.push(['do', 'chat:open']);
                  }}>
                    Start Chat
                  </button>
                </CardContent>
              </Card>

              <Card className='border-border'>
                <CardContent className='p-6'>
                  <div className='w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center mb-4'>
                    <MapPin className='w-6 h-6 text-purple-600' />
                  </div>
                  <h3 className='font-bold mb-2'>Office</h3>
                  <p className='text-sm text-muted-foreground'>
                    Lagos, Nigeria<br />
                    Remote-first company
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Contact Form */}
            <div className='md:col-span-2'>
              <Card className='border-border'>
                <CardContent className='p-8'>
                  <h2 className='text-2xl font-bold mb-6'>Send us a message</h2>
                  <form onSubmit={handleSubmit} className='space-y-4'>
                    <div className='grid md:grid-cols-2 gap-4'>
                      <div>
                        <label htmlFor='name' className='block text-sm font-medium mb-2'>
                          Your Name <span className='text-red-500'>*</span>
                        </label>
                        <Input
                          id='name'
                          name='name'
                          type='text'
                          required
                          value={formData.name}
                          onChange={handleChange}
                          placeholder='John Doe'
                          className='w-full'
                        />
                      </div>
                      <div>
                        <label htmlFor='email' className='block text-sm font-medium mb-2'>
                          Email Address <span className='text-red-500'>*</span>
                        </label>
                        <Input
                          id='email'
                          name='email'
                          type='email'
                          required
                          value={formData.email}
                          onChange={handleChange}
                          placeholder='john@example.com'
                          className='w-full'
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor='subject' className='block text-sm font-medium mb-2'>
                        Subject <span className='text-red-500'>*</span>
                      </label>
                      <Input
                        id='subject'
                        name='subject'
                        type='text'
                        required
                        value={formData.subject}
                        onChange={handleChange}
                        placeholder='How can we help?'
                        className='w-full'
                      />
                    </div>

                    <div>
                      <label htmlFor='message' className='block text-sm font-medium mb-2'>
                        Message <span className='text-red-500'>*</span>
                      </label>
                      <Textarea
                        id='message'
                        name='message'
                        required
                        value={formData.message}
                        onChange={handleChange}
                        placeholder='Tell us more about your inquiry...'
                        className='w-full min-h-[150px]'
                      />
                    </div>

                    <Button
                      type='submit'
                      size='lg'
                      disabled={isSubmitting}
                      className='w-full sm:w-auto gap-2'
                    >
                      {isSubmitting ? 'Sending...' : (
                        <>
                          <Send className='w-4 h-4' />
                          Send Message
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Teaser */}
      <section className='py-16 px-4 bg-muted/30'>
        <div className='container mx-auto max-w-4xl text-center'>
          <h2 className='text-2xl font-bold mb-4'>Looking for quick answers?</h2>
          <p className='text-muted-foreground mb-6'>
            Check out our Help Center for guides, tutorials, and FAQs.
          </p>
          <Button variant='outline' asChild>
            <a href='https://help.leadsbox.app' target='_blank' rel='noopener noreferrer'>
              Visit Help Center
            </a>
          </Button>
        </div>
      </section>

      {/* Footer Navigation */}
      <section className='py-8 px-4 border-t border-border'>
        <div className='container mx-auto max-w-4xl'>
          <div className='flex flex-wrap justify-center gap-4 text-sm text-muted-foreground'>
            <Link to='/' className='hover:text-primary'>Home</Link>
            <span>•</span>
            <Link to='/about' className='hover:text-primary'>About</Link>
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

export default Contact;
