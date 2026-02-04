import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/Card'
import { Button } from '@/shared/ui/Button'
import { Select, SelectOption } from '@/shared/ui/Select'
import { Input } from '@/shared/ui/Input'
import { useTranslationWithNamespace } from '@/shared/lib/i18n/hooks'
import { namespaces } from '@/shared/lib/i18n/config'
import { useAuth } from '@/shared/lib/auth'
import { useToast } from '@/shared/lib/ToastProvider'
import { classesApi, ClassGroup } from '@/shared/api/classes'
import { studentsApi } from '@/shared/api/students'
import { apiClient } from '@/shared/api/client'
import { 
  Upload, 
  Download, 
  FileText, 
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react'

export function ImportExportPage() {
  const { t } = useTranslationWithNamespace(namespaces.admin)
  const { user } = useAuth()
  const { success, error: showError } = useToast()

  const [selectedClass, setSelectedClass] = useState<string>('')
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importResults, setImportResults] = useState<{
    created: number
    errors: number
    details?: {
      created_students?: Array<{ student_number: string; name: string; email: string }>
      error_messages?: string[]
    }
  } | null>(null)

  // Fetch classes
  const { data: classesData } = useQuery({
    queryKey: ['classes', user?.linked_school],
    queryFn: () => classesApi.list({ school_id: user?.linked_school }),
    enabled: !!user?.linked_school,
  })

  // Import mutation
  const importMutation = useMutation({
    mutationFn: async (data: { file: File; school_id: string; class_group_id?: string }) => {
      const formData = new FormData()
      formData.append('file', data.file)
      formData.append('school_id', data.school_id)
      if (data.class_group_id) {
        formData.append('class_group_id', data.class_group_id)
      }

      const response = await apiClient.post('/classes/students/bulk_import/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return response.data
    },
    onSuccess: (data) => {
      setImportResults(data)
      setImportFile(null)
      if (data.errors === 0) {
        success(t('import_export.import_success', { 
          defaultValue: 'Успешно импортировано студентов',
          count: data.created 
        }).replace('{{count}}', String(data.created)))
      } else {
        showError(t('import_export.import_partial', { 
          defaultValue: 'Импортировано с ошибками',
          created: data.created,
          errors: data.errors
        }).replace('{{created}}', String(data.created)).replace('{{errors}}', String(data.errors)))
      }
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || error.message || t('import_export.import_failed', { defaultValue: 'Ошибка импорта' })
      showError(errorMessage)
      setImportResults({
        created: 0,
        errors: 1,
        details: {
          error_messages: [errorMessage],
        },
      })
    },
  })

  // Export function
  const handleExport = async () => {
    try {
      const params = new URLSearchParams()
      if (user?.linked_school) {
        params.append('school_id', user.linked_school)
      }
      if (selectedClass) {
        params.append('class_group_id', selectedClass)
      }

      const response = await apiClient.get(`/classes/students/export/?${params.toString()}`, {
        responseType: 'blob',
      })

      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `students_export_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      success(t('import_export.export_success', { defaultValue: 'Экспорт выполнен успешно' }))
    } catch (error: any) {
      console.error('Export error:', error)
      showError(error.response?.data?.error || error.message || t('import_export.export_error', { defaultValue: 'Ошибка при экспорте' }))
    }
  }

  const handleImport = () => {
    if (!importFile || !user?.linked_school) return

    importMutation.mutate({
      file: importFile,
      school_id: user.linked_school,
      class_group_id: selectedClass || undefined,
    })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImportFile(e.target.files[0])
      setImportResults(null)
    }
  }

  // Extract data - ensure arrays
  const classes = Array.isArray(classesData)
    ? classesData
    : (Array.isArray(classesData?.results) ? classesData.results : [])

  const classOptions: SelectOption[] = classes.map((classGroup: ClassGroup) => ({
    value: classGroup.id,
    label: classGroup.name,
  }))

  // CSV template
  const csvTemplate = `email,first_name,last_name,student_number,enrollment_date,birth_date,gender,language_pref
student1@example.com,Иван,Иванов,STU2024001,2024-09-01,2008-01-15,M,ru
student2@example.com,Мария,Петрова,STU2024002,2024-09-01,2008-03-20,F,ru`

  const downloadTemplate = () => {
    const blob = new Blob([csvTemplate], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'students_import_template.csv'
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t('import_export.title', { defaultValue: 'Импорт/Экспорт студентов' })}
          </h1>
          <p className="text-gray-600 mt-1">
            {t('import_export.description', { defaultValue: 'Массовый импорт и экспорт данных студентов' })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Import Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              {t('import_export.import_title', { defaultValue: 'Импорт студентов' })}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                {t('import_export.select_class', { defaultValue: 'Выберите класс (опционально)' })}
              </label>
              <Select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                options={classOptions}
                placeholder={t('import_export.select_class_placeholder', { defaultValue: 'Все классы' })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {t('import_export.select_file', { defaultValue: 'Выберите CSV файл' })}
              </label>
              <div className="flex gap-2">
                <Input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  onClick={downloadTemplate}
                  title={t('import_export.download_template', { defaultValue: 'Скачать шаблон' })}
                >
                  <FileText className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {t('import_export.file_format', { 
                  defaultValue: 'Формат: email, first_name, last_name, student_number, enrollment_date, birth_date, gender, language_pref' 
                })}
              </p>
            </div>

            {importFile && (
              <div className="p-3 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-800">
                  <FileSpreadsheet className="w-4 h-4 inline mr-2" />
                  {importFile.name}
                </p>
              </div>
            )}

            <Button
              onClick={handleImport}
              disabled={!importFile || importMutation.isPending}
              className="w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              {importMutation.isPending
                ? t('import_export.importing', { defaultValue: 'Импорт...' })
                : t('import_export.import', { defaultValue: 'Импортировать' })}
            </Button>

            {/* Import Results */}
            {importResults && (
              <div className={`p-4 rounded-md ${
                importResults.errors === 0
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-yellow-50 border border-yellow-200'
              }`}>
                <div className="flex items-start gap-3">
                  {importResults.errors === 0 ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2">
                      {t('import_export.import_results', { defaultValue: 'Результаты импорта' })}
                    </h3>
                    <p className="text-sm mb-2">
                      {t('import_export.created_count', { 
                        defaultValue: 'Создано: {{count}}',
                        count: importResults.created 
                      })}
                    </p>
                    {importResults.errors > 0 && (
                      <p className="text-sm text-yellow-800 mb-2">
                        {t('import_export.errors_count', { 
                          defaultValue: 'Ошибок: {{count}}',
                          count: importResults.errors 
                        })}
                      </p>
                    )}
                    {importResults.details?.error_messages && importResults.details.error_messages.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {importResults.details.error_messages.slice(0, 5).map((error, idx) => (
                          <p key={idx} className="text-xs text-yellow-800">
                            {error}
                          </p>
                        ))}
                        {importResults.details.error_messages.length > 5 && (
                          <p className="text-xs text-yellow-800">
                            {t('import_export.more_errors', { 
                              defaultValue: '... и еще {{count}} ошибок',
                              count: importResults.details.error_messages.length - 5 
                            })}
                          </p>
                        )}
                      </div>
                    )}
                    {importResults.details?.created_students && importResults.details.created_students.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-medium mb-1">
                          {t('import_export.created_students', { defaultValue: 'Созданные студенты:' })}
                        </p>
                        <ul className="text-xs space-y-1">
                          {importResults.details.created_students.slice(0, 5).map((student, idx) => (
                            <li key={idx} className="text-green-800">
                              {student.name} ({student.student_number})
                            </li>
                          ))}
                          {importResults.details.created_students.length > 5 && (
                            <li className="text-green-800">
                              {t('import_export.more_students', { 
                                defaultValue: '... и еще {{count}} студентов',
                                count: importResults.details.created_students.length - 5 
                              })}
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Export Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              {t('import_export.export_title', { defaultValue: 'Экспорт студентов' })}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                {t('import_export.select_class_export', { defaultValue: 'Выберите класс (опционально)' })}
              </label>
              <Select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                options={classOptions}
                placeholder={t('import_export.all_classes', { defaultValue: 'Все классы' })}
              />
              <p className="text-xs text-gray-500 mt-1">
                {t('import_export.export_description', { 
                  defaultValue: 'Если класс не выбран, будут экспортированы все студенты школы' 
                })}
              </p>
            </div>

            <Button
              onClick={handleExport}
              className="w-full"
              variant="outline"
            >
              <Download className="w-4 h-4 mr-2" />
              {t('import_export.export', { defaultValue: 'Экспортировать в CSV' })}
            </Button>

            <div className="p-4 bg-gray-50 rounded-md">
              <h4 className="font-medium text-sm mb-2">
                {t('import_export.export_format', { defaultValue: 'Формат экспорта:' })}
              </h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• email, first_name, last_name, student_number</li>
                <li>• enrollment_date, birth_date, gender, language_pref</li>
                <li>• class_group, school</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

