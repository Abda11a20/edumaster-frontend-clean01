import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Search, 
  Filter, 
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
  ShoppingBag,
  Eye
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { lessonsAPI } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'
import Navbar from '../components/Navbar'
import YouTubeSecurePlayer from '../components/YouTubeSecurePlayer'

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
  const [lessons, setLessons] = useState([])
  const [filteredLessons, setFilteredLessons] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedClassLevel, setSelectedClassLevel] = useState('all')
  const [sortBy, setSortBy] = useState('title')
  const [sortOrder, setSortOrder] = useState('asc')
  const [viewMode, setViewMode] = useState('grid')
  const [processingLessonId, setProcessingLessonId] = useState(null)
  const [purchasedLessons, setPurchasedLessons] = useState(new Set())
  const [activeTab, setActiveTab] = useState('all') // 'all' أو 'purchased'

  // pagination states
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const { toast } = useToast()

  const classLevels = [
    { value: 'all', label: 'جميع المراحل' },
    { value: 'Grade 1 Secondary', label: 'الصف الأول الثانوي' },
    { value: 'Grade 2 Secondary', label: 'الصف الثاني الثانوي' },
    { value: 'Grade 3 Secondary', label: 'الصف الثالث الثانوي' }
  ]

  // دالة تحميل صفحة من الدروس
  const fetchLessonsPage = async (p = 1, append = false) => {
    try {
      if (append) setIsLoadingMore(true)
      else setIsLoading(true)

      const response = await lessonsAPI.getAllLessons({ page: p, limit })

      let lessonsData = []
      let pagination = null

      if (Array.isArray(response)) {
        lessonsData = response
        pagination = null
      } else if (response?.lessons || response?.data?.lessons) {
        lessonsData = response.lessons ?? response.data.lessons
        pagination = response.pagination ?? response.data.pagination
      } else if (response?.data && Array.isArray(response.data)) {
        lessonsData = response.data
      } else if (response?.data?.items) {
        lessonsData = response.data.items
        pagination = response.data.pagination ?? null
      } else if (response?.data) {
        if (Array.isArray(response.data)) {
          lessonsData = response.data
        } else if (response.data.lessons) {
          lessonsData = response.data.lessons
          pagination = response.data.pagination ?? null
        } else {
          lessonsData = response.lessons ?? response.items ?? []
        }
      } else {
        lessonsData = response.lessons ?? response.items ?? []
      }

      if (append) {
        setLessons(prev => {
          const merged = [...prev]
          const existingIds = new Set(prev.map(l => l._id))
          lessonsData.forEach(l => {
            if (!existingIds.has(l._id)) merged.push(l)
          })
          return merged
        })
      } else {
        setLessons(Array.isArray(lessonsData) ? lessonsData : [])
      }

      if (pagination) {
        setTotal(pagination.total ?? (pagination.totalItems ?? 0))
        setTotalPages(pagination.totalPages ?? Math.ceil((pagination.total ?? 0) / (pagination.limit ?? limit)))
        setPage(pagination.page ?? p)
      } else {
        const returnedCount = Array.isArray(lessonsData) ? lessonsData.length : 0
        if (!append) {
          setPage(p)
        }
        if (returnedCount === limit) {
          setTotalPages(p + 1)
        } else {
          setTotalPages(p)
        }
        setTotal(prev => {
          const currentCount = append ? prev + returnedCount : returnedCount
          return currentCount
        })
      }
    } catch (error) {
      console.error('Error fetching lessons:', error)
      toast({
        title: 'خطأ في تحميل الدروس',
        description: error.message || 'تحقق من اتصالك بالإنترنت وحاول مرة أخرى',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }

  // دالة تحميل الدروس المشتراة
  const fetchPurchasedLessons = async () => {
    try {
      const purchased = await lessonsAPI.getPurchasedLessons()
      const purchasedIds = new Set(purchased.map(lesson => lesson._id))
      setPurchasedLessons(purchasedIds)
    } catch (error) {
      console.error('Error fetching purchased lessons:', error)
      toast({
        title: 'خطأ في تحميل الدروس المشتراة',
        description: 'تعذر تحميل قائمة الدروس المشتراة',
        variant: 'destructive'
      })
    }
  }

  useEffect(() => {
    fetchLessonsPage(1, false)
    fetchPurchasedLessons()
  }, [])

  useEffect(() => {
    let filtered = Array.isArray(lessons) ? lessons.slice() : []

    // تطبيق الفلتر حسب التبويب النشط
    if (activeTab === 'purchased') {
      filtered = filtered.filter(lesson => purchasedLessons.has(lesson._id))
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(lesson =>
        String(lesson.title || '').toLowerCase().includes(q) ||
        String(lesson.description || '').toLowerCase().includes(q)
      )
    }

    if (selectedClassLevel !== 'all') {
      filtered = filtered.filter(lesson => lesson.classLevel === selectedClassLevel)
    }

    const safeToSort = Array.isArray(filtered) ? [...filtered] : []
    const sorted = safeToSort.sort((a, b) => {
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
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0
      }
    })

    setFilteredLessons(sorted)
  }, [lessons, searchQuery, selectedClassLevel, sortBy, sortOrder, activeTab, purchasedLessons])

  const handlePurchaseLesson = async (lessonId, lessonTitle) => {
    try {
      setProcessingLessonId(lessonId)

      toast({
        title: 'جاري توجيهك إلى صفحة الدفع',
        description: 'سيتم فتح صفحة الدفع في نافذة جديدة',
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
        } catch (e) {}

        toast({
          title: 'تم منح الوصول للدرس!',
          description: `تم شراء الدرس "${lessonTitle}" بنجاح في الوضع التجريبي`,
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
        throw new Error('فشل في الحصول على رابط الدفع')
      }
    } catch (error) {
      console.error('Purchase error:', error)
      toast({
        title: 'خطأ في عملية الشراء',
        description: error.message || 'حدث خطأ أثناء توجيهك إلى صفحة الدفع',
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
    const isProcessing = processingLessonId === lesson._id
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: index * 0.1 }}
      >
        <Card className="h-full hover:shadow-lg transition-all duration-300 group border-2 border-transparent hover:border-blue-200 dark:hover:border-blue-800">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg mb-2 group-hover:text-blue-600 transition-colors">
                  {lesson.title}
                </CardTitle>
                <CardDescription className="text-sm line-clamp-2">
                  {lesson.description}
                </CardDescription>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge variant="secondary">
                  {lesson.classLevel}
                </Badge>
                {isPurchased && (
                  <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                    <Check className="h-3 w-3 ml-1" />
                    مشترى
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4">
              {lesson.video && (
                <div className="relative bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden aspect-video border-2 border-gray-200 dark:border-gray-700">
                  {isPurchased ? (
                    <YouTubeSecurePlayer 
                      videoId={extractYouTubeId(lesson.video)}
                      title={lesson.title}
                    />
                  ) : (
                    <>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Play className="h-8 w-8 text-white ml-1" />
                        </div>
                      </div>
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <div className="bg-black/70 text-white px-3 py-2 rounded-lg text-sm">
                          اضغط لشراء الدرس للمشاهدة
                        </div>
                      </div>
                      <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                        <Clock className="h-3 w-3 inline mr-1" />
                        45 دقيقة
                      </div>
                    </>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-sm text-gray-600 dark:text-gray-300 mr-1">4.8</span>
                  </div>
                  <div className="flex items-center">
                    <BookOpen className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-300 mr-1">120 طالب</span>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="text-lg font-bold text-green-600">{lesson.price}</span>
                  <span className="text-sm text-gray-500 mr-1">ج.م</span>
                </div>
              </div>

              <div className="flex space-x-2">
                <Link to={`/lessons/${lesson._id}`} className="flex-1">
                  <Button variant="outline" className="w-full">
                    <Eye className="h-4 w-4 ml-2" />
                    عرض التفاصيل
                  </Button>
                </Link>
                
                {isPurchased ? (
                  <Button className="flex-1" variant="outline" disabled>
                    <Check className="h-4 w-4 ml-2" />
                    تم الشراء
                  </Button>
                ) : (
                  <Button 
                    onClick={() => handlePurchaseLesson(lesson._id, lesson.title)}
                    className="flex-1"
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader className="h-4 w-4 ml-2 animate-spin" />
                        جاري التوجيه...
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="h-4 w-4 ml-2" />
                        شراء الدرس
                      </>
                    )}
                  </Button>
                )}
              </div>
              
              {isProcessing && (
                <div className="text-center text-sm text-blue-600 dark:text-blue-400">
                  <ExternalLink className="h-4 w-4 inline ml-1" />
                  سيتم فتح صفحة الدفع في نافذة جديدة
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
    const isProcessing = processingLessonId === lesson._id
    
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: index * 0.05 }}
      >
        <Card className="mb-4 hover:shadow-md transition-shadow border-2 border-transparent hover:border-blue-200 dark:hover:border-blue-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 flex-1">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  {isPurchased ? (
                    <YouTubeSecurePlayer 
                      videoId={extractYouTubeId(lesson.video)}
                      title={lesson.title}
                    />
                  ) : (
                    <Play className="h-8 w-8 text-blue-600" />
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold">{lesson.title}</h3>
                    {isPurchased && (
                      <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 text-xs">
                        <Check className="h-3 w-3 ml-1" />
                        مشترى
                      </Badge>
                    )}
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-2 line-clamp-1">
                    {lesson.description}
                  </p>
                  <div className="flex items-center space-x-4">
                    <Badge variant="secondary">{lesson.classLevel}</Badge>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-sm text-gray-600 dark:text-gray-300 mr-1">4.8</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-300 mr-1">45 دقيقة</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="text-xl font-bold text-green-600">{lesson.price}</span>
                    <span className="text-sm text-gray-500 mr-1">ج.م</span>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Link to={`/lessons/${lesson._id}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 ml-2" />
                      التفاصيل
                    </Button>
                  </Link>
                  
                  {isPurchased ? (
                    <Button size="sm" variant="outline" disabled>
                      <Check className="h-4 w-4" />
                      تم الشراء
                    </Button>
                  ) : (
                    <Button 
                      size="sm"
                      onClick={() => handlePurchaseLesson(lesson._id, lesson.title)}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <Loader className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <ShoppingBag className="h-4 w-4 ml-2" />
                          شراء
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
            
            {isProcessing && (
              <div className="mt-3 text-center text-sm text-blue-600 dark:text-blue-400">
                <ExternalLink className="h-4 w-4 inline ml-1" />
                سيتم فتح صفحة الدفع في نافذة جديدة
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
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            الدروس التعليمية
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            اكتشف مجموعة واسعة من الدروس التفاعلية المصممة لمساعدتك في تحقيق أهدافك الأكاديمية
          </p>
        </motion.div>

        {/* تبويبات التصفية */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-6"
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="all" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                جميع الدروس
              </TabsTrigger>
              <TabsTrigger value="purchased" className="flex items-center gap-2">
                <Check className="h-4 w-4" />
                الدروس المشتراة
                {purchasedLessons.size > 0 && (
                  <Badge variant="secondary" className="h-5 px-1 text-xs">
                    {purchasedLessons.size}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8"
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="البحث في الدروس..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <Select value={selectedClassLevel} onValueChange={setSelectedClassLevel}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="المرحلة الدراسية" />
                  </SelectTrigger>
                  <SelectContent>
                    {classLevels.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full md:w-32">
                    <SelectValue placeholder="ترتيب حسب" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="title">العنوان</SelectItem>
                    <SelectItem value="price">السعر</SelectItem>
                    <SelectItem value="classLevel">المرحلة</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="w-full md:w-auto"
                >
                  {sortOrder === 'asc' ? (
                    <SortAsc className="h-4 w-4" />
                  ) : (
                    <SortDesc className="h-4 w-4" />
                  )}
                </Button>

                <div className="flex border rounded-md">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="rounded-r-none"
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="rounded-l-none"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between">
            <p className="text-gray-600 dark:text-gray-300">
              عرض {filteredLessons.length} من {total || lessons.length} درس
              {activeTab === 'purchased' && ` (${purchasedLessons.size} مشترى)`}
            </p>
            
            {activeTab === 'purchased' && purchasedLessons.size === 0 && (
              <Button 
                onClick={() => setActiveTab('all')}
                variant="outline"
                size="sm"
              >
                تصفح جميع الدروس
              </Button>
            )}
          </div>
        </motion.div>

        {filteredLessons.length > 0 ? (
          <div>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

            {activeTab === 'all' && (
              <div className="mt-8 flex justify-center items-center space-x-3">
                {isLoadingMore ? (
                  <Button variant="outline" disabled>
                    <LoadingSpinner size="sm" /> جاري التحميل...
                  </Button>
                ) : (
                  page < totalPages && (
                    <Button onClick={loadMore}>
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
            className="text-center py-12"
          >
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {activeTab === 'purchased' ? 'لا توجد دروس مشتراة' : 'لا توجد دروس متاحة'}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {activeTab === 'purchased' 
                ? 'لم تشتري أي دروس بعد. ابدأ بتصفح الدروس المتاحة وشراء ما تحتاجه.'
                : 'جرب تغيير معايير البحث أو الفلترة'
              }
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => {
                setSearchQuery('')
                setSelectedClassLevel('all')
              }}>
                إعادة تعيين الفلاتر
              </Button>
              {activeTab === 'purchased' && (
                <Button variant="outline" onClick={() => setActiveTab('all')}>
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