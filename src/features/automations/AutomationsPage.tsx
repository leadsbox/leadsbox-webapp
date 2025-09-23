import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Calendar, Clock, MessageSquare, Sparkles, Wand2, Pencil, Trash2, Copy, Power } from 'lucide-react';
import TemplatesTab from '@/features/settings/tabs/TemplatesTab';
import TagsTab from '@/features/settings/tabs/TagsTab';
import NewAutomationModal from './modals/NewAutomationModal';
import { AutomationFlow } from './builder/types';
import { FLOWS_COLLECTION_KEY, createDefaultFlow, useLocalStorage } from './builder/utils';
import { validateFlow } from './builder/serializers';
import { toast } from 'react-toastify';

const quickReplies = [
  {
    title: 'Pricing',
    description: 'Share your latest price list or packages in one tap.',
    usage: 'Used 42 times this month',
  },
  {
    title: 'Location & Directions',
    description: 'Send customers directions or pickup details instantly.',
    usage: 'Used 28 times this month',
  },
  {
    title: 'Thank You',
    description: 'Close conversations with a professional thank you note.',
    usage: 'Used 16 times this month',
  },
];

const autoResponses = [
  {
    title: 'First-contact auto reply',
    description: 'Welcome new leads and let them know someone is on it.',
    template: '“Thanks for reaching out! A teammate will reply shortly.”',
    enabled: true,
  },
  {
    title: 'After-hours responder',
    description: 'Set expectations when messages come in late at night.',
    template: '“We’re closed right now, but you’ll hear from us tomorrow morning.”',
    enabled: false,
  },
];

const followUps = [
  {
    title: '24 hour check-in',
    description: 'Remind hot leads that haven’t answered after a day.',
    trigger: 'If no reply in 24 hours',
    action: 'Send reminder message',
  },
  {
    title: 'Quote follow-up',
    description: 'Circle back on proposals that were sent but unanswered.',
    trigger: '3 days after quote sent',
    action: 'Notify owner + schedule nudge',
  },
  {
    title: 'Dormant lead revive',
    description: 'Re-engage leads that have been quiet for two weeks.',
    trigger: '14 days without activity',
    action: 'Send “still interested?” template',
  },
];

const AutomationsPage: React.FC = () => {
  const [flows, setFlows] = useLocalStorage<AutomationFlow[]>(FLOWS_COLLECTION_KEY, []);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingFlow, setEditingFlow] = useState<AutomationFlow | undefined>();

  const openBuilder = (flow?: AutomationFlow) => {
    setEditingFlow(flow ?? { ...createDefaultFlow(), name: 'Untitled automation' });
    setBuilderOpen(true);
  };

  const handleSaveFlow = (saved: AutomationFlow) => {
    setFlows((current) => {
      const exists = current.some((flow) => flow.id === saved.id);
      const next = exists
        ? current.map((flow) => (flow.id === saved.id ? saved : flow))
        : [...current, saved];
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
        candidate.id === flow.id
          ? { ...candidate, status: flow.status === 'ON' ? 'OFF' : 'ON', updatedAt: new Date().toISOString() }
          : candidate
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
              <Button size='sm'>New template</Button>
            </CardHeader>
            <CardContent>
              <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
                {quickReplies.map((item) => (
                  <Card key={item.title} className='border-muted'>
                    <CardHeader className='pb-2'>
                      <CardTitle className='flex items-center justify-between text-lg'>
                        {item.title}
                        <Badge variant='outline' className='text-xs font-medium'>
                          FAQ
                        </Badge>
                      </CardTitle>
                      <CardDescription>{item.description}</CardDescription>
                    </CardHeader>
                    <CardContent className='pt-4 text-sm text-muted-foreground'>{item.usage}</CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
              <div>
                <CardTitle>Template packs</CardTitle>
                <CardDescription>Bundle replies for pricing, onboarding, support, and more.</CardDescription>
              </div>
              <Button size='sm' variant='outline'>
                Explore packs
              </Button>
            </CardHeader>
            <CardContent className='grid gap-4 md:grid-cols-2'>
              <Card className='border-muted'>
                <CardHeader>
                  <CardTitle>Sales starter kit</CardTitle>
                  <CardDescription>All the scripts you need for product questions and objections.</CardDescription>
                </CardHeader>
              </Card>
              <Card className='border-muted'>
                <CardHeader>
                  <CardTitle>Customer care pack</CardTitle>
                  <CardDescription>Follow-ups, thank you notes, feedback requests, and more.</CardDescription>
                </CardHeader>
              </Card>
            </CardContent>
          </Card>

          <TemplatesTab />
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
              {autoResponses.map((item) => (
                <Card key={item.title} className='border-muted'>
                  <CardHeader className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                    <div>
                      <CardTitle className='flex items-center gap-2 text-lg'>
                        <MessageSquare className='h-4 w-4 text-primary' />
                        {item.title}
                      </CardTitle>
                      <CardDescription>{item.description}</CardDescription>
                    </div>
                    <div className='flex items-center gap-2'>
                      <Switch defaultChecked={item.enabled} />
                      <span className='text-sm text-muted-foreground'>{item.enabled ? 'Enabled' : 'Disabled'}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <blockquote className='rounded-md border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground'>
                      {item.template}
                    </blockquote>
                  </CardContent>
                </Card>
              ))}
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
              <Button size='sm'>New workflow</Button>
            </CardHeader>
            <CardContent>
              <ScrollArea className='h-[340px] pr-4'>
                <div className='space-y-4'>
                  {followUps.map((item, index) => (
                    <Card key={item.title} className='border-muted'>
                      <CardHeader className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
                        <div>
                          <CardTitle className='text-lg'>{item.title}</CardTitle>
                          <CardDescription>{item.description}</CardDescription>
                        </div>
                        <Badge variant='outline' className='bg-primary/10 text-primary'>
                          Workflow #{index + 1}
                        </Badge>
                      </CardHeader>
                      <CardContent className='grid gap-4 md:grid-cols-2'>
                        <div className='rounded-md border border-dashed border-border p-3 text-sm text-muted-foreground'>
                          <h4 className='flex items-center gap-2 text-sm font-medium text-foreground'>
                            <Clock className='h-4 w-4 text-primary' /> Trigger
                          </h4>
                          <p className='mt-1'>{item.trigger}</p>
                        </div>
                        <div className='rounded-md border border-dashed border-border p-3 text-sm text-muted-foreground'>
                          <h4 className='flex items-center gap-2 text-sm font-medium text-foreground'>
                            <Calendar className='h-4 w-4 text-primary' /> Action
                          </h4>
                          <p className='mt-1'>{item.action}</p>
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
                      <Switch
                        checked={flow.status === 'ON'}
                        onCheckedChange={() => handleToggle(flow)}
                        aria-label='Toggle automation'
                      />
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
                      <Button size='sm' variant='ghost' className='gap-1 text-destructive hover:text-destructive' onClick={() => handleDelete(flow.id)}>
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

      <NewAutomationModal
        open={builderOpen}
        onOpenChange={setBuilderOpen}
        initialFlow={editingFlow}
        onSave={handleSaveFlow}
      />
    </div>
  );
};

export default AutomationsPage;
