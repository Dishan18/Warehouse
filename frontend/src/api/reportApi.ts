import axiosInstance from './axios'
import type { MovementType, ProductStatus } from '../types'

export const reportApi = {
  exportProducts: async (params: {
    search?: string
    categoryId?: string
    status?: ProductStatus
  }) => {
    const res = await axiosInstance.get<Blob>('/reports/products', {
      params,
      responseType: 'blob',
    })
    return res.data
  },

  exportMovements: async (params: {
    search?: string
    type?: MovementType
    productId?: string
    from?: string
    to?: string
  }) => {
    const res = await axiosInstance.get<Blob>('/reports/movements', {
      params,
      responseType: 'blob',
    })
    return res.data
  },

  exportInventory: async () => {
    const res = await axiosInstance.get<Blob>('/reports/inventory', {
      responseType: 'blob',
    })
    return res.data
  },
}
