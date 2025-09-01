import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Building, Plus, Save } from 'lucide-react';
import { mockOrganization } from '@/data/mockData';
import client from '@/api/client';
import { toast } from 'react-toastify';
import { useAuth } from '@/context/AuthContext';

type Org = { id: string; name: string; settings?: any };

interface Props {
  orgs: Org[];
  setOrgs: (os: Org[]) => void;
  selectedOrgId: string;
  setSelectedOrgId: (id: string) => void;
  organization: any;
  setOrganization: (o: any) => void;
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

  const handleCreateOrganizationWithDetails = async () => {
    const name = createForm.name.trim();
    if (!name) {
      toast.error('Organization name is required');
      return;
    }
    try {
      // create org
      const resp = await client.post('/orgs', { name, description: createForm.description?.trim() || undefined });
      const org = resp?.data?.data?.org;
      if (!org || !org.id) throw new Error('Create response missing organization');

      // update settings
      const nextSettings: any = {};
      if (createForm.currency) nextSettings.currency = createForm.currency;
      if (createForm.timezone) nextSettings.timezone = createForm.timezone;
      try {
        if (Object.keys(nextSettings).length > 0) await client.put(`/orgs/${org.id}`, { settings: nextSettings });
      } catch {
        toast.error('Organization created, but failed to save settings');
      }

      // update parent state
      const normalized = { ...mockOrganization, ...org, settings: { ...mockOrganization.settings, ...(org.settings || {}), ...nextSettings } };
      setOrgs([org, ...orgs]);
      setSelectedOrgId(org.id);
      try {
        setOrg(org.id);
        window.dispatchEvent(new CustomEvent('lb:org-changed'));
      } catch {}
      setOrganization(normalized);

      setCreateForm({ name: '', description: '', currency: 'NGN', timezone: 'UTC' });
      setCreateOrgOpen(false);
      toast.success('Organization created');
    } catch (e) {
      toast.error('Failed to create organization');
    }
  };

  return (
    <Card>
      <CardHeader className='space-y-3'>
        <div>
          <Button onClick={() => setCreateOrgOpen(true)} size='sm'>
            <Plus className='h-4 w-4 mr-2' />
            Create Organization
          </Button>
        </div>
        <CardTitle className='flex items-center'>
          <Building className='h-5 w-5 mr-2' />
          Organization Details
        </CardTitle>
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
                } catch {}
                const sel = orgs.find((o) => o.id === v);
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
                  <SelectItem key={o.id} value={o.id}>
                    {o.name}
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
            <Select value={organization.settings.timezone} onValueChange={(tz) => setOrganization({ ...organization, settings: { ...organization.settings, timezone: tz } })}>
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
            <Select value={organization.settings.currency} onValueChange={(cur) => setOrganization({ ...organization, settings: { ...organization.settings, currency: cur } })}>
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
              <Input id='create-org-name' value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} placeholder='Acme Inc.' />
            </div>
            <div className='md:col-span-2'>
              <Label htmlFor='create-org-desc'>Description (optional)</Label>
              <Input id='create-org-desc' value={createForm.description} onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })} placeholder='What does your organization do?' />
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
            <Button variant='outline' onClick={() => setCreateOrgOpen(false)}>Cancel</Button>
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

