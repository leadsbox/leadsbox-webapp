// API Configuration for LeadsBox Dashboard

export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3010/api';

export const ORG_HEADER = 'x-org-id';

// API Endpoints
export const endpoints = {
  // Auth
  login: '/auth/login',
  register: '/auth/register',
  refresh: '/auth/refresh',
  logout: '/auth/logout',
  me: '/auth/me',
  verifyEmailByToken: (token: string) => `/auth/verify-email/${token}`,
  resendVerification: '/auth/resend-verification',
  checkUsername: '/auth/check-username',
  forgotPassword: '/auth/forgot-password',
  resetPassword: '/auth/reset-password',

  // Orgs (backend path is /orgs)
  orgs: '/orgs',
  orgMembers: (orgId: string) => `/orgs/${orgId}/members`,

  // OAuth & Social Auth
  google: {
    login: '/auth/google',
    callback: '/auth/google/callback',
  },

  // User & Organization (legacy keys kept for compatibility)
  profile: '/user/profile', // not used by this backend; left for compat
  organization: '/organization', // use endpoints.orgs instead
  members: '/organization/members',
  orgInvite: (orgId: string) => `/orgs/${orgId}/invitations`,
  orgInvitePreview: (token: string) => `/orgs/invitations/${token}`,
  orgInviteAccept: (token: string) => `/orgs/invitations/${token}/accept`,

  // Leads
  leads: '/leads',
  lead: (id: string) => `/leads/${id}`,
  updateLead: (id: string) => `/leads/${id}`,
  deleteLead: (id: string) => `/leads/${id}`,
  archiveLead: (id: string) => `/leads/${id}/archive`,
  moveLead: (id: string) => `/leads/${id}/move`,

  // Contacts (central contact management)
  contacts: '/contacts',
  contact: (id: string) => `/contacts/${id}`,

  // Threads & Messages
  threads: '/threads',
  thread: (id: string) => `/threads/${id}`,
  threadMessages: (threadId: string) => `/threads/${threadId}/messages`,
  threadReply: (threadId: string) => `/threads/${threadId}/reply`,
  threadStart: '/threads/start',

  // Tasks
  tasks: '/tasks',
  task: (id: string) => `/tasks/${id}`,

  // Pipeline
  pipeline: '/pipeline',

  // Settings
  settings: '/settings',
  notifications: '/settings/notifications',
  integrations: '/settings/integrations',

  // Integrations
  whatsapp: {
    connect: '/integrations/whatsapp/connect',
    disconnect: '/integrations/whatsapp/disconnect',
    status: '/integrations/whatsapp/status',
  },
  telegram: {
    connect: '/integrations/telegram/connect',
    disconnect: '/integrations/telegram/disconnect',
    status: '/integrations/telegram/status',
  },

  // Tags & Templates
  tags: '/tags',
  templates: '/templates',
  templateStatus: (id: string) => `/templates/status/${id}`,
  submitTemplate: '/templates/submit-for-approval',
  followups: '/followups',
  followupConversation: (conversationId: string) => `/followups/conversation/${conversationId}`,
  followup: (id: string) => `/followups/${id}`,
  followupCancel: (id: string) => `/followups/${id}/cancel`,
} as const;

// HTTP Methods
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
} as const;

// Request headers
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
} as const;

// API Status Codes
export const STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
} as const;

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network connection failed. Please check your internet connection.',
  UNAUTHORIZED: 'Your session has expired. Please sign in again.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'An unexpected error occurred. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
} as const;

// Cache keys
export const CACHE_KEYS = {
  user: 'auth_user',
  token: 'auth_token',
  refreshToken: 'auth_refresh_token',
  organization: 'current_organization',
  preferences: 'user_preferences',
} as const;

// WebSocket events
export const WS_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  NEW_MESSAGE: 'new_message',
  MESSAGE_READ: 'message_read',
  LEAD_UPDATED: 'lead_updated',
  TASK_UPDATED: 'task_updated',
  THREAD_UPDATED: 'thread_updated',
  USER_TYPING: 'user_typing',
  USER_ONLINE: 'user_online',
  USER_OFFLINE: 'user_offline',
} as const;
