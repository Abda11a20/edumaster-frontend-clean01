import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import LoadingSpinner from '../components/LoadingSpinner'
import { useToast } from '@/hooks/use-toast'
import { examsAPI } from '../services/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BarChart3, RefreshCw, FileCheck, FileX, ChevronLeft, ChevronRight, Star, Award, CheckCircle, XCircle } from 'lucide-react'

const StudentResultsPage = () => {
  const [exams, setExams] = useState([])
  const [scores, setScores] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('submitted')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const { toast } = useToast()

  // نظام التقييم المتدرج
  const GRADE_SYSTEM = {
    FAILED: { min: 0, max: 49, label: 'راسب', color: 'text-red-600', bgColor: 'bg-red-100', borderColor: 'border-red-200', icon: XCircle },
    ACCEPTABLE: { min: 50, max: 60, label: 'مقبول', color: 'text-orange-600', bgColor: 'bg-orange-100', borderColor: 'border-orange-200', icon: CheckCircle },
    GOOD: { min: 61, max: 75, label: 'جيد', color: 'text-blue-600', bgColor: 'bg-blue-100', borderColor: 'border-blue-200', icon: Award },
    VERY_GOOD: { min: 76, max: 85, label: 'جيد جداً', color: 'text-teal-600', bgColor: 'bg-teal-100', borderColor: 'border-teal-200', icon: Award },
    EXCELLENT: { min: 86, max: 100, label: 'ممتاز', color: 'text-green-600', bgColor: 'bg-green-100', borderColor: 'border-green-200', icon: Star }
  }

  // دالة لحساب الدرجة الكلية للامتحان
  const calculateTotalScore = (exam) => {
    // إذا كان totalScore موجوداً ونسبة أكبر من 0 نستخدمه
    if (exam.totalScore && exam.totalScore > 0) {
      return exam.totalScore;
    }
    
    // حساب المجموع من نقاط الأسئلة
    if (Array.isArray(exam.questions) && exam.questions.length > 0) {
      const totalFromQuestions = exam.questions.reduce((sum, question) => {
        return sum + (question.points || 1); // إذا لم تكن هناك points نستخدم 1 كافتراضي
      }, 0);
      
      if (totalFromQuestions > 0) {
        return totalFromQuestions;
      }
    }
    
    // إذا لم توجد أسئلة أو كانت النقاط صفر، نستخدم عدد الأسئلة كدرجة كلية
    if (exam.questions?.length > 0) {
      return exam.questions.length;
    }
    
    // افتراضي 100 إذا لم يكن هناك بيانات كافية
    return 100;
  };

  // دالة لتحديد التقييم بناءً على النسبة المئوية
  const getGradeInfo = (percentage) => {
    // تحويل النسبة إلى رقم للتأكد من المقارنة الصحيحة
    const percent = Number(percentage);
    for (const [key, grade] of Object.entries(GRADE_SYSTEM)) {
      if (percent >= grade.min && percent <= grade.max) {
        return grade;
      }
    }
    return GRADE_SYSTEM.FAILED;
  }

  const fetchScores = async (examsList) => {
    const results = {}
    
    const promises = examsList.map(async (ex) => {
      try {
        const res = await examsAPI.getStudentScore(ex._id)
        
        if (res === null) {
          return { examId: ex._id, score: null }
        } else {
          const score = res?.score
          return { examId: ex._id, score: typeof score === 'number' ? score : null }
        }
      } catch (e) {
        console.error(`Error fetching score for exam ${ex._id}:`, e)
        return { examId: ex._id, score: null }
      }
    })

    try {
      const resultsArray = await Promise.all(promises)
      resultsArray.forEach(({ examId, score }) => {
        results[examId] = score
      })
      setScores(results)
    } catch (error) {
      console.error('Error in fetchScores:', error)
    }
  }

  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true)
        const res = await examsAPI.getAllExams({ page: 1, limit: 100 })
        const list = res?.data || res || []
        const examsArray = Array.isArray(list) ? list : []
        setExams(examsArray)
        
        if (examsArray.length > 0) {
          await fetchScores(examsArray)
        }
      } catch (error) {
        console.error('Error in init:', error)
        toast({
          title: 'خطأ في تحميل البيانات',
          description: 'تعذر تحميل الامتحانات',
          variant: 'destructive'
        })
      } finally {
        setIsLoading(false)
      }
    }
    init()
  }, [])

  // تقسيم الامتحانات إلى مجموعتين
  const { submittedExams, notSubmittedExams } = useMemo(() => {
    const submitted = []
    const notSubmitted = []
    
    exams.forEach(exam => {
      const score = scores[exam._id]
      if (typeof score === 'number') {
        submitted.push(exam)
      } else {
        notSubmitted.push(exam)
      }
    })

    return { submittedExams: submitted, notSubmittedExams: notSubmitted }
  }, [exams, scores])

  // تطبيق البحث
  const filteredSubmitted = useMemo(() => {
    if (!search) return submittedExams
    const s = search.toLowerCase()
    return submittedExams.filter(ex => (ex?.title || '').toLowerCase().includes(s))
  }, [submittedExams, search])

  const filteredNotSubmitted = useMemo(() => {
    if (!search) return notSubmittedExams
    const s = search.toLowerCase()
    return notSubmittedExams.filter(ex => (ex?.title || '').toLowerCase().includes(s))
  }, [notSubmittedExams, search])

  // Pagination للبيانات الحالية
  const currentData = useMemo(() => {
    const data = activeTab === 'submitted' ? filteredSubmitted : filteredNotSubmitted
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return data.slice(startIndex, endIndex)
  }, [activeTab, filteredSubmitted, filteredNotSubmitted, currentPage, itemsPerPage])

  const totalPages = useMemo(() => {
    const data = activeTab === 'submitted' ? filteredSubmitted : filteredNotSubmitted
    return Math.ceil(data.length / itemsPerPage)
  }, [activeTab, filteredSubmitted, filteredNotSubmitted, itemsPerPage])

  // إعادة تعيين الصفحة عند تغيير التبويب أو البحث
  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab, search])

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true)
      await fetchScores(exams)
      toast({ 
        title: 'تم التحديث', 
        description: 'تم تحديث نتائجك' 
      })
    } catch (e) {
      toast({ 
        title: 'تعذر التحديث', 
        description: 'حاول مرة أخرى', 
        variant: 'destructive' 
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  const renderTable = (data, isSubmitted) => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>الامتحان</TableHead>
            <TableHead>الدرجة</TableHead>
            <TableHead>النسبة</TableHead>
            <TableHead>التقييم</TableHead>
            <TableHead>الإجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((ex) => {
            const score = scores[ex._id]
            const total = calculateTotalScore(ex)
            // حساب النسبة المئوية بناءً على الدرجة الفعلية والدرجة الكلية المحسوبة
            const percentage = typeof score === 'number' && total > 0 ? Math.round((score / total) * 100) : 0
            const gradeInfo = isSubmitted ? getGradeInfo(percentage) : null
            const GradeIcon = gradeInfo?.icon || Award
            
            return (
              <TableRow key={ex._id}>
                <TableCell className="font-medium">{ex.title}</TableCell>
                <TableCell>
                  {isSubmitted ? (
                    <div className="flex flex-col">
                      <span className="font-bold">{score} / {total}</span>
                      <span className="text-xs text-gray-500">
                        {ex.questions?.length || '?'} أسئلة
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      <span>—</span>
                      <span className="text-xs text-gray-500">
                        {ex.questions?.length || '?'} أسئلة
                      </span>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {isSubmitted ? (
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${gradeInfo?.bgColor.replace('bg-', 'bg-')}`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        ></div>
                      </div>
                      <span className="font-mono text-sm font-bold">
                        {percentage}%
                      </span>
                    </div>
                  ) : (
                    '—'
                  )}
                </TableCell>
                <TableCell>
                  {isSubmitted ? (
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${gradeInfo?.bgColor} ${gradeInfo?.borderColor} border`}>
                      <GradeIcon className={`h-4 w-4 ${gradeInfo?.color}`} />
                      <span className={`text-sm font-medium ${gradeInfo?.color}`}>
                        {gradeInfo?.label}
                      </span>
                    </div>
                  ) : (
                    <span className="text-orange-500 font-medium">⌛ لم يتم التقديم</span>
                  )}
                </TableCell>
                <TableCell>
                  {isSubmitted ? (
                    <Link to={`/exams/${ex._id}/result`}>
                      <Button variant="outline" size="sm" className="bg-blue-50 hover:bg-blue-100 border-blue-200">
                        <BarChart3 className="h-4 w-4 ml-2" />
                        عرض التفاصيل
                      </Button>
                    </Link>
                  ) : (
                    <Link to={`/exams/${ex._id}`}>
                      <Button variant="outline" size="sm" className="bg-green-50 hover:bg-green-100 border-green-200">
                        ابدأ الامتحان
                      </Button>
                    </Link>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
      
      {data.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          {isSubmitted ? 'لا توجد امتحانات مكتملة' : 'لا توجد امتحانات متاحة'}
        </div>
      )}
    </div>
  )

  const renderPagination = () => {
    if (totalPages <= 1) return null

    const pages = []
    const maxVisiblePages = 5
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <Button
          key={i}
          variant={currentPage === i ? "default" : "outline"}
          size="sm"
          onClick={() => handlePageChange(i)}
          className={currentPage === i ? "bg-primary text-primary-foreground" : ""}
        >
          {i}
        </Button>
      )
    }

    return (
      <div className="flex items-center justify-center space-x-2 mt-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronRight className="h-4 w-4" />
          السابق
        </Button>
        
        {pages}
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          التالي
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* نظام التقييم التوضيحي */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-6 w-6 text-purple-500" />
              نظام التقييم
            </CardTitle>
            <CardDescription>
              يتم حساب النسبة المئوية بناءً على الدرجة الفعلية والدرجة الكلية للامتحان
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {Object.entries(GRADE_SYSTEM).map(([key, grade]) => {
                const IconComponent = grade.icon
                return (
                  <div key={key} className={`flex items-center gap-2 p-3 rounded-lg ${grade.bgColor} ${grade.borderColor} border`}>
                    <IconComponent className={`h-5 w-5 ${grade.color}`} />
                    <div>
                      <div className={`font-medium ${grade.color}`}>{grade.label}</div>
                      <div className="text-xs text-gray-600">{grade.min}% - {grade.max}%</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-6 w-6 text-blue-500" />
                نتائج امتحاناتي
              </CardTitle>
              <CardDescription>عرض نتائجك في الامتحانات المنشورة</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Input
                placeholder="ابحث باسم الامتحان..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-56"
              />
              <Button onClick={handleRefresh} disabled={isRefreshing}>
                <RefreshCw className={`h-4 w-4 ml-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'جاري التحديث' : 'تحديث النتائج'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <LoadingSpinner size="lg" />
              </div>
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="submitted" className="flex items-center gap-2">
                    <FileCheck className="h-4 w-4" />
                    الامتحانات المكتملة
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                      {filteredSubmitted.length}
                    </span>
                  </TabsTrigger>
                  <TabsTrigger value="not-submitted" className="flex items-center gap-2">
                    <FileX className="h-4 w-4" />
                    الامتحانات المتاحة
                    <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
                      {filteredNotSubmitted.length}
                    </span>
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="submitted" className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 text-green-800">
                      <FileCheck className="h-5 w-5" />
                      <span className="font-medium">الامتحانات التي تم تقديمها</span>
                    </div>
                    <p className="text-green-600 text-sm mt-1">
                      عرض النتائج والتفاصيل الكاملة للامتحانات المكتملة
                    </p>
                  </div>
                  
                  {renderTable(currentData, true)}
                  {renderPagination()}
                </TabsContent>
                
                <TabsContent value="not-submitted" className="space-y-4">
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 text-orange-800">
                      <FileX className="h-5 w-5" />
                      <span className="font-medium">الامتحانات المتاحة للتقديم</span>
                    </div>
                    <p className="text-orange-600 text-sm mt-1">
                      يمكنك البدء في هذه الامتحانات عندما تكون مستعداً
                    </p>
                  </div>
                  
                  {renderTable(currentData, false)}
                  {renderPagination()}
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>

        {/* إحصائيات سريعة */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-800">إجمالي الامتحانات</p>
                  <p className="text-2xl font-bold text-blue-900">{exams.length}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800">تم تقديمها</p>
                  <p className="text-2xl font-bold text-green-900">{submittedExams.length}</p>
                </div>
                <FileCheck className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-800">متاحة للتقديم</p>
                  <p className="text-2xl font-bold text-orange-900">{notSubmittedExams.length}</p>
                </div>
                <FileX className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default StudentResultsPage