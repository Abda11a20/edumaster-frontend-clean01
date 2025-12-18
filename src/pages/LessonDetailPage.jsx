import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpen, Clock, User, CreditCard, Check, Loader, Download, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { lessonsAPI } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'
import Navbar from '../components/Navbar'
import CustomVideoPlayer from '../components/CustomVideoPlayer'
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

  useEffect(() => {
    const fetchLessonData = async () => {
      try {
        setIsLoading(true)
        const lessonData = await lessonsAPI.getLessonById(id)
        setLesson(lessonData)

        // Check if user purchased the lesson
        try {
          const purchasedLessons = await lessonsAPI.getPurchasedLessons()
          const isAlreadyPurchased = purchasedLessons.some(l => l._id === id)
          setIsPurchased(isAlreadyPurchased)
        } catch (error) {
          console.warn('Could not fetch purchased lessons, assuming not purchased:', error)
          setIsPurchased(false)
        }
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Badge variant="secondary">{lesson.classLevel}</Badge>
            <Badge variant="outline">{t('exams.card.minutes').replace('min', lesson.duration)}</Badge>
            {lesson.category && <Badge variant="secondary">{lesson.category}</Badge>}
          </div>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {lesson.title}
          </h1>

          <div className="flex items-center gap-4 mb-4 text-sm text-gray-600 dark:text-gray-300">
            {lesson.teacher && (
              <div className="flex items-center">
                <User className="h-4 w-4 rtl:ml-0 rtl:mr-1 ltr:ml-1" />
                <span>{t('lessons.detail.teacher', { name: lesson.teacher })}</span>
              </div>
            )}
            <div className="flex items-center">
              <Clock className="h-4 w-4 rtl:ml-0 rtl:mr-1 ltr:ml-1" />
              <span>{t('lessons.detail.published_on', { date: new Date(lesson.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-GB') })}</span>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-2 space-y-6"
          >
            {isPurchased && lesson.video ? (
              <Card>
                <CardHeader>
                  <CardTitle>{t('lessons.detail.watch_lesson')}</CardTitle>
                  <CardDescription>
                    {t('lessons.detail.watch_desc')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="aspect-video bg-black rounded-lg overflow-hidden">
                    <CustomVideoPlayer
                      videoId={extractYouTubeId(lesson.video)}
                      title={lesson.title}
                    />
                  </div>

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
            <Card>
              <CardHeader>
                <CardTitle>{t('lessons.detail.description')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300 text-lg">
                  {lesson.description || t('lessons.detail.no_desc')}
                </p>
              </CardContent>
            </Card>

            {/* Lesson Info */}
            <Card>
              <CardHeader>
                <CardTitle>{t('lessons.detail.info')}</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="mb-4 flex flex-wrap h-auto gap-2">
                    <TabsTrigger value="content" className="flex-1 min-w-[100px]">{t('lessons.detail.content')}</TabsTrigger>
                    <TabsTrigger value="resources" className="flex-1 min-w-[100px]">{t('lessons.detail.resources')}</TabsTrigger>
                    <TabsTrigger value="info" className="flex-1 min-w-[100px]">{t('lessons.detail.additional_info')}</TabsTrigger>
                  </TabsList>

                  <TabsContent value="content">
                    <div className="prose dark:prose-invert max-w-none">
                      {lesson.content || t('lessons.detail.no_content')}
                    </div>
                  </TabsContent>

                  <TabsContent value="resources">
                    {lesson.attachments && lesson.attachments.length > 0 ? (
                      <div className="space-y-2">
                        {lesson.attachments.map((attachment, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center">
                              <FileText className="h-5 w-5 ltr:mr-2 rtl:ml-2 text-gray-500" />
                              <span>{attachment.name}</span>
                            </div>
                            <Button variant="outline" size="sm">
                              <Download className="h-4 w-4 ltr:mr-1 rtl:ml-1" />
                              {t('common.download')}
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">{t('lessons.detail.no_resources')}</p>
                    )}
                  </TabsContent>

                  <TabsContent value="info">
                    <div className="space-y-4">
                      {lesson.objectives && (
                        <div>
                          <h4 className="font-medium mb-2">{t('lessons.detail.objectives')}</h4>
                          <ul className="list-disc list-inside space-y-1">
                            {lesson.objectives.map((obj, idx) => (
                              <li key={idx}>{obj}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {lesson.requirements && (
                        <div>
                          <h4 className="font-medium mb-2">{t('lessons.detail.requirements')}</h4>
                          <ul className="list-disc list-inside space-y-1">
                            {lesson.requirements.map((req, idx) => (
                              <li key={idx}>{req}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>

          {/* Subscription Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>{t('lessons.detail.subscription_details')}</CardTitle>
                <CardDescription>
                  {t('lessons.detail.access_full')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-300">{t('lessons.detail.price')}</span>
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                      {lesson.price} {t('payment.order_details.currency')}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                      <BookOpen className="h-4 w-4 ltr:mr-2 rtl:ml-2 text-green-500" />
                      {t('lessons.detail.direct_access')}
                    </div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                      <Download className="h-4 w-4 ltr:mr-2 rtl:ml-2 text-blue-500" />
                      {t('lessons.detail.downloadable_resources')}
                    </div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                      <Clock className="h-4 w-4 ltr:mr-2 rtl:ml-2 text-orange-500" />
                      {t('lessons.detail.duration_content', { duration: lesson.duration })}
                    </div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                      <Check className="h-4 w-4 ltr:mr-2 rtl:ml-2 text-purple-500" />
                      {t('lessons.detail.lifetime_access')}
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    onClick={handlePurchase}
                    disabled={isPurchasing || isPurchased}
                  >
                    {isPurchased ? (
                      <>
                        <Check className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                        {t('lessons.detail.subscribed_success')}
                      </>
                    ) : isPurchasing ? (
                      <>
                        <Loader className="h-4 w-4 ltr:mr-2 rtl:ml-2 animate-spin" />
                        {t('lessons.detail.redirecting')}
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                        {t('lessons.detail.subscribe_now')}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default LessonDetailPage