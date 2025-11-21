import React from 'react';
import { useAuth } from '../../context/useAuth';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Gift, Mail, CreditCard, DollarSign, Copy } from 'lucide-react';
import { notify } from '../../lib/toast';

const ReferralsPage: React.FC = () => {
  const { user } = useAuth();
  const referralLink = `${window.location.origin}/register?ref=${user?.referralCode || ''}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    notify.success({
        title: 'Copied!',
        description: 'Referral link copied to clipboard.',
        key: 'referral-copy'
    });
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <Card className="overflow-hidden border-0 shadow-lg">
        <div className="bg-primary px-8 py-12 text-center text-primary-foreground">
          <h1 className="text-4xl font-bold mb-4">Give $50, Get $50</h1>
          <p className="text-primary-foreground/90 text-xl max-w-2xl mx-auto">
            Invite your friends to LeadsBox. When they subscribe, you both get $50 in credits.
          </p>
        </div>

        <CardContent className="p-8">
          <div className="mb-10 max-w-xl mx-auto">
            <label className="block text-sm font-medium text-muted-foreground mb-2 text-center">
              Your Unique Referral Link
            </label>
            <div className="flex gap-2">
              <Input
                type="text"
                readOnly
                value={referralLink}
                className="bg-muted/50"
              />
              <Button onClick={copyToClipboard} className="gap-2">
                <Copy className="h-4 w-4" />
                Copy
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="p-6 bg-muted/30 rounded-xl border border-border/50">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-lg mb-2">1. Send Invitation</h3>
              <p className="text-sm text-muted-foreground">Share your link via WhatsApp or Email.</p>
            </div>
            <div className="p-6 bg-muted/30 rounded-xl border border-border/50">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-lg mb-2">2. They Subscribe</h3>
              <p className="text-sm text-muted-foreground">Friend signs up for a paid plan.</p>
            </div>
            <div className="p-6 bg-muted/30 rounded-xl border border-border/50">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-lg mb-2">3. You Get Paid</h3>
              <p className="text-sm text-muted-foreground">Credits are applied to your account.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReferralsPage;
