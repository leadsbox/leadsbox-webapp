import client from './client';
import { Product } from './products';

export interface CatalogItem {
  id: string;
  catalogId: string;
  productId: string;
  displayOrder: number;
  product: Product;
  createdAt: string;
}

export interface Catalog {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  isActive: boolean;
  isPublic: boolean;
  shareLink?: string;
  createdAt: string;
  updatedAt: string;
  items: CatalogItem[];
}

export interface CatalogListResponse {
  success: boolean;
  message: string;
  data: {
    catalogs: Catalog[];
  };
}

export interface CatalogResponse {
  success: boolean;
  message: string;
  data: {
    catalog: Catalog;
  };
}

export interface ShareLinkResponse {
  success: boolean;
  message: string;
  data: {
    catalog: Catalog;
    shareUrl: string;
  };
}

export interface AddProductsResponse {
  success: boolean;
  message: string;
  data: {
    count: number;
  };
}

export const catalogsApi = {
  list: async () => {
    const response = await client.get<CatalogListResponse>('/catalogs');
    return response.data;
  },

  create: async (data: { name: string; description?: string; isActive?: boolean; isPublic?: boolean; productIds?: string[] }) => {
    const response = await client.post<CatalogResponse>('/catalogs', data);
    return response.data;
  },

  get: async (id: string) => {
    const response = await client.get<CatalogResponse>(`/catalogs/${id}`);
    return response.data;
  },

  update: async (id: string, data: Partial<Catalog>) => {
    const response = await client.put<CatalogResponse>(`/catalogs/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await client.delete(`/catalogs/${id}`);
    return response.data;
  },

  addProducts: async (id: string, productIds: string[]) => {
    const response = await client.post<AddProductsResponse>(`/catalogs/${id}/products`, { productIds });
    return response.data;
  },

  removeProduct: async (id: string, productId: string) => {
    const response = await client.delete(`/catalogs/${id}/products/${productId}`);
    return response.data;
  },

  reorder: async (id: string, itemOrders: Array<{ itemId: string; displayOrder: number }>) => {
    const response = await client.put(`/catalogs/${id}/reorder`, { itemOrders });
    return response.data;
  },

  generateShareLink: async (id: string) => {
    const response = await client.post<ShareLinkResponse>(`/catalogs/${id}/share`);
    return response.data;
  },

  revokeShareLink: async (id: string) => {
    const response = await client.delete<CatalogResponse>(`/catalogs/${id}/share`);
    return response.data;
  },
};
