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
import { useTranslation } from '../hooks/useTranslation'

const ExamsPage = () => {
  const { t, lang } = useTranslation()
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

      // Check for token
      const token = localStorage.getItem('token')
      if (!token) {
        setError(t('auth.login.required_desc') || 'You must be logged in to access exams')
        toast({
          title: t('auth.login.required') || 'Login Required',
          description: t('auth.login.required_desc') || 'Please login to access exams',
          variant: 'destructive'
        })
        return
      }

      // Fetch exams
      const examsData = await examsAPI.getAllExams({ page: 1, limit: 100 })

      if (!examsData || examsData.length === 0) {
        // We don't set error here to avoid showing alert, just empty state
        setExams([])
        setFilteredExams([])
        return
      }

      // Process data
      const processedExams = examsData.map(exam => {
        // Extract exam data from different structures
        const examData = exam.exam || exam.data || exam

        return {
          _id: examData._id || exam._id,
          title: examData.title || examData.name || t('common.untitled'),
          description: examData.description || t('common.no_desc'),
          subject: examData.subject || examData.classLevel || t('common.unknown'),
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

      // Update exams data in search service
      SearchService.updateExamsData(processedExams);

    } catch (error) {
      let errorMessage = t('dashboard.error_load')

      if (error.message?.includes('Session expired') || error.status === 401) {
        errorMessage = t('dashboard.error_session')
        localStorage.removeItem('token')
        window.location.href = '/login'
      } else if (error.message?.includes('Network')) {
        errorMessage = t('dashboard.error_network')
      } else {
        errorMessage = error.message || t('dashboard.error_unknown')
      }

      setError(errorMessage)
      toast({
        title: t('common.error'),
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

    // Filter by active status
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

    // Filter by search
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
      if (!exam.endDate) return t('exams.card.unknown_time')

      try {
        const endDate = new Date(exam.endDate)
        const now = new Date()
        const diffMs = endDate - now

        if (diffMs <= 0) return t('exams.card.expired')

        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
        const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

        if (diffDays > 0) {
          return `${diffDays} ${t('exams.card.days')} ${diffHours} ${t('exams.card.hours')}`
        } else if (diffHours > 0) {
          return `${diffHours} ${t('exams.card.hours')}`
        } else {
          const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
          return `${diffMinutes} ${t('exams.card.minutes')}`
        }
      } catch (error) {
        return t('exams.card.unknown_time')
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
                    <Badge variant="success" className="flex items-center gap-1 bg-green-100 text-green-800 hover:bg-green-200">
                      <CheckCircle className="h-3 w-3" />
                      {t('exams.card.active')}
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="flex items-center gap-1">
                      <XCircle className="h-3 w-3" />
                      {t('exams.card.expired')}
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
              {/* Exam Info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-blue-500 ml-2" />
                  <div>
                    <p className="text-gray-500">{t('exams.card.duration')}</p>
                    <p className="font-semibold">{exam.duration} {t('exams.card.minutes')}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <BookOpen className="h-4 w-4 text-green-500 ml-2" />
                  <div>
                    <p className="text-gray-500">{t('exams.card.questions')}</p>
                    <p className="font-semibold">{exam.questionsCount}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <BarChart3 className="h-4 w-4 text-yellow-500 ml-2" />
                  <div>
                    <p className="text-gray-500">{t('exams.card.score')}</p>
                    <p className="font-semibold">{exam.totalScore}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-purple-500 ml-2" />
                  <div>
                    <p className="text-gray-500">{t('exams.card.remaining_time')}</p>
                    <p className="font-semibold">{getTimeRemaining()}</p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-2 rtl:space-x-reverse">
                <Link to={`/exams/${exam._id}`} className="flex-1">
                  <Button variant="outline" className="w-full">
                    {t('exams.card.details')}
                  </Button>
                </Link>
                <Link to={`/exams/${exam._id}`} className="flex-1">
                  <Button className="w-full" disabled={!isActive()}>
                    {t('exams.card.start')}
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
            {t('exams.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {t('exams.subtitle')}
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
                  placeholder={t('exams.search_placeholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <Label htmlFor="active-only" className="text-sm text-gray-600 dark:text-gray-300">
                    {t('exams.filter_active')}
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
                    <span>{t('exams.refresh')}</span>
                  </Button>

                  <Badge variant={showActiveOnly ? "default" : "outline"}>
                    {showActiveOnly ? t('exams.active_only') : t('exams.all_exams')}
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
            {t('exams.showing_results', { count: filteredExams.length, total: exams.length })}
          </p>

          {showActiveOnly && (
            <Badge variant="outline" className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              {t('exams.active_count', { count: filteredExams.length })}
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
              {exams.length === 0 ? t('exams.empty.title') : t('exams.empty.subtitle')}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {exams.length === 0
                ? t('exams.empty.desc_no_exams')
                : t('exams.empty.desc_filter')
              }
            </p>
            <Button onClick={fetchExams}>
              {t('exams.empty.refresh_list')}
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default ExamsPage