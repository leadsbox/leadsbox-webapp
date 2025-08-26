// Tasks Page Component for LeadsBox Dashboard

import React, { useState } from 'react';
import { 
  CheckSquare, 
  Clock, 
  AlertTriangle, 
  Plus, 
  Filter,
  Search,
  Calendar,
  User,
  Flag,
  MoreHorizontal,
  Phone,
  Mail,
  Users,
  CheckCircle,
  Circle,
  XCircle
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Checkbox } from '../../components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { mockTasks, mockUsers, getOverdueTasks, getTodayTasks, getUpcomingTasks } from '../../data/mockData';
import { Task } from '../../types';
import { formatDistanceToNow, format, isToday, isPast } from 'date-fns';

const TasksPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'overdue' | 'today' | 'upcoming' | 'all'>('overdue');
  
  const overdueTasks = getOverdueTasks();
  const todayTasks = getTodayTasks();
  const upcomingTasks = getUpcomingTasks();
  
  const getFilteredTasks = () => {
    let tasks: Task[] = [];
    
    switch (activeTab) {
      case 'overdue':
        tasks = overdueTasks;
        break;
      case 'today':
        tasks = todayTasks;
        break;
      case 'upcoming':
        tasks = upcomingTasks;
        break;
      default:
        tasks = mockTasks;
    }
    
    return tasks.filter(task => 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const filteredTasks = getFilteredTasks();

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
        return <Phone className="h-4 w-4" />;
      case 'EMAIL':
        return <Mail className="h-4 w-4" />;
      case 'MEETING':
        return <Users className="h-4 w-4" />;
      case 'FOLLOW_UP':
        return <Clock className="h-4 w-4" />;
      default:
        return <CheckSquare className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'IN_PROGRESS':
        return <Circle className="h-4 w-4 text-blue-500" />;
      case 'CANCELLED':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Circle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const isOverdue = (task: Task) => {
    return task.status !== 'COMPLETED' && isPast(new Date(task.dueDate));
  };

  const toggleTaskComplete = (taskId: string) => {
    // In a real app, this would make an API call
    console.log('Toggle task completion:', taskId);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tasks</h1>
          <p className="text-muted-foreground">Manage your tasks and deadlines</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Task
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
              Overdue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{overdueTasks.length}</div>
            <p className="text-xs text-muted-foreground">Need immediate attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Clock className="h-4 w-4 mr-2 text-amber-500" />
              Due Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">{todayTasks.length}</div>
            <p className="text-xs text-muted-foreground">Tasks for today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-blue-500" />
              Upcoming
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{upcomingTasks.length}</div>
            <p className="text-xs text-muted-foreground">Future tasks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <CheckSquare className="h-4 w-4 mr-2 text-green-500" />
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {mockTasks.filter(t => t.status === 'COMPLETED').length}
            </div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </div>

      {/* Task Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList>
          <TabsTrigger value="overdue" className="flex items-center space-x-2">
            <AlertTriangle className="h-3 w-3" />
            <span>Overdue ({overdueTasks.length})</span>
          </TabsTrigger>
          <TabsTrigger value="today" className="flex items-center space-x-2">
            <Clock className="h-3 w-3" />
            <span>Today ({todayTasks.length})</span>
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="flex items-center space-x-2">
            <Calendar className="h-3 w-3" />
            <span>Upcoming ({upcomingTasks.length})</span>
          </TabsTrigger>
          <TabsTrigger value="all" className="flex items-center space-x-2">
            <CheckSquare className="h-3 w-3" />
            <span>All ({mockTasks.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {/* Task List */}
          <Card>
            <CardHeader>
              <CardTitle>Tasks ({filteredTasks.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredTasks.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No tasks found</h3>
                    <p className="text-muted-foreground mb-4">
                      {activeTab === 'overdue' && 'Great! No overdue tasks.'}
                      {activeTab === 'today' && 'No tasks scheduled for today.'}
                      {activeTab === 'upcoming' && 'No upcoming tasks.'}
                      {activeTab === 'all' && 'Try adjusting your search query.'}
                    </p>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Task
                    </Button>
                  </div>
                ) : (
                  filteredTasks.map((task) => {
                    const assignedUser = mockUsers.find(user => user.id === task.assignedTo);
                    const taskIsOverdue = isOverdue(task);
                    
                    return (
                      <div
                        key={task.id}
                        className={`p-4 rounded-lg border transition-colors hover:bg-muted/50 ${
                          taskIsOverdue ? 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20' : 'border-border'
                        }`}
                      >
                        <div className="flex items-start space-x-4">
                          {/* Checkbox */}
                          <div className="mt-1">
                            <Checkbox
                              checked={task.status === 'COMPLETED'}
                              onCheckedChange={() => toggleTaskComplete(task.id)}
                              className="h-5 w-5"
                            />
                          </div>

                          {/* Task Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <h3 className={`font-medium ${
                                    task.status === 'COMPLETED' ? 'line-through text-muted-foreground' : 'text-foreground'
                                  }`}>
                                    {task.title}
                                  </h3>
                                  {getStatusIcon(task.status)}
                                </div>

                                {task.description && (
                                  <p className="text-sm text-muted-foreground mb-2">
                                    {task.description}
                                  </p>
                                )}

                                <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                  <div className="flex items-center space-x-1">
                                    {getTypeIcon(task.type)}
                                    <span className="capitalize">{task.type.replace('_', ' ')}</span>
                                  </div>

                                  <div className="flex items-center space-x-1">
                                    <Calendar className="h-3 w-3" />
                                    <span className={taskIsOverdue ? 'text-red-500 font-medium' : ''}>
                                      {isToday(new Date(task.dueDate)) 
                                        ? 'Today' 
                                        : format(new Date(task.dueDate), 'MMM d, yyyy')
                                      }
                                      {' at '}
                                      {format(new Date(task.dueDate), 'h:mm a')}
                                    </span>
                                  </div>

                                  {assignedUser && (
                                    <div className="flex items-center space-x-1">
                                      <User className="h-3 w-3" />
                                      <span>{assignedUser.name}</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Task Actions */}
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline" className={getPriorityColor(task.priority)}>
                                  <Flag className="h-3 w-3 mr-1" />
                                  {task.priority}
                                </Badge>

                                <Badge variant="outline" className={getStatusColor(task.status)}>
                                  {task.status}
                                </Badge>

                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem>Edit Task</DropdownMenuItem>
                                    <DropdownMenuItem>Duplicate</DropdownMenuItem>
                                    <DropdownMenuItem>View Lead</DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-destructive">
                                      Delete Task
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>

                            {/* Assigned User */}
                            {assignedUser && (
                              <div className="flex items-center space-x-2 mt-3 pt-3 border-t border-border">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={assignedUser.avatar} />
                                  <AvatarFallback className="text-xs">
                                    {assignedUser.name.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm text-muted-foreground">
                                  Assigned to {assignedUser.name}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {assignedUser.role}
                                </Badge>
                              </div>
                            )}
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