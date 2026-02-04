import { apiClient } from './client'

export interface Attendance {
  id: string
  lesson?: string
  lesson_id?: string
  lesson_date?: string
  lesson_course?: string
  student?: string
  student_id: string
  student_name?: string
  status: 'present' | 'absent' | 'tardy' | 'excused'
  reason?: string
  recorded_by?: string
  recorded_by_name?: string
  created_at?: string
  updated_at?: string
}

export interface AttendanceStatistics {
  total: number
  present: number
  absent: number
  tardy: number
  excused?: number
  attendance_rate: number
  period?: {
    from: string
    to: string
  }
}

export const attendanceApi = {
  list: async (params?: {
    student_id?: string
    lesson_id?: string
    date_from?: string
    date_to?: string
  }) => {
    const response = await apiClient.get('/attendance/', { params })
    return response.data
  },

  mark: async (data: {
    lesson_id: string
    records: Array<{
      student_id: string
      status: string
      reason?: string
    }>
  }) => {
    const response = await apiClient.post('/attendance/mark/', data)
    return response.data
  },

  statistics: async (params?: {
    student_id?: string
    date_from?: string
    date_to?: string
  }): Promise<AttendanceStatistics> => {
    const response = await apiClient.get('/attendance/statistics/', { params })
    return response.data
  },
}

