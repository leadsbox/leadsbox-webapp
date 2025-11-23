import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Cookie, Settings } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';

interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  functional: boolean;
}

const COOKIE_CONSENT_KEY = 'leadsbox_cookie_consent';
const COOKIE_PREFERENCES_KEY = 'leadsbox_cookie_preferences';

export const CookieConsent: React.FC = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true, // Always true, cannot be disabled
    analytics: false,
    functional: false,
  });

  useEffect(() => {
    // Check if user has already made a choice
    const consent =localStorage.getItem(COOKIE_CONSENT_KEY);
    const savedPreferences = localStorage.getItem(COOKIE_PREFERENCES_KEY);

    if (!consent) {
      // Show banner after a short delay for better UX
      setTimeout(() => setShowBanner(true), 1000);
    } else if (savedPreferences) {
      // Load saved preferences
      try {
        const parsed = JSON.parse(savedPreferences);
        setPreferences(parsed);
        applyPreferences(parsed);
      } catch (e) {
        console.error('Failed to parse cookie preferences', e);
      }
    }
  }, []);

  const applyPreferences = (prefs: CookiePreferences) => {
    // Apply analytics preferences
    if (prefs.analytics) {
      // Enable PostHog or other analytics
      // @ts-ignore
      if (window.posthog) {
        // @ts-ignore
        window.posthog.opt_in_capturing();
      }
    } else {
      // Disable analytics
      // @ts-ignore
      if (window.posthog) {
        // @ts-ignore
        window.posthog.opt_out_capturing();
      }
    }

    // Functional cookies (theme, language, etc.) are typically essential
    // but we separate them here for transparency
  };

  const savePreferences = (prefs: CookiePreferences) => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'true');
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(prefs));
    setPreferences(prefs);
    applyPreferences(prefs);
  };

  const handleAcceptAll = () => {
    const allAccepted: CookiePreferences = {
      essential: true,
      analytics: true,
      functional: true,
    };
    savePreferences(allAccepted);
    setShowBanner(false);
    setShowSettings(false);
  };

  const handleRejectNonEssential = () => {
    const onlyEssential: CookiePreferences = {
      essential: true,
      analytics: false,
      functional: false,
    };
    savePreferences(onlyEssential);
    setShowBanner(false);
    setShowSettings(false);
  };

  const handleSaveCustom = () => {
    savePreferences(preferences);
    setShowBanner(false);
    setShowSettings(false);
  };

  const handleTogglePreference = (key: keyof CookiePreferences) => {
    if (key === 'essential') return; // Cannot disable essential cookies
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Cookie Banner */}
      <div className='fixed bottom-0 left-0 right-0 z-50 p-4 bg-background border-t border-border shadow-2xl animate-in slide-in-from-bottom duration-300'>
        <div className='container mx-auto max-w-6xl'>
          <div className='flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6'>
            {/* Icon */}
            <div className='flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center'>
              <Cookie className='w-6 h-6 text-primary' />
            </div>

            {/* Content */}
            <div className='flex-1'>
              <h3 className='font-bold text-lg mb-1'>We value your privacy</h3>
              <p className='text-sm text-muted-foreground'>
                We use cookies to enhance your browsing experience, analyze site traffic, and personalize content. By clicking "Accept All", you consent to our use of cookies.{' '}
                <a href='/cookies' className='text-primary hover:underline'>
                  Learn more
                </a>
              </p>
            </div>

            {/* Actions */}
            <div className='flex flex-wrap gap-2 w-full md:w-auto'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setShowSettings(true)}
                className='gap-2'
              >
                <Settings className='w-4 h-4' />
                Customize
              </Button>
              <Button
                variant='ghost'
                size='sm'
                onClick={handleRejectNonEssential}
              >
                Reject Non-Essential
              </Button>
              <Button
                size='sm'
                onClick={handleAcceptAll}
                className='bg-primary hover:bg-primary-hover text-white'
              >
                Accept All
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className='max-w-2xl'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <Cookie className='w-5 h-5 text-primary' />
              Cookie Preferences
            </DialogTitle>
            <DialogDescription>
              Manage your cookie settings. You can enable or disable different types of cookies below. Essential cookies cannot be disabled as they are necessary for the website to function.
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-6 py-4'>
            {/* Essential Cookies */}
            <div className='flex items-start justify-between gap-4'>
              <div className='flex-1'>
                <div className='flex items-center gap-2 mb-2'>
                  <h4 className='font-semibold'>Essential Cookies</h4>
                  <span className='text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full'>
                    Always Active
                  </span>
                </div>
                <p className='text-sm text-muted-foreground'>
                  These cookies are necessary for the website to function and cannot be switched off. They are usually only set in response to actions made by you, such as setting your privacy preferences, logging in, or filling in forms.
                </p>
              </div>
              <Switch
                checked={true}
                disabled={true}
                aria-label='Essential cookies (always active)'
              />
            </div>

            {/* Analytics Cookies */}
            <div className='flex items-start justify-between gap-4'>
              <div className='flex-1'>
                <h4 className='font-semibold mb-2'>Analytics Cookies</h4>
                <p className='text-sm text-muted-foreground'>
                  These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site. They help us know which pages are the most and least popular and see how visitors move around the site.
                </p>
                <p className='text-xs text-muted-foreground mt-2'>
                  Provider: PostHog
                </p>
              </div>
              <Switch
                checked={preferences.analytics}
                onCheckedChange={() => handleTogglePreference('analytics')}
                aria-label='Analytics cookies'
              />
            </div>

            {/* Functional Cookies */}
            <div className='flex items-start justify-between gap-4'>
              <div className='flex-1'>
                <h4 className='font-semibold mb-2'>Functional Cookies</h4>
                <p className='text-sm text-muted-foreground'>
                  These cookies enable enhanced functionality and personalization, such as remembering your theme preference (dark/light mode), language settings, and other customization options.
                </p>
              </div>
              <Switch
                checked={preferences.functional}
                onCheckedChange={() => handleTogglePreference('functional')}
                aria-label='Functional cookies'
              />
            </div>
          </div>

          {/* Actions */}
          <div className='flex flex-col sm:flex-row gap-2 pt-4 border-t'>
            <Button
              variant='outline'
              onClick={handleRejectNonEssential}
              className='flex-1'
            >
              Reject Non-Essential
            </Button>
            <Button
              onClick={handleSaveCustom}
              className='flex-1 bg-primary hover:bg-primary-hover text-white'
            >
              Save Preferences
            </Button>
            <Button
              onClick={handleAcceptAll}
              className='flex-1 bg-primary hover:bg-primary-hover text-white'
            >
              Accept All
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CookieConsent;
