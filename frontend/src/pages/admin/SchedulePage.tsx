import { useState, useCallback, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/Card'
import { Button } from '@/shared/ui/Button'
import { Select, SelectOption } from '@/shared/ui/Select'
import { Input } from '@/shared/ui/Input'
import { useTranslationWithNamespace } from '@/shared/lib/i18n/hooks'
import { namespaces } from '@/shared/lib/i18n/config'
import { useAuth } from '@/shared/lib/auth'
import { useDialog } from '@/shared/lib/useDialog'
import { useToast } from '@/shared/lib/ToastProvider'
import { scheduleApi, ScheduleSlot, ScheduleConflict } from '@/shared/api/schedule'
import { coursesApi, Course } from '@/shared/api/courses'
import { classesApi, ClassGroup } from '@/shared/api/classes'
import { 
  Calendar, 
  Plus, 
  Edit2, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2,
  Save,
  X,
  Clock
} from 'lucide-react'
// Helper functions for time manipulation
const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.substring(0, 5).split(':').map(Number)
  return hours * 60 + minutes
}

const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

const addMinutes = (time: string, minutes: number): string => {
  return minutesToTime(timeToMinutes(time) + minutes)
}

// Days will be translated in component
const DAYS_OF_WEEK_KEYS = [
  { value: 0, key: 'monday', shortKey: 'mon' },
  { value: 1, key: 'tuesday', shortKey: 'tue' },
  { value: 2, key: 'wednesday', shortKey: 'wed' },
  { value: 3, key: 'thursday', shortKey: 'thu' },
  { value: 4, key: 'friday', shortKey: 'fri' },
  { value: 5, key: 'saturday', shortKey: 'sat' },
  { value: 6, key: 'sunday', shortKey: 'sun' },
]

const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00'
]

interface SlotPosition {
  day: number
  startTime: string
  endTime: string
}

export function AdminSchedulePage() {
  const { t } = useTranslationWithNamespace(namespaces.admin)
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { confirm, DialogComponent } = useDialog()
  const { success, error: showError } = useToast()

  const [selectedClass, setSelectedClass] = useState<string>('')
  const [selectedCourse, setSelectedCourse] = useState<string>('')
  const [draggedSlot, setDraggedSlot] = useState<ScheduleSlot | null>(null)
  const [editingSlot, setEditingSlot] = useState<ScheduleSlot | null>(null)
  const [isCreatingSlot, setIsCreatingSlot] = useState(false)
  const [conflicts, setConflicts] = useState<ScheduleConflict[]>([])
  const [showConflicts, setShowConflicts] = useState(false)

  const [slotForm, setSlotForm] = useState<Partial<ScheduleSlot>>({
    course: '',
    day_of_week: 0,
    start_time: '09:00',
    end_time: '09:45',
    classroom: '',
  })

  // Fetch classes
  const { data: classesData } = useQuery({
    queryKey: ['classes', user?.linked_school],
    queryFn: () => classesApi.list({ school_id: user?.linked_school }),
    enabled: !!user?.linked_school,
  })

  // Fetch courses for selected class
  const { data: coursesData } = useQuery({
    queryKey: ['courses', selectedClass],
    queryFn: () => coursesApi.list({ 
      school_id: user?.linked_school,
      class_group_id: selectedClass 
    }),
    enabled: !!selectedClass && !!user?.linked_school,
  })

  // Fetch schedule slots
  const { data: slotsData } = useQuery({
    queryKey: ['schedule-slots', selectedClass],
    queryFn: () => scheduleApi.listSlots(),
    enabled: !!selectedClass,
  })

  // Check conflicts
  const { data: conflictsData, refetch: refetchConflicts } = useQuery({
    queryKey: ['schedule-conflicts'],
    queryFn: () => scheduleApi.resolveConflicts(),
    enabled: false, // Only fetch on demand
  })

  // Create slot mutation
  const createSlotMutation = useMutation({
    mutationFn: (data: Partial<ScheduleSlot>) => scheduleApi.createSlot(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule-slots'] })
      setIsCreatingSlot(false)
      resetSlotForm()
      refetchConflicts()
      success(t('schedule.slot_created', { defaultValue: 'Слот расписания создан' }))
    },
    onError: () => {
      showError(t('schedule.slot_create_error', { defaultValue: 'Ошибка при создании слота' }))
    },
  })

  // Update slot mutation
  const updateSlotMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ScheduleSlot> }) =>
      scheduleApi.updateSlot(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule-slots'] })
      setEditingSlot(null)
      resetSlotForm()
      refetchConflicts()
      success(t('schedule.slot_updated', { defaultValue: 'Слот расписания обновлен' }))
    },
    onError: () => {
      showError(t('schedule.slot_update_error', { defaultValue: 'Ошибка при обновлении слота' }))
    },
  })

  // Delete slot mutation
  const deleteSlotMutation = useMutation({
    mutationFn: (id: string) => scheduleApi.deleteSlot(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule-slots'] })
      refetchConflicts()
      success(t('schedule.slot_deleted', { defaultValue: 'Слот расписания удален' }))
    },
    onError: () => {
      showError(t('schedule.slot_delete_error', { defaultValue: 'Ошибка при удалении слота' }))
    },
  })

  const resetSlotForm = () => {
    setSlotForm({
      course: selectedCourse || '',
      day_of_week: 0,
      start_time: '09:00',
      end_time: '09:45',
      classroom: '',
    })
  }

  // Extract data from queries - ensure arrays
  const slots = Array.isArray(slotsData)
    ? slotsData
    : (Array.isArray(slotsData?.results) ? slotsData.results : [])
  const classes = Array.isArray(classesData)
    ? classesData
    : (Array.isArray(classesData?.results) ? classesData.results : [])
  const courses = Array.isArray(coursesData)
    ? coursesData
    : (Array.isArray(coursesData?.results) ? coursesData.results : [])

  // Filter slots by selected class courses
  const filteredSlots = useMemo(() => {
    if (!selectedClass) return []
    const courseIds = courses.map((c: Course) => c.id)
    return slots.filter((slot: ScheduleSlot) => courseIds.includes(slot.course))
  }, [slots, courses, selectedClass])

  // Group slots by day - store all slots for each day
  const slotsByDay = useMemo(() => {
    const grouped: Record<number, ScheduleSlot[]> = {}
    
    DAYS_OF_WEEK_KEYS.forEach(day => {
      grouped[day.value] = []
    })

    filteredSlots.forEach((slot: ScheduleSlot) => {
      if (!grouped[slot.day_of_week]) {
        grouped[slot.day_of_week] = []
      }
      grouped[slot.day_of_week].push(slot)
    })

    // Sort slots by start time
    Object.keys(grouped).forEach(day => {
      grouped[parseInt(day)].sort((a, b) => 
        timeToMinutes(a.start_time) - timeToMinutes(b.start_time)
      )
    })

    return grouped
  }, [filteredSlots])

  // Calculate slot height and position
  const getSlotStyle = (slot: ScheduleSlot) => {
    const startMinutes = timeToMinutes(slot.start_time)
    const endMinutes = timeToMinutes(slot.end_time)
    const duration = endMinutes - startMinutes // minutes
    const height = (duration / 30) * 60 // 30 min = 60px
    const startOffset = ((startMinutes - 8 * 60) / 30) * 60 // 8:00 = 0px

    return {
      height: `${height}px`,
      top: `${startOffset}px`,
    }
  }

  // Check if slot has conflict
  const hasConflict = (slot: ScheduleSlot) => {
    if (!conflictsData?.conflicts) return false
    return conflictsData.conflicts.some(
      (conflict: ScheduleConflict) =>
        conflict.slot1.id === slot.id || conflict.slot2.id === slot.id
    )
  }

  // Handle drag start
  const handleDragStart = (e: React.DragEvent, slot: ScheduleSlot) => {
    setDraggedSlot(slot)
    e.dataTransfer.effectAllowed = 'move'
  }

  // Handle drop
  const handleDrop = async (e: React.DragEvent, targetDay: number, targetTime: string) => {
    e.preventDefault()
    if (!draggedSlot) return

    const startTime = `${targetTime}:00`
    const originalDuration = timeToMinutes(draggedSlot.end_time) - timeToMinutes(draggedSlot.start_time)
    const endTime = `${addMinutes(targetTime, originalDuration)}:00`

    await updateSlotMutation.mutateAsync({
      id: draggedSlot.id,
      data: {
        day_of_week: targetDay,
        start_time: startTime,
        end_time: endTime,
      },
    })

    setDraggedSlot(null)
  }

  // Handle drag over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  // Handle check conflicts
  const handleCheckConflicts = async () => {
    const result = await scheduleApi.resolveConflicts()
    setConflicts(result.conflicts)
    setShowConflicts(true)
    queryClient.setQueryData(['schedule-conflicts'], result)
  }

  const courseOptions: SelectOption[] = courses.map((course: Course) => ({
    value: course.id,
    label: course.name,
  }))

  const classOptions: SelectOption[] = classes.map((classGroup: ClassGroup) => ({
    value: classGroup.id,
    label: classGroup.name,
  }))
  
  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t('schedule.title', { defaultValue: 'Построитель расписания' })}
          </h1>
          <p className="text-gray-600 mt-1">
            {t('schedule.description', { defaultValue: 'Создайте и управляйте расписанием уроков' })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleCheckConflicts}
            disabled={!selectedClass}
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            {t('schedule.check_conflicts', { defaultValue: 'Проверить конфликты' })}
          </Button>
          {conflicts.length > 0 && (
            <span className="px-3 py-1 bg-red-100 text-red-700 rounded-md text-sm font-medium flex items-center gap-1">
              <AlertTriangle className="w-4 h-4" />
              {conflicts.length}
            </span>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">
                {t('schedule.select_class', { defaultValue: 'Выберите класс' })}
              </label>
              <Select
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value)
                  setSelectedCourse('')
                }}
                options={classOptions}
                placeholder={t('schedule.select_class_placeholder', { defaultValue: 'Выберите класс' })}
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">
                {t('schedule.select_course', { defaultValue: 'Выберите предмет' })}
              </label>
              <Select
                value={selectedCourse}
                onChange={(e) => {
                  setSelectedCourse(e.target.value)
                  setSlotForm({ ...slotForm, course: e.target.value })
                }}
                options={courseOptions}
                placeholder={t('schedule.select_course_placeholder', { defaultValue: 'Выберите предмет' })}
                disabled={!selectedClass}
              />
            </div>
            {selectedCourse && (
              <div className="flex items-end">
                <Button
                  onClick={() => {
                    setIsCreatingSlot(true)
                    resetSlotForm()
                    setEditingSlot(null)
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {t('schedule.add_slot', { defaultValue: 'Добавить слот' })}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Conflicts Alert */}
      {showConflicts && conflicts.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 mb-2">
                  {t('schedule.conflicts_found', { defaultValue: 'Обнаружены конфликты' })} ({conflicts.length})
                </h3>
                <div className="space-y-2">
                  {conflicts.slice(0, 5).map((conflict: ScheduleConflict, idx: number) => (
                    <div key={idx} className="text-sm text-red-800">
                      {conflict.slot1.course_name} и {conflict.slot2.course_name} -{' '}
                      {conflict.type === 'teacher'
                        ? t('schedule.conflict_teacher', { defaultValue: 'конфликт учителя' })
                        : t('schedule.conflict_classroom', { defaultValue: 'конфликт аудитории' })}
                    </div>
                  ))}
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowConflicts(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Schedule Grid */}
      {selectedClass ? (
        <Card>
          <CardHeader>
            <CardTitle>{t('schedule.weekly_schedule', { defaultValue: 'Недельное расписание' })}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <div className="min-w-[1200px]">
                {/* Header */}
                <div className="grid grid-cols-8 border-b bg-gray-50 sticky top-0 z-10">
                  <div className="p-3 border-r font-medium text-sm text-gray-700">
                    {t('schedule.time', { defaultValue: 'Время' })}
                  </div>
                  {DAYS_OF_WEEK_KEYS.map((day) => (
                    <div key={day.value} className="p-3 border-r text-center font-medium text-sm text-gray-700">
                      {t(`schedule.${day.shortKey}`, { defaultValue: day.shortKey.toUpperCase() })}
                    </div>
                  ))}
                </div>

                {/* Time slots */}
                <div className="relative">
                  {TIME_SLOTS.map((time, timeIdx) => (
                    <div key={time} className="grid grid-cols-8 border-b">
                      {/* Time column */}
                      <div className="p-2 border-r bg-gray-50 text-xs text-gray-600 text-center">
                        {time}
                      </div>

                      {/* Day columns */}
                      {DAYS_OF_WEEK_KEYS.map((day) => {
                        const daySlots = slotsByDay[day.value] || []
                        // Find slots that should be visible in this time row
                        const visibleSlots = daySlots.filter((slot: ScheduleSlot) => {
                          const slotStart = timeToMinutes(slot.start_time)
                          const slotEnd = timeToMinutes(slot.end_time)
                          const rowStart = timeToMinutes(time)
                          const rowEnd = timeToMinutes(addMinutes(time, 30))
                          // Slot is visible if it overlaps with this time row
                          return slotStart < rowEnd && slotEnd > rowStart
                        })
                        
                        return (
                          <div
                            key={`${day.value}-${time}`}
                            className="relative border-r min-h-[60px]"
                            onDrop={(e) => handleDrop(e, day.value, time)}
                            onDragOver={handleDragOver}
                          >
                            {/* Render slots that start at this time or earlier but extend into this row */}
                            {visibleSlots
                              .filter((slot: ScheduleSlot) => {
                                // Only render if this is the first row where the slot appears
                                const slotStart = timeToMinutes(slot.start_time)
                                const rowStart = timeToMinutes(time)
                                const prevRowStart = timeIdx > 0 ? timeToMinutes(TIME_SLOTS[timeIdx - 1]) : -1
                                return slotStart >= prevRowStart && slotStart < rowStart + 30
                              })
                              .map((slot: ScheduleSlot) => {
                                const style = getSlotStyle(slot)
                                const conflict = hasConflict(slot)
                                return (
                                  <div
                                    key={slot.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, slot)}
                                    className={`absolute left-1 right-1 rounded-md p-2 text-xs cursor-move transition-all z-10 ${
                                      conflict
                                        ? 'bg-red-100 border-2 border-red-400 text-red-900'
                                        : 'bg-blue-100 border border-blue-300 text-blue-900 hover:bg-blue-200'
                                    }`}
                                    style={style}
                                    title={`${slot.course_name} ${slot.start_time.substring(0, 5)}-${slot.end_time.substring(0, 5)} ${slot.classroom || ''}`}
                                  >
                                    <div className="font-medium truncate">{slot.course_name}</div>
                                    <div className="text-xs opacity-75">
                                      {slot.start_time.substring(0, 5)}-{slot.end_time.substring(0, 5)}
                                    </div>
                                    {slot.classroom && (
                                      <div className="text-xs opacity-75">{slot.classroom}</div>
                                    )}
                                    <div className="flex gap-1 mt-1">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setEditingSlot(slot)
                                          setSlotForm({
                                            course: slot.course,
                                            day_of_week: slot.day_of_week,
                                            start_time: slot.start_time.substring(0, 5),
                                            end_time: slot.end_time.substring(0, 5),
                                            classroom: slot.classroom || '',
                                          })
                                          setIsCreatingSlot(false)
                                        }}
                                        className="p-0.5 hover:bg-blue-300 rounded"
                                      >
                                        <Edit2 className="w-3 h-3" />
                                      </button>
                                      <button
                                        onClick={async (e) => {
                                          e.stopPropagation()
                                          const confirmed = await confirm(
                                            t('schedule.confirm_delete_slot', { defaultValue: 'Удалить слот расписания?' }),
                                            {
                                              title: t('schedule.delete_slot', { defaultValue: 'Удаление слота' }),
                                              confirmText: t('schedule.delete', { defaultValue: 'Удалить' }),
                                              cancelText: t('schedule.cancel', { defaultValue: 'Отмена' }),
                                              variant: 'destructive',
                                            }
                                          )
                                          if (confirmed) {
                                            deleteSlotMutation.mutate(slot.id)
                                          }
                                        }}
                                        className="p-0.5 hover:bg-red-300 rounded"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                )
                              })}
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            {t('schedule.select_class_first', { defaultValue: 'Выберите класс для просмотра расписания' })}
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Slot Dialog */}
      {(isCreatingSlot || editingSlot) && (
        <Card className="fixed inset-x-4 bottom-4 max-w-md mx-auto shadow-2xl z-50">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <CardTitle>
                {editingSlot
                  ? t('schedule.edit_slot', { defaultValue: 'Редактировать слот' })
                  : t('schedule.create_slot', { defaultValue: 'Создать слот' })}
              </CardTitle>
              <button
                onClick={() => {
                  setIsCreatingSlot(false)
                  setEditingSlot(null)
                  resetSlotForm()
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('schedule.day', { defaultValue: 'День недели' })} *
                </label>
                <Select
                  value={slotForm.day_of_week?.toString()}
                  onChange={(e) => setSlotForm({ ...slotForm, day_of_week: parseInt(e.target.value) })}
                  options={DAYS_OF_WEEK_KEYS.map(day => ({ 
                    value: day.value.toString(), 
                    label: t(`schedule.${day.key}`, { defaultValue: day.key }) 
                  }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t('schedule.start_time', { defaultValue: 'Время начала' })} *
                  </label>
                  <Input
                    type="time"
                    value={slotForm.start_time}
                    onChange={(e) => setSlotForm({ ...slotForm, start_time: e.target.value + ':00' })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t('schedule.end_time', { defaultValue: 'Время окончания' })} *
                  </label>
                  <Input
                    type="time"
                    value={slotForm.end_time}
                    onChange={(e) => setSlotForm({ ...slotForm, end_time: e.target.value + ':00' })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('schedule.classroom', { defaultValue: 'Аудитория' })}
                </label>
                <Input
                  value={slotForm.classroom}
                  onChange={(e) => setSlotForm({ ...slotForm, classroom: e.target.value })}
                  placeholder={t('schedule.classroom_placeholder', { defaultValue: 'Номер аудитории' })}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => {
                    if (!slotForm.course || !slotForm.start_time || !slotForm.end_time) {
                      return
                    }
                    if (editingSlot) {
                      updateSlotMutation.mutate({ id: editingSlot.id, data: slotForm })
                    } else {
                      createSlotMutation.mutate(slotForm)
                    }
                  }}
                  disabled={createSlotMutation.isPending || updateSlotMutation.isPending}
                  className="flex-1"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {t('schedule.save', { defaultValue: 'Сохранить' })}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreatingSlot(false)
                    setEditingSlot(null)
                    resetSlotForm()
                  }}
                >
                  <X className="w-4 h-4 mr-2" />
                  {t('schedule.cancel', { defaultValue: 'Отмена' })}
                </Button>
              </div>
      </div>
          </CardContent>
        </Card>
      )}

      <DialogComponent />
    </div>
  )
}
