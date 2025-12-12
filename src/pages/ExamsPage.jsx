import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Calendar, Clock, BarChart3, BookOpen, Search, Filter, CheckCircle, XCircle, Users, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { examsAPI } from '../services/api'
import SearchService from '../services/searchService'
import { timeService } from '../services/timeService'
import LoadingSpinner from '../components/LoadingSpinner'
import Navbar from '../components/Navbar'

const ExamsPage = () => {
  const [exams, setExams] = useState([])
  const [filteredExams, setFilteredExams] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showActiveOnly, setShowActiveOnly] = useState(true)
  const [error, setError] = useState(null)
  const { toast } = useToast()

  const fetchExams = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // التحقق من وجود التوكن
      const token = localStorage.getItem('token')
      if (!token) {
        setError('يجب تسجيل الدخول للوصول إلى الامتحانات')
        toast({
          title: 'يجب تسجيل الدخول',
          description: 'يرجى تسجيل الدخول للوصول إلى الامتحانات',
          variant: 'destructive'
        })
        return
      }

      // جلب الامتحانات
      const examsData = await examsAPI.getAllExams({ page: 1, limit: 100 })
      
      if (!examsData || examsData.length === 0) {
        setError('لا توجد امتحانات متاحة في الوقت الحالي')
        setExams([])
        setFilteredExams([])
        return
      }
      
      // معالجة البيانات
      const processedExams = examsData.map(exam => {
        // استخراج بيانات الامتحان من الهياكل المختلفة
        const examData = exam.exam || exam.data || exam
        
        return {
          _id: examData._id || exam._id,
          title: examData.title || examData.name || 'بدون عنوان',
          description: examData.description || 'لا يوجد وصف',
          subject: examData.subject || examData.classLevel || 'غير محدد',
          duration: examData.duration || 60,
          questionsCount: examData.questionsCount || examData.numberOfQuestions || 
                        (examData.questions ? examData.questions.length : 0),
          totalScore: examData.totalScore || 100,
          deadline: examData.endDate || examData.deadline,
          startDate: examData.startDate,
          endDate: examData.endDate || examData.deadline,
          isPublished: examData.isPublished !== false,
          classLevel: examData.classLevel,
          passingScore: examData.passingScore || 60,
          createdAt: examData.createdAt
        }
      })
      
      setExams(processedExams)
      setFilteredExams(processedExams)
      
      // تحديث بيانات الامتحانات في خدمة البحث
      SearchService.updateExamsData(processedExams);
      
    } catch (error) {
      let errorMessage = 'خطأ في تحميل الامتحانات'
      
      if (error.message?.includes('Session expired') || error.status === 401) {
        errorMessage = 'انتهت جلسة العمل. يرجى تسجيل الدخول مرة أخرى'
        localStorage.removeItem('token')
        window.location.href = '/login'
      } else if (error.message?.includes('Network')) {
        errorMessage = 'خطأ في الاتصال بالإنترنت'
      } else {
        errorMessage = error.message || 'حدث خطأ غير معروف'
      }
      
      setError(errorMessage)
      toast({
        title: 'خطأ',
        description: errorMessage,
        variant: 'destructive'
      })
      
      setExams([])
      setFilteredExams([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchExams()
  }, [])

  useEffect(() => {
    let filtered = [...exams]
    
    // فلترة حسب حالة النشاط (لم تنته بعد)
    if (showActiveOnly) {
      const now = new Date()
      filtered = filtered.filter(exam => {
        if (!exam.endDate) return true
        
        try {
          const endDate = new Date(exam.endDate)
          return endDate > now
        } catch (error) {
          return true
        }
      })
    }
    
    // فلترة حسب البحث
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(exam =>
        String(exam.title || '').toLowerCase().includes(q) ||
        String(exam.description || '').toLowerCase().includes(q) ||
        String(exam.subject || '').toLowerCase().includes(q)
      )
    }
    
    setFilteredExams(filtered)
  }, [exams, searchQuery, showActiveOnly])

  const ExamCard = ({ exam, index }) => {
    const isActive = () => {
      if (!exam.endDate) return true
      try {
        const endDate = new Date(exam.endDate)
        return endDate > new Date()
      } catch (error) {
        return true
      }
    }
    
    const getTimeRemaining = () => {
      if (!exam.endDate) return 'غير محدد'
      
      try {
        const endDate = new Date(exam.endDate)
        const now = new Date()
        const diffMs = endDate - now
        
        if (diffMs <= 0) return 'منتهي'
        
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
        const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        
        if (diffDays > 0) {
          return `${diffDays} يوم ${diffHours} ساعة`
        } else if (diffHours > 0) {
          return `${diffHours} ساعة`
        } else {
          const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
          return `${diffMinutes} دقيقة`
        }
      } catch (error) {
        return 'غير محدد'
      }
    }
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: index * 0.1 }}
      >
        <Card className="h-full hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <CardTitle className="text-lg">{exam.title}</CardTitle>
                  {isActive() ? (
                    <Badge variant="success" className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      نشط
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="flex items-center gap-1">
                      <XCircle className="h-3 w-3" />
                      منتهي
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-sm line-clamp-2">
                  {exam.description}
                </CardDescription>
              </div>
              <Badge variant="secondary" className="ml-2">
                {exam.subject}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4">
              {/* معلومات الامتحان */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-blue-500 ml-2" />
                  <div>
                    <p className="text-gray-500">المدة</p>
                    <p className="font-semibold">{exam.duration} دقيقة</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <BookOpen className="h-4 w-4 text-green-500 ml-2" />
                  <div>
                    <p className="text-gray-500">الأسئلة</p>
                    <p className="font-semibold">{exam.questionsCount}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <BarChart3 className="h-4 w-4 text-yellow-500 ml-2" />
                  <div>
                    <p className="text-gray-500">الدرجة</p>
                    <p className="font-semibold">{exam.totalScore}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-purple-500 ml-2" />
                  <div>
                    <p className="text-gray-500">الوقت المتبقي</p>
                    <p className="font-semibold">{getTimeRemaining()}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-2 rtl:space-x-reverse">
                <Link to={`/exams/${exam._id}`} className="flex-1">
                  <Button variant="outline" className="w-full">
                    عرض التفاصيل
                  </Button>
                </Link>
                <Link to={`/exams/${exam._id}`} className="flex-1">
                  <Button className="w-full" disabled={!isActive()}>
                    بدء الامتحان
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
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
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            الامتحانات
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            اختبر معرفتك من خلال الامتحانات التفاعلية
          </p>
        </motion.div>

        {/* Error Alert */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8"
        >
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="البحث في الامتحانات..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <Label htmlFor="active-only" className="text-sm text-gray-600 dark:text-gray-300">
                    عرض الامتحانات النشطة فقط
                  </Label>
                  <Switch
                    id="active-only"
                    checked={showActiveOnly}
                    onCheckedChange={setShowActiveOnly}
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={fetchExams}
                    className="flex items-center"
                  >
                    <span>تحديث</span>
                  </Button>
                  
                  <Badge variant={showActiveOnly ? "default" : "outline"}>
                    {showActiveOnly ? "النشطة فقط" : "جميع الامتحانات"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Results Count */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-6 flex items-center justify-between"
        >
          <p className="text-gray-600 dark:text-gray-300">
            عرض {filteredExams.length} من {exams.length} امتحان
          </p>
          
          {showActiveOnly && (
            <Badge variant="outline" className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              {filteredExams.length} امتحان نشط
            </Badge>
          )}
        </motion.div>

        {/* Exams Grid */}
        {filteredExams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExams.map((exam, index) => (
              <ExamCard key={exam._id} exam={exam} index={index} />
            ))}
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
              {exams.length === 0 ? 'لا توجد امتحانات متاحة' : 'لم يتم العثور على امتحانات'}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {exams.length === 0 
                ? 'لا توجد امتحانات في النظام حالياً' 
                : 'جرب إلغاء الفلتر أو تغيير معايير البحث'
              }
            </p>
            <Button onClick={fetchExams}>
              تحديث القائمة
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default ExamsPage