import axiosInstance from './axios'
import type { AuthResponse, LoginRequest, RegisterRequest } from '../types'

export const authApi = {
  login: (data: LoginRequest) =>
    axiosInstance.post<AuthResponse>('/auth/login', data).then((r) => r.data),

  register: (data: RegisterRequest) =>
    axiosInstance.post<AuthResponse>('/auth/register', data).then((r) => r.data),
}
