import type { FollowUpRule, FollowUpStatus, Task } from '@/types';

export interface TaskBuckets {
  overdue: Task[];
  today: Task[];
  upcoming: Task[];
  completed: Task[];
  cancelled: Task[];
}

const FOLLOW_UP_STATUS_TO_TASK_STATUS: Record<FollowUpStatus, Task['status']> = {
  SCHEDULED: 'PENDING',
  SENT: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  FAILED: 'PENDING',
};

const toIsoString = (value?: string | Date | null, fallback?: string): string => {
  if (value) {
    const date = typeof value === 'string' ? new Date(value) : value;
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString();
    }
  }
  if (fallback) {
    return fallback;
  }
  return new Date().toISOString();
};

const normalisePriority = (value?: string | null): Task['priority'] => {
  const candidate = typeof value === 'string' ? value.trim().toUpperCase() : '';
  if (candidate === 'HIGH' || candidate === 'MEDIUM' || candidate === 'LOW') {
    return candidate;
  }
  return 'MEDIUM';
};

const toTaskStatus = (status?: FollowUpStatus | null): Task['status'] => {
  if (!status) return 'PENDING';
  return FOLLOW_UP_STATUS_TO_TASK_STATUS[status] ?? 'PENDING';
};

const resolveTitle = (followUp: FollowUpRule): string => {
  const metadataTitle =
    typeof followUp.metadata === 'object' && followUp.metadata !== null && typeof (followUp.metadata as Record<string, unknown>).title === 'string'
      ? String((followUp.metadata as Record<string, unknown>).title)
      : null;

  if (metadataTitle && metadataTitle.trim().length > 0) {
    return metadataTitle.trim();
  }

  if (followUp.template?.name) {
    return followUp.template.name;
  }

  const provider = typeof followUp.provider === 'string' ? followUp.provider : '';
  const capitalisedProvider = provider.length > 0 ? provider.charAt(0).toUpperCase() + provider.slice(1).toLowerCase() : 'Follow-up';

  return `${capitalisedProvider} reminder`;
};

export const mapFollowUpToTask = (followUp: FollowUpRule): Task => {
  const dueDateIso = toIsoString(followUp.scheduledTime);

  const metadataPriority =
    typeof followUp.metadata === 'object' && followUp.metadata !== null
      ? ((followUp.metadata as Record<string, unknown>).priority as string | undefined)
      : undefined;

  return {
    id: followUp.id,
    title: resolveTitle(followUp),
    description: followUp.message ?? undefined,
    type: 'FOLLOW_UP',
    priority: normalisePriority(metadataPriority),
    status: toTaskStatus(followUp.status),
    assignedTo: followUp.userId ?? '',
    leadId: followUp.leadId ?? undefined,
    leadName: followUp.lead?.contact?.displayName || followUp.lead?.contact?.name || followUp.lead?.name || undefined,
    threadId: followUp.conversationId ?? undefined,
    dueDate: dueDateIso,
    createdAt: toIsoString(followUp.createdAt, dueDateIso),
    updatedAt: toIsoString(followUp.updatedAt, dueDateIso),
  };
};

export const mapFollowUpsToTasks = (followUps: FollowUpRule[]): Task[] => followUps.map((followUp) => mapFollowUpToTask(followUp));

const startOfDay = (date: Date) => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};

const endOfDay = (date: Date) => {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
};

const parseDate = (value: string): Date | null => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

export const categoriseTasks = (tasks: Task[], reference: Date = new Date()): TaskBuckets => {
  const buckets: TaskBuckets = {
    overdue: [],
    today: [],
    upcoming: [],
    completed: [],
    cancelled: [],
  };

  const dayStart = startOfDay(reference);
  const dayEnd = endOfDay(reference);

  tasks.forEach((task) => {
    if (task.status === 'COMPLETED') {
      buckets.completed.push(task);
      return;
    }
    if (task.status === 'CANCELLED') {
      buckets.cancelled.push(task);
      return;
    }

    const dueDate = parseDate(task.dueDate);
    if (!dueDate) {
      buckets.upcoming.push(task);
      return;
    }

    if (dueDate < dayStart) {
      buckets.overdue.push(task);
    } else if (dueDate <= dayEnd) {
      buckets.today.push(task);
    } else {
      buckets.upcoming.push(task);
    }
  });

  return buckets;
};
