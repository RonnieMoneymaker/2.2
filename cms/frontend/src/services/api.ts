import axios from 'axios';
import { Product, Category, Stats } from '../types/api';

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

export default api;

