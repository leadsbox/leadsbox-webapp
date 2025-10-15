// Tasks Page Component for LeadsBox Dashboard

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  CheckSquare,
  Circle,
  Clock,
  Filter,
  Flag,
  Mail,
  MoreHorizontal,
  Phone,
  Plus,
  Search,
  User,
  Users,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import client, { getOrgId } from '@/api/client';
import { endpoints } from '@/api/config';
import { useAuth } from '@/context/AuthContext';
import { extractFollowUps } from '@/utils/apiData';
import { categoriseTasks, mapFollowUpsToTasks } from '@/features/tasks/taskUtils';
import type { Task } from '@/types';
import { formatDistanceToNow, format, isPast, isToday } from 'date-fns';
import { notify } from '@/lib/toast';

type TabValue = 'overdue' | 'today' | 'upcoming' | 'all';

interface MemberUser {
  id: string;
  userId?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
  profileImage?: string;
  avatarUrl?: string;
}

interface OrgMember {
  id: string;
  role: string;
  userId: string;
  user?: MemberUser;
}

const getPriorityColor = (priority: Task['priority']) => {
  switch (priority) {
    case 'HIGH':
      return 'bg-red-500/10 text-red-400';
    case 'MEDIUM':
      return 'bg-amber-500/10 text-amber-400';
    case 'LOW':
      return 'bg-blue-500/10 text-blue-400';
    default:
      return 'bg-gray-500/10 text-gray-400';
  }
};

const getStatusColor = (status: Task['status']) => {
  switch (status) {
    case 'COMPLETED':
      return 'bg-green-500/10 text-green-400 border-green-500/20';
    case 'IN_PROGRESS':
      return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    case 'PENDING':
      return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    case 'CANCELLED':
      return 'bg-red-500/10 text-red-400 border-red-500/20';
    default:
      return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
  }
};

const getTypeIcon = (type: Task['type']) => {
  switch (type) {
    case 'CALL':
      return <Phone className='h-4 w-4' />;
    case 'EMAIL':
      return <Mail className='h-4 w-4' />;
    case 'MEETING':
      return <Users className='h-4 w-4' />;
    case 'FOLLOW_UP':
      return <Clock className='h-4 w-4' />;
    default:
      return <CheckSquare className='h-4 w-4' />;
  }
};

const getStatusIcon = (status: Task['status']) => {
  switch (status) {
    case 'COMPLETED':
      return <CheckCircle className='h-4 w-4 text-green-500' />;
    case 'IN_PROGRESS':
      return <Circle className='h-4 w-4 text-blue-500' />;
    case 'CANCELLED':
      return <XCircle className='h-4 w-4 text-red-500' />;
    default:
      return <Circle className='h-4 w-4 text-muted-foreground' />;
  }
};

const isTaskOverdue = (task: Task) =>
  task.status !== 'COMPLETED' && task.status !== 'CANCELLED' && isPast(new Date(task.dueDate));

const normaliseMember = (candidate: unknown): OrgMember | null => {
  if (!candidate || typeof candidate !== 'object') return null;
  const record = candidate as Record<string, unknown>;

  const idRaw = record.id;
  const id =
    typeof idRaw === 'string'
      ? idRaw
      : typeof idRaw === 'number'
      ? String(idRaw)
      : record['memberId'] && typeof record['memberId'] === 'string'
      ? record['memberId']
      : '';
  if (!id) return null;

  const userIdRaw = record.userId;
  const userId =
    typeof userIdRaw === 'string'
      ? userIdRaw
      : typeof userIdRaw === 'number'
      ? String(userIdRaw)
      : '';
  if (!userId) return null;

  const role = typeof record.role === 'string' ? record.role : 'MEMBER';

  const rawUser = record.user;
  let user: MemberUser | undefined;
  if (rawUser && typeof rawUser === 'object') {
    const userRecord = rawUser as Record<string, unknown>;
    const userIdValue = userRecord.id;
    const resolvedId =
      typeof userIdValue === 'string'
        ? userIdValue
        : typeof userIdValue === 'number'
        ? String(userIdValue)
        : '';
    if (resolvedId) {
      user = {
        id: resolvedId,
        userId: typeof userRecord.userId === 'string' ? userRecord.userId : undefined,
        firstName: typeof userRecord.firstName === 'string' ? userRecord.firstName : undefined,
        lastName: typeof userRecord.lastName === 'string' ? userRecord.lastName : undefined,
        username: typeof userRecord.username === 'string' ? userRecord.username : undefined,
        email: typeof userRecord.email === 'string' ? userRecord.email : undefined,
        profileImage:
          typeof userRecord.profileImage === 'string' ? userRecord.profileImage : undefined,
        avatarUrl: typeof userRecord.avatarUrl === 'string' ? userRecord.avatarUrl : undefined,
      };
    }
  }

  return { id, role, userId, user };
};

const extractMembers = (payload: unknown): OrgMember[] => {
  const resolveCandidates = (input: unknown): unknown[] => {
    if (Array.isArray(input)) return input;
    if (input && typeof input === 'object') {
      const record = input as Record<string, unknown>;
      if (Array.isArray(record.members)) return record.members;
      const data = record.data;
      if (Array.isArray(data)) return data;
      if (data && typeof data === 'object') {
        const nested = data as Record<string, unknown>;
        if (Array.isArray(nested.members)) return nested.members;
      }
    }
    return [];
  };

  return resolveCandidates(payload)
    .map(normaliseMember)
    .filter((member): member is OrgMember => Boolean(member));
};

const getMemberName = (member?: OrgMember): string => {
  if (!member?.user) return 'Unassigned';
  const { firstName, lastName, username, email } = member.user;
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
  if (fullName) return fullName;
  if (username) return username;
  if (email) return email;
  return 'Team member';
};

const getMemberInitials = (member?: OrgMember): string => {
  if (!member?.user) return '??';
  const { firstName, lastName, username, email } = member.user;
  const letters: string[] = [];
  if (firstName) letters.push(firstName.charAt(0));
  if (lastName) letters.push(lastName.charAt(0));
  if (letters.length) return letters.join('').toUpperCase();
  const fallback = username || email;
  if (fallback) return fallback.slice(0, 2).toUpperCase();
  return '??';
};

const getMemberAvatar = (member?: OrgMember): string | undefined =>
  member?.user?.profileImage || member?.user?.avatarUrl || undefined;

const TasksPage: React.FC = () => {
  const { user } = useAuth();
  const organizationId = user?.orgId || user?.currentOrgId || getOrgId();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabValue>('overdue');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [tasksError, setTasksError] = useState<string | null>(null);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState<string | null>(null);

  const loadTasks = useCallback(async () => {
    setTasksLoading(true);
    setTasksError(null);
    try {
      const response = await client.get(endpoints.followups);
      const followUps = extractFollowUps(response?.data);
      const mappedTasks = mapFollowUpsToTasks(followUps);
      setTasks(mappedTasks);
    } catch (error) {
      console.error('Failed to load follow-ups:', error);
      const apiError = error as { response?: { data?: { message?: string } } };
      setTasksError(apiError.response?.data?.message || 'Unable to load follow-ups.');
      setTasks([]);
    } finally {
      setTasksLoading(false);
    }
  }, [organizationId]);

  const loadMembers = useCallback(async () => {
    if (!organizationId) {
      setMembers([]);
      return;
    }

    setMembersLoading(true);
    setMembersError(null);
    try {
      const response = await client.get(endpoints.orgMembers(organizationId));
      const memberList = extractMembers(response?.data);
      setMembers(memberList);
    } catch (error) {
      console.error('Failed to load organization members:', error);
      const apiError = error as { response?: { data?: { message?: string } } };
      setMembers([]);
      setMembersError(apiError.response?.data?.message || 'Unable to load members.');
    } finally {
      setMembersLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const toggleTaskComplete = useCallback(
    async (task: Task) => {
      const isCompleted = task.status === 'COMPLETED';
      const nextStatus = isCompleted ? 'SCHEDULED' : 'SENT';
      try {
        await client.put(endpoints.followup(task.id), { status: nextStatus });
        await loadTasks();
        notify.success({
          key: `tasks:toggle:${task.id}`,
          title: isCompleted ? 'Task reopened' : 'Task completed',
        });
      } catch (error) {
        console.error('Failed to update follow-up status:', error);
        notify.error({
          key: 'tasks:update:error',
          title: 'Unable to update task',
          description: 'Please try again in a moment.',
        });
      }
    },
    [loadTasks]
  );

  const taskBuckets = useMemo(() => categoriseTasks(tasks), [tasks]);
  const overdueTasks = taskBuckets.overdue;
  const todayTasks = taskBuckets.today;
  const upcomingTasks = taskBuckets.upcoming;
  const completedTasks = taskBuckets.completed;
  const totalTasks = tasks.length;

  const memberLookup = useMemo(() => {
    const lookup = new Map<string, OrgMember>();
    members.forEach((member) => {
      lookup.set(member.userId, member);
      if (member.user?.id) lookup.set(member.user.id, member);
      if (member.user?.userId) lookup.set(member.user.userId, member);
    });
    return lookup;
  }, [members]);

  const combinedError = tasksError || membersError;
  const busy = tasksLoading || membersLoading;

  const renderMetric = (value: number): string | number => {
    if (busy) return '…';
    if (combinedError) return '—';
    return value;
  };

  const filteredTasks = useMemo(() => {
    const baseTasks: Task[] =
      activeTab === 'overdue'
        ? overdueTasks
        : activeTab === 'today'
        ? todayTasks
        : activeTab === 'upcoming'
        ? upcomingTasks
        : tasks;

    const query = searchQuery.trim().toLowerCase();
    if (!query) return baseTasks;

    return baseTasks.filter((task) => {
      if (task.title.toLowerCase().includes(query)) return true;
      if (task.description?.toLowerCase().includes(query)) return true;

      const assignee = memberLookup.get(task.assignedTo);
      if (assignee) {
        const name = getMemberName(assignee).toLowerCase();
        if (name.includes(query)) return true;
      }

      return false;
    });
  }, [activeTab, overdueTasks, todayTasks, upcomingTasks, tasks, searchQuery, memberLookup]);

  return (
    <div className='p-4 sm:p-6 space-y-4 sm:space-y-6'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
        <div>
          <h1 className='text-2xl sm:text-3xl font-bold text-foreground'>Tasks</h1>
          <p className='text-sm sm:text-base text-muted-foreground'>Manage your tasks and deadlines</p>
        </div>
        <Button className='w-full sm:w-auto'>
          <Plus className='h-4 w-4 mr-2' />
          Add Task
        </Button>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium flex items-center'>
              <AlertTriangle className='h-4 w-4 mr-2 text-red-500' />
              Overdue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-red-500'>{renderMetric(overdueTasks.length)}</div>
            <p className='text-xs text-muted-foreground'>Need immediate attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium flex items-center'>
              <Clock className='h-4 w-4 mr-2 text-amber-500' />
              Due Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-amber-500'>{renderMetric(todayTasks.length)}</div>
            <p className='text-xs text-muted-foreground'>Tasks for today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium flex items-center'>
              <Calendar className='h-4 w-4 mr-2 text-blue-500' />
              Upcoming
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-blue-500'>{renderMetric(upcomingTasks.length)}</div>
            <p className='text-xs text-muted-foreground'>Future tasks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium flex items-center'>
              <CheckSquare className='h-4 w-4 mr-2 text-green-500' />
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-green-500'>{renderMetric(completedTasks.length)}</div>
            <p className='text-xs text-muted-foreground'>Delivered follow-ups</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className='flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4'>
        <div className='relative flex-1'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
          <Input
            placeholder='Search tasks...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='pl-10'
          />
        </div>

        <Button variant='outline' className='w-full sm:w-auto'>
          <Filter className='h-4 w-4 mr-2' />
          Filter
        </Button>
      </div>

  {/* Task Tabs */}
      <Tabs value={activeTab} onValueChange={(value: TabValue) => setActiveTab(value)}>
        <TabsList className='flex gap-2 overflow-x-auto whitespace-nowrap'>
          <TabsTrigger value='overdue' className='flex items-center space-x-2 shrink-0'>
            <AlertTriangle className='h-3 w-3' />
            <span>Overdue ({renderMetric(overdueTasks.length)})</span>
          </TabsTrigger>
          <TabsTrigger value='today' className='flex items-center space-x-2 shrink-0'>
            <Clock className='h-3 w-3' />
            <span>Today ({renderMetric(todayTasks.length)})</span>
          </TabsTrigger>
          <TabsTrigger value='upcoming' className='flex items-center space-x-2 shrink-0'>
            <Calendar className='h-3 w-3' />
            <span>Upcoming ({renderMetric(upcomingTasks.length)})</span>
          </TabsTrigger>
          <TabsTrigger value='all' className='flex items-center space-x-2 shrink-0'>
            <CheckSquare className='h-3 w-3' />
            <span>All ({renderMetric(totalTasks)})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className='mt-6'>
          {/* Task List */}
          <Card>
            <CardHeader>
              <CardTitle>Tasks ({renderMetric(filteredTasks.length)})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {busy ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <div key={`task-skeleton-${index}`} className='p-4 rounded-lg border border-border'>
                      <div className='flex items-start space-x-4'>
                        <Skeleton className='h-5 w-5 rounded-md' />
                        <div className='flex-1 space-y-2'>
                          <Skeleton className='h-5 w-1/3' />
                          <Skeleton className='h-4 w-2/3' />
                          <Skeleton className='h-4 w-1/2' />
                        </div>
                      </div>
                    </div>
                  ))
                ) : combinedError ? (
                  <div className='text-center py-8 text-destructive'>
                    <p className='font-medium mb-2'>Unable to load tasks</p>
                    <p className='text-sm text-muted-foreground'>{combinedError}</p>
                  </div>
                ) : filteredTasks.length === 0 ? (
                  <div className='text-center py-8'>
                    <CheckSquare className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
                    <h3 className='text-lg font-medium text-foreground mb-2'>No tasks found</h3>
                    <p className='text-muted-foreground mb-4'>
                      {activeTab === 'overdue' && 'Great! No overdue tasks.'}
                      {activeTab === 'today' && 'No follow-ups required today.'}
                      {activeTab === 'upcoming' && 'No upcoming reminders yet.'}
                      {activeTab === 'all' && 'Try adjusting your search query.'}
                    </p>
                    <Button>
                      <Plus className='h-4 w-4 mr-2' />
                      Add Task
                    </Button>
                  </div>
                ) : (
                  filteredTasks.map((task) => {
                    const taskIsOverdue = isTaskOverdue(task);
                    const assignee = memberLookup.get(task.assignedTo);
                    const assigneeName = getMemberName(assignee);
                    const assigneeInitials = getMemberInitials(assignee);
                    const assigneeAvatar = getMemberAvatar(assignee);

                    return (
                      <div
                        key={task.id}
                        className={`p-4 rounded-lg border transition-colors hover:bg-muted/50 ${
                          taskIsOverdue
                            ? 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20'
                            : 'border-border'
                        }`}
                      >
                        <div className='flex items-start space-x-4'>
                          {/* Checkbox */}
                          <div className='mt-1'>
                            <Checkbox
                              checked={task.status === 'COMPLETED'}
                              onCheckedChange={() => toggleTaskComplete(task)}
                              className='h-5 w-5'
                              disabled={tasksLoading}
                            />
                          </div>

                          {/* Task Content */}
                          <div className='flex-1 min-w-0'>
                            <div className='flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3'>
                              <div className='flex-1'>
                                <div className='flex items-center space-x-2 mb-1 min-w-0'>
                                  <h3
                                    className={`font-medium truncate ${
                                      task.status === 'COMPLETED'
                                        ? 'line-through text-muted-foreground'
                                        : 'text-foreground'
                                    }`}
                                  >
                                    {task.title}
                                  </h3>
                                  {getStatusIcon(task.status)}
                                </div>

                                {task.description && (
                                  <p className='text-sm text-muted-foreground mb-2'>{task.description}</p>
                                )}

                                <div className='flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground'>
                                  <div className='flex items-center space-x-1'>
                                    {getTypeIcon(task.type)}
                                    <span className='capitalize'>{task.type.replace('_', ' ')}</span>
                                  </div>

                                  <div className='flex items-center space-x-1'>
                                    <Calendar className='h-3 w-3' />
                                    <span className={taskIsOverdue ? 'text-red-500 font-medium' : ''}>
                                      {isToday(new Date(task.dueDate))
                                        ? 'Today'
                                        : format(new Date(task.dueDate), 'MMM d, yyyy')}
                                      {' · '}
                                      {format(new Date(task.dueDate), 'h:mm a')}
                                      {' · '}
                                      {formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })}
                                    </span>
                                  </div>

                                  <div className='flex items-center space-x-1'>
                                    <User className='h-3 w-3' />
                                    <span>{assigneeName}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Task Actions */}
                              <div className='flex items-center gap-2 flex-wrap sm:flex-nowrap sm:justify-end'>
                                <Badge variant='outline' className={getPriorityColor(task.priority)}>
                                  <Flag className='h-3 w-3 mr-1' />
                                  {task.priority}
                                </Badge>

                                <Badge variant='outline' className={getStatusColor(task.status)}>
                                  {task.status}
                                </Badge>

                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant='ghost' size='icon' className='h-8 w-8'>
                                      <MoreHorizontal className='h-4 w-4' />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align='end'>
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem>Edit Task</DropdownMenuItem>
                                    <DropdownMenuItem>Duplicate</DropdownMenuItem>
                                    <DropdownMenuItem>View Lead</DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className='text-destructive'>
                                      Delete Task
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>

                            {/* Assigned User */}
                            <div className='flex items-center space-x-2 mt-3 pt-3 border-t border-border'>
                              <Avatar className='h-6 w-6'>
                                {assigneeAvatar ? (
                                  <AvatarImage src={assigneeAvatar} />
                                ) : (
                                  <AvatarFallback className='text-xs'>{assigneeInitials}</AvatarFallback>
                                )}
                              </Avatar>
                              <span className='text-sm text-muted-foreground'>Assigned to {assigneeName}</span>
                              {assignee?.role && (
                                <Badge variant='outline' className='text-xs'>
                                  {assignee.role}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TasksPage;
