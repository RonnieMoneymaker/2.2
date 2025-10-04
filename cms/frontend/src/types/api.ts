export interface Product {
  id: number;
  name: string;
  slug: string;
  sku?: string;
  description?: string;
  priceCents: number;
  currency: string;
  stockQuantity: number;
  categoryId?: number;
  images?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  parentId?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Stats {
  products: number;
  categories: number;
  customers: number;
  orders: number;
  salesOverTime: Array<{
    date: string;
    totalCents: number;
  }>;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

