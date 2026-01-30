import { InvoiceItem } from '@/features/invoices/invoiceTypes';
import client from './client';

export interface Invoice {
  id: string;
  code: string;
  organizationId: string;
  contactPhone?: string;
  currency: string;
  items: InvoiceItem[];
  subtotal: number;
  total: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  leadId?: string;
  dealId?: string;
  extRef?: string;
  paymentLink?: string;
  metadata?: Record<string, unknown>;
}

export interface InvoiceListResponse {
  data: {
    invoices: Invoice[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface InvoiceResponse {
  data: Invoice;
}

export interface InvoiceListParams {
  page?: number;
  limit?: number;
  status?: string;
  leadId?: string;
}

export const invoiceApi = {
  list: async (params: InvoiceListParams = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.status) query.append('status', params.status);
    if (params.leadId) query.append('leadId', params.leadId);

    const response = await client.get<InvoiceListResponse>(`/invoices?${query.toString()}`);
    return response.data;
  },

  getByCode: async (code: string) => {
    const response = await client.get<InvoiceResponse>(`/invoices/${code}`);
    return response.data;
  },

  create: async (data: Partial<Invoice>) => {
    const response = await client.post<InvoiceResponse>('/invoices', data);
    return response.data;
  },

  update: async (code: string, data: Partial<Invoice>) => {
    const response = await client.patch<InvoiceResponse>(`/invoices/${code}`, data);
    return response.data;
  },

  delete: async (code: string) => {
    const response = await client.delete(`/invoices/${code}`);
    return response.data;
  },
};
