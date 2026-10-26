import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Clock, Calendar, BarChart3, BookOpen, ArrowLeft, Play, AlertCircle, CheckCircle, XCircle, Timer, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { examsAPI, apiRequest } from '../services/api'
import { ExamState, getExamAttemptState } from '../utils/examState'
import { timeService } from '../services/timeService'
import LoadingSpinner from '../components/LoadingSpinner'
import Navbar from '../components/Navbar'
import { useTranslation } from '../hooks/useTranslation'

const ExamDetailPage = () => {
  const { id } = useParams()
  const { t, lang } = useTranslation()
  const [exam, setExam] = useState(null)
  const [attemptState, setAttemptState] = useState(null) // ExamState enum value
  const [isLoading, setIsLoading] = useState(true)
  const [isStarting, setIsStarting] = useState(false)
  const [isCheckingState, setIsCheckingState] = useState(false)
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
          throw new Error(t('exams.detail.not_found') || 'Exam not found')
        }

        // Check data structure
        let examDetails = examData.data || examData

        // If it contains an exam field inside
        if (examDetails.exam) {
          examDetails = { ...examDetails, ...examDetails.exam }
        }

        setExam(examDetails)

        // Check attempt state using the state machine
        try {
          const state = await getExamAttemptState(id, apiRequest)
          setAttemptState(state.state)
        } catch (attemptError) {
          console.log('Cannot check attempt state:', attemptError)
          setAttemptState(ExamState.UNKNOWN)
        }

      } catch (error) {
        console.error('Error fetching exam:', error)

        let errorMessage = t('dashboard.error_load')
        if (error.message?.includes('Exam not found') || error.status === 404) {
          errorMessage = t('exams.detail.not_found')
        } else if (error.message?.includes('Session expired') || error.status === 401) {
          errorMessage = t('dashboard.error_session')
          localStorage.removeItem('token')
          navigate('/login')
        }

        setError(errorMessage)
        toast({
          title: t('common.error'),
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

      // Start exam via API
      const startResponse = await examsAPI.startExam(id)

      if (startResponse) {
        toast({
          title: t('exams.detail.starting'),
          description: 'Good luck!',
          variant: 'default'
        })

        // Go to exam page
        navigate(`/exams/${id}/take`)
      }
    } catch (error) {
      console.error('Error starting exam:', error)

      let errorMessage = t('dashboard.error_unknown')
      if (error.message?.includes('already submitted')) {
        errorMessage = t('exams.detail.alerts.submitted')
      } else if (error.message?.includes('already started')) {
        errorMessage = t('exams.detail.starting')
        navigate(`/exams/${id}/take`)
        return
      }

      toast({
        title: t('common.error'),
        description: errorMessage,
        variant: 'destructive'
      })
    } finally {
      setIsStarting(false)
    }
  }

  const handleContinueExam = () => {
    // Navigate directly to exam — do NOT call startExam (causes duplicates)
    navigate(`/exams/${id}/take`)
  }

  const handleRecheckState = async () => {
    setIsCheckingState(true)
    try {
      const state = await getExamAttemptState(id, apiRequest)
      setAttemptState(state.state)
    } catch {
      setAttemptState(ExamState.UNKNOWN)
    } finally {
      setIsCheckingState(false)
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
              {error || t('exams.detail.not_found')}
            </h1>
            <Link to="/exams">
              <Button>
                <ArrowLeft className="h-4 w-4 ml-2" />
                {t('exams.detail.back')}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Check if exam period is still active (based on endDate)
  const isExamActive = () => {
    if (!exam.endDate) return true
    try {
      const endDate = new Date(exam.endDate)
      return endDate > new Date()
    } catch {
      return true
    }
  }

  const isActive = isExamActive()

  // ─── Determine the single primary action based on state ────────────────

  const renderActionButtons = () => {
    // Past endDate overrides everything except viewing results
    if (!isActive) {
      if (attemptState === ExamState.SUBMITTED) {
        return (
          <Button
            className="bg-green-600 hover:bg-green-700"
            onClick={handleViewResult}
          >
            <BarChart3 className="h-4 w-4 ml-2" />
            {t('exams.detail.view_result')}
          </Button>
        )
      }
      // Past endDate, not submitted → no action possible
      return (
        <Button disabled className="opacity-50 cursor-not-allowed">
          <XCircle className="h-4 w-4 ml-2" />
          {t('exams.detail.expired_button')}
        </Button>
      )
    }

    switch (attemptState) {
      case ExamState.NOT_STARTED:
        return (
          <Button
            className="bg-green-600 hover:bg-green-700"
            onClick={handleStartExam}
            disabled={isStarting}
          >
            {isStarting ? (
              <>
                <LoadingSpinner size="sm" className="ml-2" />
                {t('exams.detail.starting')}
              </>
            ) : (
              <>
                <Play className="h-4 w-4 ml-2" />
                {t('exams.detail.start_button')}
              </>
            )}
          </Button>
        )

      case ExamState.IN_PROGRESS:
        return (
          <Button
            className="bg-yellow-600 hover:bg-yellow-700"
            onClick={handleContinueExam}
          >
            <Timer className="h-4 w-4 ml-2" />
            {t('exams.detail.continue_button')}
          </Button>
        )

      case ExamState.SUBMITTED:
        return (
          <Button
            className="bg-green-600 hover:bg-green-700"
            onClick={handleViewResult}
          >
            <BarChart3 className="h-4 w-4 ml-2" />
            {t('exams.detail.view_result')}
          </Button>
        )

      case ExamState.EXPIRED_UNSUBMITTED:
        // Time ran out but exam was never submitted. No action possible.
        return (
          <Button disabled className="opacity-50 cursor-not-allowed">
            <XCircle className="h-4 w-4 ml-2" />
            {t('exams.detail.expired_button')}
          </Button>
        )

      case ExamState.UNKNOWN:
        // Never offer Start here: it could create a duplicate attempt.
        return (
          <Button variant="outline" onClick={handleRecheckState} disabled={isCheckingState}>
            {isCheckingState ? (
              <LoadingSpinner size="sm" className="ml-2" />
            ) : (
              <RefreshCw className="h-4 w-4 ml-2" />
            )}
            {t('exams.detail.recheck_state')}
          </Button>
        )

      default:
        return null
    }
  }

  // ─── Determine the alert message based on state ────────────────────────

  const renderStateAlert = () => {
    if (!isActive && attemptState !== ExamState.SUBMITTED) {
      return (
        <Alert variant="destructive" className="mt-4">
          <XCircle className="h-5 w-5" />
          <AlertDescription>
            {t('exams.detail.past_end_date')}
          </AlertDescription>
        </Alert>
      )
    }

    switch (attemptState) {
      case ExamState.SUBMITTED:
        return (
          <Alert variant="success" className="mt-4 bg-green-50 text-green-800 border-green-200">
            <CheckCircle className="h-5 w-5" />
            <AlertDescription>
              {t('exams.detail.alerts.submitted')}
            </AlertDescription>
          </Alert>
        )

      case ExamState.IN_PROGRESS:
        return (
          <Alert className="mt-4 bg-yellow-50 text-yellow-800 border-yellow-200">
            <Timer className="h-5 w-5" />
            <AlertDescription>
              {t('exams.detail.alerts.in_progress')}
            </AlertDescription>
          </Alert>
        )

      case ExamState.EXPIRED_UNSUBMITTED:
        return (
          <Alert variant="destructive" className="mt-4 bg-orange-50 text-orange-800 border-orange-200">
            <AlertCircle className="h-5 w-5" />
            <AlertDescription>
              {t('exams.detail.expired_unsubmitted')}
            </AlertDescription>
          </Alert>
        )

      case ExamState.UNKNOWN:
        return (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-5 w-5" />
            <AlertDescription>
              {t('exams.detail.state_unknown')}
            </AlertDescription>
          </Alert>
        )

      default:
        return null
    }
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
              {t('exams.detail.back')}
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
                <Badge>{exam.classLevel || exam.subject || t('common.unknown')}</Badge>
                {isActive ? (
                  <Badge variant="success" className="flex items-center bg-green-100 text-green-800 hover:bg-green-200">
                    <CheckCircle className="h-3 w-3 ml-1" />
                    {t('exams.card.active')}
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="flex items-center">
                    <XCircle className="h-3 w-3 ml-1" />
                    {t('exams.card.expired')}
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {exam.title || t('exams.detail.no_title')}
              </h1>
              <p className="text-gray-600 dark:text-gray-300 text-lg">
                {exam.description || t('exams.detail.no_desc')}
              </p>
            </div>

            <div className="mt-4 md:mt-0 flex flex-col gap-2">
              {renderActionButtons()}
            </div>
          </div>
        </motion.div>

        {/* Exam Details */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-blue-400 ml-3" />
                <div>
                  <p className="text-sm text-gray-500">{t('exams.detail.duration')}</p>
                  <p className="font-semibold">{exam.duration || 0} {t('exams.card.minutes')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <BookOpen className="h-8 w-8 text-green-400 ml-3" />
                <div>
                  <p className="text-sm text-gray-500">{t('exams.detail.questions_count')}</p>
                  <p className="font-semibold">
                    {exam.questionsCount || exam.numberOfQuestions || exam.questions?.length || 0} {t('common.questions')}
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
                  <p className="text-sm text-gray-500">{t('exams.detail.total_score')}</p>
                  <p className="font-semibold">{exam.totalScore || 100} {t('common.marks')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-purple-400 ml-3" />
                <div>
                  <p className="text-sm text-gray-500">{t('exams.detail.end_date')}</p>
                  <p className="font-semibold">
                    {exam.endDate && timeService.isValidTime(new Date(exam.endDate).getTime())
                      ? new Date(exam.endDate).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')
                      : t('exams.card.unknown_time')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Exam Instructions */}
        <Card>
          <CardHeader>
            <CardTitle dir={lang === 'ar' ? 'rtl' : 'ltr'} className={lang === 'ar' ? 'text-right' : 'text-left'}>
              {t('exams.detail.instructions.title')}
            </CardTitle>
            <CardDescription dir={lang === 'ar' ? 'rtl' : 'ltr'} className={lang === 'ar' ? 'text-right' : 'text-left'}>
              {t('exams.detail.instructions.subtitle')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-5 w-5" />
                <AlertDescription dir={lang === 'ar' ? 'rtl' : 'ltr'} className={lang === 'ar' ? 'text-right' : 'text-left'}>
                  <strong>{t('exams.detail.instructions.important')}</strong> {t('exams.detail.instructions.important_text')}
                </AlertDescription>
              </Alert>

              <ul
                dir={lang === 'ar' ? 'rtl' : 'ltr'}
                className={`list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300 ${lang === 'ar' ? 'text-right' : 'text-left'}`}
              >
                {(t('exams.detail.instructions.list', { returnObjects: true }) || []).map((instruction, idx) => (
                  <li key={idx}>{instruction}</li>
                ))}
              </ul>

              {renderStateAlert()}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ExamDetailPage
