import { apiClient } from './client'

export type JoinRequestStatus = 'pending' | 'approved' | 'rejected'

export interface SchoolJoinRequest {
  id: string
  user: string
  user_email?: string
  user_name?: string
  school: string
  school_name?: string
  requested_role: string
  status: JoinRequestStatus
  created_at: string
  reviewed_at: string | null
  reviewed_by: string | null
  rejection_reason?: string
}

export const REQUESTABLE_ROLES = [
  'teacher',
  'student',
  'parent',
  'director',
  'schooladmin',
  'registrar',
  'scheduler',
] as const

export const schoolJoinRequestsApi = {
  list: async (params?: { status?: string; school_id?: string }): Promise<{ results?: SchoolJoinRequest[] } | SchoolJoinRequest[]> => {
    const response = await apiClient.get('/school-join-requests/', { params })
    const data = response.data
    return Array.isArray(data) ? data : { results: data?.results ?? data }
  },

  create: async (payload: { school_id: string; requested_role: string }): Promise<SchoolJoinRequest> => {
    const response = await apiClient.post('/school-join-requests/', payload)
    return response.data
  },

  patch: async (id: string, payload: { status: 'approved' | 'rejected'; rejection_reason?: string }): Promise<SchoolJoinRequest> => {
    const response = await apiClient.patch(`/school-join-requests/${id}/`, payload)
    return response.data
  },
}
