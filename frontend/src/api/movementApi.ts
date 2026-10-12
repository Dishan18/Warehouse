import axiosInstance from './axios'
import type { MovementRequest, MovementType, Page, StockMovement } from '../types'

export interface MovementQuery {
  page?: number
  size?: number
  sortBy?: string
  direction?: string
  search?: string
  type?: MovementType
  productId?: string
}

export const movementApi = {
  getAll: (params: MovementQuery) =>
    axiosInstance.get<Page<StockMovement>>('/movements', { params }).then((r) => r.data),

  inbound: (data: MovementRequest) =>
    axiosInstance.post<StockMovement>('/movements/inbound', data).then((r) => r.data),

  outbound: (data: MovementRequest) =>
    axiosInstance.post<StockMovement>('/movements/outbound', data).then((r) => r.data),

  adjust: (data: MovementRequest) =>
    axiosInstance.post<StockMovement>('/movements/adjustments', data).then((r) => r.data),
}
