import axiosInstance from './axios'
import type { DashboardSummary } from '../types'

export const dashboardApi = {
  getSummary: () =>
    axiosInstance.get<DashboardSummary>('/dashboard/summary').then((r) => r.data),
}
