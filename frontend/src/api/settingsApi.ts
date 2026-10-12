import axiosInstance from './axios'
import type { AppSettings, SettingsRequest } from '../types'

export const settingsApi = {
  get: () =>
    axiosInstance.get<AppSettings>('/settings').then((r) => r.data),

  update: (data: SettingsRequest) =>
    axiosInstance.put<AppSettings>('/settings', data).then((r) => r.data),
}
