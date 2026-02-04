import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/Card'
import { Button } from '@/shared/ui/Button'
import { Select, SelectOption } from '@/shared/ui/Select'
import { Input } from '@/shared/ui/Input'
import { useTranslationWithNamespace } from '@/shared/lib/i18n/hooks'
import { namespaces } from '@/shared/lib/i18n/config'
import { useAuth } from '@/shared/lib/auth'
import { useToast } from '@/shared/lib/ToastProvider'
import { useDialog } from '@/shared/lib/useDialog'
import { 
  certificatesApi, 
  certificateTemplatesApi,
  Certificate,
  CertificateTemplate,
  GenerateCertificateRequest
} from '@/shared/api/certificates'
import { studentsApi, Student } from '@/shared/api/students'
import { classesApi, ClassGroup } from '@/shared/api/classes'
import { 
  Award, 
  Download, 
  Eye, 
  FileText, 
  Plus,
  CheckCircle2,
  X
} from 'lucide-react'
import { format } from 'date-fns'

export function CertificatesPage() {
  const { t } = useTranslationWithNamespace(namespaces.certificates)
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { confirm, DialogComponent } = useDialog()
  const { success, error: showError } = useToast()

  const [selectedClass, setSelectedClass] = useState<string>('')
  const [selectedStudent, setSelectedStudent] = useState<string>('')
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [previewMode, setPreviewMode] = useState(false)

  const [certificateForm, setCertificateForm] = useState<Partial<GenerateCertificateRequest>>({
    title: '',
    language: 'ru',
    issue_date: format(new Date(), 'yyyy-MM-dd'),
    meta: {},
  })

  // Fetch classes
  const { data: classesData } = useQuery({
    queryKey: ['classes', user?.linked_school],
    queryFn: () => classesApi.list({ school_id: user?.linked_school }),
    enabled: !!user?.linked_school,
  })

  // Fetch students for selected class
  const { data: studentsData } = useQuery({
    queryKey: ['students', selectedClass],
    queryFn: () => {
      if (!selectedClass) return Promise.resolve({ results: [] })
      return classesApi.retrieveStudents(selectedClass)
    },
    enabled: !!selectedClass,
  })

  // Fetch templates
  const { data: templatesData } = useQuery({
    queryKey: ['certificate-templates', user?.linked_school],
    queryFn: () => certificateTemplatesApi.list({ school_id: user?.linked_school }),
    enabled: !!user?.linked_school,
  })

  // Fetch certificates
  const { data: certificatesData } = useQuery({
    queryKey: ['certificates', selectedStudent],
    queryFn: () => certificatesApi.list({ student_id: selectedStudent }),
    enabled: !!selectedStudent,
  })

  // Generate certificate mutation
  const generateMutation = useMutation({
    mutationFn: (data: GenerateCertificateRequest) => certificatesApi.generate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificates'] })
      setPreviewMode(false)
      success(t('certificate_generated', { defaultValue: 'Сертификат успешно создан' }))
    },
    onError: (error: any) => {
      showError(error.response?.data?.error || error.message || t('certificate_generate_error', { defaultValue: 'Ошибка при создании сертификата' }))
    },
  })

  // Extract data from queries - ensure arrays
  const classes = Array.isArray(classesData) 
    ? classesData 
    : (Array.isArray(classesData?.results) ? classesData.results : [])
  const students = Array.isArray(studentsData)
    ? studentsData
    : (Array.isArray(studentsData?.results) ? studentsData.results : [])
  const templates = Array.isArray(templatesData)
    ? templatesData
    : (Array.isArray(templatesData?.results) ? templatesData.results : [])
  const certificates = Array.isArray(certificatesData)
    ? certificatesData
    : (Array.isArray(certificatesData?.results) ? certificatesData.results : [])

  // Download certificate
  const handleDownload = async (certificateId: string, studentName: string) => {
    try {
      const blob = await certificatesApi.download(certificateId)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `certificate_${studentName}_${format(new Date(), 'yyyy-MM-dd')}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      success(t('certificate_downloaded', { defaultValue: 'Сертификат скачан' }))
    } catch (error: any) {
      console.error('Download error:', error)
      showError(error.response?.data?.error || error.message || t('download_error', { defaultValue: 'Ошибка при скачивании' }))
    }
  }

  // Preview template with student data
  const previewHtml = useMemo(() => {
    if (!selectedTemplate || !selectedStudent) return ''

    const template = templates?.find((t: CertificateTemplate) => t.id === selectedTemplate)
    if (!template) return ''

    const student = students?.find((s: Student) => s.id === selectedStudent)
    if (!student) return ''

    let html = template.html_template
    // Replace placeholders
    html = html.replace(/\{\{student_name\}\}/g, student.user?.get_full_name || '')
    html = html.replace(/\{\{student_first_name\}\}/g, student.user?.first_name || '')
    html = html.replace(/\{\{student_last_name\}\}/g, student.user?.last_name || '')
    html = html.replace(/\{\{title\}\}/g, certificateForm.title || t('default_title', { defaultValue: 'Сертификат' }))
    html = html.replace(/\{\{issue_date\}\}/g, certificateForm.issue_date ? format(new Date(certificateForm.issue_date), 'dd.MM.yyyy') : '')
    html = html.replace(/\{\{school_name\}\}/g, 'Haileybury Almaty') // TODO: Get from school data

    return html
  }, [selectedTemplate, selectedStudent, certificateForm, templates, students, t])

  const classOptions: SelectOption[] = classes.map((classGroup: ClassGroup) => ({
    value: classGroup.id,
    label: classGroup.name,
  }))

  const studentOptions: SelectOption[] = students.map((student: Student) => ({
    value: student.id,
    label: student.user?.get_full_name || student.student_number,
  }))

  const templateOptions: SelectOption[] = templates
    .filter((t: CertificateTemplate) => t.is_active)
    .map((template: CertificateTemplate) => ({
      value: template.id,
      label: template.name,
    }))

  const selectedStudentData = students.find((s: Student) => s.id === selectedStudent)
  
  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t('title', { defaultValue: 'Генератор сертификатов' })}
          </h1>
          <p className="text-gray-600 mt-1">
            {t('description', { defaultValue: 'Создайте и скачайте сертификаты для студентов' })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Form */}
        <div className="lg:col-span-1 space-y-6">
          {/* Selection Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {t('form.title', { defaultValue: 'Создание сертификата' })}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('form.select_class', { defaultValue: 'Выберите класс' })}
                </label>
                <Select
                  value={selectedClass}
                  onChange={(e) => {
                    setSelectedClass(e.target.value)
                    setSelectedStudent('')
                  }}
                  options={classOptions}
                  placeholder={t('form.select_class_placeholder', { defaultValue: 'Выберите класс' })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('form.select_student', { defaultValue: 'Выберите студента' })}
                </label>
                <Select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  options={studentOptions}
                  placeholder={t('form.select_student_placeholder', { defaultValue: 'Выберите студента' })}
                  disabled={!selectedClass}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('form.select_template', { defaultValue: 'Выберите шаблон' })}
                </label>
                <Select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  options={templateOptions}
                  placeholder={t('form.select_template_placeholder', { defaultValue: 'Выберите шаблон' })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('form.title_field', { defaultValue: 'Название сертификата' })} *
                </label>
                <Input
                  value={certificateForm.title}
                  onChange={(e) => setCertificateForm({ ...certificateForm, title: e.target.value })}
                  placeholder={t('form.title_placeholder', { defaultValue: 'Например: Сертификат об окончании курса' })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('form.issue_date', { defaultValue: 'Дата выдачи' })}
                </label>
                <Input
                  type="date"
                  value={certificateForm.issue_date}
                  onChange={(e) => setCertificateForm({ ...certificateForm, issue_date: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('form.language', { defaultValue: 'Язык' })}
                </label>
                <Select
                  value={certificateForm.language}
                  onChange={(e) => setCertificateForm({ ...certificateForm, language: e.target.value })}
                  options={[
                    { value: 'ru', label: 'Русский' },
                    { value: 'kz', label: 'Қазақша' },
                    { value: 'en', label: 'English' },
                  ]}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => setPreviewMode(true)}
                  disabled={!selectedStudent || !selectedTemplate || !certificateForm.title}
                  variant="outline"
                  className="flex-1"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  {t('form.preview', { defaultValue: 'Предпросмотр' })}
                </Button>
                <Button
                  onClick={() => {
                    if (!selectedStudent || !certificateForm.title) return
                    generateMutation.mutate({
                      student_id: selectedStudent,
                      template_id: selectedTemplate || undefined,
                      title: certificateForm.title,
                      language: certificateForm.language,
                      issue_date: certificateForm.issue_date,
                      meta: certificateForm.meta,
                    })
                  }}
                  disabled={!selectedStudent || !certificateForm.title || generateMutation.isPending}
                  className="flex-1"
                >
                  <Award className="w-4 h-4 mr-2" />
                  {t('form.generate', { defaultValue: 'Сгенерировать' })}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Student Certificates List */}
          {selectedStudent && certificates.length > 0 && (
        <Card>
          <CardHeader>
                <CardTitle className="text-lg">
                  {t('certificates_list', { defaultValue: 'Сертификаты студента' })}
                </CardTitle>
          </CardHeader>
          <CardContent>
                <div className="space-y-2">
                  {certificates.map((cert: Certificate) => (
                    <div
                      key={cert.id}
                      className="p-3 border rounded-lg hover:bg-gray-50 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium text-sm">{cert.title}</p>
                        <p className="text-xs text-gray-500">
                          {cert.issue_date ? format(new Date(cert.issue_date), 'dd.MM.yyyy') : ''}
                        </p>
                      </div>
                      {cert.pdf_file && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownload(cert.id, cert.student_name || 'student')}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Panel - Preview */}
        <div className="lg:col-span-2">
          {previewMode && previewHtml ? (
            <Card>
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    {t('preview.title', { defaultValue: 'Предпросмотр сертификата' })}
                  </CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPreviewMode(false)}
                  >
                    <X className="w-4 h-4 mr-2" />
                    {t('preview.close', { defaultValue: 'Закрыть' })}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="bg-white p-8 min-h-[600px]">
                  <div
                    className="certificate-preview"
                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                    style={{
                      fontFamily: 'serif',
                    }}
                  />
                </div>
                <div className="p-4 border-t bg-gray-50 flex justify-end">
                  <Button
                    onClick={() => {
                      if (!selectedStudent || !certificateForm.title) return
                      generateMutation.mutate({
                        student_id: selectedStudent,
                        template_id: selectedTemplate || undefined,
                        title: certificateForm.title,
                        language: certificateForm.language,
                        issue_date: certificateForm.issue_date,
                        meta: certificateForm.meta,
                      })
                    }}
                    disabled={generateMutation.isPending}
                  >
                    <Award className="w-4 h-4 mr-2" />
                    {t('preview.generate', { defaultValue: 'Сгенерировать PDF' })}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-12 text-center text-gray-500">
                <Award className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium mb-2">
                  {t('preview.empty', { defaultValue: 'Предпросмотр недоступен' })}
                </p>
                <p className="text-sm">
                  {t('preview.empty_description', { defaultValue: 'Выберите студента и шаблон для предпросмотра' })}
            </p>
          </CardContent>
        </Card>
          )}
        </div>
      </div>

      <DialogComponent />
    </div>
  )
}
