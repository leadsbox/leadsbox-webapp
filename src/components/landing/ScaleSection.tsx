import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { MessageCircle, Zap, BarChart3, Users } from 'lucide-react';

const ScaleSection = () => {
  return (
    <section id="features" className="py-32 bg-muted/30 relative overflow-hidden border-b border-border">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <Badge variant="outline" className="mb-4 border-primary/20 text-primary bg-primary/5">Features</Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Everything you need to scale.</h2>
          <p className="text-xl text-muted-foreground">
            LeadsBox gives you the superpowers to manage thousands of conversations without losing your mind.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Large Card */}
          <Card className="md:col-span-2 bg-card border-border shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
            <CardContent className="p-10 h-full flex flex-col justify-between relative">
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6">
                  <MessageCircle className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Unified Inbox</h3>
                <p className="text-muted-foreground text-lg max-w-md">
                  Stop switching tabs. Reply to WhatsApp, Instagram, and Telegram messages from a single, powerful dashboard.
                </p>
              </div>
              <div className="absolute right-0 bottom-0 w-1/2 h-64 bg-gradient-to-tl from-blue-500/10 to-transparent rounded-tl-[100px]" />
            </CardContent>
          </Card>

          {/* Tall Card */}
          <Card className="md:row-span-2 bg-card border-border shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
             <CardContent className="p-10 h-full flex flex-col">
               <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center mb-6">
                  <Zap className="w-6 h-6 text-orange-600" />
               </div>
               <h3 className="text-2xl font-bold mb-3">AI Automation</h3>
               <p className="text-muted-foreground text-lg mb-8">
                 Let AI handle the repetitive stuff. Auto-qualify leads and schedule meetings 24/7.
               </p>
               <div className="flex-1 bg-muted/50 rounded-2xl border border-border p-4 space-y-3 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-orange-500 animate-linear-progress" />
                  {[1,2,3].map(i => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-background rounded-xl shadow-sm">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <div className="h-2 w-20 bg-muted rounded" />
                      <div className="ml-auto text-[10px] text-orange-500 font-mono bg-orange-500/10 px-2 py-1 rounded">DONE</div>
                    </div>
                  ))}
               </div>
             </CardContent>
          </Card>

          {/* Small Card 1 */}
          <Card className="bg-card border-border shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-10">
              <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center mb-6">
                <BarChart3 className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Revenue Tracking</h3>
              <p className="text-muted-foreground">
                See exactly which conversations turn into cash. Track ROI per channel.
              </p>
            </CardContent>
          </Card>

          {/* Small Card 2 */}
          <Card className="bg-card border-border shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-10">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Team Collaboration</h3>
              <p className="text-muted-foreground">
                Assign chats, leave internal notes, and work together to close deals.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default ScaleSection;
