import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import LoadingSpinner from '../components/LoadingSpinner'
import { useToast } from '@/hooks/use-toast'
import { examsAPI } from '../services/api'
import SearchService from '../services/searchService'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BarChart3, RefreshCw, FileCheck, FileX, ChevronLeft, ChevronRight, Star, Award, CheckCircle, XCircle } from 'lucide-react'
import { useTranslation } from '../hooks/useTranslation'

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
  const { t } = useTranslation()

  const GRADE_SYSTEM = {
    FAILED: { min: 0, max: 49, label: t('exams.results.grades.failed'), color: 'text-red-600', bgColor: 'bg-red-100', borderColor: 'border-red-200', icon: XCircle },
    ACCEPTABLE: { min: 50, max: 60, label: t('exams.results.grades.acceptable'), color: 'text-orange-600', bgColor: 'bg-orange-100', borderColor: 'border-orange-200', icon: CheckCircle },
    GOOD: { min: 61, max: 75, label: t('exams.results.grades.good'), color: 'text-blue-600', bgColor: 'bg-blue-100', borderColor: 'border-blue-200', icon: Award },
    VERY_GOOD: { min: 76, max: 85, label: t('exams.results.grades.very_good'), color: 'text-teal-600', bgColor: 'bg-teal-100', borderColor: 'border-teal-200', icon: Award },
    EXCELLENT: { min: 86, max: 100, label: t('exams.results.grades.excellent'), color: 'text-green-600', bgColor: 'bg-green-100', borderColor: 'border-green-200', icon: Star }
  }

  const calculateTotalScore = (exam) => {
    if (exam.totalScore && exam.totalScore > 0) {
      return exam.totalScore;
    }

    if (Array.isArray(exam.questions) && exam.questions.length > 0) {
      const totalFromQuestions = exam.questions.reduce((sum, question) => {
        return sum + (question.points || 1);
      }, 0);

      if (totalFromQuestions > 0) {
        return totalFromQuestions;
      }
    }

    if (exam.questions?.length > 0) {
      return exam.questions.length;
    }

    return 100;
  };

  const getGradeInfo = (percentage) => {
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
      // لا نعرض خطأ
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

        // تحديث بيانات الامتحانات في خدمة البحث
        SearchService.updateExamsData(examsArray);

        if (examsArray.length > 0) {
          await fetchScores(examsArray)
        }
      } catch (error) {
        toast({
          title: t('dashboard.error_load'),
          description: t('dashboard.error_unknown'),
          variant: 'destructive'
        })
      } finally {
        setIsLoading(false)
      }
    }
    init()
  }, [])

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

  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab, search])

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true)
      await fetchScores(exams)
      toast({
        title: t('profile.messages.update_success'),
        description: t('profile.messages.update_success_desc')
      })
    } catch (e) {
      toast({
        title: t('common.error'),
        description: t('common.retry'),
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
            <TableHead>{t('exams.results.table.exam')}</TableHead>
            <TableHead>{t('exams.results.table.score')}</TableHead>
            <TableHead>{t('exams.results.table.percentage')}</TableHead>
            <TableHead>{t('exams.results.table.grade')}</TableHead>
            <TableHead>{t('exams.results.table.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((ex) => {
            const score = scores[ex._id]
            const total = calculateTotalScore(ex)
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
                        {ex.questions?.length || '?'} {t('exams.card.questions')}
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      <span>—</span>
                      <span className="text-xs text-gray-500">
                        {ex.questions?.length || '?'} {t('exams.card.questions')}
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
                    <span className="text-orange-500 font-medium">⌛ {t('exams.results.table.not_submitted')}</span>
                  )}
                </TableCell>
                <TableCell>
                  {isSubmitted ? (
                    <Link to={`/exams/${ex._id}/result`}>
                      <Button variant="outline" size="sm" className="bg-blue-50 hover:bg-blue-100 border-blue-200">
                        <BarChart3 className="h-4 w-4 ml-2" />
                        {t('exams.card.details')}
                      </Button>
                    </Link>
                  ) : (
                    <Link to={`/exams/${ex._id}`}>
                      <Button variant="outline" size="sm" className="bg-green-50 hover:bg-green-100 border-green-200">
                        {t('exams.card.start')}
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
          {isSubmitted ? t('exams.results.messages.no_submitted') : t('exams.results.messages.no_available')}
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
          {t('common.previous')}
        </Button>

        {pages}

        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          {t('common.next')}
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 overflow-x-hidden">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-6 w-6 text-purple-500" />
              {t('exams.results.grading_system')}
            </CardTitle>
            <CardDescription>
              {t('exams.results.grading_desc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
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
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-6 w-6 text-blue-500" />
                {t('exams.results.title')}
              </CardTitle>
              <CardDescription>{t('exams.results.subtitle')}</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
              <Input
                placeholder={t('exams.search_placeholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full sm:w-56"
              />
              <Button onClick={handleRefresh} disabled={isRefreshing} className="w-full sm:w-auto">
                <RefreshCw className={`h-4 w-4 ml-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? t('common.processing') : t('exams.refresh')}
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
                    {t('exams.results.tabs.submitted')}
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                      {filteredSubmitted.length}
                    </span>
                  </TabsTrigger>
                  <TabsTrigger value="not-submitted" className="flex items-center gap-2">
                    <FileX className="h-4 w-4" />
                    {t('exams.results.tabs.available')}
                    <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
                      {filteredNotSubmitted.length}
                    </span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="submitted" className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 text-green-800">
                      <FileCheck className="h-5 w-5" />
                      <span className="font-medium">{t('exams.results.messages.submitted_title')}</span>
                    </div>
                    <p className="text-green-600 text-sm mt-1">
                      {t('exams.results.messages.submitted_desc')}
                    </p>
                  </div>

                  {renderTable(currentData, true)}
                  {renderPagination()}
                </TabsContent>

                <TabsContent value="not-submitted" className="space-y-4">
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 text-orange-800">
                      <FileX className="h-5 w-5" />
                      <span className="font-medium">{t('exams.results.messages.available_title')}</span>
                    </div>
                    <p className="text-orange-600 text-sm mt-1">
                      {t('exams.results.messages.available_desc')}
                    </p>
                  </div>

                  {renderTable(currentData, false)}
                  {renderPagination()}
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-800">{t('exams.results.stats.total')}</p>
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
                  <p className="text-sm font-medium text-green-800">{t('exams.results.stats.submitted')}</p>
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
                  <p className="text-sm font-medium text-orange-800">{t('exams.results.stats.available')}</p>
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