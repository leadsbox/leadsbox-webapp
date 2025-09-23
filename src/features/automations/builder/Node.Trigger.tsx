import { FC } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TriggerNode } from './types';
import { cn } from '@/lib/utils';

interface TriggerNodeProps {
  node: TriggerNode;
  selected: boolean;
  onSelect: () => void;
  onStartConnection: (direction: 'output') => void;
}

const TriggerNodeView: FC<TriggerNodeProps> = ({ node, selected, onSelect, onStartConnection }) => {
  const { kind, waitHours } = node.trigger;
  const label =
    kind === 'message.received'
      ? 'Message received'
      : kind === 'no_reply.for_hours'
        ? `No reply (${waitHours ?? 24}h)`
        : 'Invoice paid';

  return (
    <div
      className={cn(
        'relative min-w-[220px] select-none rounded-xl border-l-4 border-emerald-500 bg-card shadow-sm transition-shadow focus-visible:outline-none focus-visible:ring-2',
        selected && 'ring-2 ring-primary shadow-lg'
      )}
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
    >
      <span
        className='absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 cursor-crosshair rounded-full border-2 border-emerald-500 bg-emerald-500/20'
        role='button'
        aria-label='Connect trigger output'
        onMouseDown={(event) => {
          event.stopPropagation();
          onStartConnection('output');
        }}
        onTouchStart={(event) => {
          event.stopPropagation();
          onStartConnection('output');
        }}
      />
      <Card className='border-none shadow-none'>
        <CardHeader className='pb-2'>
          <Badge variant='outline' className='mb-2 border-emerald-500 text-emerald-500'>
            Trigger
          </Badge>
          <CardTitle className='text-lg'>{label}</CardTitle>
        </CardHeader>
        <CardContent className='text-sm text-muted-foreground'>
          {kind === 'message.received' && 'Starts when a lead sends a DM on any connected channel.'}
          {kind === 'no_reply.for_hours' && `Starts after ${waitHours ?? 24} hours without a reply.`}
          {kind === 'invoice.paid' && 'Starts after a linked invoice is paid.'}
        </CardContent>
      </Card>
    </div>
  );
};

export default TriggerNodeView;
