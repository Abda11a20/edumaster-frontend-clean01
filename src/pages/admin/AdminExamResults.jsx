import { useEffect, useMemo, useState } from 'react'
import Navbar from '../../components/Navbar'
import LoadingSpinner from '../../components/LoadingSpinner'
import { useToast } from '@/hooks/use-toast'
import { examsAPI } from '../../services/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Search, RefreshCw } from 'lucide-react'
import { useTranslation } from "../../hooks/useTranslation";

const AdminExamResults = () => {
  const [exams, setExams] = useState([])
  const [selectedExam, setSelectedExam] = useState('')
  const [scores, setScores] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFetching, setIsFetching] = useState(false)
  const [studentName, setStudentName] = useState('')
  const { toast } = useToast()
  const { t, lang } = useTranslation()

  // دالة لحساب الدرجة الكلية للامتحان
  const calculateTotalScore = (exam) => {
    if (!exam) return 100;

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

  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true)
        const res = await examsAPI.getAllExams({ page: 1, limit: 100 })
        const list = res?.data || res || []
        setExams(Array.isArray(list) ? list : [])
      } catch (error) {
        toast({ title: t('common.error'), description: t('admin.exam_results.messages.error_load_exams'), variant: 'destructive' })
      } finally {
        setIsLoading(false)
      }
    }
    init()
  }, [toast])

  const fetchScores = async (examId, nameFilter) => {
    if (!examId) {
      setScores([])
      return
    }

    try {
      setIsFetching(true)
      const res = await examsAPI.getAdminExamScores(examId, nameFilter)
      console.log('نتائج الامتحانات:', res) // للتصحيح

      // معالجة البيانات المختلفة التي قد تأتي من الخادم
      let scoresData = []

      if (Array.isArray(res)) {
        scoresData = res
      } else if (res && Array.isArray(res.data)) {
        scoresData = res.data
      } else if (res && res.scores) {
        scoresData = res.scores
      }

      setScores(scoresData)

      if (scoresData.length === 0) {
        toast({
          title: t('admin.exam_results.messages.no_results'),
          description: t('admin.exam_results.messages.no_results_desc')
        })
      }
    } catch (error) {
      console.error('خطأ في جلب النتائج:', error)
      toast({
        title: t('admin.exam_results.messages.error_fetch'),
        description: error.message || t('common.retry'),
        variant: 'destructive'
      })
      setScores([])
    } finally {
      setIsFetching(false)
    }
  }

  // جلب النتائج عند اختيار امتحان أو تغيير اسم الطالب
  useEffect(() => {
    if (selectedExam) {
      fetchScores(selectedExam, studentName)
    } else {
      setScores([])
    }
  }, [selectedExam, studentName])

  const selectedExamObj = useMemo(() =>
    exams.find(e => e._id === selectedExam),
    [exams, selectedExam]
  )

  const handleSearch = () => {
    if (selectedExam) {
      fetchScores(selectedExam, studentName)
    } else {
      toast({
        title: t('admin.exam_results.select_exam'),
        description: t('admin.exam_results.messages.select_exam_error'),
        variant: 'destructive'
      })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.exam_results.title')}</CardTitle>
            <CardDescription>{t('admin.exam_results.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <LoadingSpinner size="lg" />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row gap-3 items-center">
                  <div className="flex items-center gap-2 w-full md:w-72">
                    <Select value={selectedExam} onValueChange={setSelectedExam}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('admin.exam_results.select_exam')} />
                      </SelectTrigger>
                      <SelectContent>
                        {exams.map(ex => (
                          <SelectItem key={ex._id} value={ex._id}>
                            {ex.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2 w-full md:flex-1">
                    <Search className="h-4 w-4 text-gray-400" />
                    <Input
                      placeholder={t('admin.exam_results.student_name_ph')}
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleSearch}
                      disabled={!selectedExam || isFetching}
                    >
                      <RefreshCw className={`h-4 w-4 ml-2 ${isFetching ? 'animate-spin' : ''}`} />
                      {isFetching ? t('common.searching') : t('common.search')}
                    </Button>
                  </div>
                </div>

                {selectedExam && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-blue-800">
                          {selectedExamObj?.title || t('common.unknown')}
                        </h3>
                        <p className="text-sm text-blue-600">
                          {t('admin.exam_results.stats.questions_count')} {selectedExamObj?.questions?.length || 0} |
                          {t('admin.exam_results.stats.total_score')} {calculateTotalScore(selectedExamObj)}
                        </p>
                      </div>
                      <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                        {scores.length} {t('admin.exam_results.stats.result_count')}
                      </span>
                    </div>
                  </div>
                )}

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('admin.exam_results.table.student')}</TableHead>
                        <TableHead>{t('admin.exam_results.table.score')}</TableHead>
                        <TableHead>{t('admin.exam_results.table.percentage')}</TableHead>
                        <TableHead>{t('admin.exam_results.table.status')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {scores.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                            {selectedExam ? t('admin.exam_results.list.empty') : t('admin.exam_results.list.select_prompt')}
                          </TableCell>
                        </TableRow>
                      ) : (
                        scores.map((row, index) => {
                          const total = calculateTotalScore(selectedExamObj)
                          const scoreValue = row?.score || row?.result?.score || 0
                          const percentage = total > 0 ? Math.round((scoreValue / total) * 100) : 0
                          const isPassed = percentage >= 60

                          return (
                            <TableRow key={row._id || row.id || `row-${index}`}>
                              <TableCell className="font-medium">
                                {row.student?.fullName || row.user?.fullName || row.fullName || t('common.unknown')}
                              </TableCell>
                              <TableCell>
                                {scoreValue} / {total}
                              </TableCell>
                              <TableCell>
                                <span className={`font-bold ${isPassed ? 'text-green-600' : 'text-red-600'}`}>
                                  {percentage}%
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${isPassed
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                                  }`}>
                                  {isPassed ? t('admin.exam_results.status.passed') : t('admin.exam_results.status.failed')}
                                </span>
                              </TableCell>
                            </TableRow>
                          )
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default AdminExamResults