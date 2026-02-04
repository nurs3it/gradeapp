import { apiClient } from './client'

export interface Course {
  id: string
  name: string
  subject?: string
  subject_name?: string
  teacher?: string
  teacher_name?: string
  class_group?: string
  class_group_name?: string
  academic_year?: string
  is_optional?: boolean
}

export const coursesApi = {
  list: async (params?: {
    school_id?: string
    teacher_id?: string
    class_group_id?: string
  }) => {
    const response = await apiClient.get('/schedule/courses/', { params })
    return response.data
  },
}

