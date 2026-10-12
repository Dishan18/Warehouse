import axiosInstance from './axios'

export interface InventoryReport {
  totalProducts: number
  totalCategories: number
  totalSuppliers: number
  lowStockProducts: number
  outOfStockProducts: number
  totalInventoryValue: number
  productsByCategory: Array<{ category: string; count: number; value: number }>
  stockMovements: Array<{ date: string; in: number; out: number }>
  topProductsByMovement: Array<{ product: string; movements: number }>
  supplierPerformance: Array<{ supplier: string; products: number; totalValue: number }>
}

export interface DateRange {
  startDate: string
  endDate: string
}

export const reportsApi = {
  getInventoryReport: (params?: DateRange) =>
    axiosInstance.get<InventoryReport>('/reports/inventory/analytics', { params }),

  getMovementsReport: (params?: DateRange) =>
    axiosInstance.get('/reports/movements', { params }),

  getProductsReport: (params?: DateRange) =>
    axiosInstance.get('/reports/products', { params }),
}