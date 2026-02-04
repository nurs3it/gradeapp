import { apiClient } from './client'

export interface Notification {
  id: string
  type: string
  payload: Record<string, unknown>
  read_flag: boolean
  created_at: string
}

export const notificationsApi = {
  list: async (): Promise<Notification[]> => {
    const response = await apiClient.get('/notifications/')
    return response.data
  },

  markRead: async (id: string): Promise<Notification> => {
    const response = await apiClient.patch(`/notifications/${id}/`, { read_flag: true })
    return response.data
  },
}
