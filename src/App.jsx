import { useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { NotificationsProvider } from './contexts/NotificationsContext';
import { Toaster } from '@/components/ui/toaster'

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

import './App.css'

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

  return (
    <ThemeProvider>
      <NotificationsProvider>
      <AuthProvider>
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
          </div>
        </Router>
      </AuthProvider>
      </NotificationsProvider>
    </ThemeProvider>
  )
}

export default App