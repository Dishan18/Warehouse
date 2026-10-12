import axiosInstance from './axios'
import type { Category, CategoryRequest, Page } from '../types'

export interface CategoryQuery {
  page?: number
  size?: number
  sortBy?: string
  direction?: string
  search?: string
}

export const categoryApi = {
  getAll: (params: CategoryQuery) =>
    axiosInstance.get<Page<Category>>('/categories', { params }).then((r) => r.data),

  getById: (id: string) =>
    axiosInstance.get<Category>(`/categories/${id}`).then((r) => r.data),

  create: (data: CategoryRequest) =>
    axiosInstance.post<Category>('/categories', data).then((r) => r.data),

  update: (id: string, data: CategoryRequest) =>
    axiosInstance.put<Category>(`/categories/${id}`, data).then((r) => r.data),

  delete: (id: string) => axiosInstance.delete<void>(`/categories/${id}`),
}
