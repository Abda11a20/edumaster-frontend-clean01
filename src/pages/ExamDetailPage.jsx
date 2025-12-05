import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Clock, Calendar, BarChart3, BookOpen, ArrowLeft, Play, Users, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { examsAPI } from '../services/api'
import { timeService } from '../services/timeService'
import LoadingSpinner from '../components/LoadingSpinner'
import Navbar from '../components/Navbar'

const ExamDetailPage = () => {
  const { id } = useParams()
  const [exam, setExam] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isStarting, setIsStarting] = useState(false)
  const { toast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    const fetchExam = async () => {
      try {
        setIsLoading(true)
        const examData = await examsAPI.getExamById(id)
        
        // تحقق من هيكل البيانات الذي يعيده الباكند
        let examDetails = examData.data || examData
        
        // إذا كان يحتوي على حقل exam بداخله (هيكل متداخل)
        if (examDetails.exam) {
          examDetails = { ...examDetails, ...examDetails.exam }
        }
        
        setExam(examDetails)
      } catch (error) {
        console.error('Error fetching exam:', error)
        toast({
          title: 'خطأ في تحميل الامتحان',
          description: 'تحقق من اتصالك بالإنترنت وحاول مرة أخرى',
          variant: 'destructive'
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (id) {
      fetchExam()
    }
  }, [id, toast])

  const handleStartExam = async () => {
    try {
      setIsStarting(true)
      // اذهب مباشرة إلى صفحة الامتحان — صفحة الامتحان ستُسند منطق البدء/الاستئناف
      navigate(`/exams/${id}/take`)
    } catch (error) {
      console.error('Error starting exam:', error)
      
      toast({
        title: 'خطأ في فتح صفحة الامتحان',
        description: 'حاول مرة أخرى',
        variant: 'destructive'
      })
    } finally {
      setIsStarting(false)
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

  if (!exam) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              الامتحان غير موجود
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
              <Badge className="mb-2">{exam.classLevel || exam.subject || 'غير محدد'}</Badge>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {exam.title || 'بدون عنوان'}
              </h1>
              <p className="text-gray-600 dark:text-gray-300 text-lg">
                {exam.description || 'لا يوجد وصف للامتحان'}
              </p>
            </div>
            
            <div className="mt-4 md:mt-0">
              <Button 
                className="bg-green-600 hover:bg-green-700" 
                onClick={handleStartExam}
                disabled={isStarting}
              >
                {isStarting ? (
                  <>
                    <LoadingSpinner size="sm" className="ml-2" />
                    جاري البدء...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 ml-2" />
                    بدء الامتحان
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Exam Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-blue-400 mr-3" />
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
                <BookOpen className="h-8 w-8 text-green-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">عدد الأسئلة</p>
                  <p className="font-semibold">{exam.questionsCount || exam.numberOfQuestions || exam.questions?.length || 0} سؤال</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <BarChart3 className="h-8 w-8 text-yellow-400 mr-3" />
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
                <Calendar className="h-8 w-8 text-purple-400 mr-3" />
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
          </CardHeader>
          <CardContent>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg mb-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 ml-2" />
                <div>
                  <h4 className="font-medium text-yellow-800 dark:text-yellow-200">ملاحظة هامة</h4>
                  <p className="text-yellow-700 dark:text-yellow-300 text-sm mt-1">
                    لا يمكنك الخروج من الامتحان بعد بدئه، وتأكد من أن اتصالك بالإنترنت مستقر.
                  </p>
                </div>
              </div>
            </div>
            
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
              <li>يجب إكمال الامتحان في المدة المحددة ({exam.duration || 0} دقيقة)</li>
              <li>لا يمكن إعادة فتح الامتحان بعد إنهائه</li>
              <li>سيتم احتساب النتيجة فور إنهاء الامتحان</li>
              <li>يجب الحصول على 60% على الأقل لاجتياز الامتحان</li>
              <li>الإجابات النهائية لا يمكن تعديلها بعد الإرسال</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ExamDetailPage