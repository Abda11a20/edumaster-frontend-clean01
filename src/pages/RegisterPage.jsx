import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock, User, Phone, GraduationCap, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from '../components/LoadingSpinner'
import { useTranslation } from '../hooks/useTranslation'

const RegisterPage = () => {
  const { t } = useTranslation()
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    cpassword: '',
    phoneNumber: '',
    classLevel: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const { register, isAuthenticated } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard')
    }
  }, [isAuthenticated, navigate])

  const classLevels = [
    t('class_levels.grade1'),
    t('class_levels.grade2'),
    t('class_levels.grade3')
  ]

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSelectChange = (value) => {
    setFormData({
      ...formData,
      classLevel: value
    })
  }

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      toast({
        title: t('auth.login.error_input'),
        description: t('auth.register.error_fullname'),
        variant: 'destructive'
      })
      return false
    }

    if (!formData.email.trim()) {
      toast({
        title: t('auth.login.error_input'),
        description: t('auth.register.error_email'),
        variant: 'destructive'
      })
      return false
    }

    if (formData.password.length < 8) {
      toast({
        title: t('auth.login.error_input'),
        description: t('auth.register.error_password_length'),
        variant: 'destructive'
      })
      return false
    }

    if (formData.password !== formData.cpassword) {
      toast({
        title: t('auth.login.error_input'),
        description: t('auth.register.error_password_match'),
        variant: 'destructive'
      })
      return false
    }

    if (!formData.phoneNumber.trim()) {
      toast({
        title: t('auth.login.error_input'),
        description: t('auth.register.error_phone'),
        variant: 'destructive'
      })
      return false
    }

    if (!formData.classLevel) {
      toast({
        title: t('auth.login.error_input'),
        description: t('auth.register.error_class'),
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
      // إعداد البيانات للإرسال بشكل يتوافق مع ما يتوقعه الخادم
      const registrationData = {
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        cpassword: formData.cpassword,
        phoneNumber: formData.phoneNumber,
        classLevel: formData.classLevel
      }

      const result = await register(registrationData)

      if (result.success) {
        toast({
          title: t('auth.register.success'),
          description: t('auth.register.success_desc')
        })
        navigate('/login')
      } else {
        toast({
          title: t('auth.register.error_failed'),
          description: result.error || t('common.error'),
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Registration error:', error)
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
            {t('auth.login.back_home')}
          </Link>
          <div className="flex items-center justify-center mb-4">
            <GraduationCap className="h-10 w-10 text-blue-600 dark:text-blue-400" />
            <span className="ml-2 text-2xl font-bold text-gray-900 dark:text-white">{t('navbar.logo')}</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('auth.register.join_us')}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {t('auth.register.join_us_sub')}
          </p>
        </motion.div>

        {/* Registration Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-center text-gray-900 dark:text-white">
                {t('auth.register.title')}
              </CardTitle>
              <CardDescription className="text-center text-gray-600 dark:text-gray-300">
                {t('auth.register.subtitle')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-gray-700 dark:text-gray-300">
                    {t('auth.register.fullname')}
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="fullName"
                      name="fullName"
                      type="text"
                      placeholder={t('auth.register.fullname_placeholder')}
                      value={formData.fullName}
                      onChange={handleChange}
                      className="pl-10"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">
                    {t('auth.register.email')}
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder={t('auth.register.email_placeholder')}
                      value={formData.email}
                      onChange={handleChange}
                      className="pl-10"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber" className="text-gray-700 dark:text-gray-300">
                    {t('auth.register.phone')}
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="phoneNumber"
                      name="phoneNumber"
                      type="tel"
                      placeholder={t('auth.register.phone_placeholder')}
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      className="pl-10"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="classLevel" className="text-gray-700 dark:text-gray-300">
                    {t('auth.register.class_level')}
                  </Label>
                  <Select onValueChange={handleSelectChange} disabled={isLoading}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('auth.register.class_level_placeholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      {classLevels.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-700 dark:text-gray-300">
                    {t('auth.register.password')}
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder={t('auth.register.password_placeholder')}
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

                <div className="space-y-2">
                  <Label htmlFor="cpassword" className="text-gray-700 dark:text-gray-300">
                    {t('auth.register.cpassword')}
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="cpassword"
                      name="cpassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder={t('auth.register.cpassword_placeholder')}
                      value={formData.cpassword}
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
                      <LoadingSpinner size="sm" className="mr-2" />
                      {t('auth.register.submitting')}
                    </>
                  ) : (
                    t('auth.register.submit')
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {t('auth.register.has_account')}{' '}
                  <Link
                    to="/login"
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                  >
                    {t('auth.register.login_link')}
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

export default RegisterPage