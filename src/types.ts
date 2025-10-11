// Message Template and Follow-up Rule types for automations
export type TemplateCategory = 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
export type TemplateStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';

export interface Template {
  id: string;
  name: string;
  body: string;
  variables: string[];
  category: TemplateCategory;
  status: TemplateStatus;
  language?: string;
  providerTemplateId?: string | null;
  submittedAt?: string | null;
  approvedAt?: string | null;
  rejectionReason?: string | null;
  updatedAt?: string;
}

export type FollowUpStatus = 'SCHEDULED' | 'SENT' | 'CANCELLED' | 'FAILED';

export interface FollowUpRule {
  id: string;
  conversationId: string;
  provider: string;
  scheduledTime: string;
  status: FollowUpStatus;
  message?: string;
  userId: string;
  organizationId: string;
  leadId?: string;
  templateId?: string | null;
  variables?: Record<string, string> | null;
  template?: Template;
  createdAt?: string;
  updatedAt?: string;
}
// LeadsBox Dashboard Types

export interface User {
  id: string;
  username: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  orgId?: string;
  profileImage?: string;
  avatar?: string;
  role: 'OWNER' | 'MANAGER' | 'AGENT' | 'ADMIN' | 'MEMBER';
  createdAt: string;
  updatedAt: string;
  emailVerified?: boolean;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  source: 'whatsapp' | 'telegram' | 'instagram' | 'website' | 'manual';
  stage: Stage;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  tags: string[];
  assignedTo?: string;
  value?: number;
  notes?: string;
  noteHistory?: LeadNote[];
  createdAt: string;
  updatedAt: string;
  lastActivity?: string;
  // Backend relationship fields
  conversationId?: string;
  providerId?: string;
  contactId?: string; // References Contact.id
  threadId?: string; // References Thread.id
  from?: string;
  label?: LeadLabel;
}

export interface Thread {
  id: string;
  leadId: string;
  lead: Lead;
  channel: 'whatsapp' | 'telegram' | 'instagram' | 'sms' | 'email';
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

export interface LeadNote {
  id: string;
  note: string;
  createdAt: string;
  author?: Pick<User, 'id' | 'email' | 'firstName' | 'lastName' | 'username' | 'profileImage'>;
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

export type Stage =
  | 'NEW_LEAD'
  | 'ENGAGED'
  | 'TRANSACTION_SUCCESSFUL'
  | 'PAYMENT_PENDING'
  | 'TRANSACTION_IN_PROGRESS'
  | 'CLOSED_LOST_TRANSACTION'
  | 'PRICING_INQUIRY'
  | 'DEMO_REQUEST'
  | 'NEW_INQUIRY'
  | 'TECHNICAL_SUPPORT'
  | 'FOLLOW_UP_REQUIRED'
  | 'PARTNERSHIP_OPPORTUNITY'
  | 'FEEDBACK'
  | 'NOT_A_LEAD'
  // Legacy support
  | 'NEW'
  | 'QUALIFIED'
  | 'IN_PROGRESS'
  | 'WON'
  | 'LOST';

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
  getAllLabelOptions: () =>
    LEAD_LABELS.map((label) => ({
      value: label,
      label: LEAD_LABEL_DISPLAY_MAP[label],
    })),

  // Check if a label is valid
  isValidLabel: (label: string): label is LeadLabel => LEAD_LABELS.includes(label as LeadLabel),

  // Get label color based on type (for UI styling)
  getLabelColor: (label: LeadLabel): string => {
    switch (label) {
      case 'NEW_LEAD':
        return 'blue';
      case 'TRANSACTION_SUCCESSFUL':
        return 'emerald';
      case 'CLOSED_LOST_TRANSACTION':
        return 'red';
      case 'PAYMENT_PENDING':
        return 'amber';
      case 'TRANSACTION_IN_PROGRESS':
        return 'orange';
      case 'FOLLOW_UP_REQUIRED':
        return 'violet';
      case 'NEW_INQUIRY':
        return 'cyan';
      case 'DEMO_REQUEST':
        return 'indigo';
      case 'TECHNICAL_SUPPORT':
        return 'rose';
      case 'PRICING_INQUIRY':
        return 'lime';
      case 'PARTNERSHIP_OPPORTUNITY':
        return 'pink';
      case 'FEEDBACK':
        return 'teal';
      case 'ENGAGED':
        return 'sky';
      case 'NOT_A_LEAD':
        return 'gray';
      default:
        return 'slate';
    }
  },

  // Get comprehensive styling for lead labels with proper outlines and backgrounds
  getLabelStyling: (label: LeadLabel): string => {
    const color = leadLabelUtils.getLabelColor(label);
    return `bg-${color}-50 text-${color}-700 border border-${color}-200 ring-1 ring-${color}-200/50 hover:bg-${color}-100 hover:border-${color}-300`;
  },
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
export type OrganizationSummary = {
  id: string;
  name: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
};

export interface AuthUser extends User {
  orgId?: string | null;
  currentOrgId?: string | null;
  organizations?: OrganizationSummary[];
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  organizationName?: string;
  inviteToken?: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
  refreshToken: string;
}
