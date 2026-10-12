import axiosInstance from './axios'
import type { Page, Product, ProductRequest, ProductStatus } from '../types'

export interface ProductQuery {
  page?: number
  size?: number
  sortBy?: string
  direction?: string
  search?: string
  categoryId?: string
  status?: ProductStatus
  active?: boolean
}

export const productApi = {
  getAll: (params: ProductQuery) =>
    axiosInstance.get<Page<Product>>('/products', { params }).then((r) => r.data),

  getById: (id: string) =>
    axiosInstance.get<Product>(`/products/${id}`).then((r) => r.data),

  create: (data: ProductRequest) =>
    axiosInstance.post<Product>('/products', data).then((r) => r.data),

  update: (id: string, data: ProductRequest) =>
    axiosInstance.put<Product>(`/products/${id}`, data).then((r) => r.data),

  delete: (id: string) => axiosInstance.delete<void>(`/products/${id}`),
}
