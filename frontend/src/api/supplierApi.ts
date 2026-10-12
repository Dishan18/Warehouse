import axiosInstance from './axios'
import type { Page, Supplier, SupplierRequest } from '../types'

export interface SupplierQuery {
  page?: number
  size?: number
  sortBy?: string
  direction?: string
  search?: string
}

export const supplierApi = {
  getAll: (params: SupplierQuery) =>
    axiosInstance.get<Page<Supplier>>('/suppliers', { params }).then((r) => r.data),

  getById: (id: string) =>
    axiosInstance.get<Supplier>(`/suppliers/${id}`).then((r) => r.data),

  create: (data: SupplierRequest) =>
    axiosInstance.post<Supplier>('/suppliers', data).then((r) => r.data),

  update: (id: string, data: SupplierRequest) =>
    axiosInstance.put<Supplier>(`/suppliers/${id}`, data).then((r) => r.data),

  delete: (id: string) => axiosInstance.delete<void>(`/suppliers/${id}`),
}
