import axios from 'axios';
import { Product, Category, Stats, Customer, Order } from '../types/api';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:2000/api';
const API_KEY = process.env.REACT_APP_API_KEY || 'dev-api-key-123';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'x-api-key': API_KEY,
    'Content-Type': 'application/json',
  },
});

export const statsApi = {
  getOverview: () => api.get<Stats>('/stats/overview'),
};

export const categoriesApi = {
  getAll: () => api.get<{ categories: Category[] }>('/categories'),
  create: (data: Partial<Category>) => api.post<{ category: Category }>('/categories', data),
  update: (id: number, data: Partial<Category>) => api.put<{ category: Category }>(`/categories/${id}`, data),
  delete: (id: number) => api.delete(`/categories/${id}`),
};

export const productsApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string }) => 
    api.get<{ products: Product[]; pagination: any }>('/products', { params }),
  create: (data: Partial<Product>) => api.post<{ product: Product }>('/products', data),
  update: (id: number, data: Partial<Product>) => api.put<{ product: Product }>(`/products/${id}`, data),
  delete: (id: number) => api.delete(`/products/${id}`),
};

export const customersApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string }) => 
    api.get<{ customers: Customer[]; pagination: any }>('/customers', { params }),
  getById: (id: number) => api.get<Customer>(`/customers/${id}`),
  create: (data: Partial<Customer>) => api.post<Customer>('/customers', data),
  update: (id: number, data: Partial<Customer>) => api.put<Customer>(`/customers/${id}`, data),
  delete: (id: number) => api.delete(`/customers/${id}`),
};

export const ordersApi = {
  getAll: (params?: { page?: number; limit?: number; status?: string; customerId?: number }) => 
    api.get<{ orders: Order[]; pagination: any }>('/orders', { params }),
  getById: (id: number) => api.get<Order>(`/orders/${id}`),
  getStats: () => api.get<any>('/orders/stats/overview'),
  create: (data: { customerId: number; items: Array<{ productId: number; quantity: number }> }) => 
    api.post<Order>('/orders', data),
  updateStatus: (id: number, status: string) => api.patch<Order>(`/orders/${id}/status`, { status }),
  delete: (id: number) => api.delete(`/orders/${id}`),
};

export const analyticsApi = {
  getOverview: () => api.get<any>('/analytics/overview'),
  getAll: () => api.get<any>('/analytics/all'),
  getGoogleAds: () => api.get<any>('/analytics/google-ads'),
  getFacebookAds: () => api.get<any>('/analytics/facebook-ads'),
  getSnapchatAds: () => api.get<any>('/analytics/snapchat-ads'),
  getClarity: () => api.get<any>('/analytics/clarity'),
  getMerchantCenter: () => api.get<any>('/analytics/merchant-center'),
};

export const integrationsApi = {
  getAll: () => api.get<any>('/integrations'),
  getById: (id: number) => api.get<any>(`/integrations/${id}`),
  create: (data: any) => api.post<any>('/integrations', data),
  update: (id: number, data: any) => api.put<any>(`/integrations/${id}`, data),
  delete: (id: number) => api.delete(`/integrations/${id}`),
  test: (id: number) => api.post<any>(`/integrations/${id}/test`),
  syncWooCommerce: (id: number) => api.post<any>(`/integrations/${id}/sync/woocommerce/products`),
  syncShopify: (id: number) => api.post<any>(`/integrations/${id}/sync/shopify/products`),
  getLogs: (id: number) => api.get<any>(`/integrations/${id}/logs`),
  getWebhooks: (id: number) => api.get<any>(`/integrations/${id}/webhooks`),
};

export const chatApi = {
  getSessions: () => api.get<any>('/chat/sessions'),
  getMessages: (params?: any) => api.get<any>('/chat/messages', { params }),
  sendMessage: (data: any) => api.post<any>('/chat/messages', data),
  markAsRead: (sessionId: string) => api.post<any>(`/chat/sessions/${sessionId}/read`),
  getUnread: () => api.get<any>('/chat/unread'),
  sync: () => api.post<any>('/chat/sync'),
};

export const emailMarketingApi = {
  getAll: () => api.get<any>('/email-marketing'),
  getById: (id: number) => api.get<any>(`/email-marketing/${id}`),
  create: (data: any) => api.post<any>('/email-marketing', data),
  update: (id: number, data: any) => api.put<any>(`/email-marketing/${id}`, data),
  delete: (id: number) => api.delete(`/email-marketing/${id}`),
  send: (id: number) => api.post<any>(`/email-marketing/${id}/send`),
  getStats: (id: number) => api.get<any>(`/email-marketing/${id}/stats`),
  syncMailchimp: () => api.post<any>('/email-marketing/sync/mailchimp'),
};

export default api;



