import axiosInstance from './axios'
import type { AuditLogEntry, Page } from '../types'

export interface AuditLogQuery {
  page?: number
  size?: number
  sortBy?: string
  direction?: string
  search?: string
}

export const auditLogApi = {
  getAll: (params: AuditLogQuery) =>
    axiosInstance.get<Page<AuditLogEntry>>('/audit-logs', { params }).then((r) => r.data),
}
