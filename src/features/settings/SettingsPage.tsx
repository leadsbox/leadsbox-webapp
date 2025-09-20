// Settings Page Component for LeadsBox Dashboard

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { mockOrganization } from '../../data/mockData';
import { Org, Organization, OrgSettings } from './types';
import { ThemeSettings } from './components/ThemeSettings';
import ProfileTab from './tabs/ProfileTab';
import OrganizationTab from './tabs/OrganizationTab';
import MembersTab from './tabs/MembersTab';
import TagsTab from './tabs/TagsTab';
import TemplatesTab from './tabs/TemplatesTab';
import NotificationsTab from './tabs/NotificationsTab';
import IntegrationsTab from './tabs/IntegrationsTab';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
// brand icons imported in child tabs as needed

const SettingsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => {
    // Initialize tab from URL parameter, default to 'profile'
    const tabParam = searchParams.get('tab');
    const validTabs = ['profile', 'integrations', 'organization', 'members', 'tags', 'templates', 'notifications', 'appearance'];
    return validTabs.includes(tabParam || '') ? tabParam! : 'profile';
  });
  const [organization, setOrganization] = useState<Organization>({
    ...mockOrganization,
    settings: {
      timezone: 'UTC',
      currency: 'USD',
      ...mockOrganization.settings,
    },
  });
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [orgLoading, setOrgLoading] = useState(false);
  const { setOrg } = useAuth();

  // Handle tab changes and update URL
  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    // Update URL parameter
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('tab', newTab);
    setSearchParams(newSearchParams, { replace: true });
  };

  // Watch for URL parameter changes and update active tab
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    const validTabs = ['profile', 'integrations', 'organization', 'members', 'tags', 'templates', 'notifications', 'appearance'];
    const newTab = validTabs.includes(tabParam || '') ? tabParam! : 'profile';
    
    // Update active tab based on URL parameter
    setActiveTab(newTab);
  }, [searchParams]);  // Load organizations
  useEffect(() => {
    (async () => {
      try {
        setOrgLoading(true);
        const resp = await client.get<{ data: { orgs: Organization[] } }>('/orgs');
        const list = resp?.data?.data?.orgs || [];
        setOrgs(list);
        if (list.length) {
          setSelectedOrgId(list[0].id);
          try {
            setOrg(list[0].id);
            window.dispatchEvent(new CustomEvent('lb:org-changed'));
          } catch (error) {
            console.error('Failed to set organization', error);
          }
          // Normalize with mock structure for UI compatibility
          const org = list[0];
          const normalized: Organization = {
            ...mockOrganization,
            ...org,
            settings: {
              // Ensure nested defaults like notifications exist
              ...mockOrganization.settings,
              // Provide base defaults
              timezone: 'UTC',
              currency: 'USD',
              // Overlay org-provided settings last
              ...(org.settings || {}),
            },
          };
          setOrganization(normalized);
        }
      } catch (e) {
        console.error('Failed to load organizations', e);
      } finally {
        setOrgLoading(false);
      }
    })();
  }, [setOrg]);

  // All profile, members, and integrations logic moved to child tabs

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

  // Deprecated inline create function removed; organization creation lives in OrganizationTab

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
      <Tabs value={activeTab} onValueChange={handleTabChange}>
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
