import client from './client';
import { endpoints } from './config';

export interface SaleItem {
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface Sale {
  id: string;
  organizationId: string;
  leadId: string;
  amount: number;
  currency: string;
  items: SaleItem[];
  status: 'PENDING' | 'PAID' | 'PARTIAL' | 'REFUNDED' | 'VOID';
  isAutoDetected: boolean;
  detectionConfidence?: number;
  detectionReasoning?: string;
  detectionMetadata?: {
    messageId?: string;
    detectedAt?: string;
    conversationHistory?: string[];
    deliveryAddress?: string;
  };
  approvedBy?: string;
  approvedAt?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
  lead?: {
    id: string;
    contact?: {
      id: string;
      displayName?: string;
      phone?: string;
      waId?: string;
    };
    thread?: {
      id: string;
    };
  };
}

export interface ListSalesParams {
  status?: 'PENDING' | 'PAID' | 'PARTIAL' | 'REFUNDED' | 'VOID';
  isAutoDetected?: boolean;
  leadId?: string;
}

export interface UpdateSaleInput {
  items?: SaleItem[];
  currency?: string;
  amount?: number;
  status?: 'PENDING' | 'PAID' | 'PARTIAL' | 'REFUNDED' | 'VOID';
}

export const salesApi = {
  /**
   * List all sales for the organization
   */
  list: async (params?: ListSalesParams) => {
    const response = await client.get(endpoints.sales.list, { params });
    return response.data;
  },

  /**
   * Get single sale by ID
   */
  getById: async (id: string): Promise<{ data: { sale: Sale } }> => {
    const response = await client.get(endpoints.sales.detail(id));
    return response.data;
  },

  /**
   * Approve an auto-detected sale
   */
  approve: async (id: string): Promise<{ data: { sale: Sale } }> => {
    const response = await client.post(endpoints.sales.approve(id));
    return response.data;
  },

  /**
   * Update sale details
   */
  update: async (id: string, data: UpdateSaleInput): Promise<{ data: { sale: Sale } }> => {
    const response = await client.put(endpoints.sales.update(id), data);
    return response.data;
  },

  /**
   * Delete a sale
   */
  delete: async (id: string): Promise<void> => {
    await client.delete(endpoints.sales.remove(id));
  },

  /**
   * Get count of pending auto-detected sales
   */
  getPendingCount: async (): Promise<{ data: { count: number } }> => {
    const response = await client.get(endpoints.sales.pendingCount);
    return response.data;
  },
};
