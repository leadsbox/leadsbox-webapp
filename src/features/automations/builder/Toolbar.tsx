import { FC } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { AutomationFlow } from './types';
import { Save, ZoomIn, ZoomOut, Scan, Undo, Redo, Eye, CheckCircle2, X } from 'lucide-react';

interface ToolbarProps {
  flow: AutomationFlow;
  validation: { ok: boolean; issues: string[] };
  onValidate: () => void;
  onPreview: () => void;
  onSaveDraft: () => void;
  onExit: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onUndo: () => void;
  onRedo: () => void;
}

const Toolbar: FC<ToolbarProps> = ({
  flow,
  validation,
  onValidate,
  onPreview,
  onSaveDraft,
  onExit,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onUndo,
  onRedo,
}) => {
  return (
    <div className='flex h-14 w-full items-center justify-between border-b border-border bg-card/80 px-4 backdrop-blur-md'>
      <div className='flex items-center gap-3'>
        <div>
          <p className='text-sm font-semibold text-foreground'>{flow.name}</p>
          <div className='flex items-center gap-2 text-xs text-muted-foreground'>
            <span>Version {flow.version}</span>
            <Badge variant={flow.status === 'ON' ? 'default' : 'outline'} className={cn(flow.status === 'ON' && 'bg-green-500/20 text-green-500')}>
              {flow.status}
            </Badge>
          </div>
        </div>
      </div>

      <div className='flex items-center gap-2'>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant='ghost' size='icon' onClick={onUndo} aria-label='Undo'>
                <Undo className='h-4 w-4' />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Undo</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant='ghost' size='icon' onClick={onRedo} aria-label='Redo'>
                <Redo className='h-4 w-4' />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Redo</TooltipContent>
          </Tooltip>

          <div className='h-6 w-px bg-border' />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant='ghost' size='icon' onClick={onZoomOut} aria-label='Zoom out'>
                <ZoomOut className='h-4 w-4' />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom out</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant='ghost' size='icon' onClick={onZoomReset} aria-label='Reset zoom'>
                <Scan className='h-4 w-4' />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reset zoom</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant='ghost' size='icon' onClick={onZoomIn} aria-label='Zoom in'>
                <ZoomIn className='h-4 w-4' />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom in</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className='flex items-center gap-2'>
        <Button variant='outline' size='sm' onClick={onValidate} className='gap-2'>
          <CheckCircle2 className='h-4 w-4' /> Validate
        </Button>
        <Button variant='outline' size='sm' onClick={onPreview} className='gap-2'>
          <Eye className='h-4 w-4' /> Preview
        </Button>
        <Button variant='secondary' size='sm' onClick={onSaveDraft} className='gap-2'>
          <Save className='h-4 w-4' /> Save draft
        </Button>
        <Button variant='ghost' size='sm' onClick={onExit} className='gap-2 text-destructive'>
          <X className='h-4 w-4' /> Exit
        </Button>
      </div>
    </div>
  );
};

export default Toolbar;
