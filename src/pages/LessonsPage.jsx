import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Search,
  Play,
  Clock,
  Star,
  BookOpen,
  Grid,
  List,
  SortAsc,
  SortDesc,
  DollarSign,
  Loader,
  ExternalLink,
  Check,
  X,
  Eye,
  ChevronDown,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { lessonsAPI } from '../services/api'
import SearchService from '../services/searchService'
import LoadingSpinner from '../components/LoadingSpinner'
import Navbar from '../components/Navbar'
import YouTubeSecurePlayer from '../components/YouTubeSecurePlayer'
import { useTranslation } from '../hooks/useTranslation'

// دالة مساعدة لاستخراج YouTube ID
const extractYouTubeId = (url) => {
  if (!url) return '';
  if (url.includes('youtu.be/')) {
    return url.split('youtu.be/')[1]?.split('?')[0];
  }
  if (url.includes('youtube.com/watch')) {
    const urlObj = new URL(url);
    return urlObj.searchParams.get('v');
  }
  if (url.includes('youtube.com/embed/')) {
    return url.split('youtube.com/embed/')[1]?.split('?')[0];
  }
  if (url.length === 11 && !url.includes('/') && !url.includes('.')) {
    return url;
  }
  return url;
}

const LessonsPage = () => {
  const { t, lang } = useTranslation()
  const [lessons, setLessons] = useState([])
  const [filteredLessons, setFilteredLessons] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [lessonsError, setLessonsError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('title')
  const [sortOrder, setSortOrder] = useState('asc')
  const [viewMode, setViewMode] = useState('grid')
  const [processingLessonId, setProcessingLessonId] = useState(null)
  const [purchasedLessons, setPurchasedLessons] = useState(new Set())
  const [purchasedLessonsError, setPurchasedLessonsError] = useState(null)
  const [activeTab, setActiveTab] = useState('all')

  // حالة إدارة تشغيل الفيديو
  const [activeVideoId, setActiveVideoId] = useState(null)

  // pagination states
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const lessonRequestId = useRef(0)

  const { toast } = useToast()

  // دالة إدارة تشغيل الفيديو
  const handleVideoPlay = useCallback((lessonId) => {
    setActiveVideoId(lessonId); // تشغيل الفيديو الجديد فقط، بدون تبديل
  }, []);

  // Fetch all matching criteria server-side; purchased lessons come from their unpaginated endpoint.
  const fetchLessonsPage = useCallback(async (p = 1, append = false) => {
    const requestId = ++lessonRequestId.current
    try {
      if (append) setIsLoadingMore(true)
      else setIsLoading(true)
      setLessonsError(null)

      let lessonsData
      let pagination
      if (activeTab === 'purchased') {
        lessonsData = await lessonsAPI.getPurchasedLessons()
        pagination = { total: lessonsData.length, totalPages: 1, page: 1 }
      } else {
        const response = await lessonsAPI.getAllLessons({
          page: p,
          limit,
          title: searchQuery.trim() || undefined,
          classLevel: undefined,
          sortBy,
          sortOrder
        })

        if (Array.isArray(response?.data)) {
          lessonsData = response.data
          pagination = response.pagination ?? null
        } else if (Array.isArray(response?.lessons)) {
          lessonsData = response.lessons
          pagination = response.pagination ?? null
        } else if (Array.isArray(response?.data?.lessons)) {
          lessonsData = response.data.lessons
          pagination = response.pagination ?? response.data.pagination ?? null
        } else if (Array.isArray(response?.data?.items)) {
          lessonsData = response.data.items
          pagination = response.pagination ?? response.data.pagination ?? null
        } else if (Array.isArray(response)) {
          lessonsData = response
          pagination = null
        } else {
          const error = new Error('Unexpected lessons response')
          error.code = 'INVALID_LESSONS_RESPONSE'
          throw error
        }
      }

      if (!Array.isArray(lessonsData) || !lessonsData.every(lesson =>
        lesson && typeof lesson === 'object' && !Array.isArray(lesson) && typeof lesson._id === 'string'
      )) {
        const error = new Error('Unexpected lessons data')
        error.code = 'INVALID_LESSONS_RESPONSE'
        throw error
      }

      if (requestId !== lessonRequestId.current) return

      if (activeTab === 'purchased') {
        setPurchasedLessons(new Set(lessonsData.map(lesson => lesson._id)))
        setPurchasedLessonsError(null)
      }

      if (append) {
        setLessons(prev => {
          const merged = [...prev]
          const existingIds = new Set(prev.map(lesson => lesson._id))
          lessonsData.forEach(lesson => {
            if (!existingIds.has(lesson._id)) merged.push(lesson)
          })
          return merged
        })
      } else {
        setLessons(Array.isArray(lessonsData) ? lessonsData : [])
      }

      SearchService.updateLessonsData(lessonsData)

      if (pagination) {
        setTotal(pagination.total ?? pagination.totalItems ?? lessonsData.length)
        setTotalPages(pagination.totalPages ?? Math.ceil((pagination.total ?? lessonsData.length) / limit))
        setPage(pagination.page ?? p)
      } else {
        const returnedCount = lessonsData.length
        if (!append) setPage(p)
        setTotalPages(returnedCount === limit ? p + 1 : p)
        setTotal(prev => append ? prev + returnedCount : returnedCount)
      }
    } catch (error) {
      if (requestId !== lessonRequestId.current) return
      console.error('Error fetching lessons:', error)
      const errorMessageKey = error.code === 'INVALID_LESSONS_RESPONSE'
        ? 'lessons.messages.invalid_response'
        : activeTab === 'purchased'
          ? 'lessons.messages.fetch_purchased_error'
          : 'lessons.messages.fetch_error'
      setLessonsError({ messageKey: errorMessageKey, page: p, append })
      if (!append) {
        setLessons([])
        setTotal(0)
        setTotalPages(1)
      }
      toast({
        title: t(errorMessageKey),
        description: error.message || t('auth.login.error_connection_desc'),
        variant: 'destructive'
      })
    } finally {
      if (requestId === lessonRequestId.current) {
        setIsLoading(false)
        setIsLoadingMore(false)
      }
    }
  }, [activeTab, limit, searchQuery, sortBy, sortOrder, toast, t])

  // دالة تحميل الدروس المشتراة
  const fetchPurchasedLessons = async () => {
    try {
      const purchased = await lessonsAPI.getPurchasedLessons()
      const purchasedIds = new Set(purchased.map(lesson => lesson._id))
      setPurchasedLessons(purchasedIds)
      setPurchasedLessonsError(null)
    } catch (error) {
      console.error('Error fetching purchased lessons:', error)
      setPurchasedLessonsError(t('lessons.messages.fetch_purchased_error'))
      toast({
        title: t('lessons.messages.fetch_purchased_error'),
        description: t('common.error'),
        variant: 'destructive'
      })
    }
  }

  // دالة إعادة تعيين الفلاتر
  const resetFilters = () => {
    setSearchQuery('')
    setSortBy('title')
    setSortOrder('asc')
  }

  useEffect(() => {
    fetchPurchasedLessons()
  }, [])

  useEffect(() => {
    setPage(1)
    const timeoutId = setTimeout(() => fetchLessonsPage(1, false), 250)
    return () => clearTimeout(timeoutId)
  }, [fetchLessonsPage])

  useEffect(() => {
    let filtered = Array.isArray(lessons) ? lessons.slice() : []

    // Purchased lessons are fetched as a complete list, so their controls can safely filter locally.
    if (activeTab === 'purchased') {
      filtered = filtered.filter(lesson => purchasedLessons.has(lesson._id))
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        filtered = filtered.filter(lesson =>
          String(lesson.title || '').toLowerCase().includes(q) ||
          String(lesson.description || '').toLowerCase().includes(q)
        )
      }

      filtered.sort((a, b) => {
        let aValue = a?.[sortBy]
        let bValue = b?.[sortBy]

        if (sortBy === 'price') {
          aValue = parseFloat(aValue) || 0
          bValue = parseFloat(bValue) || 0
        } else {
          aValue = aValue == null ? '' : String(aValue)
          bValue = bValue == null ? '' : String(bValue)
          const aIsDate = !isNaN(Date.parse(aValue))
          const bIsDate = !isNaN(Date.parse(bValue))
          if (aIsDate && bIsDate) {
            const diff = new Date(aValue) - new Date(bValue)
            return sortOrder === 'asc' ? diff : -diff
          }
          aValue = aValue.toLowerCase()
          bValue = bValue.toLowerCase()
        }

        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0
        }
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0
      })
    }

    setFilteredLessons(filtered)
  }, [lessons, searchQuery, sortBy, sortOrder, activeTab, purchasedLessons])

  const handlePurchaseLesson = async (lessonId, lessonTitle, price) => {
    if (price === 0) return

    try {
      setProcessingLessonId(lessonId)

      setProcessingLessonId(lessonId)

      toast({
        title: t('lessons.messages.purchase_redirect'),
        description: t('lessons.card.payment_redirect'),
      })

      const response = await lessonsAPI.payForLesson(lessonId)

      if (response.success && response.paymentUrl) {
        // فتح صفحة الدفع في نافذة جديدة
        const paymentWindow = window.open(response.paymentUrl, '_blank', 'width=800,height=600')

        // منح الوصول فوراً للدرس (وضع تجريبي)
        setPurchasedLessons(prev => new Set([...prev, lessonId]))
        try {
          const raw = localStorage.getItem('purchasedLessonIds')
          const ids = raw ? JSON.parse(raw) : []
          if (!ids.includes(lessonId)) {
            ids.push(lessonId)
            localStorage.setItem('purchasedLessonIds', JSON.stringify(ids))
          }
        } catch (e) { }

        toast({
          title: t('lessons.messages.purchase_success'),
          description: t('lessons.messages.purchase_success_desc', { title: lessonTitle }),
          variant: 'default',
          duration: 5000
        })

        // مراقبة إغلاق نافذة الدفع (اختياري)
        const checkPaymentWindow = setInterval(() => {
          if (paymentWindow && paymentWindow.closed) {
            clearInterval(checkPaymentWindow)
          }
        }, 1000)

      } else {
        throw new Error(t('common.error'))
      }
    } catch (error) {
      console.error('Purchase error:', error)
      toast({
        title: t('lessons.messages.purchase_error'),
        description: error.message || t('common.error'),
        variant: 'destructive'
      })
    } finally {
      setProcessingLessonId(null)
    }
  }

  const loadMore = () => {
    if (page >= totalPages && totalPages !== page + 1) {
      return
    }
    const nextPage = page + 1
    fetchLessonsPage(nextPage, true)
  }

  const LessonCard = ({ lesson, index }) => {
    const isPurchased = purchasedLessons.has(lesson._id)
    const isFree = lesson.price === 0
    const hasAccess = isPurchased || isFree
    const isProcessing = processingLessonId === lesson._id
    const isVideoPlaying = activeVideoId === lesson._id

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: index * 0.1 }}
        className="h-full"
      >
        <Card className="h-full gap-3 sm:gap-6 hover:shadow-lg transition-all duration-300 group border-2 border-transparent hover:border-blue-200 dark:hover:border-blue-800 flex flex-col">
          <CardHeader className="px-3 pb-3 sm:px-6">
            <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <CardTitle className="text-sm sm:text-lg mb-1 sm:mb-2 group-hover:text-blue-600 transition-colors line-clamp-2 break-words">
                  {lesson.title}
                </CardTitle>
              </div>
              <div className="flex max-w-full flex-wrap items-center gap-1 sm:flex-col sm:items-end sm:gap-2">
                {isPurchased && (
                  <Badge variant="default" className="max-w-full truncate bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0 h-5">
                    <Check className="h-2.5 w-2.5 ml-0.5" />
                    {t('lessons.card.purchased')}
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col px-3 sm:px-6">
            <div className="flex flex-1 flex-col gap-3 sm:gap-4">
              {lesson.video && (
                <div className="relative bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden aspect-square lg:aspect-video border-2 border-gray-200 dark:border-gray-700">
                  {hasAccess ? (
                    <YouTubeSecurePlayer
                      videoId={extractYouTubeId(lesson.video)}
                      title={lesson.title}
                      isPlaying={isVideoPlaying}
                      onPlay={() => handleVideoPlay(lesson._id)}
                      className="rounded-lg"
                    />
                  ) : (
                    <>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Play className="h-6 w-6 sm:h-8 sm:w-8 text-white ml-0.5 sm:ml-1" />
                        </div>
                      </div>
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <div className="bg-black/70 text-white px-2 py-1 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm text-center">
                          {t('lessons.card.buy_to_watch')}
                        </div>
                      </div>
                      <div className="absolute bottom-2 right-2 bg-black/70 text-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-xs">
                        <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 inline mr-0.5 sm:mr-1" />
                        45 {t('common.minutes')}
                      </div>
                    </>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2 sm:gap-4">
                  <div className="flex items-center">
                    <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-400 fill-current" />
                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mr-0.5 sm:mr-1">4.8</span>
                  </div>
                </div>

                <div className="flex shrink-0 items-center">
                  <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                  <span className="text-base sm:text-lg font-bold text-green-600">{lesson.price}</span>
                  <span className="text-xs sm:text-sm text-gray-500 mr-0.5 sm:mr-1">{t('common.price_currency')}</span>
                </div>
              </div>

              <div className="mt-auto grid grid-cols-2 gap-1 sm:flex sm:gap-0 sm:space-x-2">
                <Link to={`/lessons/${lesson._id}`} state={{ lesson }} className={`min-w-0 sm:flex-1 ${isFree ? 'col-span-2 sm:col-span-1' : ''}`}>
                  <Button variant="outline" className="h-8 w-full min-w-0 px-1 text-[11px] sm:h-10 sm:px-3 sm:text-sm">
                    <span className="hidden truncate sm:inline">{t('lessons.card.details')}</span>
                    <span className="truncate sm:hidden">{t('common.details')}</span>
                  </Button>
                </Link>

                {isPurchased ? (
                  <Button className="h-8 min-w-0 px-1 text-[11px] sm:h-10 sm:flex-1 sm:px-3 sm:text-sm" variant="outline" disabled>
                    <Check className="h-3 w-3 shrink-0 sm:h-4 sm:w-4 sm:ml-2" />
                    <span className="hidden truncate sm:inline">{t('lessons.card.purchased')}</span>
                    <span className="truncate sm:hidden">{t('common.purchased')}</span>
                  </Button>
                ) : !isFree ? (
                  <Button
                    onClick={() => handlePurchaseLesson(lesson._id, lesson.title, lesson.price)}
                    className="h-8 min-w-0 px-1 text-[11px] sm:h-10 sm:flex-1 sm:px-3 sm:text-sm"
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader className="h-3 w-3 shrink-0 animate-spin sm:h-4 sm:w-4 sm:ml-2" />
                        <span className="hidden truncate sm:inline">{t('lessons.card.processing')}</span>
                      </>
                    ) : (
                      <>
                        <span className="hidden truncate sm:inline">{t('lessons.card.buy')}</span>
                        <span className="truncate sm:hidden">{t('common.buy')}</span>
                      </>
                    )}
                  </Button>
                ) : null}
              </div>

              {isProcessing && (
                <div className="break-words text-center text-[10px] sm:text-sm text-blue-600 dark:text-blue-400">
                  <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 inline ml-0.5 sm:ml-1" />
                  {t('lessons.card.payment_redirect')}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  const LessonListItem = ({ lesson, index }) => {
    const isPurchased = purchasedLessons.has(lesson._id)
    const isFree = lesson.price === 0
    const hasAccess = isPurchased || isFree
    const isProcessing = processingLessonId === lesson._id
    const isVideoPlaying = activeVideoId === lesson._id

    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: index * 0.05 }}
      >
        <Card className="mb-3 sm:mb-4 hover:shadow-md transition-shadow border-2 border-transparent hover:border-blue-200 dark:hover:border-blue-800">
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center space-x-2 sm:space-x-4 flex-1">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center flex-shrink-0">
                  {hasAccess ? (
                    <div className="w-full h-full">
                      <YouTubeSecurePlayer
                        videoId={extractYouTubeId(lesson.video)}
                        title={lesson.title}
                        isPlaying={isVideoPlaying}
                        onPlay={() => handleVideoPlay(lesson._id)}
                        className="rounded-lg"
                      />
                    </div>
                  ) : (
                    <Play className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 sm:gap-2 mb-0.5 sm:mb-1">
                    <h3 className="text-sm sm:text-base md:text-lg font-semibold truncate">{lesson.title}</h3>
                    {isPurchased && (
                      <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 text-xs px-2 py-0 h-5">
                        <Check className="h-2.5 w-2.5 ml-0.5" />
                        {t('lessons.card.purchased')}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-1 sm:mb-2 line-clamp-1">
                    {lesson.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                    <div className="flex items-center">
                      <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-400 fill-current" />
                      <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mr-0.5 sm:mr-1">4.8</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                      <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mr-0.5 sm:mr-1">45 {t('common.minutes')}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                <div className="text-right">
                  <div className="flex items-center justify-end">
                    <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                    <span className="text-lg sm:text-xl font-bold text-green-600">{lesson.price}</span>
                    <span className="text-xs sm:text-sm text-gray-500 mr-0.5 sm:mr-1">{t('common.price_currency')}</span>
                  </div>
                </div>

                <div className="flex space-x-1 sm:space-x-2">
                  <Link to={`/lessons/${lesson._id}`} state={{ lesson }}>
                    <Button variant="outline" size="sm" className="h-8 text-xs sm:text-sm">
                      <Eye className="h-3 w-3 sm:h-4 sm:w-4 ml-0.5 sm:ml-1" />
                      <span className="hidden sm:inline">{t('common.details')}</span>
                      <span className="sm:hidden">{t('common.view')}</span>
                    </Button>
                  </Link>

                  {isPurchased ? (
                    <Button size="sm" variant="outline" disabled className="h-8 text-xs sm:text-sm">
                      <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">{t('lessons.card.purchased')}</span>
                    </Button>
                  ) : !isFree ? (
                    <Button
                      size="sm"
                      onClick={() => handlePurchaseLesson(lesson._id, lesson.title, lesson.price)}
                      disabled={isProcessing}
                      className="h-8 text-xs sm:text-sm"
                    >
                      {isProcessing ? (
                        <Loader className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                      ) : (
                        <>
                          <span className="hidden sm:inline">{t('common.buy')}</span>
                          <span className="sm:hidden">{t('common.buy')}</span>
                        </>
                      )}
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>

            {isProcessing && (
              <div className="mt-2 text-center text-xs sm:text-sm text-blue-600 dark:text-blue-400">
                <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 inline ml-0.5 sm:ml-1" />
                {t('lessons.card.payment_redirect')}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  if (isLoading && lessons.length === 0) {
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

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-4 sm:mb-6"
        >
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">
            {t('lessons.title')}
          </h1>
          <p className="text-xs sm:text-sm lg:text-base text-gray-600 dark:text-gray-300">
            {t('lessons.subtitle')}
          </p>
        </motion.div>

        {/* تبويبات التصفية */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-4 sm:mb-6"
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-3 sm:mb-4">
              <TabsTrigger value="all" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                <BookOpen className="h-3 w-3 sm:h-4 sm:w-4" />
                {t('lessons.tabs.all')}
              </TabsTrigger>
              <TabsTrigger value="purchased" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                {t('lessons.tabs.purchased')}
                {purchasedLessons.size > 0 && (
                  <Badge variant="secondary" className="h-4 sm:h-5 px-1 text-xs mr-1 sm:mr-2">
                    {purchasedLessons.size}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>
          {purchasedLessonsError && activeTab === 'purchased' && (
            <div role="alert" className="mt-3 flex items-center justify-between rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <span>{purchasedLessonsError}</span>
              <Button variant="outline" size="sm" onClick={fetchPurchasedLessons}>{t('common.retry')}</Button>
            </div>
          )}
        </motion.div>

        {/* شريط البحث والفلترة */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-4 sm:mb-6"
        >
          <Card className="overflow-hidden">
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div className="flex flex-col gap-2 sm:gap-3 md:gap-4">
                {/* البحث */}
                <div className="w-full">
                  <div className="relative">
                    <Search className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                    <Input
                      placeholder={t('lessons.search_placeholder')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pr-8 sm:pr-10 pl-3 text-xs sm:text-sm"
                    />
                  </div>
                </div>

                {/* صف الفلاتر */}
                <div className="grid grid-cols-2 md:flex md:flex-row gap-2 sm:gap-3">
                  {/* الترتيب */}
                  <div className="col-span-1 md:w-32">
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-full text-xs sm:text-sm">
                        <SelectValue placeholder={t('lessons.filters.sort_by')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="title" className="text-xs sm:text-sm">{t('lessons.filters.sort_title')}</SelectItem>
                        <SelectItem value="price" className="text-xs sm:text-sm">{t('lessons.filters.sort_price')}</SelectItem>
                        <SelectItem value="classLevel" className="text-xs sm:text-sm">{t('lessons.filters.sort_level')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* زر الترتيب */}
                  <div className="col-span-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                      className="w-full md:w-auto text-xs sm:text-sm h-9 sm:h-10"
                    >
                      {sortOrder === 'asc' ? (
                        <SortAsc className="h-3 w-3 sm:h-4 sm:w-4" />
                      ) : (
                        <SortDesc className="h-3 w-3 sm:h-4 sm:w-4" />
                      )}
                      <span className="mr-1 sm:mr-2">
                        {sortOrder === 'asc' ? t('lessons.filters.sort_asc') : t('lessons.filters.sort_desc')}
                      </span>
                    </Button>
                  </div>

                  {/* أزرار عرض */}
                  <div className="col-span-2 md:col-span-1">
                    <div className="flex border rounded-md h-9 sm:h-10">
                      <Button
                        variant={viewMode === 'grid' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('grid')}
                        className="rounded-l-none rounded-r-none flex-1 sm:flex-none text-xs sm:text-sm"
                      >
                        <Grid className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="mr-1 sm:mr-2 hidden sm:inline">{t('lessons.filters.view_grid')}</span>
                      </Button>
                      <Button
                        variant={viewMode === 'list' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('list')}
                        className="rounded-r-none rounded-l-none flex-1 sm:flex-none text-xs sm:text-sm"
                      >
                        <List className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="mr-1 sm:mr-2 hidden sm:inline">{t('lessons.filters.view_list')}</span>
                      </Button>
                    </div>
                  </div>

                  {/* زر إعادة التعيين */}
                  <div className="col-span-2 md:col-span-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetFilters}
                      className="w-full md:w-auto text-xs sm:text-sm h-9 sm:h-10"
                    >
                      <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2" />
                      {t('lessons.filters.reset')}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* معلومات العدد */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-3 sm:mb-4"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
              {t('lessons.count_info', { count: filteredLessons.length, total: total || lessons.length })}
              {activeTab === 'purchased' && ` (${purchasedLessons.size} ${t('common.purchased')})`}
            </p>

            {activeTab === 'purchased' && purchasedLessons.size === 0 && (
              <Button
                onClick={() => setActiveTab('all')}
                variant="outline"
                size="sm"
                className="text-xs sm:text-sm h-8"
              >
                {t('lessons.browse_all')}
              </Button>
            )}
          </div>
        </motion.div>

        {/* عرض الدروس */}
        {lessonsError && (
          <div role="alert" className="mb-4 flex items-center justify-between rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <span>{t(lessonsError.messageKey)}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchLessonsPage(lessonsError.page, lessonsError.append)}
            >
              {t('common.retry')}
            </Button>
          </div>
        )}

        {lessonsError && !lessonsError.append ? null : filteredLessons.length > 0 ? (
          <div>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                {filteredLessons.map((lesson, index) => (
                  <LessonCard key={lesson._id} lesson={lesson} index={index} />
                ))}
              </div>
            ) : (
              <div>
                {filteredLessons.map((lesson, index) => (
                  <LessonListItem key={lesson._id} lesson={lesson} index={index} />
                ))}
              </div>
            )}

            {/* تحميل المزيد */}
            {activeTab === 'all' && (
              <div className="mt-6 sm:mt-8 flex justify-center items-center">
                {isLoadingMore ? (
                  <Button variant="outline" disabled className="text-xs sm:text-sm">
                    <LoadingSpinner size="sm" /> جاري التحميل...
                  </Button>
                ) : (
                  page < totalPages && (
                    <Button
                      onClick={loadMore}
                      className="text-xs sm:text-sm"
                    >
                      <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2" />
                      تحميل المزيد
                    </Button>
                  )
                )}
              </div>
            )}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center py-8 sm:py-12"
          >
            <BookOpen className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">
              {activeTab === 'purchased' ? 'لا توجد دروس مشتراة' : 'لا توجد دروس متاحة'}
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-4 sm:mb-6 max-w-md mx-auto">
              {activeTab === 'purchased'
                ? 'لم تشتري أي دروس بعد. ابدأ بتصفح الدروس المتاحة وشراء ما تحتاجه.'
                : 'جرب تغيير معايير البحث أو الفلترة'
              }
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button
                onClick={resetFilters}
                size="sm"
                className="text-xs sm:text-sm"
              >
                إعادة تعيين الفلاتر
              </Button>
              {activeTab === 'purchased' && (
                <Button
                  variant="outline"
                  onClick={() => setActiveTab('all')}
                  size="sm"
                  className="text-xs sm:text-sm"
                >
                  تصفح جميع الدروس
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default LessonsPage
