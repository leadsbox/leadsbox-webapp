import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';

import { Button } from '@/components/ui/button';

const NotFound = () => {
  const location = useLocation();
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

  useEffect(() => {
    document.title = 'Page Not Found · LeadsBox';
    console.error('404 Error: User attempted to access non-existent route:', location.pathname);
  }, [location.pathname]);

  return (
    <div className='min-h-screen w-full bg-background text-foreground'>
      {/* Navigation (same style as landing) */}
      <header className='sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md'>
        <div className='container mx-auto flex h-16 items-center justify-between px-4'>
          <a href='/' className='flex items-center gap-3 transition-transform hover:scale-105'>
            <div className='w-8 h-8 bg-white p-1 rounded-sm flex items-center justify-center'>
              <LogoMark priority />
            </div>
            <span className='text-xl font-semibold'>LeadsBox</span>
          </a>

          <nav className='hidden md:flex items-center gap-6'>
            <a href='/#product' className='text-muted-foreground hover:text-primary transition-colors'>
              Product
            </a>
            <a href='/#how-it-works' className='text-muted-foreground hover:text-primary transition-colors'>
              How it Works
            </a>
            <a href='/#pricing' className='text-muted-foreground hover:text-primary transition-colors'>
              Pricing
            </a>
            <a href='/#creators' className='text-muted-foreground hover:text-primary transition-colors'>
              For Creators
            </a>
          </nav>

          <div className='flex items-center gap-2 sm:gap-3'>
            <Button asChild size='sm'>
              <Link to='/dashboard'>
                <Home className='mr-2 h-4 w-4' />
                Go to Dashboard
              </Link>
            </Button>
            <Button variant='outline' size='sm' onClick={() => window.history.back()}>
              <ArrowLeft className='mr-2 h-4 w-4' />
              Go Back
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <section aria-labelledby='not-found-heading' className='flex items-center justify-center w-full h-[calc(100vh-4rem)] px-6 sm:px-12'>
        <div className='max-w-xl w-full text-center'>
          <div className='mb-6 inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-sm font-medium text-muted-foreground shadow-sm'>
            <span className='mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-destructive/10 text-destructive'>404</span>
            We couldn't find that page
          </div>

          <h1 id='not-found-heading' className='text-3xl font-semibold sm:text-4xl'>
            This page has moved or never existed.
          </h1>
          <p className='mt-4 text-base text-muted-foreground'>
            The link <span className='font-medium text-foreground'>{location.pathname}</span> may be broken or the page may have been removed. Check
            the URL or return to a known location.
          </p>

          <div className='mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center'>
            <Button asChild size='lg'>
              <Link to='/dashboard'>
                <Home className='mr-2 h-4 w-4' />
                Go to Dashboard
              </Link>
            </Button>
            <Button variant='outline' size='lg' onClick={() => window.history.back()}>
              <ArrowLeft className='mr-2 h-4 w-4' />
              Go Back
            </Button>
          </div>

          <p className='mt-10 text-sm text-muted-foreground'>
            Still lost?{' '}
            <a className='text-primary hover:underline' href='mailto:support@leadsbox.app'>
              Contact support
            </a>{' '}
            and we'll help you out.
          </p>
        </div>
      </section>
    </div>
  );
};

export default NotFound;
