import client from './client';
import { Product } from './products';

export type QuoteStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'CONVERTED';

export interface QuoteItem {
  id?: string;
  quoteId?: string;
  productId?: string;
  name: string;
  description?: string;
  qty: number;
  unitPrice: number;
  subtotal?: number;
  product?: Product;
}

export interface Quote {
  id: string;
  organizationId: string;
  leadId?: string;
  contactId?: string;
  code: string;
  currency: string;
  subtotal: number;
  discount: number;
  taxRate: number;
  total: number;
  validUntil?: string;
  status: QuoteStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  items: QuoteItem[];
  lead?: { id: string; contactId: string | null };
  contact?: { id: string; displayName: string | null; phone: string | null };
}

export interface QuoteListResponse {
  success: boolean;
  message: string;
  data: {
    quotes: Quote[];
  };
}

export interface QuoteResponse {
  success: boolean;
  message: string;
  data: {
    quote: Quote;
  };
}

export interface ConvertToInvoiceResponse {
  success: boolean;
  message: string;
  data: {
    invoice: any; // Use your invoice type here
  };
}

export const quotesApi = {
  list: async (params?: { status?: string }) => {
    const response = await client.get<QuoteListResponse>('/quotes', { params });
    return response.data;
  },

  create: async (data: {
    leadId?: string;
    contactId?: string;
    currency?: string;
    discount?: number;
    taxRate?: number;
    validUntil?: string;
    notes?: string;
    items: QuoteItem[];
  }) => {
    const response = await client.post<QuoteResponse>('/quotes', data);
    return response.data;
  },

  getByCode: async (code: string) => {
    const response = await client.get<QuoteResponse>(`/quotes/${code}`);
    return response.data;
  },

  update: async (id: string, data: Partial<Quote>) => {
    const response = await client.put<QuoteResponse>(`/quotes/${id}`, data);
    return response.data;
  },

  updateStatus: async (id: string, status: QuoteStatus) => {
    const response = await client.put<QuoteResponse>(`/quotes/${id}/status`, { status });
    return response.data;
  },

  convertToInvoice: async (id: string) => {
    const response = await client.post<ConvertToInvoiceResponse>(`/quotes/${id}/convert`);
    return response.data;
  },
};
