// LeadsBox Dashboard Types

export interface User {
  id: string;
  username: string;
  name?: string;
  email: string;
  orgId?: string;
  profileImage?: string;
  avatar?: string;
  role: 'OWNER' | 'MANAGER' | 'AGENT';
  createdAt: string;
  updatedAt: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  source: 'whatsapp' | 'telegram' | 'website' | 'manual';
  stage: Stage;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  tags: string[];
  assignedTo?: string;
  value?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  lastActivity?: string;
  // Backend relationship fields
  conversationId?: string;
  providerId?: string;
  contactId?: string; // References Contact.id
  threadId?: string; // References Thread.id
  from?: string;
}

export interface Thread {
  id: string;
  leadId: string;
  lead: Lead;
  channel: 'whatsapp' | 'telegram' | 'sms' | 'email';
  status: 'OPEN' | 'CLOSED' | 'PENDING';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  isUnread: boolean;
  lastMessage?: Message;
  assignedTo?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  threadId: string;
  content: string;
  type: 'TEXT' | 'IMAGE' | 'FILE' | 'AUDIO' | 'VIDEO';
  sender: 'LEAD' | 'AGENT' | 'SYSTEM';
  senderId?: string;
  attachments?: Attachment[];
  metadata?: Record<string, string>;
  createdAt: string;
  isRead: boolean;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  type: 'FOLLOW_UP' | 'CALL' | 'EMAIL' | 'MEETING' | 'OTHER';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  assignedTo: string;
  leadId?: string;
  threadId?: string;
  dueDate: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type Stage = 'NEW' | 'QUALIFIED' | 'IN_PROGRESS' | 'WON' | 'LOST';

// Available lead labels from backend
export const LEAD_LABELS = [
  'NEW_LEAD',
  'CLOSED_LOST_TRANSACTION',
  'TRANSACTION_SUCCESSFUL',
  'PAYMENT_PENDING',
  'TRANSACTION_IN_PROGRESS',
  'FOLLOW_UP_REQUIRED',
  'NEW_INQUIRY',
  'DEMO_REQUEST',
  'TECHNICAL_SUPPORT',
  'PRICING_INQUIRY',
  'PARTNERSHIP_OPPORTUNITY',
  'FEEDBACK',
  'ENGAGED',
  'NOT_A_LEAD',
] as const;

export type LeadLabel = (typeof LEAD_LABELS)[number];

// Lead label utilities
export const LEAD_LABEL_DISPLAY_MAP: Record<LeadLabel, string> = {
  NEW_LEAD: 'New Lead',
  CLOSED_LOST_TRANSACTION: 'Closed/Lost Transaction',
  TRANSACTION_SUCCESSFUL: 'Transaction Successful',
  PAYMENT_PENDING: 'Payment Pending',
  TRANSACTION_IN_PROGRESS: 'Transaction in Progress',
  FOLLOW_UP_REQUIRED: 'Follow-Up Required',
  NEW_INQUIRY: 'New Inquiry',
  DEMO_REQUEST: 'Demo Request',
  TECHNICAL_SUPPORT: 'Technical Support',
  PRICING_INQUIRY: 'Pricing Inquiry',
  PARTNERSHIP_OPPORTUNITY: 'Partnership Opportunity',
  FEEDBACK: 'Feedback',
  ENGAGED: 'Engaged',
  NOT_A_LEAD: 'Not a Lead',
};

// Utility functions for lead labels
export const leadLabelUtils = {
  // Convert backend enum key to display string
  getDisplayName: (label: LeadLabel): string => LEAD_LABEL_DISPLAY_MAP[label] || label,
  
  // Get all available labels as options for dropdowns
  getAllLabelOptions: () => LEAD_LABELS.map(label => ({
    value: label,
    label: LEAD_LABEL_DISPLAY_MAP[label],
  })),
  
  // Check if a label is valid
  isValidLabel: (label: string): label is LeadLabel => LEAD_LABELS.includes(label as LeadLabel),
  
  // Get label color based on type (for UI styling)
  getLabelColor: (label: LeadLabel): string => {
    switch (label) {
      case 'NEW_LEAD': return 'blue';
      case 'TRANSACTION_SUCCESSFUL': return 'green';
      case 'CLOSED_LOST_TRANSACTION': return 'red';
      case 'PAYMENT_PENDING': return 'yellow';
      case 'TRANSACTION_IN_PROGRESS': return 'orange';
      case 'FOLLOW_UP_REQUIRED': return 'purple';
      case 'ENGAGED': return 'teal';
      case 'NOT_A_LEAD': return 'gray';
      default: return 'slate';
    }
  }
};

export interface Pipeline {
  stages: {
    [K in Stage]: {
      name: string;
      color: string;
      leads: Lead[];
    };
  };
}

export interface Analytics {
  overview: {
    totalLeads: number;
    activeThreads: number;
    conversionRate: number;
    avgResponseTime: number;
  };
  trends: {
    leadsOverTime: ChartDataPoint[];
    conversionsByStage: ChartDataPoint[];
    responseTimesTrend: ChartDataPoint[];
  };
  performance: {
    topSources: SourcePerformance[];
    agentPerformance: AgentPerformance[];
    channelDistribution: ChartDataPoint[];
  };
}

export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface SourcePerformance {
  source: string;
  leads: number;
  conversions: number;
  conversionRate: number;
}

export interface AgentPerformance {
  agent: User;
  threadsHandled: number;
  avgResponseTime: number;
  conversions: number;
  rating: number;
}

export interface Organization {
  id: string;
  name: string;
  logo?: string;
  plan: 'STARTER' | 'PRO' | 'ENTERPRISE';
  settings: {
    timezone: string;
    language: string;
    currency: string;
    notifications: NotificationSettings;
    integrations: IntegrationSettings;
  };
}

export interface NotificationSettings {
  email: {
    newLeads: boolean;
    taskReminders: boolean;
    systemUpdates: boolean;
  };
  push: {
    newMessages: boolean;
    taskDeadlines: boolean;
    leadUpdates: boolean;
  };
}

export interface IntegrationSettings {
  whatsapp: {
    enabled: boolean;
    webhook?: string;
    token?: string;
  };
  telegram: {
    enabled: boolean;
    botToken?: string;
  };
}

export interface Filter {
  channel?: string[];
  status?: string[];
  priority?: string[];
  assignedTo?: string[];
  tags?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Auth types
export interface AuthUser extends User {
  organizations: Organization[];
  currentOrgId: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  organizationName?: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
  refreshToken: string;
}
