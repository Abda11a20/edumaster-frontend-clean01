import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check, BookOpen, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import Navbar from '../components/Navbar'
import { useTranslation } from '../hooks/useTranslation'

const PaymentSuccessPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { t } = useTranslation()

  useEffect(() => {
    toast({
      title: t('payment.status.success'),
      description: t('payment.status.success_desc'),
      variant: 'default'
    })
  }, [toast, t])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('payment.success_page.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            {t('payment.success_page.desc')}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card>
            <CardHeader className="text-center">
              <CardTitle>{t('payment.success_page.what_next')}</CardTitle>
              <CardDescription>
                {t('payment.success_page.start_journey')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400 ltr:ml-3 rtl:mr-3" />
                  <div>
                    <h3 className="font-medium">{t('payment.success_page.access_content')}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {t('payment.success_page.access_desc')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <Check className="h-6 w-6 text-green-600 dark:text-green-400 ltr:ml-3 rtl:mr-3" />
                  <div>
                    <h3 className="font-medium">{t('payment.success_page.track_progress')}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {t('payment.success_page.track_desc')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row gap-4">
                <Button
                  className="flex-1"
                  onClick={() => navigate(`/lessons/${id}`)}
                >
                  <BookOpen className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                  {t('payment.success_page.go_to_lesson')}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate('/lessons')}
                >
                  <ArrowRight className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                  {t('payment.success_page.browse_more')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

export default PaymentSuccessPage