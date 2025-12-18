import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock, Key, ArrowLeft, GraduationCap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from '../components/LoadingSpinner'
import { useTranslation } from '../hooks/useTranslation'

const ResetPasswordPage = () => {
  const { t, lang, toggleLanguage } = useTranslation()
  const [formData, setFormData] = useState({
    email: '',
    otp: '',
    newPassword: '',
    cpassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const { resetPassword } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const validateForm = () => {
    if (!formData.email.trim()) {
      toast({
        title: t('auth.forgot_password.error_data'),
        description: t('auth.forgot_password.error_email_required'),
        variant: 'destructive'
      })
      return false
    }

    if (!formData.otp.trim()) {
      toast({
        title: t('auth.forgot_password.error_data'),
        description: t('auth.reset_password.error_otp_required'),
        variant: 'destructive'
      })
      return false
    }

    if (formData.newPassword.length < 8) {
      toast({
        title: t('auth.register.error_password_length'),
        description: t('auth.reset_password.error_password_length'),
        variant: 'destructive'
      })
      return false
    }

    if (formData.newPassword !== formData.cpassword) {
      toast({
        title: t('auth.register.error_password_match'),
        description: t('auth.reset_password.error_mismatch'),
        variant: 'destructive'
      })
      return false
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)

    try {
      const result = await resetPassword(formData)

      if (result.success) {
        toast({
          title: t('auth.reset_password.success'),
          description: t('auth.reset_password.success_desc')
        })
        navigate('/login')
      } else {
        toast({
          title: t('auth.reset_password.error_failed'),
          description: result.error || t('common.error'),
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: t('auth.login.error_connection'),
        description: t('auth.login.error_connection_desc'),
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900 flex items-center justify-center p-4 relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleLanguage}
        className="absolute top-4 right-4 font-bold"
      >
        {lang === 'ar' ? 'English' : 'العربية'}
      </Button>
      <div className="w-full max-w-md">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <Link to="/forgot-password" className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-4">
            <ArrowLeft className="h-4 w-4 rtl:ml-2 ltr:mr-2" />
            {t('auth.reset_password.back')}
          </Link>
          <div className="flex items-center justify-center mb-4">
            <GraduationCap className="h-10 w-10 text-blue-600 dark:text-blue-400" />
            <span className="ml-2 text-2xl font-bold text-gray-900 dark:text-white">{t('common.app_name')}</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('auth.reset_password.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {t('auth.reset_password.subtitle')}
          </p>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-center text-gray-900 dark:text-white">
                {t('auth.reset_password.form_title')}
              </CardTitle>
              <CardDescription className="text-center text-gray-600 dark:text-gray-300">
                {t('auth.reset_password.form_subtitle')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">
                    {t('auth.login.email_or_phone')}
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400 rtl:right-3 rtl:left-auto" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder={t('auth.forgot_password.email_placeholder')}
                      value={formData.email}
                      onChange={handleChange}
                      className="pl-10 rtl:pr-10 rtl:pl-4"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="otp" className="text-gray-700 dark:text-gray-300">
                    {t('auth.reset_password.otp')}
                  </Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-3 h-4 w-4 text-gray-400 rtl:right-3 rtl:left-auto" />
                    <Input
                      id="otp"
                      name="otp"
                      type="text"
                      placeholder={t('auth.reset_password.otp_placeholder')}
                      value={formData.otp}
                      onChange={handleChange}
                      className="pl-10 rtl:pr-10 rtl:pl-4"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-gray-700 dark:text-gray-300">
                    {t('auth.reset_password.new_password')}
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400 rtl:right-3 rtl:left-auto" />
                    <Input
                      id="newPassword"
                      name="newPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder={t('auth.reset_password.new_password_placeholder')}
                      value={formData.newPassword}
                      onChange={handleChange}
                      className="pl-10 pr-10 rtl:pl-10 rtl:pr-4"
                      required
                      disabled={isLoading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent rtl:left-0 rtl:right-auto"
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

                <div className="space-y-2">
                  <Label htmlFor="cpassword" className="text-gray-700 dark:text-gray-300">
                    {t('auth.reset_password.confirm_password')}
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400 rtl:right-3 rtl:left-auto" />
                    <Input
                      id="cpassword"
                      name="cpassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder={t('auth.reset_password.confirm_password_placeholder')}
                      value={formData.cpassword}
                      onChange={handleChange}
                      className="pl-10 pr-10 rtl:pl-10 rtl:pr-4"
                      required
                      disabled={isLoading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent rtl:left-0 rtl:right-auto"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={isLoading}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <LoadingSpinner size="sm" className="ltr:mr-2 rtl:ml-2" />
                      {t('auth.reset_password.submitting')}
                    </>
                  ) : (
                    t('auth.reset_password.submit')
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {t('common.remembered')}{' '}
                  <Link
                    to="/login"
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                  >
                    {t('auth.login.submit')}
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

export default ResetPasswordPage
