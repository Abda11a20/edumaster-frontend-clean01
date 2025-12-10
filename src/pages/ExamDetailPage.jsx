import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Clock, Calendar, BarChart3, BookOpen, ArrowLeft, Play, Users, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { examsAPI } from '../services/api'
import { timeService } from '../services/timeService'
import LoadingSpinner from '../components/LoadingSpinner'
import Navbar from '../components/Navbar'

const ExamDetailPage = () => {
  const { id } = useParams()
  const [exam, setExam] = useState(null)
  const [hasAttempt, setHasAttempt] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isStarting, setIsStarting] = useState(false)
  const [error, setError] = useState(null)
  const { toast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    const fetchExam = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        console.log('📡 جلب تفاصيل الامتحان...')
        const examData = await examsAPI.getExamById(id)
        
        console.log('📦 بيانات الامتحان:', examData)
        
        if (!examData) {
          throw new Error('الامتحان غير موجود')
        }
        
        // تحقق من هيكل البيانات
        let examDetails = examData.data || examData
        
        // إذا كان يحتوي على حقل exam بداخله
        if (examDetails.exam) {
          examDetails = { ...examDetails, ...examDetails.exam }
        }
        
        setExam(examDetails)
        
        // التحقق إذا كان المستخدم قد حاول الامتحان من قبل
        try {
          const attempt = await examsAPI.checkExamAttempt(id)
          setHasAttempt(attempt)
        } catch (attemptError) {
          console.log('لا يمكن التحقق من المحاولات:', attemptError)
        }
        
      } catch (error) {
        console.error('Error fetching exam:', error)
        
        let errorMessage = 'خطأ في تحميل الامتحان'
        if (error.message?.includes('Exam not found') || error.status === 404) {
          errorMessage = 'الامتحان غير موجود'
        } else if (error.message?.includes('Session expired') || error.status === 401) {
          errorMessage = 'انتهت جلسة العمل'
          localStorage.removeItem('token')
          navigate('/login')
        }
        
        setError(errorMessage)
        toast({
          title: 'خطأ',
          description: errorMessage,
          variant: 'destructive'
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (id) {
      fetchExam()
    }
  }, [id, toast, navigate])

  const handleStartExam = async () => {
    try {
      setIsStarting(true)
      
      // بدء الامتحان من خلال API
      const startResponse = await examsAPI.startExam(id)
      
      if (startResponse) {
        toast({
          title: 'تم بدء الامتحان',
          description: 'حظاً موفقاً!',
          variant: 'default'
        })
        
        // اذهب إلى صفحة الامتحان
        navigate(`/exams/${id}/take`)
      }
    } catch (error) {
      console.error('Error starting exam:', error)
      
      let errorMessage = 'خطأ في بدء الامتحان'
      if (error.message?.includes('already submitted')) {
        errorMessage = 'لقد قدمت هذا الامتحان بالفعل'
      } else if (error.message?.includes('already started')) {
        errorMessage = 'لقد بدأت هذا الامتحان بالفعل'
        navigate(`/exams/${id}/take`)
        return
      }
      
      toast({
        title: 'خطأ',
        description: errorMessage,
        variant: 'destructive'
      })
    } finally {
      setIsStarting(false)
    }
  }

  const handleViewResult = () => {
    navigate(`/exams/${id}/result`)
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

  if (error || !exam) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {error || 'الامتحان غير موجود'}
            </h1>
            <Link to="/exams">
              <Button>
                <ArrowLeft className="h-4 w-4 ml-2" />
                العودة إلى الامتحانات
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // التحقق من حالة الامتحان
  const isExamActive = () => {
    if (!exam.endDate) return true
    try {
      const endDate = new Date(exam.endDate)
      return endDate > new Date()
    } catch (error) {
      return true
    }
  }

  const isActive = isExamActive()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link to="/exams">
            <Button variant="ghost" className="flex items-center">
              <ArrowLeft className="h-4 w-4 ml-2" />
              العودة إلى الامتحانات
            </Button>
          </Link>
        </div>

        {/* Exam Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge>{exam.classLevel || exam.subject || 'غير محدد'}</Badge>
                {isActive ? (
                  <Badge variant="success" className="flex items-center">
                    <CheckCircle className="h-3 w-3 ml-1" />
                    نشط
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="flex items-center">
                    <XCircle className="h-3 w-3 ml-1" />
                    منتهي
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {exam.title || 'بدون عنوان'}
              </h1>
              <p className="text-gray-600 dark:text-gray-300 text-lg">
                {exam.description || 'لا يوجد وصف للامتحان'}
              </p>
            </div>
            
            <div className="mt-4 md:mt-0 flex flex-col gap-2">
              {hasAttempt ? (
                <>
                  <Button 
                    className="bg-green-600 hover:bg-green-700" 
                    onClick={handleViewResult}
                  >
                    <BarChart3 className="h-4 w-4 ml-2" />
                    عرض النتيجة
                  </Button>
                  {isActive && (
                    <Button 
                      variant="outline"
                      onClick={handleStartExam}
                      disabled={!isActive || isStarting}
                    >
                      {isStarting ? (
                        <>
                          <LoadingSpinner size="sm" className="ml-2" />
                          جاري البدء...
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 ml-2" />
                          إعادة الامتحان
                        </>
                      )}
                    </Button>
                  )}
                </>
              ) : (
                <Button 
                  className="bg-green-600 hover:bg-green-700" 
                  onClick={handleStartExam}
                  disabled={!isActive || isStarting}
                >
                  {isStarting ? (
                    <>
                      <LoadingSpinner size="sm" className="ml-2" />
                      جاري البدء...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 ml-2" />
                      {isActive ? 'بدء الامتحان' : 'الامتحان منتهي'}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Exam Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-blue-400 ml-3" />
                <div>
                  <p className="text-sm text-gray-500">المدة</p>
                  <p className="font-semibold">{exam.duration || 0} دقيقة</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <BookOpen className="h-8 w-8 text-green-400 ml-3" />
                <div>
                  <p className="text-sm text-gray-500">عدد الأسئلة</p>
                  <p className="font-semibold">
                    {exam.questionsCount || exam.numberOfQuestions || exam.questions?.length || 0} سؤال
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <BarChart3 className="h-8 w-8 text-yellow-400 ml-3" />
                <div>
                  <p className="text-sm text-gray-500">الدرجة النهائية</p>
                  <p className="font-semibold">{exam.totalScore || 100} درجة</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-purple-400 ml-3" />
                <div>
                  <p className="text-sm text-gray-500">تاريخ الانتهاء</p>
                  <p className="font-semibold">
                    {exam.endDate && timeService.isValidTime(new Date(exam.endDate).getTime())
                      ? new Date(exam.endDate).toLocaleDateString('ar-EG') 
                      : 'غير محدد'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Exam Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>تعليمات الامتحان</CardTitle>
            <CardDescription>
              اقرأ التعليمات بعناية قبل بدء الامتحان
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-5 w-5" />
                <AlertDescription>
                  <strong>ملاحظة هامة:</strong> لا يمكنك الخروج من الامتحان بعد بدئه، وتأكد من أن اتصالك بالإنترنت مستقر.
                </AlertDescription>
              </Alert>
              
              <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
                <li>يجب إكمال الامتحان في المدة المحددة ({exam.duration || 0} دقيقة)</li>
                <li>لا يمكن إعادة فتح الامتحان بعد إنهائه</li>
                <li>سيتم احتساب النتيجة فور إنهاء الامتحان</li>
                <li>يجب الحصول على {exam.passingScore || 60}% على الأقل لاجتياز الامتحان</li>
                <li>الإجابات النهائية لا يمكن تعديلها بعد الإرسال</li>
                <li>يُسمح بمحاولة واحدة فقط لكل امتحان</li>
                <li>الأسئلة قد تكون اختيار من متعدد أو صح/خطأ أو مقالية</li>
              </ul>
              
              {hasAttempt && (
                <Alert variant="success" className="mt-4">
                  <CheckCircle className="h-5 w-5" />
                  <AlertDescription>
                    <strong>لقد قدمت هذا الامتحان من قبل.</strong> يمكنك إعادة الامتحان لتحسين نتيجتك.
                  </AlertDescription>
                </Alert>
              )}
              
              {!isActive && (
                <Alert variant="destructive" className="mt-4">
                  <XCircle className="h-5 w-5" />
                  <AlertDescription>
                    <strong>هذا الامتحان منتهي الصلاحية.</strong> لم يعد بالإمكان تقديمه.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ExamDetailPage