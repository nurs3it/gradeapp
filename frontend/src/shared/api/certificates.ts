import { apiClient } from './client'

export interface Certificate {
  id: string
  student: string
  student_name?: string
  title: string
  issue_date: string
  expires?: string
  pdf_url?: string
  pdf_file?: string
  template_id?: string
  language: string
  meta?: Record<string, unknown>
  created_at?: string
  updated_at?: string
}

export interface CertificateTemplate {
  id: string
  school: string
  name: string
  html_template: string
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface GenerateCertificateRequest {
  student_id: string
  template_id?: string
  title: string
  language?: string
  meta?: Record<string, unknown>
  issue_date?: string
}

export const certificatesApi = {
  list: async (params?: { student_id?: string; school_id?: string }) => {
    const response = await apiClient.get('/certificates/', { params })
    return response.data
  },

  get: async (id: string) => {
    const response = await apiClient.get(`/certificates/${id}/`)
    return response.data
  },

  generate: async (data: GenerateCertificateRequest) => {
    const response = await apiClient.post('/certificates/generate/', data)
    return response.data
  },

  download: async (id: string) => {
    const response = await apiClient.get(`/certificates/${id}/download/`, {
      responseType: 'blob',
    })
    return response.data
  },

  delete: async (id: string) => {
    const response = await apiClient.delete(`/certificates/${id}/`)
    return response.data
  },
}

export const certificateTemplatesApi = {
  list: async (params?: { school_id?: string }) => {
    const response = await apiClient.get('/certificates/templates/', { params })
    return response.data
  },

  get: async (id: string) => {
    const response = await apiClient.get(`/certificates/templates/${id}/`)
    return response.data
  },

  create: async (data: Partial<CertificateTemplate>) => {
    const response = await apiClient.post('/certificates/templates/', data)
    return response.data
  },

  update: async (id: string, data: Partial<CertificateTemplate>) => {
    const response = await apiClient.patch(`/certificates/templates/${id}/`, data)
    return response.data
  },

  delete: async (id: string) => {
    const response = await apiClient.delete(`/certificates/templates/${id}/`)
    return response.data
  },
}

