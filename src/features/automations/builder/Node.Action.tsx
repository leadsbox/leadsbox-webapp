import { FC } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ActionNode } from './types';
import { cn } from '@/lib/utils';

interface ActionNodeProps {
  node: ActionNode;
  selected: boolean;
  onSelect: () => void;
  onStartConnection: (direction: 'input') => void;
}

const friendlyName: Record<string, string> = {
  send_template: 'Send template',
  add_label: 'Add label',
  create_followup: 'Create follow-up',
  assign: 'Assign to user',
  move_stage: 'Move stage',
  create_invoice: 'Create invoice link',
};

const ActionNodeView: FC<ActionNodeProps> = ({ node, selected, onSelect, onStartConnection }) => {
  const title = friendlyName[node.action.kind] ?? 'Action';

  return (
    <div
      className={cn(
        'relative min-w-[220px] select-none rounded-xl border-l-4 border-fuchsia-500 bg-card shadow-sm transition-shadow focus-visible:outline-none focus-visible:ring-2',
        selected && 'ring-2 ring-primary shadow-lg'
      )}
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
    >
      <span
        className='absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 cursor-crosshair rounded-full border-2 border-fuchsia-500 bg-fuchsia-500/20'
        role='button'
        aria-label='Connect action input'
        onMouseDown={(event) => {
          event.stopPropagation();
          onStartConnection('input');
        }}
        onTouchStart={(event) => {
          event.stopPropagation();
          onStartConnection('input');
        }}
      />
      <Card className='border-none shadow-none'>
        <CardHeader className='pb-2'>
          <Badge variant='outline' className='mb-2 border-fuchsia-500 text-fuchsia-500'>
            Action
          </Badge>
          <CardTitle className='text-lg'>{title}</CardTitle>
        </CardHeader>
        <CardContent className='text-sm text-muted-foreground'>
          {node.action.kind === 'send_template' && 'Instantly reply with the selected template.'}
          {node.action.kind === 'add_label' && `Apply label ${node.action.args?.label ?? ''}.`}
          {node.action.kind === 'create_followup' && `Schedule reminder after ${node.action.args?.offsetHours ?? 24}h.`}
          {node.action.kind === 'assign' && 'Assign this conversation to a teammate.'}
          {node.action.kind === 'move_stage' && `Move the lead to ${node.action.args?.stage ?? 'the next'} stage.`}
          {node.action.kind === 'create_invoice' && 'Create a payment link (billing required).'}
        </CardContent>
      </Card>
    </div>
  );
};

export default ActionNodeView;
