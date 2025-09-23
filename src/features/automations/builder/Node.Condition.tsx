import { FC } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ConditionNode } from './types';
import { cn } from '@/lib/utils';

interface ConditionNodeProps {
  node: ConditionNode;
  selected: boolean;
  onSelect: () => void;
  onStartConnection: (direction: 'input' | 'output', branch?: 'true' | 'false') => void;
}

const ConditionNodeView: FC<ConditionNodeProps> = ({ node, selected, onSelect, onStartConnection }) => {
  return (
    <div
      className={cn(
        'relative min-w-[240px] select-none rounded-xl border-l-4 border-sky-500 bg-card shadow-sm transition-shadow focus-visible:outline-none focus-visible:ring-2',
        selected && 'ring-2 ring-primary shadow-lg'
      )}
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
    >
      <span
        className='absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 cursor-crosshair rounded-full border-2 border-sky-500 bg-sky-500/20'
        role='button'
        aria-label='Connect condition input'
        onMouseDown={(event) => {
          event.stopPropagation();
          onStartConnection('input');
        }}
        onTouchStart={(event) => {
          event.stopPropagation();
          onStartConnection('input');
        }}
      />
      <span
        className='absolute -right-3 top-1/3 h-6 w-6 -translate-y-1/2 cursor-crosshair rounded-full border-2 border-sky-500 bg-sky-500/20'
        role='button'
        aria-label='Connect “true” branch'
        onMouseDown={(event) => {
          event.stopPropagation();
          onStartConnection('output', 'true');
        }}
        onTouchStart={(event) => {
          event.stopPropagation();
          onStartConnection('output', 'true');
        }}
      />
      <span
        className='absolute -right-3 bottom-1/3 h-6 w-6 translate-y-1/2 cursor-crosshair rounded-full border-2 border-sky-500 bg-sky-500/20'
        role='button'
        aria-label='Connect “false” branch'
        onMouseDown={(event) => {
          event.stopPropagation();
          onStartConnection('output', 'false');
        }}
        onTouchStart={(event) => {
          event.stopPropagation();
          onStartConnection('output', 'false');
        }}
      />
      <Card className='border-none shadow-none'>
        <CardHeader className='pb-2'>
          <Badge variant='outline' className='mb-2 border-sky-500 text-sky-500'>
            Condition
          </Badge>
          <CardTitle className='text-lg'>
            {node.conditions.length} rule{node.conditions.length === 1 ? '' : 's'} ({node.mode})
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-1 text-sm text-muted-foreground'>
          {node.conditions.map((condition, index) => (
            <div key={index} className='rounded-md bg-muted/50 px-2 py-1 text-xs font-medium text-muted-foreground'>
              {condition.field} {condition.op} {Array.isArray(condition.value) ? condition.value.join(', ') : condition.value}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default ConditionNodeView;
