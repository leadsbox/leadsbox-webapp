// Mock data for LeadsBox Dashboard development

import { 
  Lead, 
  Thread, 
  Message, 
  Task, 
  User, 
  Analytics, 
  Organization,
  Stage
} from '../types';

// Mock Users
export const mockUsers: User[] = [
  {
    id: '1',
    username: 'johnsmith',
    name: 'John Smith',
    email: 'john@leadsbox.com',
    profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
    role: 'OWNER',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
  },
  {
    id: '2',
    username: 'sarahjohnson',
    name: 'Sarah Johnson',
    email: 'sarah@leadsbox.com',
    profileImage: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
    role: 'MANAGER',
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
  },
  {
    id: '3',
    username: 'mikewilson',
    name: 'Mike Wilson',
    email: 'mike@leadsbox.com',
    profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    role: 'AGENT',
    createdAt: '2024-01-03T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
  },
];

// Mock Organization
export const mockOrganization: Organization = {
  id: 'org1',
  name: 'LeadsBox Demo',
  logo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100&h=100&fit=crop',
  plan: 'PRO',
  settings: {
    timezone: 'UTC',
    language: 'en',
    currency: 'USD',
    notifications: {
      email: {
        newLeads: true,
        taskReminders: true,
        systemUpdates: false,
      },
      push: {
        newMessages: true,
        taskDeadlines: true,
        leadUpdates: true,
      },
    },
    integrations: {
      whatsapp: {
        enabled: true,
        webhook: 'https://api.leadsbox.com/webhooks/whatsapp',
        token: 'wa_token_123',
      },
      telegram: {
        enabled: false,
      },
    },
  },
};

// Mock Leads
export const mockLeads: Lead[] = [
  {
    id: 'lead1',
    name: 'Alex Rodriguez',
    email: 'alex@example.com',
    phone: '+1234567890',
    company: 'Tech Solutions Inc',
    source: 'whatsapp',
    stage: 'NEW',
    priority: 'HIGH',
    tags: ['hot-lead', 'enterprise'],
    assignedTo: '2',
    value: 15000,
    notes: 'Interested in our premium package',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T14:22:00Z',
    lastActivity: '2024-01-15T14:22:00Z',
  },
  {
    id: 'lead2',
    name: 'Emily Chen',
    email: 'emily@startup.co',
    phone: '+1987654321',
    company: 'StartupCo',
    source: 'website',
    stage: 'QUALIFIED',
    priority: 'MEDIUM',
    tags: ['startup', 'demo-requested'],
    assignedTo: '3',
    value: 5000,
    createdAt: '2024-01-14T09:15:00Z',
    updatedAt: '2024-01-15T11:30:00Z',
    lastActivity: '2024-01-15T11:30:00Z',
  },
  {
    id: 'lead3',
    name: 'David Thompson',
    email: 'david@business.com',
    phone: '+1122334455',
    company: 'Business Corp',
    source: 'telegram',
    stage: 'IN_PROGRESS',
    priority: 'HIGH',
    tags: ['negotiation', 'decision-maker'],
    assignedTo: '2',
    value: 25000,
    createdAt: '2024-01-10T15:45:00Z',
    updatedAt: '2024-01-15T16:10:00Z',
    lastActivity: '2024-01-15T16:10:00Z',
  },
  {
    id: 'lead4',
    name: 'Lisa Wang',
    email: 'lisa@agency.com',
    phone: '+1555666777',
    company: 'Creative Agency',
    source: 'whatsapp',
    stage: 'WON',
    priority: 'MEDIUM',
    tags: ['closed-won', 'referral-source'],
    assignedTo: '3',
    value: 8000,
    createdAt: '2024-01-08T12:20:00Z',
    updatedAt: '2024-01-12T17:45:00Z',
    lastActivity: '2024-01-12T17:45:00Z',
  },
  {
    id: 'lead5',
    name: 'Robert Brown',
    email: 'robert@enterprise.net',
    phone: '+1888999000',
    company: 'Enterprise Solutions',
    source: 'manual',
    stage: 'LOST',
    priority: 'LOW',
    tags: ['budget-issues', 'future-opportunity'],
    assignedTo: '2',
    value: 12000,
    createdAt: '2024-01-05T08:10:00Z',
    updatedAt: '2024-01-13T13:25:00Z',
    lastActivity: '2024-01-13T13:25:00Z',
  },
];

// Mock Messages
export const mockMessages: Message[] = [
  {
    id: 'msg1',
    threadId: 'thread1',
    content: 'Hi, I\'m interested in your services. Can you tell me more?',
    type: 'TEXT',
    sender: 'LEAD',
    createdAt: '2024-01-15T10:30:00Z',
    isRead: true,
  },
  {
    id: 'msg2',
    threadId: 'thread1',
    content: 'Hello Alex! Thanks for reaching out. I\'d be happy to help you learn more about our solutions. What specific challenges are you looking to solve?',
    type: 'TEXT',
    sender: 'AGENT',
    senderId: '2',
    createdAt: '2024-01-15T10:32:00Z',
    isRead: true,
  },
  {
    id: 'msg3',
    threadId: 'thread1',
    content: 'We\'re looking to streamline our lead management process. Currently using spreadsheets but it\'s getting unwieldy.',
    type: 'TEXT',
    sender: 'LEAD',
    createdAt: '2024-01-15T14:20:00Z',
    isRead: true,
  },
  {
    id: 'msg4',
    threadId: 'thread1',
    content: 'Perfect! Our platform is designed exactly for that. Let me schedule a demo to show you how we can help automate your lead management.',
    type: 'TEXT',
    sender: 'AGENT',
    senderId: '2',
    createdAt: '2024-01-15T14:22:00Z',
    isRead: false,
  },
];

// Mock Threads
export const mockThreads: Thread[] = [
  {
    id: 'thread1',
    leadId: 'lead1',
    lead: mockLeads[0],
    channel: 'whatsapp',
    status: 'OPEN',
    priority: 'HIGH',
    isUnread: true,
    lastMessage: mockMessages[3],
    assignedTo: '2',
    tags: ['hot-lead', 'demo-scheduled'],
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T14:22:00Z',
  },
  {
    id: 'thread2',
    leadId: 'lead2',
    lead: mockLeads[1],
    channel: 'telegram',
    status: 'PENDING',
    priority: 'MEDIUM',
    isUnread: false,
    assignedTo: '3',
    tags: ['follow-up'],
    createdAt: '2024-01-14T09:15:00Z',
    updatedAt: '2024-01-15T11:30:00Z',
  },
  {
    id: 'thread3',
    leadId: 'lead3',
    lead: mockLeads[2],
    channel: 'whatsapp',
    status: 'CLOSED',
    priority: 'HIGH',
    isUnread: false,
    assignedTo: '2',
    tags: ['negotiation'],
    createdAt: '2024-01-10T15:45:00Z',
    updatedAt: '2024-01-15T16:10:00Z',
  },
];

// Mock Tasks
export const mockTasks: Task[] = [
  {
    id: 'task1',
    title: 'Follow up with Alex Rodriguez',
    description: 'Schedule demo call and send pricing information',
    type: 'CALL',
    priority: 'HIGH',
    status: 'PENDING',
    assignedTo: '2',
    leadId: 'lead1',
    threadId: 'thread1',
    dueDate: '2024-01-16T10:00:00Z',
    createdAt: '2024-01-15T14:25:00Z',
    updatedAt: '2024-01-15T14:25:00Z',
  },
  {
    id: 'task2',
    title: 'Send proposal to Emily Chen',
    description: 'Create custom proposal based on demo feedback',
    type: 'EMAIL',
    priority: 'MEDIUM',
    status: 'IN_PROGRESS',
    assignedTo: '3',
    leadId: 'lead2',
    dueDate: '2024-01-17T15:00:00Z',
    createdAt: '2024-01-14T16:30:00Z',
    updatedAt: '2024-01-15T12:00:00Z',
  },
  {
    id: 'task3',
    title: 'Contract review meeting',
    description: 'Review contract terms with David Thompson',
    type: 'MEETING',
    priority: 'HIGH',
    status: 'COMPLETED',
    assignedTo: '2',
    leadId: 'lead3',
    dueDate: '2024-01-15T14:00:00Z',
    completedAt: '2024-01-15T14:30:00Z',
    createdAt: '2024-01-12T09:00:00Z',
    updatedAt: '2024-01-15T14:30:00Z',
  },
  {
    id: 'task4',
    title: 'Weekly team sync',
    description: 'Review pipeline and discuss upcoming targets',
    type: 'MEETING',
    priority: 'LOW',
    status: 'PENDING',
    assignedTo: '1',
    dueDate: '2024-01-12T09:00:00Z', // Overdue
    createdAt: '2024-01-08T10:00:00Z',
    updatedAt: '2024-01-08T10:00:00Z',
  },
];

// Mock Analytics
export const mockAnalytics: Analytics = {
  overview: {
    totalLeads: 156,
    activeThreads: 23,
    conversionRate: 24.5,
    avgResponseTime: 1.5, // hours
  },
  trends: {
    leadsOverTime: [
      { date: '2024-01-08', value: 12 },
      { date: '2024-01-09', value: 8 },
      { date: '2024-01-10', value: 15 },
      { date: '2024-01-11', value: 18 },
      { date: '2024-01-12', value: 22 },
      { date: '2024-01-13', value: 16 },
      { date: '2024-01-14', value: 25 },
      { date: '2024-01-15', value: 19 },
    ],
    conversionsByStage: [
      { date: 'NEW', value: 45, label: 'New Leads' },
      { date: 'QUALIFIED', value: 28, label: 'Qualified' },
      { date: 'IN_PROGRESS', value: 18, label: 'In Progress' },
      { date: 'WON', value: 12, label: 'Won' },
      { date: 'LOST', value: 8, label: 'Lost' },
    ],
    responseTimesTrend: [
      { date: '2024-01-08', value: 2.1 },
      { date: '2024-01-09', value: 1.8 },
      { date: '2024-01-10', value: 1.5 },
      { date: '2024-01-11', value: 1.2 },
      { date: '2024-01-12', value: 1.4 },
      { date: '2024-01-13', value: 1.6 },
      { date: '2024-01-14', value: 1.3 },
      { date: '2024-01-15', value: 1.1 },
    ],
  },
  performance: {
    topSources: [
      { source: 'WhatsApp', leads: 68, conversions: 18, conversionRate: 26.5 },
      { source: 'Website', leads: 42, conversions: 12, conversionRate: 28.6 },
      { source: 'Telegram', leads: 31, conversions: 6, conversionRate: 19.4 },
      { source: 'Manual', leads: 15, conversions: 4, conversionRate: 26.7 },
    ],
    agentPerformance: [
      {
        agent: mockUsers[1], // Sarah Johnson
        threadsHandled: 45,
        avgResponseTime: 1.2,
        conversions: 12,
        rating: 4.8,
      },
      {
        agent: mockUsers[2], // Mike Wilson
        threadsHandled: 38,
        avgResponseTime: 1.8,
        conversions: 8,
        rating: 4.5,
      },
    ],
    channelDistribution: [
      { date: 'WhatsApp', value: 68, label: 'WhatsApp' },
      { date: 'Website', value: 42, label: 'Website' },
      { date: 'Telegram', value: 31, label: 'Telegram' },
      { date: 'Manual', value: 15, label: 'Manual' },
    ],
  },
};

// Helper functions to get filtered data
export const getLeadsByStage = (stage: Stage): Lead[] => {
  return mockLeads.filter(lead => lead.stage === stage);
};

export const getTasksByStatus = (status: Task['status']): Task[] => {
  return mockTasks.filter(task => task.status === status);
};

export const getOverdueTasks = (): Task[] => {
  const now = new Date();
  return mockTasks.filter(task => 
    task.status !== 'COMPLETED' && 
    new Date(task.dueDate) < now
  );
};

export const getTodayTasks = (): Task[] => {
  const today = new Date().toDateString();
  return mockTasks.filter(task => 
    new Date(task.dueDate).toDateString() === today
  );
};

export const getUpcomingTasks = (): Task[] => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return mockTasks.filter(task => 
    task.status !== 'COMPLETED' && 
    new Date(task.dueDate) > today
  );
};