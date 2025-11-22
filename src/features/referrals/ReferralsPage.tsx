import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useAuth } from '../../context/useAuth';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent } from '../../components/ui/card';
import { 
  Copy, 
  Check, 
  ArrowRight, 
  Sparkles, 
  Zap, 
  TrendingUp, 
  Gift,
  Twitter,
  Linkedin,
  Facebook,
  MessageCircle,
  Share2
} from 'lucide-react';
import { notify } from '../../lib/toast';
import { cn } from '../../lib/utils';

const ReferralsPage: React.FC = () => {
  const { user } = useAuth();
  const [copied, setCopied] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });
  
  const y = useTransform(scrollYProgress, [0, 1], [0, -50]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  
  const referralLink = `${window.location.origin}/register?ref=${user?.referralCode || ''}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    notify.success({
      title: 'Copied!',
      description: 'Referral link copied to clipboard.',
      key: 'referral-copy',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const shareToSocial = (platform: string) => {
    const text = encodeURIComponent('Join me on LeadsBox and get $50 in credits! 🎉');
    const url = encodeURIComponent(referralLink);
    
    const urls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      whatsapp: `https://wa.me/?text=${text}%20${url}`,
    };
    
    if (urls[platform]) {
      window.open(urls[platform], '_blank', 'width=600,height=400');
    }
  };

  const stats = [
    { value: '$50', label: 'For you', icon: TrendingUp, color: 'from-violet-500 to-purple-500' },
    { value: '$50', label: 'For friend', icon: Gift, color: 'from-emerald-500 to-teal-500' },
    { value: '∞', label: 'Unlimited', icon: Zap, color: 'from-blue-500 to-cyan-500' },
  ];

  return (
    <div ref={containerRef} className='min-h-screen p-4 sm:p-6 lg:p-8 overflow-hidden'>
      {/* Animated Background */}
      <div className='fixed inset-0 -z-10 overflow-hidden'>
        <div className='absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl' />
        <div className='absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-3xl' />
        <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl' />
      </div>

      <div className='max-w-6xl mx-auto space-y-12 sm:space-y-16'>
        {/* Hero Section */}
        <motion.div
          style={{ y, opacity }}
          className='text-center space-y-6 pt-8 sm:pt-12'
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className='inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20'
          >
            <Sparkles className='h-4 w-4 text-primary' />
            <span className='text-sm font-medium'>Referral Program</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className='text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight'
          >
            <span className='bg-gradient-to-r from-foreground via-foreground to-foreground/60 bg-clip-text text-transparent'>
              Share the love.
            </span>
            <br />
            <span className='bg-gradient-to-r from-primary via-purple-500 to-blue-500 bg-clip-text text-transparent'>
              Earn together.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className='text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto'
          >
            Give your friends $50 in credits and get $50 when they subscribe. 
            It's a win-win for everyone.
          </motion.p>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className='grid grid-cols-3 gap-3 sm:gap-6 max-w-3xl mx-auto pt-4'
          >
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.05, y: -5 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className='relative group'
              >
                <div className='absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl blur-xl -z-10' 
                     style={{ background: `linear-gradient(to right, ${stat.color})` }} />
                <Card className='border-border/50 bg-card/50 backdrop-blur-sm'>
                  <CardContent className='p-4 sm:p-6 text-center space-y-2'>
                    <div className={cn('w-10 h-10 sm:w-12 sm:h-12 mx-auto rounded-xl bg-gradient-to-r flex items-center justify-center', stat.color)}>
                      <stat.icon className='h-5 w-5 sm:h-6 sm:w-6 text-white' />
                    </div>
                    <div className='text-2xl sm:text-3xl font-bold'>{stat.value}</div>
                    <div className='text-xs sm:text-sm text-muted-foreground'>{stat.label}</div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Share Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className='max-w-3xl mx-auto'
        >
          <Card className='border-border/50 bg-card/80 backdrop-blur-xl shadow-2xl'>
            <CardContent className='p-6 sm:p-8 space-y-6'>
              <div className='text-center space-y-2'>
                <h2 className='text-2xl font-bold'>Your Referral Link</h2>
                <p className='text-sm text-muted-foreground'>
                  Share this magic link and start earning
                </p>
              </div>

              {/* Copy Link */}
              <div className='relative'>
                <div className='flex gap-2 sm:gap-3'>
                  <div className='relative flex-1'>
                    <Input
                      type='text'
                      readOnly
                      value={referralLink}
                      className='pr-12 h-12 sm:h-14 text-sm sm:text-base font-mono bg-muted/50 border-border/50 focus-visible:ring-primary'
                      onClick={(e) => e.currentTarget.select()}
                    />
                    {user?.referralCode && (
                      <div className='absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-mono font-bold'>
                        {user.referralCode}
                      </div>
                    )}
                  </div>
                  <Button 
                    onClick={copyToClipboard}
                    size='lg'
                    className={cn(
                      'h-12 sm:h-14 px-6 sm:px-8 font-semibold transition-all duration-300',
                      copied 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : 'bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90'
                    )}
                  >
                    {copied ? (
                      <>
                        <Check className='h-5 w-5 mr-2' />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className='h-5 w-5 mr-2' />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Social Share Buttons */}
              <div className='space-y-3'>
                <div className='flex items-center gap-3'>
                  <div className='flex-1 h-px bg-border' />
                  <span className='text-xs text-muted-foreground uppercase tracking-wider'>Or share via</span>
                  <div className='flex-1 h-px bg-border' />
                </div>
                
                <div className='grid grid-cols-4 gap-2 sm:gap-3'>
                  {[
                    { icon: Twitter, label: 'Twitter', platform: 'twitter', color: 'hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600' },
                    { icon: Linkedin, label: 'LinkedIn', platform: 'linkedin', color: 'hover:bg-blue-50 hover:border-blue-700 hover:text-blue-700' },
                    { icon: Facebook, label: 'Facebook', platform: 'facebook', color: 'hover:bg-blue-50 hover:border-blue-600 hover:text-blue-600' },
                    { icon: MessageCircle, label: 'WhatsApp', platform: 'whatsapp', color: 'hover:bg-green-50 hover:border-green-600 hover:text-green-600' },
                  ].map((social) => (
                    <Button
                      key={social.platform}
                      variant='outline'
                      className={cn('h-12 sm:h-14 flex-col gap-1 transition-all', social.color)}
                      onClick={() => shareToSocial(social.platform)}
                    >
                      <social.icon className='h-5 w-5' />
                      <span className='text-xs hidden sm:inline'>{social.label}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* How it works - Timeline Style */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className='space-y-8'
        >
          <div className='text-center'>
            <h2 className='text-3xl sm:text-4xl font-bold mb-3'>How it works</h2>
            <p className='text-muted-foreground'>Three simple steps to start earning</p>
          </div>

          <div className='max-w-4xl mx-auto space-y-6'>
            {[
              {
                step: '01',
                title: 'Share your link',
                description: 'Send your unique referral link to friends via email, social media, or messaging apps.',
                icon: Share2,
                gradient: 'from-violet-500 to-purple-500',
              },
              {
                step: '02',
                title: 'They sign up & subscribe',
                description: 'Your friend creates an account and subscribes to any paid plan on LeadsBox.',
                icon: Zap,
                gradient: 'from-blue-500 to-cyan-500',
              },
              {
                step: '03',
                title: 'You both get rewarded',
                description: '$50 in credits instantly added to both accounts. Rinse and repeat!',
                icon: Gift,
                gradient: 'from-emerald-500 to-teal-500',
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className='border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden group hover:border-primary/50 transition-all duration-300'>
                  <CardContent className='p-6 sm:p-8'>
                    <div className='flex items-start gap-4 sm:gap-6'>
                      <div className='relative'>
                        <div className={cn(
                          'w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-r flex items-center justify-center transition-transform duration-300 group-hover:scale-110',
                          item.gradient
                        )}>
                          <item.icon className='h-7 w-7 sm:h-8 sm:w-8 text-white' />
                        </div>
                        <div className='absolute -top-2 -right-2 w-8 h-8 rounded-full bg-background border-2 border-border flex items-center justify-center text-xs font-bold'>
                          {item.step}
                        </div>
                      </div>
                      <div className='flex-1 space-y-2'>
                        <h3 className='text-xl sm:text-2xl font-bold'>{item.title}</h3>
                        <p className='text-muted-foreground text-sm sm:text-base leading-relaxed'>
                          {item.description}
                        </p>
                      </div>
                      <ArrowRight className='hidden sm:block h-6 w-6 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all' />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className='relative overflow-hidden rounded-3xl'
        >
          <div className='absolute inset-0 bg-gradient-to-r from-primary via-purple-500 to-blue-500 opacity-90' />
          <div className='absolute inset-0 bg-[url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMC41IiBvcGFjaXR5PSIwLjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=")] opacity-20' />
          <Card className='bg-transparent border-0 shadow-none'>
            <CardContent className='relative p-8 sm:p-12 text-center space-y-6 text-white'>
              <Sparkles className='h-12 w-12 sm:h-16 sm:w-16 mx-auto opacity-90' />
              <h2 className='text-2xl sm:text-3xl lg:text-4xl font-bold'>Start earning today</h2>
              <p className='text-white/80 text-base sm:text-lg max-w-2xl mx-auto'>
                No limits. No fine print. Just share your link and watch the rewards roll in.
              </p>
              <Button 
                size='lg'
                onClick={copyToClipboard}
                className='h-12 sm:h-14 px-8 text-base font-semibold bg-white text-primary hover:bg-white/90 shadow-xl'
              >
                Copy my link
                <ArrowRight className='ml-2 h-5 w-5' />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default ReferralsPage;
