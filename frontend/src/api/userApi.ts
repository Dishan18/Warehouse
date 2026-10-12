import axiosInstance from './axios'
import type { CreateUserRequest, Page, UpdateUserRequest, User, UserOption } from '../types'

export interface UserQuery {
  page?: number
  size?: number
  sortBy?: string
  direction?: string
  search?: string
  enabled?: boolean
}

export const userApi = {
  getAll: (params: UserQuery) =>
    axiosInstance.get<Page<User>>('/users', { params }).then((r) => r.data),

  getById: (id: string) =>
    axiosInstance.get<User>(`/users/${id}`).then((r) => r.data),

  create: (data: CreateUserRequest) =>
    axiosInstance.post<User>('/users', data).then((r) => r.data),

  update: (id: string, data: UpdateUserRequest) =>
    axiosInstance.put<User>(`/users/${id}`, data).then((r) => r.data),

  delete: (id: string) => axiosInstance.delete<void>(`/users/${id}`),

  getRecipientOptions: (search?: string) =>
    axiosInstance
      .get<UserOption[]>('/users/options', { params: { search } })
      .then((r) => r.data),
}
