import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { notify } from '@/lib/toast';
import { ArrowUpDown, CheckCircle2, Clock, MessageSquare, Plus, RefreshCw, Sparkles, Trash2 } from 'lucide-react';
import client, { getOrgId } from '@/api/client';
import { endpoints } from '@/api/config';
import type { FollowUpRule, FollowUpStatus, Template, TemplateStatus } from '@/types';
import templateApi from '@/api/templates';
import { useAuth } from '@/context/useAuth';
import TemplateComposer from './components/TemplateComposer';
import ScheduleFollowUpModal, { ConversationOption } from './components/ScheduleFollowUpModal';
import NewAutomationModal from './modals/NewAutomationModal';
import { AutomationFlow } from './builder/types';
import { FLOWS_COLLECTION_KEY, createDefaultFlow, useLocalStorage } from './builder/utils';
import { validateFlow } from './builder/serializers';
import { extractFollowUps } from '@/utils/apiData';

const TEMPLATE_STATUS_ORDER: TemplateStatus[] = ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'DEPRECATED'];

const TEMPLATE_STATUS_LABELS: Record<TemplateStatus, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  DEPRECATED: 'Deprecated',
};

const FOLLOWUP_STATUS_LABELS: Record<FollowUpStatus, string> = {
  SCHEDULED: 'Scheduled',
  SENT: 'Sent',
  CANCELLED: 'Cancelled',
  FAILED: 'Failed',
};

const resolveTemplateStatus = (status?: TemplateStatus | string | null): TemplateStatus => {
  if (!status) return 'DRAFT';
  const normalized = typeof status === 'string' ? status.toUpperCase() : status;
  if (normalized === 'PENDING_APPROVAL') return 'SUBMITTED';
  return TEMPLATE_STATUS_ORDER.includes(normalized as TemplateStatus) ? (normalized as TemplateStatus) : 'DRAFT';
};

const formatDateTime = (value?: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

type UnknownRecord = Record<string, unknown>;

const isNonEmptyString = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;

const extractThreads = (payload: unknown): ConversationOption[] => {
  const resolveCandidates = (input: unknown): unknown[] => {
    if (Array.isArray(input)) return input;
    if (input && typeof input === 'object') {
      const record = input as UnknownRecord;
      if (Array.isArray(record.threads)) return record.threads;
      const data = record.data;
      if (Array.isArray(data)) return data;
      if (data && typeof data === 'object') {
        const nested = data as UnknownRecord;
        if (Array.isArray(nested.threads)) return nested.threads;
      }
    }
    return [];
  };

  const raw = resolveCandidates(payload);

  return raw
    .map((thread) => {
      if (!thread || typeof thread !== 'object') return null;
      const record = thread as UnknownRecord;
      const id = isNonEmptyString(record.id) ? record.id : '';
      if (!id) return null;

      const contact = (record.contact ?? {}) as UnknownRecord;
      const channel = (record.channel ?? {}) as UnknownRecord;

      const label = [contact.displayName, contact.phone, contact.waId, contact.email].find(isNonEmptyString) || 'Conversation';

      const channelLabel = [channel.displayName, channel.type].find(isNonEmptyString) ?? null;

      return {
        id,
        label,
        channel: channelLabel,
        contactName: label,
      } satisfies ConversationOption;
    })
    .filter((option): option is Required<ConversationOption> => Boolean(option))
    .sort((a, b) => a.label.localeCompare(b.label));
};

const WhatsAppPrinciples = () => (
  <Card>
    <CardHeader>
      <CardTitle className='text-base'>WhatsApp policy quick tips</CardTitle>
      <CardDescription>Stay in Meta’s good graces while keeping prospects warm.</CardDescription>
    </CardHeader>
    <CardContent className='space-y-2 text-sm text-muted-foreground'>
      <p>✅ Get explicit opt-in before you automate outreach.</p>
      <p>✅ Use approved templates for any follow-up sent after the 24-hour customer care window.</p>
      <p>✅ Keep one clear purpose per template—mixing marketing and transactional content causes rejections.</p>
      <p>
        ✅ Personalize with{' '}
        <code className='rounded bg-muted px-1 py-0.5 font-mono text-xs'>
          {'{'}
          {'{name}}'}
        </code>{' '}
        style placeholders but avoid dynamic URLs or phone numbers in the copy.
      </p>
      <p>✅ Schedule reminders during reasonable hours to minimise spam complaints.</p>
    </CardContent>
  </Card>
);

const AutomationsPage: React.FC = () => {
  const { user } = useAuth();
  const organizationId = user?.orgId || user?.currentOrgId || getOrgId();
  const userId = user?.id;

  const [templates, setTemplates] = useState<Template[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);

  const [followUps, setFollowUps] = useState<FollowUpRule[]>([]);
  const [followUpsLoading, setFollowUpsLoading] = useState(false);

  const [conversations, setConversations] = useState<ConversationOption[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(false);

  const [templateComposerOpen, setTemplateComposerOpen] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<Template | null>(null);

  const [followUpModalOpen, setFollowUpModalOpen] = useState(false);
  const [followUpMode, setFollowUpMode] = useState<'create' | 'edit'>('create');
  const [activeFollowUp, setActiveFollowUp] = useState<FollowUpRule | null>(null);

  const [flows, setFlows] = useLocalStorage<AutomationFlow[]>(FLOWS_COLLECTION_KEY, []);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [builderFlow, setBuilderFlow] = useState<AutomationFlow | null>(null);
  const [builderKey, setBuilderKey] = useState(0);

  const loadTemplates = useCallback(async () => {
    setTemplatesLoading(true);
    try {
      const list = await templateApi.list();
      setTemplates(list ?? []);
    } catch (error: unknown) {
      setTemplates([]);
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to load templates.';
      notify.error({
        key: 'automations:templates:load',
        title: 'Unable to load templates',
        description: message,
      });
    } finally {
      setTemplatesLoading(false);
    }
  }, []);

  const loadFollowUps = useCallback(async () => {
    setFollowUpsLoading(true);
    try {
      const res = await client.get(endpoints.followups);
      const list = extractFollowUps(res.data);
      setFollowUps(list);
    } catch (error: unknown) {
      setFollowUps([]);
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to load follow-ups.';
      notify.error({
        key: 'automations:followups:load',
        title: 'Unable to load follow-ups',
        description: message,
      });
    } finally {
      setFollowUpsLoading(false);
    }
  }, []);

  const loadConversations = useCallback(async () => {
    setConversationsLoading(true);
    try {
      const res = await client.get(endpoints.threads, {
        params: { include: 'contact,channel' },
      });
      const list = extractThreads(res.data);
      setConversations(list);
    } catch (error: unknown) {
      setConversations([]);
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to load conversations.';
      notify.error({
        key: 'automations:conversations:load',
        title: 'Unable to load conversations',
        description: message,
      });
    } finally {
      setConversationsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTemplates();
    loadFollowUps();
    loadConversations();
  }, [loadTemplates, loadFollowUps, loadConversations]);

  const conversationMap = useMemo(() => {
    const map = new Map<string, ConversationOption>();
    conversations.forEach((option) => {
      if (option.id) {
        map.set(option.id, option);
      }
    });
    return map;
  }, [conversations]);

  const approvedTemplates = useMemo(() => templates.filter((template) => resolveTemplateStatus(template.status) === 'APPROVED'), [templates]);

  const hasOrgContext = Boolean(userId && organizationId);

  const flowsSummary = useMemo(() => {
    if (!flows.length) return 'No automations yet';
    const live = flows.filter((flow) => flow.status === 'ON').length;
    return `${live} live · ${flows.length} total`;
  }, [flows]);

  const openTemplateComposer = (template?: Template | null) => {
    setActiveTemplate(template ?? null);
    setTemplateComposerOpen(true);
  };

  const handleTemplateSaved = async () => {
    await loadTemplates();
  };

  const handleTemplateDeleted = (templateId: string) => {
    setTemplates((current) => current.filter((template) => template.id !== templateId));
  };

  const handleSubmitTemplate = async (template: Template) => {
    try {
      const status = resolveTemplateStatus(template.status);
      if (status === 'APPROVED' || status === 'SUBMITTED') {
        notify.info({
          key: `automations:template:${template.id}:submitted`,
          title: 'Template already submitted',
          description: 'This template is awaiting approval or already approved.',
        });
        return;
      }
      const updated = await templateApi.submit(template.id);
      notify.success({
        key: `automations:template:${template.id}:submit-success`,
        title: 'Template submitted',
        description: 'We sent your template to WhatsApp for review.',
      });
      if (updated) {
        setTemplates((current) => current.map((item) => (item.id === template.id ? updated : item)));
      } else {
        await loadTemplates();
      }
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Submission failed.';
      notify.error({
        key: `automations:template:${template.id}:submit-error`,
        title: 'Unable to submit template',
        description: message,
      });
    }
  };

  const handleRefreshTemplate = async (template: Template) => {
    try {
      const refreshed = await templateApi.refresh(template.id);
      if (refreshed) {
        setTemplates((current) => current.map((item) => (item.id === refreshed.id ? refreshed : item)));
        notify.success({
          key: `automations:template:${template.id}:refresh`,
          title: 'Template status updated',
        });
      } else {
        await loadTemplates();
      }
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to refresh status.';
      notify.error({
        key: `automations:template:${template.id}:refresh-error`,
        title: 'Unable to refresh status',
        description: message,
      });
    }
  };

  const openFollowUpModal = (mode: 'create' | 'edit', followUp?: FollowUpRule | null) => {
    if (!hasOrgContext) {
      notify.error({
        key: 'automations:followup:context',
        title: 'Missing organization context',
        description: 'Select an organization before scheduling follow-ups.',
      });
      return;
    }
    setFollowUpMode(mode);
    setActiveFollowUp(followUp ?? null);
    setFollowUpModalOpen(true);
  };

  const handleFollowUpCompleted = async () => {
    await loadFollowUps();
  };

  const handleFollowUpCancelled = (followUpId: string) => {
    setFollowUps((current) => current.filter((followUp) => followUp.id !== followUpId));
  };

  const cancelFollowUp = async (followUp: FollowUpRule) => {
    if (followUp.status !== 'SCHEDULED') {
      notify.info({
        key: `automations:followup:${followUp.id}:not-cancellable`,
        title: 'Cannot cancel follow-up',
        description: 'Only scheduled follow-ups can be cancelled.',
      });
      return;
    }
    if (!window.confirm('Cancel this follow-up?')) return;
    try {
      const res = await client.post(endpoints.followupCancel(followUp.id));
      const payload = (res.data?.data?.followUp as FollowUpRule) ?? (res.data?.followUp as FollowUpRule) ?? null;
      notify.success({
        key: `automations:followup:${followUp.id}:cancelled`,
        title: 'Follow-up cancelled',
      });
      if (payload) {
        await loadFollowUps();
      } else {
        handleFollowUpCancelled(followUp.id);
      }
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to cancel follow-up.';
      notify.error({
        key: `automations:followup:${followUp.id}:cancel-error`,
        title: 'Unable to cancel follow-up',
        description: message,
      });
    }
  };

  const openBuilder = (flow?: AutomationFlow) => {
    const draft = flow ? { ...flow, updatedAt: new Date().toISOString() } : createDefaultFlow();
    setBuilderFlow(draft);
    setBuilderKey(Date.now());
    setBuilderOpen(true);
  };

  const handleFlowSaved = (saved: AutomationFlow) => {
    setFlows((current) => {
      const exists = current.some((flow) => flow.id === saved.id);
      return exists ? current.map((flow) => (flow.id === saved.id ? saved : flow)) : [...current, saved];
    });
    notify.success({
      key: `automations:flow:${saved.id}:saved`,
      title: 'Automation saved',
    });
  };

  const handleFlowToggle = (flow: AutomationFlow) => {
    const validation = validateFlow(flow);
    if (!validation.ok) {
      notify.error({
        key: `automations:flow:${flow.id}:toggle-error`,
        title: 'Cannot activate flow',
        description: validation.issues[0] ?? 'Please fix flow validation issues before turning it on.',
      });
      return;
    }
    setFlows((current) =>
      current.map((candidate) =>
        candidate.id === flow.id
          ? {
              ...candidate,
              status: flow.status === 'ON' ? 'OFF' : 'ON',
              updatedAt: new Date().toISOString(),
            }
          : candidate
      )
    );
  };

  const handleFlowDuplicate = (flow: AutomationFlow) => {
    const copy: AutomationFlow = {
      ...flow,
      id: `${flow.id}-copy-${Date.now()}`,
      name: `${flow.name} (Copy)`,
      status: 'DRAFT',
      version: flow.version + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setFlows((current) => [...current, copy]);
    notify.success({
      key: `automations:flow:${flow.id}:duplicated`,
      title: 'Automation duplicated',
    });
  };

  const handleFlowDelete = (flow: AutomationFlow) => {
    if (!window.confirm('Delete this automation? This cannot be undone.')) return;
    setFlows((current) => current.filter((candidate) => candidate.id !== flow.id));
    notify.info({
      key: `automations:flow:${flow.id}:deleted`,
      title: 'Automation deleted',
    });
  };

  const sortedTemplates = useMemo(() => {
    return [...templates].sort((a, b) => {
      const statusA = resolveTemplateStatus(a.status);
      const statusB = resolveTemplateStatus(b.status);
      const diff = TEMPLATE_STATUS_ORDER.indexOf(statusA) - TEMPLATE_STATUS_ORDER.indexOf(statusB);
      if (diff !== 0) return diff;
      return (b.updatedAt ?? '').localeCompare(a.updatedAt ?? '');
    });
  }, [templates]);

  const sortedFollowUps = useMemo(() => {
    return [...followUps].sort((a, b) => {
      const aTime = a.scheduledTime ? new Date(a.scheduledTime).getTime() : Number.POSITIVE_INFINITY;
      const bTime = b.scheduledTime ? new Date(b.scheduledTime).getTime() : Number.POSITIVE_INFINITY;
      return aTime - bTime;
    });
  }, [followUps]);

  return (
    <div className='space-y-6 p-4 sm:p-6'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
        <div>
          <h1 className='text-2xl sm:text-3xl font-bold'>Automations</h1>
          <p className='text-sm text-muted-foreground'>{flowsSummary}</p>
        </div>
        <div className='flex gap-2'>
          <Button variant='outline' onClick={() => openBuilder()}>
            <Sparkles className='mr-2 h-4 w-4' />
            Build automation
          </Button>
        </div>
      </div>

      <Tabs defaultValue='templates' className='w-full'>
        <TabsList className='grid w-full grid-cols-3 sm:w-auto'>
          <TabsTrigger value='templates'>Templates</TabsTrigger>
          <TabsTrigger value='followups'>Follow-ups</TabsTrigger>
          <TabsTrigger value='flows'>Flows</TabsTrigger>
        </TabsList>

        <TabsContent value='templates' className='space-y-6 pt-4'>
          {templateComposerOpen && (
            <TemplateComposer
              open={templateComposerOpen}
              onOpenChange={(open) => {
                setTemplateComposerOpen(open);
                if (!open) {
                  setActiveTemplate(null);
                }
              }}
              template={activeTemplate}
              onSaved={handleTemplateSaved}
              onDeleted={handleTemplateDeleted}
            />
          )}
          <Card>
            <CardHeader className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
              <div>
                <CardTitle>Template library</CardTitle>
                <CardDescription>Save canned replies and request WhatsApp approval in one place.</CardDescription>
              </div>
              <Button onClick={() => openTemplateComposer()}>
                <Plus className='mr-2 h-4 w-4' />
                New template
              </Button>
            </CardHeader>
            <CardContent className='space-y-4'>
              {templatesLoading ? (
                <div className='space-y-3'>
                  {[...Array(4)].map((_, index) => (
                    <Skeleton key={index} className='h-20 w-full rounded-md' />
                  ))}
                </div>
              ) : sortedTemplates.length ? (
                <div className='space-y-4'>
                  {sortedTemplates.map((template) => {
                    const status = resolveTemplateStatus(template.status);
                    const approved = status === 'APPROVED';
                    return (
                      <div key={template.id} className='rounded-lg border border-border/70 bg-card p-4 shadow-sm transition hover:border-primary/50'>
                        <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
                          <div className='space-y-2'>
                            <div className='flex flex-wrap items-center gap-2'>
                              <h3 className='text-base font-semibold'>{template.name}</h3>
                              <Badge variant={approved ? 'default' : 'secondary'}>{TEMPLATE_STATUS_LABELS[status]}</Badge>
                              <Badge variant='outline'>{template.category.toLowerCase()}</Badge>
                            </div>
                            <p className='text-sm text-muted-foreground line-clamp-3 whitespace-pre-line'>{template.body}</p>
                          </div>
                          <div className='flex flex-wrap gap-2'>
                            <Button size='sm' variant='outline' onClick={() => openTemplateComposer(template)}>
                              <MessageSquare className='mr-2 h-3.5 w-3.5' />
                              Edit
                            </Button>
                            <Button size='sm' variant='outline' onClick={() => handleRefreshTemplate(template)}>
                              <RefreshCw className='mr-2 h-3.5 w-3.5' />
                              Refresh
                            </Button>
                            <Button size='sm' disabled={approved} onClick={() => handleSubmitTemplate(template)}>
                              <CheckCircle2 className='mr-2 h-3.5 w-3.5' />
                              Submit
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className='rounded-md border border-dashed border-border/60 bg-muted/40 p-6 text-center text-sm text-muted-foreground'>
                  No templates yet. Draft your first template to keep conversations alive after 24 hours.
                </div>
              )}
            </CardContent>
          </Card>
          <WhatsAppPrinciples />
        </TabsContent>

        <TabsContent value='followups' className='space-y-6 pt-4'>
          {hasOrgContext && followUpModalOpen && (
            <ScheduleFollowUpModal
              open={followUpModalOpen}
              onOpenChange={(open) => {
                setFollowUpModalOpen(open);
                if (!open) {
                  setActiveFollowUp(null);
                }
              }}
              mode={followUpMode}
              followUp={activeFollowUp}
              conversationOptions={conversations}
              templateOptions={approvedTemplates}
              conversationsLoading={conversationsLoading}
              userId={userId!}
              organizationId={organizationId!}
              onCompleted={handleFollowUpCompleted}
              onCancelled={handleFollowUpCancelled}
            />
          )}
          <Card>
            <CardHeader className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
              <div>
                <CardTitle>Scheduled follow-ups</CardTitle>
                <CardDescription>Line up nudges before the chat goes cold. WhatsApp templates keep you compliant.</CardDescription>
              </div>
              <Button onClick={() => openFollowUpModal('create')}>
                <Plus className='mr-2 h-4 w-4' />
                Schedule follow-up
              </Button>
            </CardHeader>
            <CardContent>
              {followUpsLoading ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Conversation</TableHead>
                      <TableHead>Send at</TableHead>
                      <TableHead>Channel</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Template</TableHead>
                      <TableHead className='text-right'>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...Array(4)].map((_, index) => (
                      <TableRow key={index}>
                        <TableCell colSpan={6}>
                          <Skeleton className='h-6 w-full' />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : sortedFollowUps.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <span className='inline-flex items-center gap-1'>
                          Conversation
                          <ArrowUpDown className='h-3.5 w-3.5 text-muted-foreground' />
                        </span>
                      </TableHead>
                      <TableHead>Send at</TableHead>
                      <TableHead>Channel</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Template</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead className='text-right'>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedFollowUps.map((followUp) => {
                      const conversation = conversationMap.get(followUp.conversationId);
                      const status = followUp.status ?? 'SCHEDULED';
                      const templateStatus = followUp.template?.status
                        ? TEMPLATE_STATUS_LABELS[resolveTemplateStatus(followUp.template.status)]
                        : null;
                      return (
                        <TableRow key={followUp.id}>
                          <TableCell>
                            <div className='flex flex-col'>
                              <span className='font-medium'>{conversation?.label ?? followUp.conversationId}</span>
                              {conversation?.channel && <span className='text-xs text-muted-foreground'>{conversation.channel}</span>}
                            </div>
                          </TableCell>
                          <TableCell>{formatDateTime(followUp.scheduledTime)}</TableCell>
                          <TableCell className='uppercase text-xs text-muted-foreground'>{followUp.provider}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                status === 'SENT' ? 'default' : status === 'FAILED' ? 'destructive' : status === 'CANCELLED' ? 'outline' : 'secondary'
                              }
                            >
                              {FOLLOWUP_STATUS_LABELS[status]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {followUp.template ? (
                              <div className='flex flex-col'>
                                <span className='text-sm font-medium'>{followUp.template.name}</span>
                                <span className='text-xs text-muted-foreground'>{templateStatus}</span>
                              </div>
                            ) : (
                              <span className='text-xs text-muted-foreground'>Custom message</span>
                            )}
                          </TableCell>
                          <TableCell className='max-w-xs text-sm text-muted-foreground'>
                            {followUp.message ? followUp.message.slice(0, 80) : '—'}
                          </TableCell>
                          <TableCell className='text-right'>
                            <div className='flex justify-end gap-2'>
                              <Button size='sm' variant='outline' onClick={() => openFollowUpModal('edit', followUp)}>
                                <MessageSquare className='mr-2 h-3.5 w-3.5' />
                                Edit
                              </Button>
                              <Button size='sm' variant='outline' onClick={() => cancelFollowUp(followUp)}>
                                <Trash2 className='mr-2 h-3.5 w-3.5' />
                                Cancel
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className='rounded-md border border-dashed border-border/60 bg-muted/40 p-6 text-center text-sm text-muted-foreground'>
                  No follow-ups scheduled. Your next follow-up can be ready in under a minute.
                </div>
              )}
            </CardContent>
          </Card>

          <Separator />

          <WhatsAppPrinciples />
        </TabsContent>

        <TabsContent value='flows' className='space-y-6 pt-4'>
          <Card>
            <CardHeader className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
              <div>
                <CardTitle>Flow builder</CardTitle>
                <CardDescription>Automate multi-step journeys across triggers, conditions, and actions.</CardDescription>
              </div>
              <Button variant='outline' onClick={() => openBuilder()}>
                <Sparkles className='mr-2 h-4 w-4' />
                New flow
              </Button>
            </CardHeader>
            <CardContent className='space-y-4'>
              {flows.length ? (
                <div className='grid gap-4 md:grid-cols-2'>
                  {flows.map((flow) => (
                    <Card key={flow.id} className='border-border/70'>
                      <CardHeader className='space-y-1'>
                        <CardTitle className='text-lg'>{flow.name}</CardTitle>
                        <CardDescription className='flex items-center gap-2 text-xs'>
                          <span>{flow.status === 'ON' ? 'Running' : 'Draft'}</span>
                          <span>•</span>
                          <span>Updated {formatDateTime(flow.updatedAt)}</span>
                        </CardDescription>
                      </CardHeader>
                      <CardContent className='space-y-3'>
                        <div className='flex flex-wrap gap-2'>
                          <Button size='sm' variant='outline' onClick={() => openBuilder(flow)}>
                            <MessageSquare className='mr-2 h-3.5 w-3.5' />
                            Edit
                          </Button>
                          <Button size='sm' variant='outline' onClick={() => handleFlowDuplicate(flow)}>
                            <ArrowUpDown className='mr-2 h-3.5 w-3.5' />
                            Duplicate
                          </Button>
                          <Button size='sm' variant='outline' onClick={() => handleFlowToggle(flow)}>
                            <Clock className='mr-2 h-3.5 w-3.5' />
                            {flow.status === 'ON' ? 'Turn off' : 'Activate'}
                          </Button>
                          <Button size='sm' variant='destructive' onClick={() => handleFlowDelete(flow)}>
                            <Trash2 className='mr-2 h-3.5 w-3.5' />
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className='rounded-md border border-dashed border-border/60 bg-muted/40 p-6 text-center text-sm text-muted-foreground'>
                  Build your first automation flow to route conversations, send templates, and trigger follow-ups automatically.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {builderFlow && (
        <NewAutomationModal key={builderKey} open={builderOpen} onOpenChange={setBuilderOpen} initialFlow={builderFlow} onSave={handleFlowSaved} />
      )}
    </div>
  );
};

export default AutomationsPage;
