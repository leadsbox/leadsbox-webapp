import client from './client';
import { endpoints } from './config';
import type {
  Template,
  TemplateCategory,
  TemplateStatus,
  TemplatePlaceholder,
} from '@/types';

// Template API types (these should ideally be defined in @/types)
type TemplateListFilters = {
  search?: string;
  category?: TemplateCategory;
  status?: TemplateStatus;
  language?: string;
};

type TemplateDetail = Template & {
  versions?: unknown[];
  reviews?: unknown[];
  audits?: unknown[];
};

type TemplateListResponse = Template[];

type TemplatePayload = {
  name: string;
  category: TemplateCategory;
  language?: string;
  header?: string | null;
  body: string;
  footer?: string | null;
  buttons?: unknown;
  placeholders: TemplatePlaceholder[];
  sampleValues?: Record<string, string>;
  notes?: string | null;
};

type TemplateSendTestPayload = {
  phoneNumber: string;
  variables?: Record<string, string>;
};

type TemplateSummary = Template;

type TemplateUpdatePayload = Partial<Omit<TemplatePayload, 'name' | 'category'>>;

const buildQueryString = (filters?: TemplateListFilters) => {
  if (!filters) return '';
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.category) params.set('category', filters.category);
  if (filters.status) params.set('status', filters.status);
  if (filters.language) params.set('language', filters.language);
  const query = params.toString();
  return query ? `?${query}` : '';
};

export const templateApi = {
  list(filters?: TemplateListFilters) {
    return client
      .get(endpoints.templates.list + buildQueryString(filters))
      .then((res) => res?.data?.data as TemplateListResponse | undefined);
  },
  detail(id: string) {
    return client
      .get(endpoints.templates.detail(id))
      .then((res) => res?.data?.data as TemplateDetail | undefined);
  },
  create(payload: TemplatePayload) {
    return client
      .post(endpoints.templates.create, payload)
      .then((res) => res?.data?.data as TemplateDetail | TemplateSummary | undefined);
  },
  update(id: string, payload: TemplateUpdatePayload) {
    return client
      .put(endpoints.templates.update(id), payload)
      .then((res) => res?.data?.data as TemplateDetail | undefined);
  },
  submit(id: string) {
    return client
      .post(endpoints.templates.submit(id))
      .then((res) => res?.data?.data as TemplateDetail | undefined);
  },
  resubmit(id: string) {
    return client
      .post(endpoints.templates.resubmit(id))
      .then((res) => res?.data?.data as TemplateDetail | undefined);
  },
  deprecate(id: string) {
    return client
      .post(endpoints.templates.deprecate(id))
      .then((res) => res?.data?.data as TemplateDetail | undefined);
  },
  remove(id: string) {
    return client.delete(endpoints.templates.remove(id));
  },
  bulkRemove(ids: string[]) {
    return client.post(endpoints.templates.bulkRemove, { ids });
  },
  sendTest(id: string, payload: TemplateSendTestPayload) {
    return client.post(endpoints.templates.sendTest(id), payload);
  },
  refresh(id: string) {
    return client
      .post(endpoints.templates.refresh(id))
      .then((res) => res?.data?.data as TemplateDetail | undefined);
  },
};

export default templateApi;
