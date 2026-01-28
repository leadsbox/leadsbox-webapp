import client from './client';

export interface Invoice {
  id: string;
  code: string;
  organizationId: string;
  contactPhone?: string;
  currency: string;
  items: unknown[];
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

export const invoiceApi = {
  list: async (page = 1, limit = 20, status?: string) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (status) {
      params.append('status', status);
    }

    const response = await client.get<InvoiceListResponse>(`/invoices?${params.toString()}`);
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
