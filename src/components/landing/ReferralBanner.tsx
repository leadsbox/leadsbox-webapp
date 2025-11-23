import React from 'react';
import { Gift, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const ReferralBanner = () => {
  return (
    <section className="py-12 bg-background border-y border-border/50">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-blue-500/10 border border-border p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
          
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

          <div className="flex items-start gap-6 relative z-10 max-w-2xl">
            <div className="hidden sm:flex h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 items-center justify-center shrink-0 shadow-lg shadow-purple-500/20">
              <Gift className="w-8 h-8 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 text-xs font-bold uppercase tracking-wider border border-purple-500/20">
                  New Program
                </span>
              </div>
              <h3 className="text-2xl md:text-3xl font-bold mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Give 1 Month, Get 1 Month Free
              </h3>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Love LeadsBox? Share it with your network. When they subscribe, you both get a month of LeadsBox Pro for free.
              </p>
            </div>
          </div>

          <div className="relative z-10 shrink-0">
            <Button asChild size="lg" className="h-14 px-8 rounded-full text-base font-semibold bg-foreground text-background hover:bg-foreground/90 shadow-xl">
              <Link to="/referral-program">
                Learn more
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ReferralBanner;
