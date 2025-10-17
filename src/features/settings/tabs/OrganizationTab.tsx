import React, { useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Building, Plus, Save } from 'lucide-react';
import { mockOrganization } from '@/data/mockData';
import client from '@/api/client';
import { notify } from '@/lib/toast';
import { useAuth } from '@/context/useAuth';
import type { Org, Organization, OrgSettings } from '@/features/settings/types';

interface Props {
  orgs: Org[];
  setOrgs: React.Dispatch<React.SetStateAction<Org[]>>;
  selectedOrgId: string;
  setSelectedOrgId: React.Dispatch<React.SetStateAction<string>>;
  organization: Organization;
  setOrganization: React.Dispatch<React.SetStateAction<Organization>>;
  orgLoading: boolean;
  onSaveOrganization: () => void;
}

export const OrganizationTab: React.FC<Props> = ({
  orgs,
  setOrgs,
  selectedOrgId,
  setSelectedOrgId,
  organization,
  setOrganization,
  orgLoading,
  onSaveOrganization,
}) => {
  const { setOrg } = useAuth();
  const [createOrgOpen, setCreateOrgOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', description: '', currency: 'NGN', timezone: 'UTC' });
  const [bankForm, setBankForm] = useState({ bankName: '', accountName: '', accountNumber: '', isDefault: true, notes: '' });
  const [bankLoading, setBankLoading] = useState(false);

  // Load existing bank details for current org
  useEffect(() => {
    const loadBank = async () => {
      if (!selectedOrgId) return;
      try {
        const resp = await client.get('/settings/bank');
        const bank = resp?.data?.data?.bank;
        if (bank) {
          setBankForm({
            bankName: bank.bankName || '',
            accountName: bank.accountName || '',
            accountNumber: bank.accountNumber || '',
            isDefault: !!bank.isDefault,
            notes: bank.notes || '',
          });
        } else {
          setBankForm({ bankName: '', accountName: '', accountNumber: '', isDefault: true, notes: '' });
        }
      } catch (e) {
        // silent
      }
    };
    loadBank();
  }, [selectedOrgId]);

  const saveBank = async () => {
    if (!selectedOrgId) return;
    setBankLoading(true);
    try {
      await client.post('/settings/bank', bankForm);
      notify.success({
        key: 'settings:bank:saved',
        title: 'Bank details saved',
      });
    } catch (error) {
      const e = error as AxiosError<{ message?: string }>;
      notify.error({
        key: 'settings:bank:error',
        title: 'Unable to save bank details',
        description: e.response?.data?.message || e?.message || 'Please try again.',
      });
    } finally {
      setBankLoading(false);
    }
  };

  const handleCreateOrganizationWithDetails = async () => {
    const name = createForm.name.trim();
    if (!name) {
      notify.warning({
        key: 'settings:organization:create:name-required',
        title: 'Organization name required',
        description: 'Enter a name before creating a new organization.',
      });
      return;
    }
    try {
      // create org
      const resp = await client.post('/orgs', { name, description: createForm.description?.trim() || undefined });
      const org: Org = resp?.data?.data?.org;
      if (!org || !org.id) throw new Error('Create response missing organization');

      // update settings
      const nextSettings: Partial<OrgSettings> = {};
      if (createForm.currency) nextSettings.currency = createForm.currency;
      if (createForm.timezone) nextSettings.timezone = createForm.timezone;
      try {
        if (Object.keys(nextSettings).length > 0) await client.put(`/orgs/${org.id}`, { settings: nextSettings });
      } catch {
        notify.warning({
          key: 'settings:organization:create:settings-missed',
          title: 'Partial setup complete',
          description: 'Organization created, but we could not save the settings.',
        });
      }

      // update parent state
      const normalized: Organization = {
        ...mockOrganization,
        ...org,
        settings: {
          ...mockOrganization.settings,
          ...(org.settings || {}),
          ...nextSettings,
        },
      };
      setOrgs((prev) => [org, ...prev]);
      setSelectedOrgId(String(org.id));
      try {
        setOrg(String(org.id));
        window.dispatchEvent(new CustomEvent('lb:org-changed'));
      } catch (error) {
        console.error('Error changing organization:', error);
        notify.error({
          key: 'settings:organization:switch-error',
          title: 'Unable to switch organization',
          description: 'Please refresh and try again.',
        });
      }
      setOrganization(normalized);

      setCreateForm({ name: '', description: '', currency: 'NGN', timezone: 'UTC' });
      setCreateOrgOpen(false);
      notify.success({
        key: 'settings:organization:create:success',
        title: 'Organization created',
      });
    } catch (e) {
      notify.error({
        key: 'settings:organization:create:error',
        title: 'Unable to create organization',
        description: 'Please try again.',
      });
    }
  };

  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between'>
        <CardTitle className='flex items-center'>
          <Building className='h-5 w-5 mr-2' />
          Organization Details
        </CardTitle>
        <Button onClick={() => setCreateOrgOpen(true)} size='sm'>
          <Plus className='h-4 w-4 mr-2' />
          Create Organization
        </Button>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <Label>Select Organization</Label>
            <Select
              value={selectedOrgId}
              onValueChange={(v) => {
                setSelectedOrgId(v);
                try {
                  setOrg(v);
                  window.dispatchEvent(new CustomEvent('lb:org-changed'));
                } catch (e) {
                  notify.error({
                    key: 'settings:organization:switch-error',
                    title: 'Unable to switch organization',
                    description: 'Please refresh and try again.',
                  });
                }
                const sel = orgs.find((o) => String(o.id) === v);
                if (sel) {
                  const normalized = { ...mockOrganization, ...sel, settings: { ...mockOrganization.settings, ...(sel.settings || {}) } };
                  setOrganization(normalized);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={orgLoading ? 'Loading...' : 'Choose organization'} />
              </SelectTrigger>
              <SelectContent>
                {orgs.map((o) => (
                  <SelectItem key={String(o.id)} value={String(o.id)}>
                    {String(o.name)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <Label htmlFor='org-name'>Organization Name</Label>
            <Input id='org-name' value={organization.name} onChange={(e) => setOrganization({ ...organization, name: e.target.value })} />
          </div>
          <div>
            <Label htmlFor='plan'>Current Plan</Label>
            <Select value={organization.plan}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='STARTER'>Starter</SelectItem>
                <SelectItem value='PRO'>Pro</SelectItem>
                <SelectItem value='ENTERPRISE'>Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor='timezone'>Timezone</Label>
            <Select
              value={organization.settings.timezone}
              onValueChange={(tz) => setOrganization({ ...organization, settings: { ...organization.settings, timezone: tz } })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='UTC'>UTC</SelectItem>
                <SelectItem value='America/New_York'>Eastern Time</SelectItem>
                <SelectItem value='America/Chicago'>Central Time</SelectItem>
                <SelectItem value='America/Denver'>Mountain Time</SelectItem>
                <SelectItem value='America/Los_Angeles'>Pacific Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor='currency'>Currency</Label>
            <Select
              value={organization.settings.currency}
              onValueChange={(cur) => setOrganization({ ...organization, settings: { ...organization.settings, currency: cur } })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='USD'>USD ($)</SelectItem>
                <SelectItem value='EUR'>EUR (€)</SelectItem>
                <SelectItem value='GBP'>GBP (£)</SelectItem>
                <SelectItem value='CAD'>CAD ($)</SelectItem>
                <SelectItem value='NGN'>NGN (₦)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button onClick={onSaveOrganization}>
          <Save className='h-4 w-4 mr-2' />
          Save Changes
        </Button>

        {/* Bank Details */}
        <div className='pt-8'>
          <h3 className='text-lg font-semibold mb-4 flex items-center'>
            <Building className='h-5 w-5 mr-2' />
            Bank Details
          </h3>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <Label>Bank Name</Label>
              <Input value={bankForm.bankName} onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })} placeholder='Bank name' />
            </div>
            <div>
              <Label>Account Name</Label>
              <Input
                value={bankForm.accountName}
                onChange={(e) => setBankForm({ ...bankForm, accountName: e.target.value })}
                placeholder='Account name'
              />
            </div>
            <div>
              <Label>Account Number</Label>
              <Input
                value={bankForm.accountNumber}
                onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                placeholder='1234567890'
              />
            </div>
            <div>
              <Label>Notes</Label>
              <Input value={bankForm.notes} onChange={(e) => setBankForm({ ...bankForm, notes: e.target.value })} placeholder='Optional notes' />
            </div>
            <div className='md:col-span-2'>
              <Button onClick={saveBank} disabled={bankLoading}>
                <Save className='h-4 w-4 mr-2' /> Save Bank Details
              </Button>
            </div>
          </div>
        </div>
      </CardContent>

      {/* Create Organization Modal */}
      <Dialog open={createOrgOpen} onOpenChange={setCreateOrgOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Organization</DialogTitle>
            <DialogDescription>Fill in details to create your organization.</DialogDescription>
          </DialogHeader>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='md:col-span-2'>
              <Label htmlFor='create-org-name'>Name</Label>
              <Input
                id='create-org-name'
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                placeholder='Acme Inc.'
              />
            </div>
            <div className='md:col-span-2'>
              <Label htmlFor='create-org-desc'>Description (optional)</Label>
              <Input
                id='create-org-desc'
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                placeholder='What does your organization do?'
              />
            </div>
            <div>
              <Label>Timezone</Label>
              <Select value={createForm.timezone} onValueChange={(v) => setCreateForm({ ...createForm, timezone: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='UTC'>UTC</SelectItem>
                  <SelectItem value='America/New_York'>Eastern Time</SelectItem>
                  <SelectItem value='America/Chicago'>Central Time</SelectItem>
                  <SelectItem value='America/Denver'>Mountain Time</SelectItem>
                  <SelectItem value='America/Los_Angeles'>Pacific Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Currency</Label>
              <Select value={createForm.currency} onValueChange={(v) => setCreateForm({ ...createForm, currency: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='USD'>USD ($)</SelectItem>
                  <SelectItem value='EUR'>EUR (€)</SelectItem>
                  <SelectItem value='GBP'>GBP (£)</SelectItem>
                  <SelectItem value='CAD'>CAD ($)</SelectItem>
                  <SelectItem value='NGN'>NGN (₦)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setCreateOrgOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateOrganizationWithDetails}>
              <Plus className='h-4 w-4 mr-2' />
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default OrganizationTab;
