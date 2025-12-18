import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, ArrowLeft, GraduationCap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from '../components/LoadingSpinner'
import { useTranslation } from '../hooks/useTranslation'

const ForgotPasswordPage = () => {
  const { t, lang, toggleLanguage } = useTranslation()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isEmailSent, setIsEmailSent] = useState(false)

  const { forgotPassword } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!email.trim()) {
      toast({
        title: t('auth.forgot_password.error_data'),
        description: t('auth.forgot_password.error_email_required'),
        variant: 'destructive'
      })
      return
    }

    setIsLoading(true)

    try {
      const result = await forgotPassword(email)

      if (result.success) {
        setIsEmailSent(true)
        toast({
          title: t('auth.forgot_password.success'),
          description: t('auth.forgot_password.success_desc')
        })
      } else {
        toast({
          title: t('auth.forgot_password.error_send'),
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

  if (isEmailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
          >
            <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-2xl text-gray-900 dark:text-white">
                  {t('auth.forgot_password.success')}
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-300">
                  {t('auth.forgot_password.success_desc')}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
                  {t('auth.forgot_password.sent_to')} <strong>{email}</strong>
                </p>
                <div className="space-y-3">
                  <Link to="/reset-password">
                    <Button className="w-full">
                      {t('auth.forgot_password.reset_link')}
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button variant="outline" className="w-full">
                      {t('auth.forgot_password.back_login')}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    )
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
          <Link to="/login" className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-4">
            <ArrowLeft className="h-4 w-4 rtl:ml-2 ltr:mr-2" />
            {t('auth.forgot_password.back_login')}
          </Link>
          <div className="flex items-center justify-center mb-4">
            <GraduationCap className="h-10 w-10 text-blue-600 dark:text-blue-400" />
            <span className="ml-2 text-2xl font-bold text-gray-900 dark:text-white">{t('common.app_name')}</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('auth.forgot_password.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {t('auth.forgot_password.subtitle')}
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
                {t('auth.forgot_password.title')}
              </CardTitle>
              <CardDescription className="text-center text-gray-600 dark:text-gray-300">
                {t('auth.forgot_password.subtitle')}
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
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 rtl:pr-10 rtl:pl-4"
                      required
                      disabled={isLoading}
                    />
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
                      {t('auth.forgot_password.submitting')}
                    </>
                  ) : (
                    t('auth.forgot_password.submit')
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

export default ForgotPasswordPage
