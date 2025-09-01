// Settings Page Component for LeadsBox Dashboard

import React, { useEffect, useState } from 'react';
import {
  Users,
  Building,
  Tag,
  MessageSquare,
  Bell,
  Shield,
  Palette,
  Globe,
  CreditCard,
  Plus,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  Save,
  User as UserIcon,
  X,
  Check,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Switch } from '../../components/ui/switch';
import { Textarea } from '../../components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../../components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { mockUsers, mockOrganization } from '../../data/mockData';
import { ThemeSettings } from './components/ThemeSettings';
import ProfileTab from './tabs/ProfileTab';
import OrganizationTab from './tabs/OrganizationTab';
import MembersTab from './tabs/MembersTab';
import TagsTab from './tabs/TagsTab';
import TemplatesTab from './tabs/TemplatesTab';
import NotificationsTab from './tabs/NotificationsTab';
import IntegrationsTab from './tabs/IntegrationsTab';
import client from '../../api/client';
import { API_BASE } from '../../api/config';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { useSearchParams } from 'react-router-dom';
import { WhatsAppIcon, TelegramIcon, InstagramIcon, FacebookIcon } from '@/components/brand-icons';

// brand icons imported from shared file

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [organization, setOrganization] = useState(mockOrganization);
  const [orgs, setOrgs] = useState<Array<{ id: string; name: string; settings?: any }>>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [orgLoading, setOrgLoading] = useState(false);
  // const [createOrgName, setCreateOrgName] = useState(''); // removed, creation via modal
  const [members, setMembers] = useState<Array<{
    membershipId: string;
    userId: string;
    name: string;
    email: string;
    avatar?: string | null;
    role: 'OWNER' | 'ADMIN' | 'MEMBER';
    addedAt: string;
  }>>([]);
  const [tags, setTags] = useState(['hot-lead', 'enterprise', 'startup', 'demo-requested', 'negotiation', 'follow-up']);
  const [newTag, setNewTag] = useState('');
  const { user, refreshAuth, setOrg } = useAuth();
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [waConnected, setWaConnected] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const apiRoot = React.useMemo(() => API_BASE.replace(/\/api\/?$/, ''), []);
  const [waToken, setWaToken] = useState<string | null>(null);
  const [businesses, setBusinesses] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedBusiness, setSelectedBusiness] = useState('');
  const [wabas, setWabas] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedWaba, setSelectedWaba] = useState('');
  const [phones, setPhones] = useState<Array<{ id: string; display: string }>>([]);
  const [selectedPhone, setSelectedPhone] = useState('');
  const [waLoading, setWaLoading] = useState(false);
  const [orgDialogOpen, setOrgDialogOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [createOrgOpen, setCreateOrgOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    currency: 'NGN',
    timezone: 'UTC',
  });
  const [connections, setConnections] = useState<Array<{ id: string; wabaId: string; phoneNumberId: string; display?: string }>>([]);
  const [disconnectKey, setDisconnectKey] = useState('');
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'MEMBER' | 'ADMIN'>('MEMBER');

  useEffect(() => {
    // initialize profile fields from user if available
    if (user) {
      setName(user.name || '');
      setAvatar(user.profileImage || user.avatar || '');
    }
  }, [user]);

  // Load organizations
  useEffect(() => {
    (async () => {
      try {
        setOrgLoading(true);
        const resp = await client.get('/orgs');
        const list: Array<any> = resp?.data?.data?.orgs || [];
        setOrgs(list);
        if (list.length) {
          setSelectedOrgId(list[0].id);
          try { setOrg(list[0].id); window.dispatchEvent(new CustomEvent('lb:org-changed')); } catch {
            console.error('Failed to set organization');
          }
          // Normalize with mock structure for UI compatibility
          const normalized = {
            ...mockOrganization,
            ...list[0],
            settings: { ...mockOrganization.settings, ...(list[0].settings || {}) },
          };
          setOrganization(normalized);
        }
      } catch (e) {
        console.error('Failed to load organizations', e);
      } finally {
        setOrgLoading(false);
      }
    })();
  }, []);

  // Load members when organization changes
  useEffect(() => {
    const fetchMembers = async () => {
      if (!selectedOrgId) return;
      try {
        const resp = await client.get(`/orgs/${selectedOrgId}/members`);
        const list: Array<any> = resp?.data?.data?.members || [];
        const mapped = list.map((m) => ({
          membershipId: m.id,
          userId: m.userId,
          name: m.user?.name || m.user?.username || 'User',
          email: m.user?.email || '',
          avatar: m.user?.profileImage || m.user?.avatar || null,
          role: m.role,
          addedAt: m.addedAt,
        }));
        setMembers(mapped);
      } catch (e) {
        console.error('Failed to load members', e);
      }
    };
    fetchMembers();
  }, [selectedOrgId]);

  const saveProfile = async () => {
    try {
      const parts = (name || '').trim().split(/\s+/);
      const firstName = parts[0] || '';
      const lastName = parts.slice(1).join(' ');
      const payload: any = {};
      if (firstName) payload.firstName = firstName;
      if (lastName) payload.lastName = lastName;
      if (avatar?.trim()) payload.profileImage = avatar.trim();
      if (Object.keys(payload).length === 0) {
        toast.info('Nothing to update');
        return;
      }
      await client.patch('/user/profile', payload);
      toast.success('Profile updated');
      await refreshAuth();
    } catch (e) {
      toast.error('Failed to update profile');
    }
  };

  // Check for WhatsApp connect status from query param
  useEffect(() => {
    const status = searchParams.get('whatsapp');
    const token = searchParams.get('waToken');
    if (status === 'connected') {
      setWaConnected(true);
      if (token) {
        setWaToken(token);
        // Ensure org exists first; if none, prompt to create before proceeding
        (async () => {
          try {
            const orgResp = await client.get('/orgs');
            const orgs = orgResp?.data?.data?.orgs || [];
            if (!Array.isArray(orgs) || orgs.length === 0) {
              setOrgDialogOpen(true);
              return;
            }
            try {
              const resp = await client.get(`${apiRoot}/api/provider/whatsapp/businesses`, {
                params: { accessToken: token },
              });
              const list = resp?.data?.data?.data || resp?.data?.data || [];
              setBusinesses(Array.isArray(list?.data) ? list.data : list);
            } catch (e) {
              toast.error('Failed to fetch businesses');
            }
          } catch (e) {
            toast.error('Failed to verify organization');
          }
        })();
      }
      toast.success('WhatsApp connected');
      searchParams.delete('whatsapp');
      searchParams.delete('waToken');
      setSearchParams(searchParams, { replace: true });
    } else if (status === 'error') {
      toast.error('WhatsApp connection failed');
      searchParams.delete('whatsapp');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Load connection status on mount
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
        console.error('Failed to fetch WhatsApp status');
      }
    })();
  }, [apiRoot]);

  const confirmBusiness = async () => {
    if (!waToken || !selectedBusiness) return;
    setWaLoading(true);
    try {
      const resp = await client.post(`${apiRoot}/api/provider/whatsapp/select-business`, {
        accessToken: waToken,
        businessId: selectedBusiness,
      });
      const list = resp?.data?.data?.wabas || [];
      setWabas(list);
    } catch (e) {
      toast.error('Failed to fetch WABAs');
    } finally {
      setWaLoading(false);
    }
  };

  const confirmWaba = async () => {
    if (!waToken || !selectedWaba) return;
    setWaLoading(true);
    try {
      const resp = await client.post(`${apiRoot}/api/provider/whatsapp/select-waba`, {
        accessToken: waToken,
        wabaId: selectedWaba,
      });
      const list = resp?.data?.data?.phoneNumbers || [];
      setPhones(list);
    } catch (e) {
      toast.error('Failed to fetch phone numbers');
    } finally {
      setWaLoading(false);
    }
  };

  const finalizeConnect = async () => {
    if (!waToken || !selectedWaba || !selectedPhone || !user?.id) return;
    setWaLoading(true);
    try {
      await client.post(`${apiRoot}/api/provider/whatsapp/connect`, {
        accessToken: waToken,
        wabaId: selectedWaba,
        phoneId: selectedPhone,
        userId: user.id,
      });
      setWaConnected(true);
      setWaToken(null);
      toast.success('WhatsApp account linked');
    } catch (e) {
      toast.error('Failed to link WhatsApp');
    } finally {
      setWaLoading(false);
    }
  };

  const disconnectWhatsApp = async () => {
    try {
      // If a specific connection is selected, pass it to backend
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
      toast.success('WhatsApp disconnected');
    } catch (e) {
      toast.error('Failed to disconnect WhatsApp');
    }
  };

  const startWhatsAppConnect = async () => {
    try {
      const resp = await client.get('/orgs');
      const orgs = resp?.data?.data?.orgs || [];
      if (!Array.isArray(orgs) || orgs.length === 0) {
        setOrgDialogOpen(true);
        return;
      }
      window.location.href = `${apiRoot}/api/provider/whatsapp`;
    } catch (e) {
      toast.error('Failed to check organizations');
    }
  };

  const createOrgAndStart = async () => {
    if (!newOrgName.trim()) {
      toast.error('Please enter an organization name');
      return;
    }
    try {
      await client.post('/orgs', { name: newOrgName.trim() });
      setOrgDialogOpen(false);
      setNewOrgName('');
      window.location.href = `${apiRoot}/api/provider/whatsapp`;
    } catch (e) {
      toast.error('Failed to create organization');
    }
  };

  const handleSaveOrganization = async () => {
    if (!selectedOrgId) return;
    try {
      await client.put(`/orgs/${selectedOrgId}`, {
        name: organization.name,
        settings: {
          currency: organization.settings.currency,
          timezone: organization.settings.timezone,
        },
      });
      toast.success('Organization updated');
      // refresh list names
      const next = orgs.map((o) => (o.id === selectedOrgId ? { ...o, name: organization.name } : o));
      setOrgs(next);
    } catch (e) {
      toast.error('Failed to update organization');
    }
  };

  // Deprecated inline create function removed; using modal with details instead

  // Create organization via modal with details
  const handleCreateOrganizationWithDetails = async () => {
    const name = createForm.name.trim();
    if (!name) {
      toast.error('Organization name is required');
      return;
    }
    try {
      // Step 1: create org with basic fields
      const resp = await client.post('/orgs', {
        name,
        description: createForm.description?.trim() || undefined,
      });
      const org = resp?.data?.data?.org;
      if (!org || !org.id) {
        throw new Error('Create response missing organization');
      }

      // Step 2: update settings (currency, timezone) if changed from defaults
      const nextSettings: any = {};
      if (createForm.currency) nextSettings.currency = createForm.currency;
      if (createForm.timezone) nextSettings.timezone = createForm.timezone;
      try {
        if (Object.keys(nextSettings).length > 0) {
          await client.put(`/orgs/${org.id}`, { settings: nextSettings });
        }
      } catch (e) {
        // Non-fatal; notify but keep created org selected
        toast.error('Organization created, but failed to save settings');
      }

      // Update UI state
      const normalized = {
        ...mockOrganization,
        ...org,
        settings: { ...mockOrganization.settings, ...(org.settings || {}), ...nextSettings },
      };
      setOrgs([org, ...orgs]);
      setSelectedOrgId(org.id);
      try { setOrg(org.id); window.dispatchEvent(new CustomEvent('lb:org-changed')); } catch {
        console.error('Failed to set organization');
      }
      setOrganization(normalized);

      // Reset and close
      setCreateForm({ name: '', description: '', currency: 'NGN', timezone: 'UTC' });
      setCreateOrgOpen(false);
      toast.success('Organization created');
    } catch (e) {
      toast.error('Failed to create organization');
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const inviteMember = async () => {
    if (!selectedOrgId) {
      toast.error('Select an organization first');
      return;
    }
    if (!inviteEmail.trim()) {
      toast.error('Enter member email');
      return;
    }
    try {
      await client.post(`/orgs/${selectedOrgId}/members`, { email: inviteEmail.trim(), role: inviteRole });
      setInviteEmail('');
      setInviteRole('MEMBER');
      setMemberDialogOpen(false);
      const resp = await client.get(`/orgs/${selectedOrgId}/members`);
      const list: Array<any> = resp?.data?.data?.members || [];
      const mapped = list.map((m) => ({
        membershipId: m.id,
        userId: m.userId,
        name: m.user?.name || m.user?.username || 'User',
        email: m.user?.email || '',
        avatar: m.user?.profileImage || m.user?.avatar || null,
        role: m.role,
        addedAt: m.addedAt,
      }));
      setMembers(mapped);
      toast.success('Member added');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to add member');
    }
  };

  const updateMemberRole = async (userId: string, role: 'MEMBER' | 'ADMIN' | 'OWNER') => {
    if (!selectedOrgId) return;
    try {
      await client.patch(`/orgs/${selectedOrgId}/members/${userId}/role`, { role });
      setMembers((prev) => prev.map((m) => (m.userId === userId ? { ...m, role } : m)));
      toast.success('Member role updated');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to update role');
    }
  };

  const removeMember = async (userId: string) => {
    if (!selectedOrgId) return;
    try {
      await client.delete(`/orgs/${selectedOrgId}/members/${userId}`);
      setMembers((prev) => prev.filter((m) => m.userId !== userId));
      toast.success('Member removed');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to remove member');
    }
  };

  const getRoleBadgeColor = (role: any) => {
    switch (role) {
      case 'OWNER':
        return 'bg-red-500/10 text-red-400';
      case 'ADMIN':
        return 'bg-blue-500/10 text-blue-400';
      case 'MEMBER':
        return 'bg-green-500/10 text-green-400';
      default:
        return 'bg-gray-500/10 text-gray-400';
    }
  };

  return (
    <div className='p-4 sm:p-6 space-y-4 sm:space-y-6'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
        <div>
          <h1 className='text-2xl sm:text-3xl font-bold text-foreground'>Settings</h1>
          <p className='text-sm sm:text-base text-muted-foreground'>Manage your organization and preferences</p>
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className='w-full overflow-x-auto flex gap-2 sm:grid sm:grid-cols-8'>
          <TabsTrigger value='profile'>Profile</TabsTrigger>
          <TabsTrigger value='integrations'>Integrations</TabsTrigger>
          <TabsTrigger value='organization'>Organization</TabsTrigger>
          <TabsTrigger value='members'>Members</TabsTrigger>
          <TabsTrigger value='tags'>Tags</TabsTrigger>
          <TabsTrigger value='templates'>Templates</TabsTrigger>
          <TabsTrigger value='notifications'>Notifications</TabsTrigger>
          <TabsTrigger value='appearance'>Appearance</TabsTrigger>
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value='profile' className='space-y-6'>
          <ProfileTab />
        </TabsContent>

        {/* Appearance Settings */}
        <TabsContent value='appearance'>
          <ThemeSettings />
        </TabsContent>

        {/* Organization Settings */}
        <TabsContent value='organization' className='space-y-6'>
          <OrganizationTab
            orgs={orgs}
            setOrgs={setOrgs}
            selectedOrgId={selectedOrgId}
            setSelectedOrgId={setSelectedOrgId}
            organization={organization}
            setOrganization={setOrganization}
            orgLoading={orgLoading}
            onSaveOrganization={handleSaveOrganization}
          />
        </TabsContent>

        {/* Members Management */}
        <TabsContent value='members' className='space-y-6'>
          <MembersTab selectedOrgId={selectedOrgId} />
        </TabsContent>

        {/* Tags Management */}
        <TabsContent value='tags' className='space-y-6'>
          <TagsTab />
        </TabsContent>

        {/* Templates */}
        <TabsContent value='templates' className='space-y-6'>
          <TemplatesTab />
        </TabsContent>

        {/* Notifications */}
        <TabsContent value='notifications' className='space-y-6'>
          <NotificationsTab organization={organization} />
        </TabsContent>

        {/* Integrations */}
        <TabsContent value='integrations' className='space-y-6'>
          <IntegrationsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
