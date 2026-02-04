import { apiClient } from './client'

export interface UserSchool {
  id: string
  name: string
}

export interface User {
  id: string
  email: string
  first_name?: string
  last_name?: string
  middle_name?: string
  phone?: string
  language_pref?: string
  profile?: Record<string, unknown>
  linked_school?: string | null
  is_active?: boolean
  date_joined?: string
  roles?: string[]
  schools?: UserSchool[]
}

export type ProfileUpdatePayload = Partial<
  Pick<User, 'first_name' | 'last_name' | 'middle_name' | 'phone' | 'language_pref' | 'profile' | 'linked_school'>
>

export const usersApi = {
  getMe: async (): Promise<User> => {
    const response = await apiClient.get('/users/me/')
    return response.data
  },

  updateMe: async (data: ProfileUpdatePayload): Promise<User> => {
    const response = await apiClient.patch('/users/me/', data)
    return response.data
  },
}
