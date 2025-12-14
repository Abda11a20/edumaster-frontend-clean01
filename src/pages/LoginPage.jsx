import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock, GraduationCap, ArrowLeft, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from '../components/LoadingSpinner'

const LoginPage = () => {
  const [formData, setFormData] = useState({
    loginId: '', // تغيير من email إلى loginId
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const { login } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from?.pathname || '/dashboard'

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const isEmail = (value) => {
    // تحقق بسيط إذا كان الإدخال بريد إلكتروني
    return value.includes('@') && value.includes('.')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.loginId.trim()) {
      toast({
        title: 'خطأ في الإدخال',
        description: 'الرجاء إدخال البريد الإلكتروني أو رقم الهاتف',
        variant: 'destructive'
      })
      return
    }
    
    setIsLoading(true)

    try {
      // إنشاء كائن البيانات المرسلة للـ API بناءً على نوع الإدخال
      let loginData = {
        password: formData.password
      }
      
      if (isEmail(formData.loginId)) {
        loginData.email = formData.loginId
      } else {
        loginData.phoneNumber = formData.loginId
      }

      const result = await login(loginData)
      
      if (result.success) {
        toast({
          title: 'تم تسجيل الدخول بنجاح',
          description: 'مرحباً بك في منصة EduMaster'
        })
        
 if (result.success) {
  toast({
    title: 'تم تسجيل الدخول بنجاح',
    description: 'مرحباً بك في منصة EduMaster'
  })

  navigate(from, { replace: true })
}

      } else {
        // استخدام رسالة الخطأ التي تأتي من الخادم مباشرة
        let errorMessage = result.error || 'تحقق من البيانات المدخلة'
        
        // رسائل مخصصة لأخطاء محددة من الخادم
        if (errorMessage.includes('password') || errorMessage.includes('كلمة المرور')) {
          errorMessage = 'كلمة المرور غير صحيحة'
        } else if (errorMessage.includes('email') || errorMessage.includes('البريد') || errorMessage.includes('phone') || errorMessage.includes('هاتف')) {
          errorMessage = 'البريد الإلكتروني أو رقم الهاتف غير صحيح'
        } else if (errorMessage.includes('انتهت الجلسة')) {
          errorMessage = 'انتهت جلسة العمل، يرجى تسجيل الدخول مرة أخرى'
        }
        
        toast({
          title: 'خطأ في تسجيل الدخول',
          description: errorMessage,
          variant: 'destructive'
        })
      }
    } catch (error) {
      // معالجة أخطاء الشبكة أو الأخطاء الغير متوقعة
      let errorDescription = 'تحقق من اتصالك بالإنترنت وحاول مرة أخرى'
      
      toast({
        title: 'خطأ في الاتصال',
        description: errorDescription,
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <Link to="/" className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            العودة للرئيسية
          </Link>
          <div className="flex items-center justify-center mb-4">
            <GraduationCap className="h-10 w-10 text-blue-600 dark:text-blue-400" />
            <span className="ml-2 text-2xl font-bold text-gray-900 dark:text-white">EduMaster</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            مرحباً بعودتك
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            سجل دخولك للمتابعة رحلتك التعليمية
          </p>
        </motion.div>

        {/* Login Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-center text-gray-900 dark:text-white">
                تسجيل الدخول
              </CardTitle>
              <CardDescription className="text-center text-gray-600 dark:text-gray-300">
                أدخل بريدك الإلكتروني أو رقم هاتفك للوصول إلى حسابك
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="loginId" className="text-gray-700 dark:text-gray-300">
                    البريد الإلكتروني أو رقم الهاتف
                  </Label>
                  <div className="relative">
                    <div className="absolute left-3 top-3 flex items-center">
                      {isEmail(formData.loginId) ? (
                        <Mail className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Phone className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                    <Input
                      id="loginId"
                      name="loginId"
                      type="text"
                      placeholder="أدخل بريدك الإلكتروني أو رقم هاتفك"
                      value={formData.loginId}
                      onChange={handleChange}
                      className="pl-10"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    يمكنك استخدام البريد الإلكتروني أو رقم الهاتف المسجل
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-700 dark:text-gray-300">
                    كلمة المرور
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="أدخل كلمة المرور"
                      value={formData.password}
                      onChange={handleChange}
                      className="pl-10 pr-10"
                      required
                      disabled={isLoading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Link
                    to="/forgot-password"
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    نسيت كلمة المرور؟
                  </Link>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      جاري تسجيل الدخول...
                    </>
                  ) : (
                    'تسجيل الدخول'
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  ليس لديك حساب؟{' '}
                  <Link
                    to="/register"
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                  >
                    إنشاء حساب جديد
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

export default LoginPage