import { useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider, useTheme } from './contexts/ThemeContext'
import { NotificationsProvider } from './contexts/NotificationsContext'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as SonnerToaster } from 'sonner'
import { I18nProvider } from './i18n/I18nProvider'
import { initializeInterceptor } from './services/apiInterceptor'

import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import SuperAdminRoute from './components/SuperAdminRoute'

// Pages
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import DashboardPage from './pages/DashboardPage'
import LessonsPage from './pages/LessonsPage'
import PaymentPage from './pages/PaymentPage'
import PaymentSuccessPage from './pages/PaymentSuccessPage'
import LessonDetailPage from './pages/LessonDetailPage'
import ExamsPage from './pages/ExamsPage'
import ExamDetailPage from './pages/ExamDetailPage'
import TakeExamPage from './pages/TakeExamPage'
import ExamResultPage from './pages/ExamResultPage'
import ProfilePage from './pages/ProfilePage'
import StudentResultsPage from './pages/StudentResultsPage'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminLessons from './pages/admin/AdminLessons'
import AdminExams from './pages/admin/AdminExams'
import AdminUsers from './pages/admin/AdminUsers'
import AdminAdmins from './pages/admin/AdminAdmins'
import AdminQuestions from './pages/admin/AdminQuestions'
import AdminExamResults from './pages/admin/AdminExamResults'
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard'
import DebugPage from './pages/DebugPage'

import './App.css'

// Internal component to access theme context
function AppContent() {
  const { toast } = useToast()
  const { theme } = useTheme()

  return (
    <>
      <Router>
        <div className="min-h-screen bg-background">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Protected Student Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } />
            <Route path="/lessons" element={
              <ProtectedRoute>
                <LessonsPage />
              </ProtectedRoute>
            } />
            <Route path="/payment/:id" element={
              <ProtectedRoute>
                <PaymentPage />
              </ProtectedRoute>
            } />
            <Route path="/payment/success/:id" element={
              <ProtectedRoute>
                <PaymentSuccessPage />
              </ProtectedRoute>
            } />
            <Route path="/lessons/:id" element={
              <ProtectedRoute>
                <LessonDetailPage />
              </ProtectedRoute>
            } />
            <Route path="/exams" element={
              <ProtectedRoute>
                <ExamsPage />
              </ProtectedRoute>
            } />
            <Route path="/exams/:id" element={
              <ProtectedRoute>
                <ExamDetailPage />
              </ProtectedRoute>
            } />
            <Route path="/exams/:id/take" element={
              <ProtectedRoute>
                <TakeExamPage />
              </ProtectedRoute>
            } />
            <Route path="/exams/:id/result" element={
              <ProtectedRoute>
                <ExamResultPage />
              </ProtectedRoute>
            } />
            <Route path="/results" element={
              <ProtectedRoute>
                <StudentResultsPage />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } />

            {/* Debug Page */}
            <Route path="/debug" element={
              <ProtectedRoute>
                <DebugPage />
              </ProtectedRoute>
            } />

            {/* Admin Routes */}
            <Route path="/super-admin" element={
              <SuperAdminRoute>
                <SuperAdminDashboard />
              </SuperAdminRoute>
            } />
            <Route path="/super-admin/admins" element={
              <SuperAdminRoute>
                <AdminAdmins />
              </SuperAdminRoute>
            } />
            <Route path="/super-admin/users" element={
              <SuperAdminRoute>
                <AdminUsers />
              </SuperAdminRoute>
            } />
            <Route path="/admin" element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } />
            <Route path="/admin/lessons" element={
              <AdminRoute>
                <AdminLessons />
              </AdminRoute>
            } />
            <Route path="/admin/exams" element={
              <AdminRoute>
                <AdminExams />
              </AdminRoute>
            } />
            <Route path="/admin/exam-results" element={
              <AdminRoute>
                <AdminExamResults />
              </AdminRoute>
            } />
            <Route path="/admin/questions" element={
              <AdminRoute>
                <AdminQuestions />
              </AdminRoute>
            } />
            <Route path="/admin/users" element={
              <AdminRoute>
                <AdminUsers />
              </AdminRoute>
            } />
            <Route path="/admin/admins" element={
              <SuperAdminRoute>
                <AdminAdmins />
              </SuperAdminRoute>
            } />

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster />
          {/* Sonner Toaster with theme support */}
          <SonnerToaster
            theme={theme}
            position="top-center"
            expand={false}
            closeButton
            toastOptions={{
              style: {
                padding: '16px 20px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '500',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05)',
              },
              classNames: {
                error: 'toast-error-custom',
                success: 'toast-success-custom',
              }
            }}
          />
        </div>
      </Router>
    </>
  )
}

function App() {
  const { toast } = useToast()

  useEffect(() => {
    // اضف هنا origins الموثوقة لمزوّد الدفع الذي تستخدمه (مثال: Paymob)
    const trustedOrigins = [
      'https://accept.paymob.com'
      // إذا كان هناك origins أخرى أضفها هنا مثل: 'https://your-provider.com'
    ]

    const handleMessage = (event) => {
      try {
        // تحقق من المصدر أولاً لحماية التطبيق
        if (!trustedOrigins.includes(event.origin)) return

        const data = event.data
        if (!data) return

        // نتوقع رسالة من النافذة الخارجية بشكل: { type: 'PAYMENT_COMPLETED', lessonId?, message? }
        if (data.type === 'PAYMENT_COMPLETED') {
          toast({
            title: 'تم الدفع بنجاح',
            description: data?.message || 'تمت عملية الدفع بنجاح',
            variant: 'default'
          })

          // توجيه اختياري لصفحة نجاح الدفع داخل التطبيق (يحمِل lessonId إن وُجد)
          if (data.lessonId) {
            window.location.href = `/payment/success/${data.lessonId}`
          }
        }
      } catch (err) {
        // لا تقاطع التطبيق إن حصل خطأ — سجل فقط للمراجعة
        // eslint-disable-next-line no-console
        console.error('handleMessage error:', err)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [toast])

  // Initialize API interceptor with language getter
  useEffect(() => {
    // Get language from localStorage (same as I18nProvider)
    const getLang = () => localStorage.getItem('language') || 'en';
    initializeInterceptor(getLang);
  }, []);

  return (
    <I18nProvider>
      <ThemeProvider>
        <NotificationsProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </NotificationsProvider>
      </ThemeProvider>
    </I18nProvider>
  )
}

export default App