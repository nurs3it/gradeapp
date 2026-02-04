import { apiClient } from './client'

export interface Subject {
  id: string
  school: string
  name: string
  code?: string
  description?: string
  default_credits?: number
  created_at?: string
}

export interface StaffSubject {
  id: string
  staff: string
  subject: string
  subject_name?: string
  created_at?: string
}

export interface Staff {
  id: string
  user?: { id: string; first_name?: string; last_name?: string; email?: string }
  school: string
  position?: string
  employment_date?: string
  load_limit_hours?: number
  created_at?: string
  updated_at?: string
}

export const subjectsApi = {
  list: async (params?: { school_id?: string }) => {
    const response = await apiClient.get('/staff/subjects/', { params })
    return response.data
  },

  get: async (id: string) => {
    const response = await apiClient.get(`/staff/subjects/${id}/`)
    return response.data
  },

  create: async (data: Partial<Subject>) => {
    const response = await apiClient.post('/staff/subjects/', data)
    return response.data
  },

  update: async (id: string, data: Partial<Subject>) => {
    const response = await apiClient.patch(`/staff/subjects/${id}/`, data)
    return response.data
  },

  delete: async (id: string) => {
    await apiClient.delete(`/staff/subjects/${id}/`)
  },
}

export const staffApi = {
  list: async (params?: { school_id?: string; position?: string }) => {
    const response = await apiClient.get('/staff/staff/', { params })
    return response.data
  },

  get: async (id: string) => {
    const response = await apiClient.get(`/staff/staff/${id}/`)
    return response.data
  },
}

export const staffSubjectsApi = {
  list: async (params?: { subject_id?: string; staff_id?: string }) => {
    const response = await apiClient.get('/staff/staff-subjects/', { params })
    return response.data
  },

  create: async (data: { staff: string; subject: string }) => {
    const response = await apiClient.post('/staff/staff-subjects/', data)
    return response.data
  },

  delete: async (id: string) => {
    await apiClient.delete(`/staff/staff-subjects/${id}/`)
  },
}
