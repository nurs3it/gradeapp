import { apiClient } from './client'

export interface City {
  id: string
  name: string
  name_ru?: string
}

export interface School {
  id: string
  name: string
  connection_code?: string | null
  city: string | null
  city_detail?: City | null
  address?: string
  grading_system?: {
    scale?: string
    min?: number
    max?: number
  }
  languages_supported?: string[]
  academic_years?: AcademicYear[]
  created_at?: string
  updated_at?: string
}

export interface AcademicYear {
  id: string
  school: string
  name: string
  start_date: string
  end_date: string
  is_current: boolean
  created_at?: string
}

export const citiesApi = {
  list: async () => {
    const response = await apiClient.get('/schools/cities/')
    return response.data
  },
}

export interface SchoolByCode {
  id: string
  name: string
  city: string | null
}

export const schoolsApi = {
  list: async () => {
    const response = await apiClient.get('/schools/')
    return response.data
  },

  getByCode: async (code: string): Promise<SchoolByCode> => {
    const normalized = String(code).trim().toUpperCase().slice(0, 6)
    const response = await apiClient.get(`/schools/by_code/${normalized}/`)
    return response.data
  },

  get: async (id: string) => {
    const response = await apiClient.get(`/schools/${id}/`)
    return response.data
  },

  create: async (data: Partial<School>) => {
    const response = await apiClient.post('/schools/', data)
    return response.data
  },

  update: async (id: string, data: Partial<School>) => {
    const response = await apiClient.patch(`/schools/${id}/`, data)
    return response.data
  },

  delete: async (id: string) => {
    const response = await apiClient.delete(`/schools/${id}/`)
    return response.data
  },
}

export const academicYearsApi = {
  list: async (params?: { school_id?: string }) => {
    const response = await apiClient.get('/schools/academic-years/', { params })
    return response.data
  },

  get: async (id: string) => {
    const response = await apiClient.get(`/schools/academic-years/${id}/`)
    return response.data
  },

  create: async (data: Partial<AcademicYear>) => {
    const response = await apiClient.post('/schools/academic-years/', data)
    return response.data
  },

  update: async (id: string, data: Partial<AcademicYear>) => {
    const response = await apiClient.patch(`/schools/academic-years/${id}/`, data)
    return response.data
  },

  delete: async (id: string) => {
    const response = await apiClient.delete(`/schools/academic-years/${id}/`)
    return response.data
  },
}
