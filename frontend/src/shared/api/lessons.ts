import { apiClient } from './client'

export interface Lesson {
  id: string
  course: string
  course_name?: string
  date: string
  start_time: string
  end_time: string
  classroom?: string
  teacher: string
  teacher_name?: string
  attendance_open_flag: boolean
  notes?: string
}

export const lessonsApi = {
  list: async (params?: {
    date?: string
    week?: string // Format: YYYY-WW
    course_id?: string
    teacher_id?: string
  }) => {
    const response = await apiClient.get('/lessons/', { params })
    return response.data
  },

  openAttendance: async (lessonId: string) => {
    const response = await apiClient.post(`/lessons/${lessonId}/open_attendance/`)
    return response.data
  },

  closeAttendance: async (lessonId: string) => {
    const response = await apiClient.post(`/lessons/${lessonId}/close_attendance/`)
    return response.data
  },
}

