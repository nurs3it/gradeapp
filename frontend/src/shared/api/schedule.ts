import { apiClient } from './client'

export interface ScheduleSlot {
  id: string
  course: string
  course_name?: string
  day_of_week: number // 0=Monday, 6=Sunday
  start_time: string
  end_time: string
  classroom?: string
  created_at?: string
  updated_at?: string
}

export interface ScheduleConflict {
  slot1: ScheduleSlot
  slot2: ScheduleSlot
  type: 'teacher' | 'classroom' | 'class_group'
}

export interface ConflictResolution {
  conflicts: ScheduleConflict[]
  suggestions: string[]
}

export const scheduleApi = {
  // Schedule Slots
  listSlots: async (params?: { course_id?: string }) => {
    const response = await apiClient.get('/schedule/slots/', { params })
    return response.data
  },

  getSlot: async (id: string) => {
    const response = await apiClient.get(`/schedule/slots/${id}/`)
    return response.data
  },

  createSlot: async (data: Partial<ScheduleSlot>) => {
    const response = await apiClient.post('/schedule/slots/', data)
    return response.data
  },

  updateSlot: async (id: string, data: Partial<ScheduleSlot>) => {
    const response = await apiClient.patch(`/schedule/slots/${id}/`, data)
    return response.data
  },

  deleteSlot: async (id: string) => {
    const response = await apiClient.delete(`/schedule/slots/${id}/`)
    return response.data
  },

  // Conflict Detection
  resolveConflicts: async (): Promise<ConflictResolution> => {
    const response = await apiClient.post('/schedule/resolve-conflicts/')
    return response.data
  },
}

