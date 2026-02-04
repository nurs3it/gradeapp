import { apiClient } from './client'

export interface Student {
  id: string
  user: {
    id: string
    email: string
    first_name: string
    last_name: string
  }
  student_number: string
  class_group: string
  class_group_name: string
  enrollment_date: string
  birth_date?: string
  gender?: string
}

export const studentsApi = {
  list: async (params?: {
    school_id?: string
    class_group_id?: string
  }) => {
    const response = await apiClient.get('/students/', { params })
    return response.data
  },
}

