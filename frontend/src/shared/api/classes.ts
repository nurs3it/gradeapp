import { apiClient } from './client'

export interface ClassGroup {
  id: string
  name: string
  grade_level: number
  school: string
  academic_year: string
  homeroom_teacher?: string | null
  homeroom_teacher_name?: string
  student_count?: number
  created_at?: string
  updated_at?: string
}

export interface ClassGroupCreatePayload {
  school: string
  name: string
  grade_level: number
  academic_year: string
  homeroom_teacher?: string | null
}

export const classesApi = {
  list: async (params?: { school_id?: string; academic_year_id?: string }) => {
    const response = await apiClient.get('/classes/', { params })
    return response.data
  },

  get: async (id: string) => {
    const response = await apiClient.get(`/classes/${id}/`)
    return response.data
  },

  create: async (data: ClassGroupCreatePayload) => {
    const response = await apiClient.post('/classes/', data)
    return response.data
  },

  update: async (id: string, data: Partial<ClassGroupCreatePayload>) => {
    const response = await apiClient.patch(`/classes/${id}/`, data)
    return response.data
  },

  delete: async (id: string) => {
    await apiClient.delete(`/classes/${id}/`)
  },

  getStudents: async (classId: string) => {
    const response = await apiClient.get(`/classes/${classId}/students/`)
    return response.data
  },
}

