import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpen, Clock, User, CreditCard, Check, Loader, Download, FileText, Play, Shield, ArrowLeft, GraduationCap, Video, Infinity } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { lessonsAPI } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'
import Navbar from '../components/Navbar'
import YouTubeSecurePlayer from '../components/YouTubeSecurePlayer'
import { useTranslation } from '../hooks/useTranslation'

// Helper to extract YouTube ID
const extractYouTubeId = (url) => {
  if (!url) return ''
  if (url.includes('youtu.be/')) {
    return url.split('youtu.be/')[1]?.split('?')[0]
  }
  if (url.includes('youtube.com/watch')) {
    const urlObj = new URL(url)
    return urlObj.searchParams.get('v')
  }
  if (url.includes('youtube.com/embed/')) {
    return url.split('youtube.com/embed/')[1]?.split('?')[0]
  }
  if (url.length === 11 && !url.includes('/') && !url.includes('.')) {
    return url
  }
  return url
}

const LessonDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t, lang } = useTranslation()
  const [lesson, setLesson] = useState(null)
  const [isPurchased, setIsPurchased] = useState(false)
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('content')
  const { toast } = useToast()

  // دالة للتحقق من حالة الشراء من الباك إند و localStorage
  const checkPurchaseStatus = async () => {
    try {
      // التحقق من الباك إند أولاً
      const purchasedLessons = await lessonsAPI.getPurchasedLessons()
      const purchased = purchasedLessons.some(l => l._id === id)
      setIsPurchased(purchased)
      return purchased
    } catch (e) {
      // في حالة الخطأ، تحقق من localStorage
      try {
        const raw = localStorage.getItem('purchasedLessonIds')
        const ids = raw ? JSON.parse(raw) : []
        const purchased = Array.isArray(ids) && ids.includes(id)
        setIsPurchased(purchased)
        return purchased
      } catch (e2) {
        setIsPurchased(false)
        return false
      }
    }
  }

  useEffect(() => {
    const fetchLessonData = async () => {
      try {
        setIsLoading(true)
        const lessonData = await lessonsAPI.getLessonById(id)
        setLesson(lessonData.data || lessonData)

        // Check if user purchased the lesson
        await checkPurchaseStatus()
      } catch (error) {
        console.error('Error fetching lesson data:', error)
        toast({
          title: t('dashboard.error_load'),
          description: t('lessons.messages.fetch_error'),
          variant: 'destructive'
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchLessonData()
  }, [id, toast, t])

  // استماع لتغييرات localStorage (للتحديث التلقائي عند الشراء من تبويب آخر)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'purchasedLessonIds') {
        checkPurchaseStatus()
      }
    }

    window.addEventListener('storage', handleStorageChange)

    // فحص دوري كل ثانية للتأكد من تحديث الحالة
    const interval = setInterval(() => {
      checkPurchaseStatus()
    }, 2000)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [id])

  const handlePurchase = async () => {
    try {
      setIsPurchasing(true)

      const response = await lessonsAPI.payForLesson(id)

      if (response.success && response.paymentUrl) {
        window.open(response.paymentUrl, '_blank', 'noopener,noreferrer')
        setIsPurchased(true)
        try {
          const raw = localStorage.getItem('purchasedLessonIds')
          const ids = raw ? JSON.parse(raw) : []
          if (!ids.includes(id)) {
            ids.push(id)
            localStorage.setItem('purchasedLessonIds', JSON.stringify(ids))
          }
        } catch (e) { }

        toast({
          title: t('lessons.detail.subscribed_success'),
          description: t('lessons.messages.purchase_success'),
          variant: 'default',
          duration: 5000
        })
      } else {
        throw new Error('No payment URL')
      }
    } catch (error) {
      console.error('Purchase error:', error)
      toast({
        title: t('lessons.messages.purchase_error'),
        description: t('common.error'),
        variant: 'destructive'
      })
    } finally {
      setIsPurchasing(false)
    }
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

  if (!lesson) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-600 dark:text-gray-300">{t('common.not_found')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <Button
            variant="ghost"
            onClick={() => navigate('/lessons')}
            className="gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
            {t('common.back')}
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Badge variant="secondary">{lesson.classLevel || t('common.unknown')}</Badge>
            {lesson.duration && <Badge variant="outline">{lesson.duration} {t('common.minutes')}</Badge>}
            {lesson.category && <Badge variant="secondary">{lesson.category}</Badge>}
          </div>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {lesson.title}
          </h1>

          <div className="flex items-center gap-4 mb-4 text-sm text-gray-600 dark:text-gray-300">
            {lesson.teacher && (
              <div className="flex items-center">
                <User className="h-4 w-4 rtl:ml-0 rtl:mr-1 ltr:ml-1" />
                <span>{lesson.teacher}</span>
              </div>
            )}
            {lesson.createdAt && (
              <div className="flex items-center">
                <Clock className="h-4 w-4 rtl:ml-0 rtl:mr-1 ltr:ml-1" />
                <span>{new Date(lesson.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-GB')}</span>
              </div>
            )}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-2 space-y-6"
          >
            {isPurchased ? (
              // المحتوى مفتوح - عرض الفيديو
              <Card>
                <CardHeader>
                  <CardTitle>{t('lessons.detail.watch_lesson')}</CardTitle>
                  <CardDescription>
                    {t('lessons.detail.watch_desc')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {lesson.video ? (
                    <div className="aspect-video bg-black rounded-lg overflow-hidden">
                      <YouTubeSecurePlayer
                        videoId={extractYouTubeId(lesson.video)}
                        title={lesson.title}
                      />
                    </div>
                  ) : (
                    <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                      <p className="text-gray-500">{t('lessons.detail.no_video')}</p>
                    </div>
                  )}

                  {lesson.attachments && lesson.attachments.length > 0 && (
                    <div className="p-6 pt-4">
                      <Button variant="outline" className="w-full">
                        <Download className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                        {t('lessons.detail.download_materials')}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              // المحتوى مغلق - يحتاج شراء
              <Card className="bg-gray-100 dark:bg-gray-800">
                <CardContent className="p-6 text-center">
                  <div className="mx-auto w-16 h-16 bg-gray-300 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                    <BookOpen className="h-8 w-8 text-gray-500" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">{t('lessons.detail.locked_content')}</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    {t('lessons.detail.locked_desc')}
                  </p>
                  <Button onClick={handlePurchase} disabled={isPurchasing}>
                    {isPurchasing ? (
                      <>
                        <Loader className="h-4 w-4 ltr:mr-2 rtl:ml-2 animate-spin" />
                        {t('lessons.detail.redirecting')}
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                        {t('lessons.detail.subscribe_to_watch')}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Description */}
            <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5 text-blue-500" />
                  {t('lessons.detail.description')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {lesson.description || t('lessons.detail.no_desc')}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Subscription Info - Platform Theme */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="sticky top-24 border border-gray-200 dark:border-gray-700 shadow-xl bg-white dark:bg-gray-800 overflow-hidden">
              <CardHeader className="pb-4 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                    <GraduationCap className="h-5 w-5 text-white" />
                  </div>
                  <CardTitle className="text-lg text-gray-900 dark:text-white">{t('lessons.detail.subscription_details')}</CardTitle>
                </div>
                <CardDescription className="text-gray-500 dark:text-gray-400">
                  {t('lessons.detail.access_full')}
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-5 space-y-5">
                {/* Price Section */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-750 rounded-xl p-4 text-center border border-gray-200 dark:border-gray-600">
                  <span className="text-gray-500 dark:text-gray-400 text-sm">{t('lessons.detail.price')}</span>
                  <div className="text-3xl font-bold mt-1 text-gray-900 dark:text-white">
                    {lesson.price || 0} <span className="text-lg font-normal text-gray-600 dark:text-gray-300">{t('payment.order_details.currency')}</span>
                  </div>
                </div>

                {/* Features List */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-lg">
                      <BookOpen className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-200">{t('lessons.detail.direct_access')}</span>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <div className="p-2 bg-blue-100 dark:bg-blue-500/20 rounded-lg">
                      <Download className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-200">{t('lessons.detail.downloadable_resources')}</span>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <div className="p-2 bg-orange-100 dark:bg-orange-500/20 rounded-lg">
                      <Video className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-200">
                      {lesson.duration ? `${lesson.duration} ${t('common.minutes')}` : t('lessons.detail.video_content')}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <div className="p-2 bg-purple-100 dark:bg-purple-500/20 rounded-lg">
                      <Infinity className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-200">{t('lessons.detail.lifetime_access')}</span>
                  </div>
                </div>

                {/* Action Button */}
                <Button
                  className={`w-full h-12 text-base font-semibold shadow-lg transition-all duration-300 ${isPurchased
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                    : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'
                    }`}
                  onClick={handlePurchase}
                  disabled={isPurchasing || isPurchased}
                >
                  {isPurchased ? (
                    <>
                      <Check className="h-5 w-5 ltr:mr-2 rtl:ml-2" />
                      {t('lessons.detail.subscribed_success')}
                    </>
                  ) : isPurchasing ? (
                    <>
                      <Loader className="h-5 w-5 ltr:mr-2 rtl:ml-2 animate-spin" />
                      {t('lessons.detail.redirecting')}
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-5 w-5 ltr:mr-2 rtl:ml-2" />
                      {t('lessons.detail.subscribe_now')}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default LessonDetailPage