import client from './client';

export interface Product {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  sku?: string;
  category?: string;
  unitPrice: number;
  currency: string;
  imageUrl?: string;
  inStock: boolean;
  stockQuantity?: number;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface ProductListResponse {
  success: boolean;
  message: string;
  data: {
    products: Product[];
  };
}

export interface ProductResponse {
  success: boolean;
  message: string;
  data: {
    product: Product;
  };
}

export interface BulkProductResponse {
  success: boolean;
  message: string;
  data: {
    count: number;
  };
}

export interface CategoriesResponse {
  success: boolean;
  message: string;
  data: {
    categories: string[];
  };
}

export const productsApi = {
  list: async (params?: { category?: string; inStock?: boolean; search?: string }) => {
    const response = await client.get<ProductListResponse>('/products', { params });
    return response.data;
  },

  create: async (data: Partial<Product>) => {
    const response = await client.post<ProductResponse>('/products', data);
    return response.data;
  },

  get: async (id: string) => {
    const response = await client.get<ProductResponse>(`/products/${id}`);
    return response.data;
  },

  update: async (id: string, data: Partial<Product>) => {
    const response = await client.put<ProductResponse>(`/products/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await client.delete(`/products/${id}`);
    return response.data;
  },

  bulk: async (products: Partial<Product>[]) => {
    const response = await client.post<BulkProductResponse>('/products/bulk', { products });
    return response.data;
  },

  categories: async () => {
    const response = await client.get<CategoriesResponse>('/products/categories/list');
    return response.data;
  },
};
