import { Badge } from '@/components/ui/badge';
import type { TemplateStatus } from '@/types';
import { cn } from '@/lib/utils';

const STATUS_STYLES: Record<TemplateStatus, string> = {
  DRAFT: 'bg-muted text-foreground',
  SUBMITTED: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
  APPROVED: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300',
  REJECTED: 'bg-destructive/15 text-destructive',
  DEPRECATED: 'bg-amber-500/15 text-amber-600 dark:text-amber-300',
};

const STATUS_LABELS: Record<TemplateStatus, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  DEPRECATED: 'Deprecated',
};

export const TemplateStatusBadge = ({ status, className }: { status: TemplateStatus; className?: string }) => {
  return (
    <Badge className={cn('px-2 py-1 text-xs font-medium capitalize', STATUS_STYLES[status], className)}>
      {STATUS_LABELS[status]}
    </Badge>
  );
};

export default TemplateStatusBadge;
