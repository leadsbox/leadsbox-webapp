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
  isManual?: boolean;
  isImported?: boolean;
  reviewStatus?: 'NOT_REQUIRED' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
  reviewedBy?: string;
  reviewedAt?: string;
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
  reviewStatus?: 'NOT_REQUIRED' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
  isAutoDetected?: boolean;
  leadId?: string;
}

export interface UpdateSaleInput {
  items?: SaleItem[];
  currency?: string;
  amount?: number;
  status?: 'PENDING' | 'PAID' | 'PARTIAL' | 'REFUNDED' | 'VOID';
}

export interface QuickCaptureSaleInput {
  leadId: string;
  amount: number;
  currency?: string;
  status?: 'PENDING' | 'PAID' | 'PARTIAL' | 'REFUNDED' | 'VOID';
  note?: string;
}

export interface ReviewInboxResponse {
  data: {
    sales: Sale[];
    summary: {
      pendingCount: number;
      highRiskCount: number;
      averageConfidence: number;
    };
  };
}

type RawSaleItem = {
  name?: unknown;
  quantity?: unknown;
  qty?: unknown;
  unitPrice?: unknown;
  unit_price?: unknown;
  line_total?: unknown;
};

const toFiniteNumber = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeSaleItem = (item: unknown): SaleItem | null => {
  if (!item || typeof item !== 'object') return null;
  const raw = item as RawSaleItem;
  const name = typeof raw.name === 'string' ? raw.name.trim() : '';
  if (!name) return null;

  const quantity =
    toFiniteNumber(raw.quantity) ??
    toFiniteNumber(raw.qty) ??
    1;
  const safeQuantity = quantity > 0 ? quantity : 1;
  const lineTotal = toFiniteNumber(raw.line_total);
  const explicitUnitPrice =
    toFiniteNumber(raw.unitPrice) ??
    toFiniteNumber(raw.unit_price);
  const unitPrice =
    explicitUnitPrice ??
    (lineTotal !== null ? lineTotal / safeQuantity : 0);

  return {
    name,
    quantity: safeQuantity,
    unitPrice: Number.isFinite(unitPrice) ? unitPrice : 0,
  };
};

const normalizeSale = (sale: Sale): Sale => {
  const rawItems = Array.isArray((sale as any)?.items) ? (sale as any).items : [];
  return {
    ...sale,
    items: rawItems
      .map((item: unknown) => normalizeSaleItem(item))
      .filter((item: SaleItem | null): item is SaleItem => Boolean(item)),
  };
};

export const salesApi = {
  /**
   * List all sales for the organization
   */
  list: async (params?: ListSalesParams) => {
    const response = await client.get(endpoints.sales.list, { params });
    const payload = response.data;
    const sales = Array.isArray(payload?.data?.sales)
      ? payload.data.sales.map((sale: Sale) => normalizeSale(sale))
      : [];
    return {
      ...payload,
      data: {
        ...(payload?.data || {}),
        sales,
      },
    };
  },

  /**
   * Get single sale by ID
   */
  getById: async (id: string): Promise<{ data: { sale: Sale } }> => {
    const response = await client.get(endpoints.sales.detail(id));
    const payload = response.data;
    const normalizedSale = payload?.data?.sale
      ? normalizeSale(payload.data.sale as Sale)
      : payload?.data?.sale;
    return {
      ...payload,
      data: {
        ...(payload?.data || {}),
        sale: normalizedSale,
      },
    };
  },

  /**
   * Approve an auto-detected sale
   */
  approve: async (id: string): Promise<{ data: { sale: Sale } }> => {
    const response = await client.post(endpoints.sales.approve(id));
    const payload = response.data;
    const normalizedSale = payload?.data?.sale
      ? normalizeSale(payload.data.sale as Sale)
      : payload?.data?.sale;
    return {
      ...payload,
      data: {
        ...(payload?.data || {}),
        sale: normalizedSale,
      },
    };
  },

  reject: async (
    id: string,
    payload?: { reason?: string }
  ): Promise<{ data: { sale: Sale } }> => {
    const response = await client.post(endpoints.sales.reject(id), payload || {});
    const body = response.data;
    const normalizedSale = body?.data?.sale
      ? normalizeSale(body.data.sale as Sale)
      : body?.data?.sale;
    return {
      ...body,
      data: {
        ...(body?.data || {}),
        sale: normalizedSale,
      },
    };
  },

  reviewInbox: async (limit = 25): Promise<ReviewInboxResponse> => {
    const response = await client.get(endpoints.sales.reviewInbox, {
      params: { limit },
    });
    const payload = response.data;
    const sales = Array.isArray(payload?.data?.sales)
      ? payload.data.sales.map((sale: Sale) => normalizeSale(sale))
      : [];
    return {
      ...payload,
      data: {
        ...(payload?.data || {}),
        sales,
      },
    };
  },

  /**
   * Update sale details
   */
  update: async (id: string, data: UpdateSaleInput): Promise<{ data: { sale: Sale } }> => {
    const response = await client.put(endpoints.sales.update(id), data);
    const payload = response.data;
    const normalizedSale = payload?.data?.sale
      ? normalizeSale(payload.data.sale as Sale)
      : payload?.data?.sale;
    return {
      ...payload,
      data: {
        ...(payload?.data || {}),
        sale: normalizedSale,
      },
    };
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

  /**
   * Create a manual sale
   */
  create: async (data: {
    leadId: string;
    items: SaleItem[];
    currency: string;
    amount: number;
    status: string;
    isManual: boolean;
  }): Promise<{ data: { sale: Sale } }> => {
    const response = await client.post(endpoints.sales.list, data);
    const payload = response.data;
    const normalizedSale = payload?.data?.sale
      ? normalizeSale(payload.data.sale as Sale)
      : payload?.data?.sale;
    return {
      ...payload,
      data: {
        ...(payload?.data || {}),
        sale: normalizedSale,
      },
    };
  },

  quickCapture: async (
    data: QuickCaptureSaleInput
  ): Promise<{ data: { sale: Sale } }> => {
    const response = await client.post(endpoints.sales.quickCapture, data);
    const payload = response.data;
    const normalizedSale = payload?.data?.sale
      ? normalizeSale(payload.data.sale as Sale)
      : payload?.data?.sale;
    return {
      ...payload,
      data: {
        ...(payload?.data || {}),
        sale: normalizedSale,
      },
    };
  },

  /**
   * Import sales from CSV
   */
  importCSV: async (formData: FormData): Promise<{ data: { imported: number } }> => {
    const response = await client.post(`${endpoints.sales.list}/import`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};
