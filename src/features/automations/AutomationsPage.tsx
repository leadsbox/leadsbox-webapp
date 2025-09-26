import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Calendar, Clock, MessageSquare, Sparkles, Wand2, Pencil, Trash2, Copy, Power } from 'lucide-react';
import { useEffect } from 'react';
import client from '@/api/client';
import type { Template, FollowUpRule } from '@/types';
import TagsTab from '@/features/settings/tabs/TagsTab';
import NewAutomationModal from './modals/NewAutomationModal';
import { AutomationFlow } from './builder/types';
import { FLOWS_COLLECTION_KEY, createDefaultFlow, useLocalStorage } from './builder/utils';
import { validateFlow } from './builder/serializers';
import { toast } from 'react-toastify';

// Removed unused quickReplies and followUps arrays

const AutomationsPage: React.FC = () => {
  const [flows, setFlows] = useLocalStorage<AutomationFlow[]>(FLOWS_COLLECTION_KEY, []);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingFlow, setEditingFlow] = useState<AutomationFlow | undefined>();
  // --- Templates ---
  const [templates, setTemplates] = useState<Template[]>([]);
  const [newTemplate, setNewTemplate] = useState<{ name: string; body: string; variables: string }>({ name: '', body: '', variables: '' });
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  // --- Follow-ups ---
  const [followupRules, setFollowupRules] = useState<FollowUpRule[]>([]);
  const [editingFollowup, setEditingFollowup] = useState<FollowUpRule | null>(null);
  // Local draft for modal editing (since FollowUpRule has required fields)
  const [editingFollowupDraft, setEditingFollowupDraft] = useState<Partial<FollowUpRule>>({});

  // Fetch templates
  useEffect(() => {
    client
      .get('/api/templates')
      .then((res) => setTemplates(res.data))
      .catch(() => {});
  }, []);
  // Fetch follow-up rules (replace with your endpoint if needed)
  useEffect(() => {
    client
      .get('/api/followup-rules')
      .then((res) => setFollowupRules(res.data))
      .catch(() => {});
  }, []);

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
          <Card>
            <CardHeader className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
              <div>
                <CardTitle>Quick reply library</CardTitle>
                <CardDescription>Save your most common answers so the team replies in seconds.</CardDescription>
              </div>
              <Button size='sm' onClick={() => setEditingTemplate({ id: '', name: '', body: '', variables: [] })}>
                New template
              </Button>
            </CardHeader>
            <CardContent>
              {/* Show create/edit card inline when editingTemplate is set and id is empty (new template) */}
              {editingTemplate && editingTemplate.id === '' && (
                <Card className='mb-6 border-muted'>
                  <CardHeader className='pb-2'>
                    <CardTitle className='text-lg font-semibold'>New Template</CardTitle>
                    <CardDescription className='text-muted-foreground'>Create a quick reply template for your team.</CardDescription>
                  </CardHeader>
                  <CardContent>
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
                            if (editingTemplate.name && editingTemplate.body) {
                              const res = await client.post('/api/templates', editingTemplate);
                              setTemplates([...templates, res.data]);
                              setEditingTemplate(null);
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
                  </CardContent>
                </Card>
              )}
              <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
                {templates.map((t) => (
                  <Card key={t.id} className='border-muted'>
                    <CardHeader className='pb-2'>
                      <CardTitle className='flex items-center justify-between text-lg'>
                        {t.name}
                        <span className='text-xs text-muted-foreground'>{t.variables.join(', ')}</span>
                      </CardTitle>
                      <CardDescription>{t.body}</CardDescription>
                    </CardHeader>
                    <CardContent className='pt-4 flex gap-2'>
                      <Button size='sm' onClick={() => setEditingTemplate(t)}>
                        Edit
                      </Button>
                      <Button
                        size='sm'
                        variant='destructive'
                        onClick={async () => {
                          await client.delete(`/api/templates/${t.id}`);
                          setTemplates(templates.filter((x) => x.id !== t.id));
                        }}
                      >
                        Delete
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
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
          <Card>
            <CardHeader className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
              <div>
                <CardTitle>Follow-up workflows</CardTitle>
                <CardDescription>Stay top-of-mind with timed nudges and proactive reminders.</CardDescription>
              </div>
              <Button
                size='sm'
                onClick={() => {
                  setEditingFollowupDraft({
                    message: '',
                    scheduledTime: '',
                    status: 'SCHEDULED',
                    provider: '',
                    conversationId: '',
                    userId: '',
                    organizationId: '',
                  });
                  setEditingFollowup(null);
                }}
              >
                New workflow
              </Button>
            </CardHeader>
            <CardContent>
              <ScrollArea className='h-[340px] pr-4'>
                <div className='space-y-4'>
                  {/* Inline Follow-up Form */}
                  {(editingFollowup || editingFollowupDraft.message !== undefined) && (
                    <Card className='mb-6 border-muted'>
                      <CardHeader className='pb-2'>
                        <CardTitle className='text-lg font-semibold'>{editingFollowup && editingFollowup.id ? 'Edit Workflow' : 'New Workflow'}</CardTitle>
                        <CardDescription className='text-muted-foreground'>Set up a follow-up workflow for your team.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className='space-y-3'>
                          <input
                            className='border border-input rounded px-3 py-2 w-full bg-muted focus:outline-none focus:ring focus:ring-primary/30 text-sm'
                            value={editingFollowupDraft.message || ''}
                            onChange={(e) => setEditingFollowupDraft({ ...editingFollowupDraft, message: e.target.value })}
                          />
                          <input
                            className='border border-input rounded px-3 py-2 w-full bg-muted focus:outline-none focus:ring focus:ring-primary/30 text-sm'
                            placeholder='Scheduled Time (ISO)'
                            value={editingFollowupDraft.scheduledTime || ''}
                            onChange={(e) => setEditingFollowupDraft({ ...editingFollowupDraft, scheduledTime: e.target.value })}
                          />
                          <select
                            className='border border-input rounded px-3 py-2 w-full bg-muted focus:outline-none focus:ring focus:ring-primary/30 text-sm'
                            value={editingFollowupDraft.status || 'SCHEDULED'}
                            onChange={(e) => setEditingFollowupDraft({ ...editingFollowupDraft, status: e.target.value as FollowUpRule['status'] })}
                          >
                            <option value='SCHEDULED'>SCHEDULED</option>
                            <option value='SENT'>SENT</option>
                            <option value='CANCELLED'>CANCELLED</option>
                            <option value='FAILED'>FAILED</option>
                          </select>
                          <div className='flex gap-2 pt-2'>
                            <Button
                              size='sm'
                              variant='default'
                              onClick={async () => {
                                if (editingFollowup && editingFollowup.id) {
                                  const updated = { ...editingFollowup, ...editingFollowupDraft };
                                  await client.put(`/api/followup-rules/${editingFollowup.id}`, updated);
                                  setFollowupRules(followupRules.map((f) => (f.id === editingFollowup.id ? (updated as FollowUpRule) : f)));
                                } else {
                                  const res = await client.post('/api/followup-rules', editingFollowupDraft);
                                  setFollowupRules([...followupRules, res.data]);
                                }
                                setEditingFollowup(null);
                                setEditingFollowupDraft({});
                              }}
                            >
                              Save
                            </Button>
                            <Button
                              size='sm'
                              variant='outline'
                              onClick={() => {
                                setEditingFollowup(null);
                                setEditingFollowupDraft({});
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  {/* Existing follow-ups list */}
                  {followupRules.map((item, index) => (
                    <Card key={item.id} className='border-muted'>
                      <CardHeader className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
                        <div>
                          <CardTitle className='text-lg'>Follow-up #{index + 1}</CardTitle>
                          <CardDescription>{item.message || '(No message set)'}</CardDescription>
                        </div>
                        <Badge variant='outline' className='bg-primary/10 text-primary'>
                          {item.status}
                        </Badge>
                      </CardHeader>
                      <CardContent className='grid gap-4 md:grid-cols-2'>
                        <div className='rounded-md border border-dashed border-border p-3 text-sm text-muted-foreground'>
                          <h4 className='flex items-center gap-2 text-sm font-medium text-foreground'>
                            <Clock className='h-4 w-4 text-primary' /> Scheduled Time
                          </h4>
                          <p className='mt-1'>{item.scheduledTime ? new Date(item.scheduledTime).toLocaleString() : '—'}</p>
                        </div>
                        <div className='rounded-md border border-dashed border-border p-3 text-sm text-muted-foreground'>
                          <h4 className='flex items-center gap-2 text-sm font-medium text-foreground'>
                            <Calendar className='h-4 w-4 text-primary' /> Message
                          </h4>
                          <p className='mt-1'>{item.message || '—'}</p>
                        </div>
                        <div className='flex gap-2'>
                          <Button
                            size='sm'
                            onClick={() => {
                              setEditingFollowup(item);
                              setEditingFollowupDraft(item);
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            size='sm'
                            variant='destructive'
                            onClick={async () => {
                              await client.delete(`/api/followup-rules/${item.id}`);
                              setFollowupRules(followupRules.filter((x) => x.id !== item.id));
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
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
