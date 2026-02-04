import { apiClient } from './client'

export interface Grade {
  id: string
  student: string
  student_id?: string
  student_name?: string
  course: string
  course_id?: string
  course_name?: string
  lesson?: string
  value: number
  scale: string
  type: string
  comment?: string
  recorded_by?: string
  recorded_by_name?: string
  date: string
  created_at?: string
  updated_at?: string
}

export interface GradeStatistics {
  average: number
  total: number
  by_type: Record<string, number>
}

export const gradesApi = {
  list: async (params?: {
    student_id?: string
    course_id?: string
    period?: string
  }) => {
    const response = await apiClient.get('/grades/', { params })
    return response.data
  },

  create: async (data: Partial<Grade>) => {
    const response = await apiClient.post('/grades/', data)
    return response.data
  },

  update: async (id: string, data: Partial<Grade>) => {
    const response = await apiClient.patch(`/grades/${id}/`, data)
    return response.data
  },

  delete: async (id: string) => {
    const response = await apiClient.delete(`/grades/${id}/`)
    return response.data
  },

  statistics: async (params?: {
    student_id?: string
    date_from?: string
    date_to?: string
  }): Promise<GradeStatistics> => {
    const response = await apiClient.get('/grades/statistics/', { params })
    return response.data
  },
}

