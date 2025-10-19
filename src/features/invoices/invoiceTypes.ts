export type InvoiceItem = {
  name: string;
  qty: number;
  unitPrice: number;
};

export type InvoiceSummary = {
  id: string;
  code: string;
  status: string;
  contactPhone?: string | null;
  currency: string;
  subtotal: number;
  total: number;
  createdAt: string;
  updatedAt: string;
  totalPaid: number;
  outstanding: number;
  isPaid: boolean;
  receiptCount: number;
  lastReceiptAt: string | null;
  items: InvoiceItem[];
};

export type InvoiceCollection = {
  items: InvoiceSummary[];
  summary: {
    totalInvoices: number;
    totalAmount: number;
    totalSubtotal: number;
    byStatus: Record<string, number>;
  };
};

export type InvoiceDetailResponse = {
  invoice: InvoiceSummary & {
    organization?: { name?: string | null };
    receipts?: Array<{
      id: string;
      receiptNumber: string;
      createdAt: string;
      amount: number;
      status?: string | null;
    }>;
  };
  bank: {
    bankName?: string;
    accountName?: string;
    accountNumber?: string;
  } | null;
  html?: string;
};

export type ReceiptInfo = {
  id: string;
  number: string;
  url: string;
  apiUrl?: string;
};

export const statusTone: Record<string, { label: string; badgeClass: string }> = {
  PAID: {
    label: 'Paid',
    badgeClass: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300',
  },
  SENT: {
    label: 'Sent',
    badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-300',
  },
  PARTIAL: {
    label: 'Partial',
    badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-300',
  },
  PENDING: {
    label: 'Pending',
    badgeClass: 'bg-slate-500/10 text-slate-600 dark:text-slate-200',
  },
  DEFAULT: {
    label: 'Unknown',
    badgeClass: 'bg-muted text-muted-foreground',
  },
};

export const formatCurrency = (amount: number, currency: string) => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'NGN',
      maximumFractionDigits: 2,
    }).format(amount ?? 0);
  } catch {
    return `${currency || 'NGN'} ${amount?.toFixed(2) ?? '0.00'}`;
  }
};

export const parseItems = (items?: unknown): InvoiceItem[] => {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => ({
      name: typeof (item as InvoiceItem)?.name === 'string' ? (item as InvoiceItem).name : '',
      qty: Number((item as InvoiceItem)?.qty) || 0,
      unitPrice: Number((item as InvoiceItem)?.unitPrice) || 0,
    }))
    .filter((item) => item.name && item.qty > 0);
};
