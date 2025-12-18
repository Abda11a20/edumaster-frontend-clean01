import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check, Shield, Lock, CreditCard, ArrowLeft, Loader } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { lessonsAPI } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'
import Navbar from '../components/Navbar'
import { useTranslation } from '../hooks/useTranslation'

const PaymentPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { t } = useTranslation()
  const [lesson, setLesson] = useState(null)
  const [paymentUrl, setPaymentUrl] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState('pending') // pending, success, failed

  useEffect(() => {
    const initPayment = async () => {
      try {
        setIsLoading(true)

        // الحصول على تفاصيل الدرس
        const lessonData = await lessonsAPI.getLessonById(id)
        setLesson(lessonData)

        // محاكاة عملية الدفع (في الواقع سيكون لديك API حقيقي)
        simulatePaymentProcess()

      } catch (error) {
        console.error('Error initializing payment:', error)
        toast({
          title: t('lessons.messages.purchase_error'),
          description: t('common.error'),
          variant: 'destructive'
        })
        navigate('/lessons')
      } finally {
        setIsLoading(false)
      }
    }

    initPayment()
  }, [id, navigate, toast])

  const simulatePaymentProcess = () => {
    // في البيئة الحقيقية، ستقوم بالاتصال بـ API الدفع هنا
    // هذا مجرد محاكاة للتوضيح
    setTimeout(() => {
      setPaymentUrl('https://accept.paymob.com/api/acceptance/iframes/823432?payment_token=Z2LTZLaXJsclpQdmVCZlRmWWF0eGNLaGxfaGZmR194VURQS2c=')
    }, 1500)
  }

  const handlePayment = async () => {
    try {
      setIsProcessing(true)

      // في الوضع التجريبي، نمنح الوصول فوراً
      setPaymentStatus('success')
      toast({
        title: t('payment.status.success'),
        description: t('payment.status.success_desc'),
        variant: 'default'
      })

      // الانتقال إلى صفحة الدرس بعد ثانيتين
      setTimeout(() => {
        navigate(`/lessons/${id}`)
      }, 2000)

    } catch (error) {
      console.error('Payment error:', error)
      setPaymentStatus('failed')
      toast({
        title: t('payment.status.failed'),
        description: t('payment.status.failed_desc'),
        variant: 'destructive'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleExternalPayment = () => {
    // فتح صفحة الدفع الخارجية في نافذة جديدة
    window.open(paymentUrl, '_blank')

    // في الوضع التجريبي، نمنح الوصول فوراً
    setPaymentStatus('success')
    toast({
      title: t('payment.status.success'),
      description: t('payment.status.success_desc'),
      variant: 'default'
    })

    // الانتقال إلى صفحة الدرس بعد ثانيتين
    setTimeout(() => {
      navigate(`/lessons/${id}`)
    }, 2000)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6"
        >
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="flex items-center mb-4"
          >
            <ArrowLeft className="h-4 w-4 ml-2" />
            {t('payment.back')}
          </Button>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('payment.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {t('payment.subtitle')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* معلومات الطلب */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-2"
          >
            <Card>
              <CardHeader>
                <CardTitle>{t('payment.order_details.title')}</CardTitle>
                <CardDescription>
                  {t('payment.order_details.subtitle')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {lesson && (
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                        <CreditCard className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                          {lesson.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300">
                          {lesson.description || t('exams.detail.no_desc')}
                        </p>
                        <div className="flex items-center mt-2">
                          <Badge variant="secondary" className="ml-2">
                            {lesson.classLevel}
                          </Badge>
                          <Badge variant="outline" className="ml-2">
                            {lesson.duration} {t('common.minutes')}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {lesson.price} {t('common.price_currency')}
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                      <div className="flex justify-between items-center py-2">
                        <span className="text-gray-600 dark:text-gray-300">{t('payment.order_details.price')}</span>
                        <span className="font-medium">{lesson.price} {t('common.price_currency')}</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-gray-600 dark:text-gray-300">{t('payment.order_details.tax')}</span>
                        <span className="font-medium">0 {t('common.price_currency')}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-t border-gray-200 dark:border-gray-700">
                        <span className="text-lg font-bold text-gray-900 dark:text-white">{t('payment.order_details.total')}</span>
                        <span className="text-lg font-bold text-gray-900 dark:text-white">{lesson.price} {t('common.price_currency')}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* معلومات الدفع الآمن */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 ml-2 text-green-600" />
                  {t('payment.secure.title')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4">
                  <Lock className="h-6 w-6 text-green-600 mt-1" />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {t('payment.secure.subtitle')}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      {t('payment.secure.desc')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* عملية الدفع */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>{t('payment.checkout.title')}</CardTitle>
                <CardDescription>
                  {t('payment.checkout.subtitle')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {paymentStatus === 'pending' ? (
                  <div className="space-y-4">
                    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <h4 className="font-medium mb-2">{t('payment.checkout.card.title')}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                        {t('payment.checkout.card.desc')}
                      </p>
                      <Button
                        className="w-full"
                        onClick={handlePayment}
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <>
                            <Loader className="h-4 w-4 ml-2 animate-spin" />
                            {t('payment.checkout.card.processing')}
                          </>
                        ) : (
                          <>
                            <CreditCard className="h-4 w-4 ml-2" />
                            {t('payment.checkout.card.button')}
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <h4 className="font-medium mb-2">{t('payment.checkout.paymob.title')}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                        {t('payment.checkout.paymob.desc')}
                      </p>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={handleExternalPayment}
                      >
                        {t('payment.checkout.paymob.button')}
                      </Button>
                    </div>
                  </div>
                ) : paymentStatus === 'success' ? (
                  <div className="text-center py-6">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {t('payment.status.success')}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      {t('payment.status.success_desc')}
                    </p>
                    <Button
                      className="w-full"
                      onClick={() => navigate(`/lessons/${id}`)}
                    >
                      {t('payment.status.go_to_lesson')}
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Lock className="h-8 w-8 text-red-600 dark:text-red-400" />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {t('payment.status.failed')}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      {t('payment.status.failed_desc')}
                    </p>
                    <Button
                      className="w-full"
                      onClick={() => setPaymentStatus('pending')}
                    >
                      {t('payment.status.retry')}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default PaymentPage