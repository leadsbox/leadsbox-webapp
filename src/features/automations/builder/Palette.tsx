import { FC } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { ActionKind, TriggerKind } from './types';

export type PaletteItem = {
  id: string;
  label: string;
  description: string;
  type: 'trigger' | 'condition' | 'action';
  payload: Record<string, unknown>;
  disabled?: boolean;
  badge?: string;
};

interface PaletteSectionProps {
  title: string;
  items: PaletteItem[];
}

const paletteSections: PaletteSectionProps[] = [
  {
    title: 'Triggers',
    items: [
      {
        id: 'trigger:message.received',
        label: 'Message received',
        description: 'Kick off when a DM hits any channel.',
        type: 'trigger',
        payload: { trigger: { kind: 'message.received' as TriggerKind } },
      },
      {
        id: 'trigger:no_reply',
        label: 'No reply for X hours',
        description: 'Follow up when a lead goes quiet.',
        type: 'trigger',
        payload: { trigger: { kind: 'no_reply.for_hours' as TriggerKind, waitHours: 24 } },
      },
      {
        id: 'trigger:invoice_paid',
        label: 'Invoice paid',
        description: 'Celebrate when payments land (coming soon).',
        type: 'trigger',
        payload: { trigger: { kind: 'invoice.paid' as TriggerKind } },
        disabled: true,
        badge: 'soon',
      },
    ],
  },
  {
    title: 'Conditions',
    items: [
      {
        id: 'condition:channel',
        label: 'Channel is…',
        description: 'WhatsApp, Instagram, Facebook.',
        type: 'condition',
        payload: {
          conditions: [
            { field: 'channel', op: 'eq', value: 'whatsapp' },
          ],
          mode: 'OR',
        },
      },
      {
        id: 'condition:label',
        label: 'Lead label is…',
        description: 'Qualify based on pipeline stage.',
        type: 'condition',
        payload: {
          conditions: [
            { field: 'label', op: 'in', value: ['NEW', 'CONTACTED'] },
          ],
          mode: 'OR',
        },
      },
      {
        id: 'condition:text',
        label: 'Message contains…',
        description: 'Scan text for keywords or intents.',
        type: 'condition',
        payload: {
          conditions: [
            { field: 'text', op: 'contains', value: 'pricing' },
          ],
          mode: 'AND',
        },
      },
      {
        id: 'condition:assignee',
        label: 'Assigned user is…',
        description: 'Route based on teammate ownership.',
        type: 'condition',
        payload: {
          conditions: [
            { field: 'assignee', op: 'eq', value: 'unassigned' },
          ],
          mode: 'AND',
        },
      },
    ],
  },
  {
    title: 'Actions',
    items: [
      {
        id: 'action:send_template',
        label: 'Send template',
        description: 'Respond instantly with saved replies.',
        type: 'action',
        payload: {
          action: { kind: 'send_template' as ActionKind, args: { templateId: undefined } },
        },
      },
      {
        id: 'action:add_label',
        label: 'Add label',
        description: 'Tag the lead with the right status.',
        type: 'action',
        payload: {
          action: { kind: 'add_label' as ActionKind, args: { label: 'FOLLOW_UP_REQUIRED' } },
        },
      },
      {
        id: 'action:create_followup',
        label: 'Create follow-up',
        description: 'Schedule a reminder for your team.',
        type: 'action',
        payload: {
          action: { kind: 'create_followup' as ActionKind, args: { offsetHours: 24 } },
        },
      },
      {
        id: 'action:assign',
        label: 'Assign to user',
        description: 'Send the conversation to a teammate.',
        type: 'action',
        payload: {
          action: { kind: 'assign' as ActionKind, args: { assigneeId: undefined } },
        },
      },
      {
        id: 'action:move_stage',
        label: 'Move pipeline stage',
        description: 'Progress the deal automatically.',
        type: 'action',
        payload: {
          action: { kind: 'move_stage' as ActionKind, args: { stage: 'WON' } },
        },
      },
      {
        id: 'action:create_invoice',
        label: 'Create invoice link',
        description: 'Generate a payment request (billing required).',
        type: 'action',
        payload: {
          action: { kind: 'create_invoice' as ActionKind, args: { amount: 0, currency: 'USD' } },
        },
        badge: 'billing',
      },
    ],
  },
];

interface DraggableCardProps {
  item: PaletteItem;
}

const DraggableCard: FC<DraggableCardProps> = ({ item }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: item.id,
    data: {
      source: 'palette',
      type: item.type,
      payload: item.payload,
    },
    disabled: item.disabled,
  });

  return (
    <Card
      ref={setNodeRef}
      className={cn(
        'cursor-grab border-muted transition-shadow focus-visible:outline-none focus-visible:ring-2',
        item.disabled && 'opacity-60 pointer-events-none',
        isDragging && 'shadow-lg'
      )}
      tabIndex={item.disabled ? -1 : 0}
      aria-disabled={item.disabled}
      {...attributes}
      {...listeners}
    >
      <CardHeader className='space-y-1'>
        <CardTitle className='flex items-center justify-between text-base'>
          {item.label}
          {item.badge && <Badge variant='outline'>{item.badge}</Badge>}
        </CardTitle>
        <CardDescription>{item.description}</CardDescription>
      </CardHeader>
    </Card>
  );
};

export const Palette: FC = () => {
  return (
    <aside className='flex h-full flex-col border-r border-border bg-card/60 backdrop-blur-md'>
      <div className='p-4'>
        <h2 className='text-lg font-semibold text-foreground'>Blocks</h2>
        <p className='text-xs text-muted-foreground'>Drag a trigger, condition, or action onto the canvas.</p>
      </div>
      <ScrollArea className='flex-1 px-4 pb-4'>
        <div className='space-y-6'>
          {paletteSections.map((section) => (
            <div key={section.title} className='space-y-3'>
              <div>
                <p className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>{section.title}</p>
              </div>
              <div className='space-y-3'>
                {section.items.map((item) => (
                  <DraggableCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </aside>
  );
};

export default Palette;
