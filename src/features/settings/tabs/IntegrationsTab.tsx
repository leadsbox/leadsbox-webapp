import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/context/useAuth';
import client, { getOrgId } from '@/api/client';
import { API_BASE } from '@/api/config';
import { useSearchParams } from 'react-router-dom';
import { notify } from '@/lib/toast';
import { FacebookIcon, InstagramIcon, TelegramIcon, WhatsAppIcon } from '@/components/brand-icons';
import { Globe } from 'lucide-react';

export const IntegrationsTab: React.FC = () => {
  const { user, refreshAuth } = useAuth();
  const [waConnected, setWaConnected] = useState(false);
  const [waToken, setWaToken] = useState<string | null>(null);
  const [businesses, setBusinesses] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedBusiness, setSelectedBusiness] = useState('');
  const [wabas, setWabas] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedWaba, setSelectedWaba] = useState('');
  const [phones, setPhones] = useState<Array<{ id: string; display: string }>>([]);
  const [selectedPhone, setSelectedPhone] = useState('');
  const [businessLoading, setBusinessLoading] = useState(false);
  const [wabaLoading, setWabaLoading] = useState(false);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [ctaLoading, setCtaLoading] = useState(false);
  const [disconnectLoading, setDisconnectLoading] = useState(false);
  const [orgCreateLoading, setOrgCreateLoading] = useState(false);
  const [connections, setConnections] = useState<Array<{ id: string; wabaId: string; phoneNumberId: string; display?: string }>>([]);
  const [disconnectKey, setDisconnectKey] = useState('');
  const [orgDialogOpen, setOrgDialogOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const apiRoot = useMemo(() => API_BASE.replace(/\/api\/?$/, ''), []);

  // Instagram connection state and effect
  const [igConnected, setIgConnected] = useState(false);
  useEffect(() => {
    const status = searchParams.get('instagram');
    if (status === 'connected') {
      setIgConnected(true);
      notify.success({
        key: 'integrations:instagram:connected',
        title: 'Instagram connected',
      });
      searchParams.delete('instagram');
      setSearchParams(searchParams, { replace: true });
    } else if (status === 'error') {
      notify.error({
        key: 'integrations:instagram:error',
        title: 'Instagram connection failed',
        description: 'Please retry the connection flow.',
      });
      searchParams.delete('instagram');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const status = searchParams.get('whatsapp');
    const token = searchParams.get('waToken');
    if (status === 'connected') {
      setWaConnected(true);
      if (token) {
        setWaToken(token);
        (async () => {
          try {
            const orgResp = await client.get('/orgs');
            const orgs = orgResp?.data?.data?.orgs || [];
            if (!Array.isArray(orgs) || orgs.length === 0) {
              setOrgDialogOpen(true);
              return;
            }
            try {
              const resp = await client.get(`${apiRoot}/api/provider/whatsapp/businesses`, { params: { accessToken: token } });
              const list = resp?.data?.data?.data || resp?.data?.data || [];
              setBusinesses(Array.isArray(list?.data) ? list.data : list);
            } catch {
              notify.error({
                key: 'integrations:whatsapp:businesses',
                title: 'Unable to fetch businesses',
                description: 'Try reconnecting your WhatsApp account.',
              });
            }
          } catch {
            notify.error({
              key: 'integrations:whatsapp:verify',
              title: 'Unable to verify organization',
              description: 'Please try reconnecting WhatsApp.',
            });
          }
        })();
      }
      notify.success({
        key: 'integrations:whatsapp:connected',
        title: 'WhatsApp connected',
      });
      searchParams.delete('whatsapp');
      searchParams.delete('waToken');
      setSearchParams(searchParams, { replace: true });
    } else if (status === 'error') {
      notify.error({
        key: 'integrations:whatsapp:error',
        title: 'WhatsApp connection failed',
        description: 'Please retry the connect flow.',
      });
      searchParams.delete('whatsapp');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, apiRoot]);

  useEffect(() => {
    (async () => {
      try {
        const resp = await client.get(`${apiRoot}/api/provider/whatsapp/status`);
        const payload = resp?.data?.data || {};
        const connected = !!payload?.connected;
        const conns = Array.isArray(payload?.connections) ? payload.connections : [];
        setWaConnected(connected);
        setConnections(conns);
        if (conns.length === 1) {
          setDisconnectKey(`${conns[0].wabaId}|${conns[0].phoneNumberId}`);
        }
      } catch {
        // Ignore error
      }
    })();
  }, [apiRoot]);

  const confirmBusiness = async () => {
    if (!waToken || !selectedBusiness) return;
    setBusinessLoading(true);
    try {
      const resp = await client.post(`${apiRoot}/api/provider/whatsapp/select-business`, { accessToken: waToken, businessId: selectedBusiness });
      const list = resp?.data?.data?.wabas || [];
      setWabas(list);
    } catch {
      notify.error({
        key: 'integrations:whatsapp:wabas',
        title: 'Unable to fetch WABAs',
        description: 'Try selecting the business again.',
      });
    } finally {
      setBusinessLoading(false);
    }
  };

  const confirmWaba = async () => {
    if (!waToken || !selectedWaba) return;
    setWabaLoading(true);
    try {
      const resp = await client.post(`${apiRoot}/api/provider/whatsapp/select-waba`, { accessToken: waToken, wabaId: selectedWaba });
      const list = resp?.data?.data?.phoneNumbers || [];
      setPhones(list);
    } catch {
      notify.error({
        key: 'integrations:whatsapp:phones',
        title: 'Unable to fetch phone numbers',
        description: 'Try selecting the WABA again.',
      });
    } finally {
      setWabaLoading(false);
    }
  };

  const finalizeConnect = async () => {
    if (!waToken || !selectedWaba || !selectedPhone) return;
    const organizationId = getOrgId();
    if (!organizationId) {
      notify.warning({
        key: 'integrations:whatsapp:select-org',
        title: 'Select an organization',
        description: 'Choose an organization before linking WhatsApp.',
      });
      return;
    }
    setPhoneLoading(true);
    try {
      await client.post(`${apiRoot}/api/provider/whatsapp/connect`, {
        accessToken: waToken,
        wabaId: selectedWaba,
        phoneId: selectedPhone,
        organizationId,
      });
      setWaConnected(true);
      setWaToken(null);
      notify.success({
        key: 'integrations:whatsapp:linked',
        title: 'WhatsApp account linked',
      });
    } catch {
      notify.error({
        key: 'integrations:whatsapp:link-error',
        title: 'Unable to link WhatsApp',
        description: 'Please try again.',
      });
    } finally {
      setPhoneLoading(false);
    }
  };

  const disconnectWhatsApp = async () => {
    setDisconnectLoading(true);
    try {
      let url = `${apiRoot}/api/provider/whatsapp/disconnect`;
      if (disconnectKey) {
        const [wabaId, phoneId] = disconnectKey.split('|');
        url += `?wabaId=${encodeURIComponent(wabaId)}&phoneId=${encodeURIComponent(phoneId)}`;
      }
      await client.delete(url);
      setWaConnected(false);
      setWaToken(null);
      setBusinesses([]);
      setWabas([]);
      setPhones([]);
      setSelectedBusiness('');
      setSelectedWaba('');
      setSelectedPhone('');
      setConnections([]);
      setDisconnectKey('');
      notify.success({
        key: 'integrations:whatsapp:disconnected',
        title: 'WhatsApp disconnected',
      });
    } catch {
      notify.error({
        key: 'integrations:whatsapp:disconnect-error',
        title: 'Unable to disconnect WhatsApp',
        description: 'Please try again.',
      });
    } finally {
      setDisconnectLoading(false);
    }
  };

  const startWhatsAppConnect = async () => {
    setCtaLoading(true);
    try {
      const resp = await client.get('/orgs');
      const orgs = resp?.data?.data?.orgs || [];
      if (!Array.isArray(orgs) || orgs.length === 0) {
        setOrgDialogOpen(true);
        return;
      }
      window.location.href = `${apiRoot}/api/provider/whatsapp`;
    } catch {
      notify.error({
        key: 'integrations:whatsapp:org-check',
        title: 'Unable to check organizations',
        description: 'Please refresh and try again.',
      });
    } finally {
      setCtaLoading(false);
    }
  };

  const createOrgAndStart = async () => {
    if (!newOrgName.trim()) {
      notify.warning({
        key: 'integrations:whatsapp:org-name',
        title: 'Organization name required',
        description: 'Enter a name before continuing.',
      });
      return;
    }
    setOrgCreateLoading(true);
    try {
      await client.post('/orgs', { name: newOrgName.trim() });
      await refreshAuth();
      setOrgDialogOpen(false);
      setNewOrgName('');
      window.location.href = `${apiRoot}/api/provider/whatsapp`;
    } catch {
      notify.error({
        key: 'integrations:whatsapp:org-create',
        title: 'Unable to create organization',
        description: 'Please try again.',
      });
    } finally {
      setOrgCreateLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center'>
          <Globe className='h-5 w-5 mr-2' />
          Integrations
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-6'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <Card className='border-muted'>
            <CardHeader className='pb-4'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center space-x-3'>
                  <div className='w-10 h-10 flex items-center justify-center'>
                    <WhatsAppIcon className='h-6 w-6' />
                  </div>
                  <div>
                    <h3 className='font-medium'>WhatsApp Business</h3>
                    <p className='text-sm text-muted-foreground'>Connect your WhatsApp account</p>
                  </div>
                </div>
                {waConnected ? (
                  <Badge variant='outline' className='bg-green-500/10 text-green-400'>
                    Connected
                  </Badge>
                ) : (
                  <Badge variant='outline' className='bg-gray-500/10 text-gray-400'>
                    Not Connected
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className='space-y-3'>
                {!waConnected && waToken ? (
                  <div className='space-y-4'>
                    <div>
                      <Label>Business</Label>
                      <Select value={selectedBusiness} onValueChange={setSelectedBusiness}>
                        <SelectTrigger>
                          <SelectValue placeholder='Select business' />
                        </SelectTrigger>
                        <SelectContent>
                          {businesses.map((b) => (
                            <SelectItem key={b.id} value={b.id}>
                              {b.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button className='mt-2' size='sm' onClick={confirmBusiness} disabled={businessLoading || !selectedBusiness} loading={businessLoading}>
                        Next
                      </Button>
                    </div>
                    {wabas.length > 0 && (
                      <div>
                        <Label>WABA</Label>
                        <Select value={selectedWaba} onValueChange={setSelectedWaba}>
                          <SelectTrigger>
                            <SelectValue placeholder='Select WABA' />
                          </SelectTrigger>
                          <SelectContent>
                            {wabas.map((w) => (
                              <SelectItem key={w.id} value={w.id}>
                                {w.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button className='mt-2' size='sm' onClick={confirmWaba} disabled={wabaLoading || !selectedWaba} loading={wabaLoading}>
                          Next
                        </Button>
                      </div>
                    )}
                    {phones.length > 0 && (
                      <div>
                        <Label>Phone</Label>
                        <Select value={selectedPhone} onValueChange={setSelectedPhone}>
                          <SelectTrigger>
                            <SelectValue placeholder='Select phone number' />
                          </SelectTrigger>
                          <SelectContent>
                            {phones.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.display}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button className='mt-2' size='sm' onClick={finalizeConnect} disabled={phoneLoading || !selectedPhone} loading={phoneLoading}>
                          Connect
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    {waConnected && connections.length > 0 && (
                      <div className='space-y-2'>
                        <Label>Select connection to disconnect</Label>
                        <Select value={disconnectKey} onValueChange={setDisconnectKey}>
                          <SelectTrigger>
                            <SelectValue placeholder='Choose a connection' />
                          </SelectTrigger>
                          <SelectContent>
                            {connections.map((c) => (
                              <SelectItem key={c.id} value={`${c.wabaId}|${c.phoneNumberId}`}>
                                WABA: {c.wabaId} — Phone: {c.display || c.phoneNumberId}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div className='flex space-x-2'>
                      <Button onClick={startWhatsAppConnect} className='flex-1' disabled={ctaLoading} loading={ctaLoading}>
                        {waConnected ? 'Reconnect' : 'Connect WhatsApp'}
                      </Button>
                      <Button
                        variant='outline'
                        className='text-destructive'
                        disabled={!waConnected || disconnectLoading}
                        loading={disconnectLoading}
                        onClick={disconnectWhatsApp}
                      >
                        Disconnect
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className='border-muted'>
            <CardHeader className='pb-4'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center space-x-3'>
                  <div className='w-10 h-10 flex items-center justify-center'>
                    <TelegramIcon className='h-6 w-6' />
                  </div>
                  <div>
                    <h3 className='font-medium'>Telegram</h3>
                    <p className='text-sm text-muted-foreground'>Connect your Telegram account</p>
                  </div>
                </div>
                {/* Telegram connection status badge */}
                {/* TODO: Add real connection state if available */}
                <Badge variant='outline' className='bg-gray-500/10 text-gray-400'>
                  Not Connected
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className='space-y-3'>
                <Button
                  className='w-full'
                  onClick={() => {
                    window.location.href = `${apiRoot}/api/provider/telegram/sign-in`;
                  }}
                >
                  Connect Telegram
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className='border-muted'>
            <CardHeader className='pb-4'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center space-x-3'>
                  <div className='w-10 h-10 flex items-center justify-center'>
                    <InstagramIcon className='h-6 w-6 text-pink-500' />
                  </div>
                  <div>
                    <h3 className='font-medium'>Instagram</h3>
                    <p className='text-sm text-muted-foreground'>Connect your Instagram account</p>
                  </div>
                </div>
                {igConnected ? (
                  <Badge variant='outline' className='bg-pink-500/10 text-pink-500'>
                    Connected
                  </Badge>
                ) : (
                  <Badge variant='outline' className='bg-gray-500/10 text-gray-400'>
                    Not Connected
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className='space-y-3'>
                <Button
                  className='w-full'
                  disabled={igConnected}
                  onClick={() => {
                    window.location.href = `${apiRoot}/api/provider/instagram`;
                  }}
                >
                  {igConnected ? 'Connected' : 'Connect Instagram'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className='border-muted'>
            <CardHeader className='pb-4'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center space-x-3'>
                  <div className='w-10 h-10 flex items-center justify-center'>
                    <FacebookIcon className='h-6 w-6 text-blue-600' />
                  </div>
                  <div>
                    <h3 className='font-medium'>Facebook</h3>
                    <p className='text-sm text-muted-foreground'>Connect your Facebook account</p>
                  </div>
                </div>
                <Badge variant='outline' className='bg-gray-500/10 text-gray-400'>
                  Not Connected
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className='space-y-3'>
                <Button
                  className='w-full'
                  onClick={() =>
                    notify.info({
                      key: 'integrations:facebook:coming-soon',
                      title: 'Coming soon',
                      description: 'Facebook integration is almost ready.',
                    })
                  }
                >
                  Connect Facebook
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>

      <AlertDialog open={orgDialogOpen} onOpenChange={setOrgDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Create an Organization</AlertDialogTitle>
            <AlertDialogDescription>You need an organization before connecting WhatsApp. Create one to proceed.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className='space-y-2'>
            <Label htmlFor='org-create-name'>Organization Name</Label>
            <input
              id='org-create-name'
              className='w-full rounded-md border px-3 py-2 text-sm bg-background border-input'
              value={newOrgName}
              onChange={(e) => setNewOrgName(e.target.value)}
              placeholder='Your Company'
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={createOrgAndStart} disabled={orgCreateLoading}>
              {orgCreateLoading ? 'Creating...' : 'Create & Continue'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default IntegrationsTab;
