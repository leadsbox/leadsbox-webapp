import { FC, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TriggerNode, ConditionNode, ActionNode, TriggerKind, ConditionField, ActionKind } from './types';
import { cn } from '@/lib/utils';

const templates = [
  { id: 'welcome', name: 'Welcome Message' },
  { id: 'pricing', name: 'Pricing Response' },
  { id: 'followup', name: 'Follow-up Reminder' },
];

const users = [
  { id: 'unassigned', name: 'Unassigned' },
  { id: 'agent-1', name: 'Kay – Sales' },
  { id: 'agent-2', name: 'Mo – Support' },
];

const labels = ['NEW', 'CONTACTED', 'QUALIFIED', 'CUSTOMER', 'LOST'];
const channels = ['any', 'whatsapp', 'instagram', 'facebook'];
const stages = ['NEW', 'QUALIFIED', 'IN_PROGRESS', 'WON', 'LOST'];

const triggerSchema = z.object({
  kind: z.enum(['message.received', 'no_reply.for_hours', 'invoice.paid']),
  waitHours: z.number().min(1).max(168).optional(),
});

const conditionSchema = z.object({
  field: z.enum(['channel', 'label', 'text', 'assignee']),
  value: z.string().min(1),
  mode: z.enum(['AND', 'OR']),
});

const actionSchema = z.object({
  kind: z.enum(['send_template', 'add_label', 'create_followup', 'assign', 'move_stage', 'create_invoice']),
  templateId: z.string().optional(),
  label: z.string().optional(),
  offsetHours: z.number().min(1).max(168).optional(),
  assigneeId: z.string().optional(),
  stage: z.string().optional(),
  amount: z.number().min(0).optional(),
  currency: z.string().optional(),
});

interface InspectorProps {
  node: TriggerNode | ConditionNode | ActionNode | null;
  onUpdate: (nodeId: string, updates: Partial<TriggerNode | ConditionNode | ActionNode>) => void;
}

const Inspector: FC<InspectorProps> = ({ node, onUpdate }) => {
  const triggerForm = useForm({
    resolver: zodResolver(triggerSchema),
    defaultValues: { kind: 'message.received', waitHours: 24 },
  });
  const conditionForm = useForm({
    resolver: zodResolver(conditionSchema),
    defaultValues: { field: 'channel', value: 'any', mode: 'AND' },
  });
  const actionForm = useForm({
    resolver: zodResolver(actionSchema),
    defaultValues: {
      kind: 'send_template',
      templateId: templates[0]?.id,
      label: labels[0],
      offsetHours: 24,
      assigneeId: users[0]?.id,
      stage: stages[0],
      amount: 0,
      currency: 'USD',
    },
  });

  useEffect(() => {
    if (!node) return;

    if (node.type === 'trigger') {
      triggerForm.reset({
        kind: node.trigger.kind,
        waitHours: node.trigger.waitHours ?? 24,
      });
    }

    if (node.type === 'condition') {
      const first = node.conditions[0];
      conditionForm.reset({
        field: first?.field ?? 'channel',
        value: Array.isArray(first?.value) ? first?.value?.[0] ?? '' : first?.value ?? '',
        mode: node.mode,
      });
    }

    if (node.type === 'action') {
      actionForm.reset({
        kind: node.action.kind,
        templateId: node.action.args?.templateId,
        label: node.action.args?.label ?? labels[0],
        offsetHours: node.action.args?.offsetHours ?? 24,
        assigneeId: node.action.args?.assigneeId ?? users[0]?.id,
        stage: node.action.args?.stage ?? stages[0],
        amount: node.action.args?.amount ?? 0,
        currency: node.action.args?.currency ?? 'USD',
      });
    }
  }, [node, triggerForm, conditionForm, actionForm]);

  if (!node) {
    return (
      <aside className='hidden h-full border-l border-border bg-card/70 backdrop-blur-md lg:flex lg:w-[360px] lg:flex-col'>
        <div className='p-6 text-sm text-muted-foreground'>Select a node to configure its behaviour.</div>
      </aside>
    );
  }

  return (
    <aside className='hidden h-full border-l border-border bg-card/70 backdrop-blur-md lg:flex lg:w-[360px] lg:flex-col'>
      <Card className='m-4 flex-1 overflow-hidden border-none bg-transparent shadow-none'>
        <CardHeader className='pb-4'>
          <Badge
            variant='outline'
            className={cn(
              'w-fit',
              node.type === 'trigger' && 'border-emerald-500 text-emerald-500',
              node.type === 'condition' && 'border-sky-500 text-sky-500',
              node.type === 'action' && 'border-fuchsia-500 text-fuchsia-500'
            )}
          >
            {node.type === 'trigger' ? 'Trigger' : node.type === 'condition' ? 'Condition' : 'Action'}
          </Badge>
          <CardTitle className='text-xl text-foreground'>Configuration</CardTitle>
        </CardHeader>
        <Separator className='mx-4' />
        <ScrollArea className='flex-1 px-4'>
          <CardContent className='space-y-6 py-6'>
            {node.type === 'trigger' && (
              <form
                className='space-y-4'
                onSubmit={triggerForm.handleSubmit((values) => {
                  onUpdate(node.id, {
                    ...node,
                    trigger: {
                      ...node.trigger,
                      kind: values.kind as TriggerKind,
                      waitHours: values.kind === 'no_reply.for_hours' ? values.waitHours ?? 24 : undefined,
                    },
                  });
                })}
              >
                <div className='space-y-2'>
                  <label className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>Trigger type</label>
                  <Select
                    value={triggerForm.watch('kind')}
                    onValueChange={(value) => triggerForm.setValue('kind', value)}
                    defaultValue={triggerForm.getValues('kind')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='message.received'>Message received</SelectItem>
                      <SelectItem value='no_reply.for_hours'>No reply for X hours</SelectItem>
                      <SelectItem value='invoice.paid' disabled>
                        Invoice paid (soon)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {triggerForm.watch('kind') === 'no_reply.for_hours' && (
                  <div className='space-y-2'>
                    <label className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>Wait hours</label>
                    <Input type='number' min={1} max={168} {...triggerForm.register('waitHours', { valueAsNumber: true })} />
                  </div>
                )}

                <Button type='submit' size='sm' className='w-full'>
                  Update trigger
                </Button>
              </form>
            )}

            {node.type === 'condition' && (
              <form
                className='space-y-4'
                onSubmit={conditionForm.handleSubmit((values) => {
                  onUpdate(node.id, {
                    ...node,
                    mode: values.mode as 'AND' | 'OR',
                    conditions: [
                      {
                        field: values.field as ConditionField,
                        op: values.field === 'text' ? 'contains' : values.field === 'label' ? 'in' : 'eq',
                        value: values.value,
                      },
                    ],
                  });
                })}
              >
                <div className='grid grid-cols-1 gap-3'>
                  <div className='space-y-2'>
                    <label className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>Field</label>
                    <Select defaultValue={conditionForm.getValues('field')} onValueChange={(value) => conditionForm.setValue('field', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='channel'>Channel</SelectItem>
                        <SelectItem value='label'>Lead label</SelectItem>
                        <SelectItem value='text'>Message contains</SelectItem>
                        <SelectItem value='assignee'>Assigned user</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className='space-y-2'>
                    <label className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>Value</label>
                    {conditionForm.watch('field') === 'channel' && (
                      <Select defaultValue={conditionForm.getValues('value')} onValueChange={(value) => conditionForm.setValue('value', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {channels.map((channel) => (
                            <SelectItem key={channel} value={channel}>
                              {channel}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {conditionForm.watch('field') === 'label' && (
                      <Select defaultValue={conditionForm.getValues('value')} onValueChange={(value) => conditionForm.setValue('value', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {labels.map((label) => (
                            <SelectItem key={label} value={label}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {conditionForm.watch('field') === 'assignee' && (
                      <Select defaultValue={conditionForm.getValues('value')} onValueChange={(value) => conditionForm.setValue('value', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {conditionForm.watch('field') === 'text' && <Textarea {...conditionForm.register('value')} placeholder='Keyword or phrase' />}
                  </div>

                  <div className='space-y-2'>
                    <label className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>Mode</label>
                    <div className='flex items-center gap-2'>
                      <Switch
                        checked={conditionForm.watch('mode') === 'AND'}
                        onCheckedChange={(checked) => conditionForm.setValue('mode', checked ? 'AND' : 'OR')}
                      />
                      <span className='text-xs text-muted-foreground'>Require all rules ({conditionForm.watch('mode')})</span>
                    </div>
                  </div>
                </div>

                <Button type='submit' size='sm' className='w-full'>
                  Update condition
                </Button>
              </form>
            )}

            {node.type === 'action' && (
              <form
                className='space-y-4'
                onSubmit={actionForm.handleSubmit((values) => {
                  onUpdate(node.id, {
                    ...node,
                    action: {
                      kind: values.kind as ActionKind,
                      args: {
                        templateId: values.templateId,
                        label: values.label,
                        offsetHours: values.offsetHours,
                        assigneeId: values.assigneeId,
                        stage: values.stage,
                        amount: values.amount,
                        currency: values.currency,
                      },
                    },
                  });
                })}
              >
                <div className='space-y-2'>
                  <label className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>Action type</label>
                  <Select defaultValue={actionForm.getValues('kind')} onValueChange={(value) => actionForm.setValue('kind', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='send_template'>Send template</SelectItem>
                      <SelectItem value='add_label'>Add label</SelectItem>
                      <SelectItem value='create_followup'>Create follow-up</SelectItem>
                      <SelectItem value='assign'>Assign to user</SelectItem>
                      <SelectItem value='move_stage'>Move stage</SelectItem>
                      <SelectItem value='create_invoice'>Create invoice link</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {actionForm.watch('kind') === 'send_template' && (
                  <div className='space-y-2'>
                    <label className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>Template</label>
                    <Select
                      defaultValue={actionForm.getValues('templateId') ?? templates[0]?.id}
                      onValueChange={(value) => actionForm.setValue('templateId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {actionForm.watch('kind') === 'add_label' && (
                  <div className='space-y-2'>
                    <label className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>Label</label>
                    <Select defaultValue={actionForm.getValues('label') ?? labels[0]} onValueChange={(value) => actionForm.setValue('label', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {labels.map((label) => (
                          <SelectItem key={label} value={label}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {actionForm.watch('kind') === 'create_followup' && (
                  <div className='space-y-2'>
                    <label className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>Follow-up in (hours)</label>
                    <Input type='number' min={1} max={168} {...actionForm.register('offsetHours', { valueAsNumber: true })} />
                  </div>
                )}

                {actionForm.watch('kind') === 'assign' && (
                  <div className='space-y-2'>
                    <label className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>Assign to</label>
                    <Select
                      defaultValue={actionForm.getValues('assigneeId') ?? 'unassigned'}
                      onValueChange={(value) => actionForm.setValue('assigneeId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {actionForm.watch('kind') === 'move_stage' && (
                  <div className='space-y-2'>
                    <label className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>Stage</label>
                    <Select defaultValue={actionForm.getValues('stage') ?? 'WON'} onValueChange={(value) => actionForm.setValue('stage', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {stages.map((stage) => (
                          <SelectItem key={stage} value={stage}>
                            {stage}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {actionForm.watch('kind') === 'create_invoice' && (
                  <div className='grid grid-cols-2 gap-3'>
                    <div className='space-y-2'>
                      <label className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>Amount</label>
                      <Input type='number' min={0} step={1} {...actionForm.register('amount', { valueAsNumber: true })} />
                    </div>
                    <div className='space-y-2'>
                      <label className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>Currency</label>
                      <Select
                        defaultValue={actionForm.getValues('currency') ?? 'USD'}
                        onValueChange={(value) => actionForm.setValue('currency', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='USD'>USD</SelectItem>
                          <SelectItem value='NGN'>NGN</SelectItem>
                          <SelectItem value='EUR'>EUR</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                <Button type='submit' size='sm' className='w-full'>
                  Update action
                </Button>
              </form>
            )}
          </CardContent>
        </ScrollArea>
      </Card>
    </aside>
  );
};

export default Inspector;
