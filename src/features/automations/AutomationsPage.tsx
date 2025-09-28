import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, MessageSquare, Sparkles, Wand2, Pencil, Trash2, Copy, Power, ArrowUpDown } from 'lucide-react';
import client, { getOrgId } from '@/api/client';
import { endpoints } from '@/api/config';
import type { Template, TemplateStatus, FollowUpRule } from '@/types';
import TagsTab from '@/features/settings/tabs/TagsTab';
import NewAutomationModal from './modals/NewAutomationModal';
import { AutomationFlow } from './builder/types';
import { FLOWS_COLLECTION_KEY, createDefaultFlow, useLocalStorage } from './builder/utils';
import { validateFlow } from './builder/serializers';
import { toast } from 'react-toastify';
import { useAuth } from '@/context/AuthContext';

// Removed unused quickReplies and followUps arrays

type TemplateStatusFilter = TemplateStatus | 'ALL';

const TEMPLATE_STATUS_ORDER: TemplateStatus[] = ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED'];

const TEMPLATE_STATUS_LABELS: Record<TemplateStatus, string> = {
  DRAFT: 'Draft',
  PENDING_APPROVAL: 'Pending approval',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};

const formatEnumLabel = (value: string) =>
  value
    .split('_')
    .filter(Boolean)
    .map((segment) => segment.charAt(0) + segment.slice(1).toLowerCase())
    .join(' ');

const resolveTemplateStatus = (status?: TemplateStatus | null): TemplateStatus => {
  if (!status) return 'DRAFT';
  return TEMPLATE_STATUS_ORDER.includes(status) ? status : 'DRAFT';
};

type FollowUpFormDraft = {
  conversationId: string;
  provider: string;
  scheduledTime: string;
  message: string;
  templateId?: string;
  status: FollowUpRule['status'];
};

const DEFAULT_PROVIDER = 'whatsapp';

const createFollowupDefaults = (conversationId = ''): FollowUpFormDraft => ({
  conversationId,
  provider: DEFAULT_PROVIDER,
  scheduledTime: '',
  message: '',
  templateId: undefined,
  status: 'SCHEDULED',
});

const toDateTimeLocalInput = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const pad = (num: number) => num.toString().padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const parseDateTimeLocal = (value?: string) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const AutomationsPage: React.FC = () => {
  const { user } = useAuth();
  // Sorting state for templates
  const [templateStatusFilter, setTemplateStatusFilter] = useState<TemplateStatusFilter>('ALL');
  const [statusSortDirection, setStatusSortDirection] = useState<'ASC' | 'DESC'>('ASC');
  const [flows, setFlows] = useLocalStorage<AutomationFlow[]>(FLOWS_COLLECTION_KEY, []);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingFlow, setEditingFlow] = useState<AutomationFlow | undefined>();
  // --- Templates ---
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  // --- Follow-ups ---
  const [allFollowups, setAllFollowups] = useState<FollowUpRule[]>([]);
  const [followupsLoading, setFollowupsLoading] = useState(false);
  const [conversationFilter, setConversationFilter] = useState<string>('ALL');
  const [editingFollowup, setEditingFollowup] = useState<FollowUpRule | null>(null);
  const [editingFollowupDraft, setEditingFollowupDraft] = useState<Partial<FollowUpRule>>({});
  const [editingFollowupVariables, setEditingFollowupVariables] = useState('');
  const [createFollowupOpen, setCreateFollowupOpen] = useState(false);
  const [createFollowupDraft, setCreateFollowupDraft] = useState<FollowUpFormDraft>(() => createFollowupDefaults());
  const [createFollowupVariables, setCreateFollowupVariables] = useState('');

  const resetCreateFollowupForm = useCallback(
    (prefillConversationId?: string) => {
      setCreateFollowupDraft(createFollowupDefaults(prefillConversationId ?? (conversationFilter !== 'ALL' ? conversationFilter : '')));
      setCreateFollowupVariables('');
    },
    [conversationFilter]
  );

  const resetEditingFollowup = () => {
    setEditingFollowup(null);
    setEditingFollowupDraft({});
    setEditingFollowupVariables('');
  };

  // Fetch templates
  useEffect(() => {
    setTemplatesLoading(true);
    client
      .get(endpoints.templates)
      .then((res) => setTemplates(Array.isArray(res.data?.data) ? res.data.data : []))
      .catch(() => setTemplates([]))
      .finally(() => setTemplatesLoading(false));
  }, []);
  const fetchAllFollowups = useCallback(async () => {
    setFollowupsLoading(true);
    try {
      const res = await client.get(endpoints.followups);
      const payload = res.data?.data;
      const followUps = Array.isArray(payload?.followUps)
        ? (payload.followUps as FollowUpRule[])
        : Array.isArray(payload)
        ? (payload as FollowUpRule[])
        : Array.isArray(res.data)
        ? (res.data as FollowUpRule[])
        : [];
      setAllFollowups(followUps);
    } catch (error: any) {
      setAllFollowups([]);
      const message = error?.response?.data?.message;
      if (message) {
        toast.error(message);
      }
    } finally {
      setFollowupsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllFollowups();
  }, [fetchAllFollowups]);

  useEffect(() => {
    if (!createFollowupOpen) {
      resetCreateFollowupForm();
    }
  }, [conversationFilter, createFollowupOpen, resetCreateFollowupForm]);

  const openBuilder = (flow?: AutomationFlow) => {
    setEditingFlow(flow ?? { ...createDefaultFlow(), name: 'Untitled automation' });
    setBuilderOpen(true);
  };

  const handleSaveFlow = (saved: AutomationFlow) => {
    setFlows((current) => {
      const exists = current.some((flow) => flow.id === saved.id);
      const next = exists ? current.map((flow) => (flow.id === saved.id ? saved : flow)) : [...current, saved];
      return next;
    });
  };

  const handleDuplicate = (flow: AutomationFlow) => {
    const duplicated: AutomationFlow = {
      ...flow,
      id: `${flow.id}-copy-${Date.now()}`,
      name: `${flow.name} (Copy)`,
      status: 'DRAFT',
      version: flow.version + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setFlows((current) => [...current, duplicated]);
    toast.success('Flow duplicated.');
  };

  const handleDelete = (flowId: string) => {
    if (!window.confirm('Delete this automation? This cannot be undone.')) return;
    setFlows((current) => current.filter((flow) => flow.id !== flowId));
    toast.info('Automation deleted.');
  };

  const handleToggle = (flow: AutomationFlow) => {
    const result = validateFlow(flow);
    if (!result.ok) {
      toast.error('Please resolve validation issues before turning it on.');
      return;
    }
    setFlows((current) =>
      current.map((candidate) =>
        candidate.id === flow.id ? { ...candidate, status: flow.status === 'ON' ? 'OFF' : 'ON', updatedAt: new Date().toISOString() } : candidate
      )
    );
  };

  const flowsSummary = useMemo(() => {
    if (!flows.length) return 'No automations yet';
    const active = flows.filter((flow) => flow.status === 'ON').length;
    return `${active} live · ${flows.length} total`;
  }, [flows]);

  const filteredTemplates = useMemo(() => {
    const byStatus =
      templateStatusFilter === 'ALL' ? templates : templates.filter((template) => resolveTemplateStatus(template.status) === templateStatusFilter);

    const resolvedOrder = TEMPLATE_STATUS_ORDER;
    const sortMultiplier = statusSortDirection === 'ASC' ? 1 : -1;

    return [...byStatus].sort((a, b) => {
      const aStatus = resolveTemplateStatus(a?.status);
      const bStatus = resolveTemplateStatus(b?.status);
      const aIndex = resolvedOrder.indexOf(aStatus);
      const bIndex = resolvedOrder.indexOf(bStatus);

      const safeA = aIndex === -1 ? resolvedOrder.length : aIndex;
      const safeB = bIndex === -1 ? resolvedOrder.length : bIndex;

      return (safeA - safeB) * sortMultiplier;
    });
  }, [templates, templateStatusFilter, statusSortDirection]);

  const approvedTemplates = useMemo(
    () => templates.filter((template) => resolveTemplateStatus(template.status) === 'APPROVED'),
    [templates]
  );

  const conversationOptions = useMemo(() => {
    const ids = Array.from(new Set(allFollowups.map((followup) => followup.conversationId).filter(Boolean)));
    ids.sort();
    return ids;
  }, [allFollowups]);

  const filteredFollowups = useMemo(() => {
    const source =
      conversationFilter === 'ALL'
        ? allFollowups
        : allFollowups.filter((followup) => followup.conversationId === conversationFilter);

    const toTimestamp = (value?: string | null) => {
      if (!value) return Number.POSITIVE_INFINITY;
      const time = new Date(value).getTime();
      return Number.isNaN(time) ? Number.POSITIVE_INFINITY : time;
    };

    return [...source].sort((a, b) => {
      const aTime = toTimestamp(a.scheduledTime ?? a.createdAt);
      const bTime = toTimestamp(b.scheduledTime ?? b.createdAt);
      return aTime - bTime;
    });
  }, [allFollowups, conversationFilter]);

  useEffect(() => {
    if (conversationFilter === 'ALL') return;
    const exists = allFollowups.some((followup) => followup.conversationId === conversationFilter);
    if (!exists) {
      setConversationFilter('ALL');
    }
  }, [allFollowups, conversationFilter]);

  const parseVariablesInput = (input: string) => {
    if (!input.trim()) return undefined;

    try {
      const parsed = JSON.parse(input.trim());
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Variables must be a JSON object');
      }

      return Object.fromEntries(
        Object.entries(parsed).map(([key, value]) => [key, String(value ?? '')])
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Variables must be valid JSON';
      throw new Error(message);
    }
  };

  const handleCreateFollowup = async () => {
    const conversationId = createFollowupDraft.conversationId.trim();
    if (!conversationId) {
      toast.error('Conversation ID is required');
      return;
    }

    const provider = (createFollowupDraft.provider || DEFAULT_PROVIDER).trim();
    if (!provider) {
      toast.error('Select a provider');
      return;
    }

    const scheduledDate = parseDateTimeLocal(createFollowupDraft.scheduledTime);
    if (!scheduledDate) {
      toast.error('Choose a valid scheduled time');
      return;
    }

    if (scheduledDate.getTime() <= Date.now()) {
      toast.error('Scheduled time must be in the future');
      return;
    }

    const organizationId = user?.orgId || user?.currentOrgId || getOrgId();
    if (!user?.id || !organizationId) {
      toast.error('We could not determine your organization context.');
      return;
    }

    let variables: Record<string, string> | undefined;
    try {
      variables = parseVariablesInput(createFollowupVariables);
    } catch (error) {
      toast.error((error as Error).message);
      return;
    }

    const payload = {
      conversationId,
      provider,
      scheduledTime: scheduledDate.toISOString(),
      message: createFollowupDraft.message.trim() || undefined,
      userId: user.id,
      organizationId,
      templateId: createFollowupDraft.templateId || undefined,
      variables,
    };

    try {
      await client.post(endpoints.followups, payload);
      toast.success('Workflow created');
      setCreateFollowupOpen(false);
      resetCreateFollowupForm(conversationId);
      setConversationFilter(conversationId);
      await fetchAllFollowups();
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to create follow-up';
      toast.error(message);
    }
  };

  const handleUpdateFollowup = async () => {
    if (!editingFollowup) return;

    const conversationId = (editingFollowupDraft.conversationId || editingFollowup.conversationId || '').trim();
    if (!conversationId) {
      toast.error('Conversation ID is required');
      return;
    }

    const provider = ((editingFollowupDraft.provider as string | undefined) || editingFollowup.provider || DEFAULT_PROVIDER).trim();
    if (!provider) {
      toast.error('Select a provider');
      return;
    }

    const scheduledInput = editingFollowupDraft.scheduledTime ?? toDateTimeLocalInput(editingFollowup.scheduledTime);
    const scheduledDate = parseDateTimeLocal(scheduledInput);
    if (!scheduledDate) {
      toast.error('Choose a valid scheduled time');
      return;
    }

    if (scheduledDate.getTime() <= Date.now()) {
      toast.error('Scheduled time must be in the future');
      return;
    }

    let variables: Record<string, string> | undefined;
    try {
      variables = parseVariablesInput(editingFollowupVariables);
    } catch (error) {
      toast.error((error as Error).message);
      return;
    }

    const status = editingFollowupDraft.status || editingFollowup.status || 'SCHEDULED';
    const trimmedMessage =
      editingFollowupDraft.message !== undefined ? editingFollowupDraft.message.trim() : undefined;

    const payload: Record<string, unknown> = {
      scheduledTime: scheduledDate.toISOString(),
      status,
      provider,
    };

    if (trimmedMessage !== undefined) {
      payload.message = trimmedMessage;
    }

    if (editingFollowupDraft.templateId !== undefined) {
      payload.templateId = editingFollowupDraft.templateId || null;
    }

    if (variables !== undefined) {
      payload.variables = variables;
    }

    try {
      await client.put(endpoints.followup(editingFollowup.id), payload);
      toast.success('Workflow updated');
      resetEditingFollowup();
      setConversationFilter(conversationId);
      await fetchAllFollowups();
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to save workflow';
      toast.error(message);
    }
  };

  return (
    <div className='p-4 sm:p-6 space-y-6'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
        <div>
          <h1 className='text-2xl sm:text-3xl font-bold text-foreground'>Automations</h1>
          <p className='text-sm text-muted-foreground'>{flowsSummary}</p>
        </div>
        <div className='flex gap-2'>
          <Button variant='outline'>View activity</Button>
          <Button onClick={() => openBuilder()}>
            <Sparkles className='mr-2 h-4 w-4' />
            Build automation
          </Button>
        </div>
      </div>

      <Tabs defaultValue='templates' className='w-full'>
        <TabsList className='grid w-full grid-cols-2 sm:w-auto sm:grid-cols-4'>
          <TabsTrigger value='templates'>Templates</TabsTrigger>
          <TabsTrigger value='auto-responses'>Auto-responses</TabsTrigger>
          <TabsTrigger value='follow-ups'>Follow-ups</TabsTrigger>
          <TabsTrigger value='flows'>Flows</TabsTrigger>
        </TabsList>
        <TabsContent value='templates' className='space-y-6 pt-4'>
          {/* Card for creating a new template */}
          <Card className='mb-6 border-muted'>
            <CardHeader className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
              <div>
                <CardTitle>Create New Template</CardTitle>
                <CardDescription>Create a quick reply template for your team.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {editingTemplate && editingTemplate.id === '' ? (
                <div className='space-y-3'>
                  <input
                    className='border border-input rounded px-3 py-2 w-full bg-muted focus:outline-none focus:ring focus:ring-primary/30 text-sm'
                    placeholder='Name'
                    value={editingTemplate.name}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                  />
                  <textarea
                    className='border border-input rounded px-3 py-2 w-full bg-muted focus:outline-none focus:ring focus:ring-primary/30 text-sm resize-none'
                    placeholder='Body'
                    rows={3}
                    value={editingTemplate.body}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, body: e.target.value })}
                  />
                  <input
                    className='border border-input rounded px-3 py-2 w-full bg-muted focus:outline-none focus:ring focus:ring-primary/30 text-sm'
                    placeholder='Variables (comma separated)'
                    value={editingTemplate.variables.join(',')}
                    onChange={(e) =>
                      setEditingTemplate({
                        ...editingTemplate,
                        variables: e.target.value
                          .split(',')
                          .map((v) => v.trim())
                          .filter(Boolean),
                      })
                    }
                  />
                  <div className='flex gap-2 pt-2'>
                    <Button
                      size='sm'
                      variant='default'
                      onClick={async () => {
                        const name = editingTemplate.name?.trim();
                        const body = editingTemplate.body?.trim();

                        if (name && body) {
                          try {
                            const variables = Array.isArray(editingTemplate.variables)
                              ? editingTemplate.variables.map((variable) => variable.trim()).filter(Boolean)
                              : [];
                            const category = (editingTemplate.category ?? 'MARKETING') as Template['category'];

                            const payload = {
                              name,
                              body,
                              variables,
                              category,
                              language: editingTemplate.language,
                            };

                            const res = await client.post(endpoints.templates, payload);
                            const createdTemplate = res.data?.data;
                            if (createdTemplate) {
                              setTemplates((prev) => [...prev, createdTemplate]);
                              toast.success('Template created');
                            } else {
                              toast.warn('Template created but response was empty');
                            }
                            setEditingTemplate(null);
                          } catch (error: unknown) {
                            let message = 'Failed to create template';
                            if (typeof error === 'object' && error !== null && 'response' in error) {
                              const err = error as { response?: { data?: { message?: string } } };
                              message = err.response?.data?.message || message;
                            }
                            toast.error(message);
                          }
                        } else {
                          toast.error('Name and body are required');
                        }
                      }}
                    >
                      Save
                    </Button>
                    <Button size='sm' variant='outline' onClick={() => setEditingTemplate(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  size='sm'
                  onClick={() =>
                    setEditingTemplate({
                      id: '',
                      name: '',
                      body: '',
                      variables: [],
                      category: 'MARKETING',
                      status: 'DRAFT',
                    })
                  }
                >
                  New template
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Card for listing and sorting templates */}
          <Card>
            <CardHeader className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
              <div>
                <CardTitle>Quick reply library</CardTitle>
                <CardDescription>Save your most common answers so the team replies in seconds.</CardDescription>
              </div>
              <div className='flex flex-col gap-2 sm:flex-row sm:items-center'>
                <select
                  className='border border-input rounded px-2 py-1 text-sm bg-muted focus:outline-none focus:ring focus:ring-primary/30'
                  value={templateStatusFilter}
                  onChange={(e) => setTemplateStatusFilter(e.target.value as TemplateStatusFilter)}
                >
                  <option value='ALL'>All statuses</option>
                  {TEMPLATE_STATUS_ORDER.map((status) => (
                    <option key={status} value={status}>
                      {TEMPLATE_STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
                <Button size='sm' variant='outline' onClick={() => setStatusSortDirection((current) => (current === 'ASC' ? 'DESC' : 'ASC'))}>
                  <ArrowUpDown className='mr-2 h-4 w-4' />
                  Status order: {statusSortDirection === 'ASC' ? 'Ascending' : 'Descending'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {templatesLoading ? (
                <div className='space-y-3'>
                  {[0, 1, 2].map((key) => (
                    <Skeleton key={key} className='h-24 w-full' />
                  ))}
                </div>
              ) : filteredTemplates.length ? (
                <div className='space-y-3'>
                  {filteredTemplates.map((template, index) => {
                    if (!template) return null;

                    const variables = Array.isArray(template.variables) ? template.variables : [];
                    const normalizedStatus = resolveTemplateStatus(template.status);
                    const statusLabel = TEMPLATE_STATUS_LABELS[normalizedStatus] ?? formatEnumLabel(normalizedStatus);
                    const category = (template.category ?? 'MARKETING') as Template['category'];
                    const categoryLabel = formatEnumLabel(category);

                    return (
                      <div key={template.id || `template-${index}`} className='rounded-lg border border-muted bg-background/40 p-4 shadow-sm'>
                        <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
                          <div className='space-y-2'>
                            <div className='flex flex-col gap-1'>
                              <span className='text-base font-semibold text-foreground'>{template.name || 'Untitled template'}</span>
                              <span className='text-sm text-muted-foreground line-clamp-2'>{template.body || 'No content provided.'}</span>
                            </div>
                            {variables.length > 0 && (
                              <div className='flex flex-wrap gap-1'>
                                {variables.map((variable) => (
                                  <Badge key={variable} variant='secondary' className='text-xs font-normal'>
                                    {variable}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className='flex flex-col items-start gap-2 sm:items-end'>
                            <Badge variant='outline' className='tracking-wide'>
                              {statusLabel}
                            </Badge>
                            <span className='text-xs text-muted-foreground'>Category: {categoryLabel}</span>
                          </div>
                        </div>
                        <div className='mt-4 flex flex-wrap gap-2'>
                          <Button size='sm' onClick={() => setEditingTemplate(template)}>
                            Edit
                          </Button>
                          <Button
                            size='sm'
                            variant='destructive'
                            onClick={async () => {
                              try {
                                await client.delete(`${endpoints.templates}/${template.id}`);
                                setTemplates((prev) => prev.filter((x) => x.id !== template.id));
                                toast.success('Template deleted');
                              } catch (error: unknown) {
                                let message = 'Failed to delete template';
                                if (
                                  typeof error === 'object' &&
                                  error !== null &&
                                  'response' in error &&
                                  typeof (error as { response?: { data?: { message?: string } } }).response === 'object'
                                ) {
                                  message = (error as { response?: { data?: { message?: string } } }).response?.data?.message || message;
                                }
                                toast.error(message);
                              }
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className='text-sm text-muted-foreground'>No templates found for the selected filters.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='auto-responses' className='space-y-6 pt-4'>
          <Card>
            <CardHeader className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
              <div>
                <CardTitle>Instant replies</CardTitle>
                <CardDescription>Keep leads warm, even when your team is busy or offline.</CardDescription>
              </div>
              <Button size='sm'>Create auto-response</Button>
            </CardHeader>
            <CardContent className='space-y-4'>
              {/* Auto-responses UI is placeholder, remove dead code. Implement real auto-response CRUD if needed. */}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Response windows</CardTitle>
              <CardDescription>Define office hours and escalation rules when nobody replies.</CardDescription>
            </CardHeader>
            <CardContent className='grid gap-4 md:grid-cols-2'>
              <Card className='border-muted'>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2 text-base'>
                    <Clock className='h-4 w-4 text-primary' />
                    Business hours
                  </CardTitle>
                  <CardDescription>Auto-detect when the team is offline and set the right expectations.</CardDescription>
                </CardHeader>
              </Card>
              <Card className='border-muted'>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2 text-base'>
                    <Wand2 className='h-4 w-4 text-primary' />
                    Escalations
                  </CardTitle>
                  <CardDescription>Route important conversations to the right teammate instantly.</CardDescription>
                </CardHeader>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='follow-ups' className='space-y-6 pt-4'>
          <Card className='border-muted'>
            <CardHeader className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
              <div>
                <CardTitle>Schedule follow-up</CardTitle>
                <CardDescription>Line up the next message before the thread goes cold.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {createFollowupOpen ? (
                <div className='space-y-3'>
                  <div className='grid gap-3 sm:grid-cols-2'>
                    <div className='space-y-1'>
                      <label className='text-xs font-medium text-muted-foreground'>Conversation ID<span className='text-destructive'>*</span></label>
                      <input
                        className='w-full rounded border border-input bg-muted px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-primary/30'
                        placeholder='conv_123'
                        list='followup-conversations'
                        value={createFollowupDraft.conversationId}
                        onChange={(e) => setCreateFollowupDraft({ ...createFollowupDraft, conversationId: e.target.value })}
                      />
                      {conversationOptions.length > 0 && (
                        <datalist id='followup-conversations'>
                          {conversationOptions.map((conversationId) => (
                            <option key={conversationId} value={conversationId} />
                          ))}
                        </datalist>
                      )}
                    </div>
                    <div className='space-y-1'>
                      <label className='text-xs font-medium text-muted-foreground'>Channel</label>
                      <select
                        className='w-full rounded border border-input bg-muted px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-primary/30'
                        value={createFollowupDraft.provider}
                        onChange={(e) => setCreateFollowupDraft({ ...createFollowupDraft, provider: e.target.value })}
                      >
                        <option value='whatsapp'>WhatsApp</option>
                        <option value='sms'>SMS</option>
                        <option value='email'>Email</option>
                        <option value='telegram'>Telegram</option>
                        <option value='instagram'>Instagram</option>
                      </select>
                    </div>
                  </div>
                  <div className='grid gap-3 sm:grid-cols-2'>
                    <div className='space-y-1'>
                      <label className='text-xs font-medium text-muted-foreground'>Scheduled time<span className='text-destructive'>*</span></label>
                      <input
                        type='datetime-local'
                        className='w-full rounded border border-input bg-muted px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-primary/30'
                        value={createFollowupDraft.scheduledTime}
                        onChange={(e) => setCreateFollowupDraft({ ...createFollowupDraft, scheduledTime: e.target.value })}
                      />
                    </div>
                    {approvedTemplates.length > 0 && (
                      <div className='space-y-1'>
                        <label className='text-xs font-medium text-muted-foreground'>Template (approved)</label>
                        <select
                          className='w-full rounded border border-input bg-muted px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-primary/30'
                          value={createFollowupDraft.templateId ?? ''}
                          onChange={(e) => setCreateFollowupDraft({ ...createFollowupDraft, templateId: e.target.value || undefined })}
                        >
                          <option value=''>No template</option>
                          {approvedTemplates.map((template) => (
                            <option key={template.id} value={template.id}>
                              {template.name} · {formatEnumLabel(template.category)}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                  <div className='space-y-1'>
                    <label className='text-xs font-medium text-muted-foreground'>Message</label>
                    <textarea
                      className='w-full rounded border border-input bg-muted px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-primary/30'
                      rows={4}
                      placeholder='Hi there! Checking in on our conversation...'
                      value={createFollowupDraft.message}
                      onChange={(e) => setCreateFollowupDraft({ ...createFollowupDraft, message: e.target.value })}
                    />
                    <p className='text-[11px] text-muted-foreground'>Required for 24-hour window follow-ups when no template is selected.</p>
                  </div>
                  <div className='space-y-1'>
                    <label className='text-xs font-medium text-muted-foreground'>Template variables (JSON)</label>
                    <textarea
                      className='w-full rounded border border-input bg-muted px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-primary/30'
                      rows={3}
                      placeholder='{"name":"Alex"}'
                      value={createFollowupVariables}
                      onChange={(e) => setCreateFollowupVariables(e.target.value)}
                    />
                    <p className='text-[11px] text-muted-foreground'>Only needed when the selected template includes placeholders.</p>
                  </div>
                  <div className='flex flex-wrap gap-2 pt-2'>
                    <Button size='sm' onClick={handleCreateFollowup}>Save</Button>
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => {
                        setCreateFollowupOpen(false);
                        resetCreateFollowupForm();
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
                  <p className='text-sm text-muted-foreground'>Schedule the perfect follow-up once and reuse it whenever a lead goes quiet.</p>
                  <Button
                    size='sm'
                    onClick={() => {
                      if (!user?.id) {
                        toast.error('You must be signed in to create follow-ups');
                        return;
                      }
                      setCreateFollowupOpen(true);
                      resetCreateFollowupForm();
                    }}
                  >
                    Schedule follow-up
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className='border-muted'>
            <CardHeader className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
              <div>
                <CardTitle>Follow-up log</CardTitle>
                <CardDescription>Review and manage the nudges queued for a conversation.</CardDescription>
              </div>
              <div className='flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center'>
                <select
                  className='w-full rounded border border-input bg-muted px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-primary/30 sm:w-60'
                  value={conversationFilter}
                  onChange={(e) => setConversationFilter(e.target.value)}
                >
                  <option value='ALL'>All conversations</option>
                  {conversationOptions.map((conversationId) => (
                    <option key={conversationId} value={conversationId}>
                      {conversationId}
                    </option>
                  ))}
                </select>
                <Badge variant='outline' className='justify-center'>{filteredFollowups.length} {filteredFollowups.length === 1 ? 'workflow' : 'workflows'}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {editingFollowup && (
                  <Card className='border-muted bg-background/80'>
                    <CardHeader className='space-y-1 pb-2'>
                      <CardTitle className='text-lg font-semibold'>Edit workflow</CardTitle>
                      <CardDescription className='text-muted-foreground'>Adjust the timing or content before the follow-up fires.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className='space-y-3'>
                        <div className='grid gap-3 sm:grid-cols-2'>
                          <div className='space-y-1'>
                            <label className='text-xs font-medium text-muted-foreground'>Conversation ID</label>
                            <input
                              className='w-full rounded border border-input bg-muted px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-primary/30'
                              value={editingFollowupDraft.conversationId ?? editingFollowup.conversationId}
                              onChange={(e) => setEditingFollowupDraft({ ...editingFollowupDraft, conversationId: e.target.value })}
                            />
                          </div>
                          <div className='space-y-1'>
                            <label className='text-xs font-medium text-muted-foreground'>Channel</label>
                            <select
                              className='w-full rounded border border-input bg-muted px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-primary/30'
                              value={(editingFollowupDraft.provider as string) ?? editingFollowup.provider ?? DEFAULT_PROVIDER}
                              onChange={(e) => setEditingFollowupDraft({ ...editingFollowupDraft, provider: e.target.value })}
                            >
                              <option value='whatsapp'>WhatsApp</option>
                              <option value='sms'>SMS</option>
                              <option value='email'>Email</option>
                              <option value='telegram'>Telegram</option>
                              <option value='instagram'>Instagram</option>
                            </select>
                          </div>
                        </div>
                        <div className='grid gap-3 sm:grid-cols-2'>
                          <div className='space-y-1'>
                            <label className='text-xs font-medium text-muted-foreground'>Scheduled time</label>
                            <input
                              type='datetime-local'
                              className='w-full rounded border border-input bg-muted px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-primary/30'
                              value={editingFollowupDraft.scheduledTime ?? toDateTimeLocalInput(editingFollowup.scheduledTime)}
                              onChange={(e) => setEditingFollowupDraft({ ...editingFollowupDraft, scheduledTime: e.target.value })}
                            />
                          </div>
                          <div className='space-y-1'>
                            <label className='text-xs font-medium text-muted-foreground'>Status</label>
                            <select
                              className='w-full rounded border border-input bg-muted px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-primary/30'
                              value={editingFollowupDraft.status ?? editingFollowup.status}
                              onChange={(e) => setEditingFollowupDraft({ ...editingFollowupDraft, status: e.target.value as FollowUpRule['status'] })}
                            >
                              <option value='SCHEDULED'>SCHEDULED</option>
                              <option value='SENT'>SENT</option>
                              <option value='CANCELLED'>CANCELLED</option>
                              <option value='FAILED'>FAILED</option>
                            </select>
                          </div>
                        </div>
                        {approvedTemplates.length > 0 && (
                          <div className='space-y-1'>
                            <label className='text-xs font-medium text-muted-foreground'>Template (approved)</label>
                            <select
                              className='w-full rounded border border-input bg-muted px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-primary/30'
                              value={editingFollowupDraft.templateId ?? editingFollowup.templateId ?? ''}
                              onChange={(e) => setEditingFollowupDraft({ ...editingFollowupDraft, templateId: e.target.value || undefined })}
                            >
                              <option value=''>No template</option>
                              {approvedTemplates.map((template) => (
                                <option key={template.id} value={template.id}>
                                  {template.name} · {formatEnumLabel(template.category)}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                        <div className='space-y-1'>
                          <label className='text-xs font-medium text-muted-foreground'>Message</label>
                          <textarea
                            className='w-full rounded border border-input bg-muted px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-primary/30'
                            rows={4}
                            value={editingFollowupDraft.message ?? editingFollowup.message ?? ''}
                            onChange={(e) => setEditingFollowupDraft({ ...editingFollowupDraft, message: e.target.value })}
                          />
                        </div>
                        <div className='space-y-1'>
                          <label className='text-xs font-medium text-muted-foreground'>Template variables (JSON)</label>
                          <textarea
                            className='w-full rounded border border-input bg-muted px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-primary/30'
                            rows={3}
                            value={editingFollowupVariables}
                            onChange={(e) => setEditingFollowupVariables(e.target.value)}
                          />
                          <p className='text-[11px] text-muted-foreground'>Only needed when the selected template includes placeholders.</p>
                        </div>
                        <div className='flex flex-wrap gap-2 pt-2'>
                          <Button size='sm' onClick={handleUpdateFollowup}>Save</Button>
                          <Button size='sm' variant='outline' onClick={resetEditingFollowup}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {followupsLoading ? (
                  <div className='space-y-3'>
                    {[0, 1].map((key) => (
                      <Skeleton key={key} className='h-24 w-full' />
                    ))}
                  </div>
                ) : filteredFollowups.length === 0 ? (
                  <p className='text-sm text-muted-foreground'>
                    {conversationFilter === 'ALL'
                      ? 'No follow-ups scheduled yet.'
                      : `No follow-ups scheduled for ${conversationFilter}.`}
                  </p>
                ) : (
                  filteredFollowups.map((item, index) => (
                    <Card key={item.id} className='border-muted'>
                      <CardHeader className='flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between'>
                        <div className='space-y-1'>
                          <CardTitle className='text-base font-semibold text-foreground'>Follow-up #{index + 1}</CardTitle>
                          <div className='text-xs text-muted-foreground space-y-1'>
                            <p>Conversation: {item.conversationId}</p>
                            <p>Channel: {item.provider}</p>
                            <p>Template: {item.template?.name || '—'}</p>
                          </div>
                        </div>
                        <div className='flex flex-col items-start gap-2 sm:items-end'>
                          <Badge variant='outline' className='bg-primary/10 text-primary uppercase tracking-wide'>
                            {item.status}
                          </Badge>
                          <span className='text-xs text-muted-foreground'>
                            {item.scheduledTime ? new Date(item.scheduledTime).toLocaleString() : 'No schedule'}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className='space-y-3'>
                        <div className='rounded-md border border-dashed border-border p-3 text-sm text-muted-foreground'>
                          <h4 className='flex items-center gap-2 text-sm font-medium text-foreground'>
                            <MessageSquare className='h-4 w-4 text-primary' /> Message
                          </h4>
                          <p className='mt-1 whitespace-pre-wrap'>{item.message || '—'}</p>
                        </div>
                        <div className='flex flex-wrap gap-2'>
                          <Button
                            size='sm'
                            onClick={() => {
                              setEditingFollowup(item);
                              setEditingFollowupDraft({
                                conversationId: item.conversationId,
                                provider: item.provider,
                                scheduledTime: toDateTimeLocalInput(item.scheduledTime),
                                status: item.status,
                                message: item.message ?? '',
                                templateId: item.templateId ?? undefined,
                              });
                              setEditingFollowupVariables(item.variables ? JSON.stringify(item.variables, null, 2) : '');
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            size='sm'
                            variant='destructive'
                            onClick={async () => {
                              try {
                                await client.delete(endpoints.followup(item.id));
                                toast.success('Workflow deleted');
                                if (editingFollowup?.id === item.id) {
                                  resetEditingFollowup();
                                }
                                await fetchAllFollowups();
                              } catch (error: any) {
                                const message = error?.response?.data?.message || 'Failed to delete workflow';
                                toast.error(message);
                              }
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reminder channels</CardTitle>
              <CardDescription>Choose how the team gets nudged when a lead is going quiet.</CardDescription>
            </CardHeader>
            <CardContent className='grid gap-4 md:grid-cols-2'>
              <Card className='border-muted'>
                <CardHeader>
                  <CardTitle className='text-base'>Inbox notifications</CardTitle>
                  <CardDescription>Create tasks inside LeadsBox when a follow-up is due.</CardDescription>
                </CardHeader>
              </Card>
              <Card className='border-muted'>
                <CardHeader>
                  <CardTitle className='text-base'>Slack & email</CardTitle>
                  <CardDescription>Ping the team where they work so nothing slips through.</CardDescription>
                </CardHeader>
              </Card>
            </CardContent>
          </Card>

          <TagsTab />
        </TabsContent>

        <TabsContent value='flows' className='space-y-4 pt-4'>
          {flows.length === 0 ? (
            <Card className='border-dashed border-primary/40 bg-muted/50'>
              <CardHeader>
                <CardTitle>No automations yet</CardTitle>
                <CardDescription>Design your first journey to keep leads warm around the clock.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => openBuilder()} className='gap-2'>
                  <Sparkles className='h-4 w-4' />
                  Build your first flow
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className='grid gap-4 lg:grid-cols-2'>
              {flows.map((flow) => (
                <Card key={flow.id} className='border-muted transition hover:border-primary/40'>
                  <CardHeader className='flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between'>
                    <div>
                      <CardTitle className='flex items-center gap-2 text-lg text-foreground'>
                        {flow.name}
                        <Badge variant='outline' className={flow.status === 'ON' ? 'border-green-500 text-green-500' : ''}>
                          {flow.status}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        {flow.nodes.length} blocks · {flow.edges.length} links · v{flow.version}
                      </CardDescription>
                    </div>
                    <div className='flex items-center gap-2'>
                      <Switch checked={flow.status === 'ON'} onCheckedChange={() => handleToggle(flow)} aria-label='Toggle automation' />
                      <Badge variant='secondary' className='hidden sm:inline-flex items-center gap-1'>
                        <Power className='h-3 w-3' /> {flow.status === 'ON' ? 'Live' : 'Off'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className='flex flex-wrap items-center justify-between gap-3'>
                    <div className='flex flex-wrap items-center gap-2 text-xs text-muted-foreground'>
                      <Badge variant='outline'>Trigger: {flow.nodes.find((node) => node.type === 'trigger') ? 'Configured' : 'Missing'}</Badge>
                      <Badge variant='outline'>Updated: {flow.updatedAt ? new Date(flow.updatedAt).toLocaleString() : '—'}</Badge>
                    </div>
                    <div className='flex flex-wrap gap-2'>
                      <Button size='sm' variant='outline' className='gap-1' onClick={() => openBuilder(flow)}>
                        <Pencil className='h-3.5 w-3.5' /> Edit
                      </Button>
                      <Button size='sm' variant='outline' className='gap-1' onClick={() => handleDuplicate(flow)}>
                        <Copy className='h-3.5 w-3.5' /> Duplicate
                      </Button>
                      <Button
                        size='sm'
                        variant='ghost'
                        className='gap-1 text-destructive hover:text-destructive'
                        onClick={() => handleDelete(flow.id)}
                      >
                        <Trash2 className='h-3.5 w-3.5' /> Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Separator />

      <Card className='border-muted bg-muted/40'>
        <CardHeader className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <CardTitle className='flex items-center gap-2'>
              <Sparkles className='h-4 w-4 text-primary' />
              Automation ideas for later
            </CardTitle>
            <CardDescription>Coming soon: AI-powered suggestions based on your best reps.</CardDescription>
          </div>
          <Button variant='outline' size='sm'>
            Join beta list
          </Button>
        </CardHeader>
        <CardContent className='grid gap-4 md:grid-cols-2'>
          <div className='rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground'>
            Smart tagging to auto-classify new leads by intent and sentiment.
          </div>
          <div className='rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground'>
            Predictive reminders that choose the best time to follow up based on results.
          </div>
        </CardContent>
      </Card>

      <NewAutomationModal open={builderOpen} onOpenChange={setBuilderOpen} initialFlow={editingFlow} onSave={handleSaveFlow} />
    </div>
  );
};

export default AutomationsPage;
