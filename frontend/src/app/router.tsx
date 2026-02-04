import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/shared/lib/auth'
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { TeacherJournalPage } from '@/pages/teacher/JournalPage'
import { TeacherSchedulePage } from '@/pages/teacher/SchedulePage'
import { TeacherAttendancePage } from '@/pages/teacher/AttendancePage'
import { ParentOverviewPage } from '@/pages/parent/OverviewPage'
import { AdminSchoolsPage } from '@/pages/admin/SchoolsPage'
import { SchoolFormPage } from '@/pages/admin/SchoolFormPage'
import { SchoolDetailPage } from '@/pages/admin/SchoolDetailPage'
import { AcademicYearFormPage } from '@/pages/admin/AcademicYearFormPage'
import { SchoolSettingsPage } from '@/pages/admin/SchoolSettingsPage'
import { AdminSchedulePage } from '@/pages/admin/SchedulePage'
import { ImportExportPage } from '@/pages/admin/ImportExportPage'
import { PermissionsPage } from '@/pages/admin/PermissionsPage'
import { JoinRequestsPage } from '@/pages/admin/JoinRequestsPage'
import { SubjectsPage } from '@/pages/admin/SubjectsPage'
import { CertificatesPage } from '@/pages/certificates/CertificatesPage'
import { ProfilePage } from '@/pages/profile/ProfilePage'
import { useTranslationWithNamespace } from '@/shared/lib/i18n/hooks'
import { namespaces } from '@/shared/lib/i18n/config'
import { Layout } from '@/widgets/layout/Layout'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { t } = useTranslationWithNamespace(namespaces.common)
  const { isAuthenticated, isLoading } = useAuth()
  
  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary/20 border-t-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground text-[15px]">{t('loading')}</p>
        </div>
      </div>
    )
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  return <Layout>{children}</Layout>
}

export function Router() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/journal"
        element={
          <ProtectedRoute>
            <TeacherJournalPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/schedule"
        element={
          <ProtectedRoute>
            <TeacherSchedulePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/attendance"
        element={
          <ProtectedRoute>
            <TeacherAttendancePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/parent/overview"
        element={
          <ProtectedRoute>
            <ParentOverviewPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/schools"
        element={
          <ProtectedRoute>
            <AdminSchoolsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/schools/new"
        element={
          <ProtectedRoute>
            <SchoolFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/schools/:id"
        element={
          <ProtectedRoute>
            <SchoolDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/schools/:id/edit"
        element={
          <ProtectedRoute>
            <SchoolFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/schools/:schoolId/years/new"
        element={
          <ProtectedRoute>
            <AcademicYearFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/schools/:schoolId/years/:id/edit"
        element={
          <ProtectedRoute>
            <AcademicYearFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/school-settings"
        element={
          <ProtectedRoute>
            <SchoolSettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/schedule"
        element={
          <ProtectedRoute>
            <AdminSchedulePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/import-export"
        element={
          <ProtectedRoute>
            <ImportExportPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/subjects"
        element={
          <ProtectedRoute>
            <SubjectsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/permissions"
        element={
          <ProtectedRoute>
            <PermissionsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/join-requests"
        element={
          <ProtectedRoute>
            <JoinRequestsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/certificates"
        element={
          <ProtectedRoute>
            <CertificatesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

