import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, Award, BarChart3, Clock, Calendar, Star, RefreshCw, Download, Printer, Share2, X, Crown, Trophy, Medal, BookOpen, User, GraduationCap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { examsAPI } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'
import Navbar from '../components/Navbar'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from '../hooks/useTranslation'

const ExamResultPage = () => {
  const { id } = useParams()
  const { user } = useAuth()
  const { t, lang } = useTranslation()
  const [result, setResult] = useState(null)
  const [examDetails, setExamDetails] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showCertificate, setShowCertificate] = useState(false)
  const { toast } = useToast()
  const navigate = useNavigate()
  const storageKey = `exam_result_${id}`

  const GRADE_SYSTEM = {
    FAILED: { min: 0, max: 49, label: t('exams.examResult.grades.failed'), color: 'text-red-600', bgColor: 'bg-red-100', borderColor: 'border-red-200', icon: XCircle },
    ACCEPTABLE: { min: 50, max: 60, label: t('exams.examResult.grades.acceptable'), color: 'text-orange-600', bgColor: 'bg-orange-100', borderColor: 'border-orange-200', icon: CheckCircle },
    GOOD: { min: 61, max: 75, label: t('exams.examResult.grades.good'), color: 'text-blue-600', bgColor: 'bg-blue-100', borderColor: 'border-blue-200', icon: Award },
    VERY_GOOD: { min: 76, max: 85, label: t('exams.examResult.grades.veryGood'), color: 'text-teal-600', bgColor: 'bg-teal-100', borderColor: 'border-teal-200', icon: Award },
    EXCELLENT: { min: 86, max: 100, label: t('exams.examResult.grades.excellent'), color: 'text-green-600', bgColor: 'bg-green-100', borderColor: 'border-green-200', icon: Crown }
  }

  const calculateTotalScore = (exam) => {
    if (exam?.totalScore && exam.totalScore > 0) {
      return exam.totalScore
    }

    if (Array.isArray(exam?.questions) && exam.questions.length > 0) {
      const totalFromQuestions = exam.questions.reduce((sum, question) => {
        return sum + (question.points || 1)
      }, 0)

      if (totalFromQuestions > 0) {
        return totalFromQuestions
      }
    }

    if (exam?.questions?.length > 0) {
      return exam.questions.length
    }

    return 100
  }

  const getGradeInfo = (percentage) => {
    const percent = Number(percentage)
    for (const [key, grade] of Object.entries(GRADE_SYSTEM)) {
      if (percent >= grade.min && percent <= grade.max) {
        return grade
      }
    }
    return GRADE_SYSTEM.FAILED
  }

  const fetchResult = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const examRes = await examsAPI.getExamById(id)
      setExamDetails(examRes)

      const resultData = await examsAPI.getStudentScore(id)

      if (resultData === null) {
        setError(t('exams.examResult.messages.notSubmittedDesc'))
        toast({
          title: t('exams.examResult.messages.notSubmitted'),
          description: t('exams.examResult.messages.notSubmittedDesc'),
          variant: 'destructive'
        })
        setResult(null)
        return
      }

      let score = 0
      let correctAnswers = 0
      let totalQuestions = 0

      if (typeof resultData?.score === 'number') {
        score = resultData.score
      } else if (typeof resultData?.result?.score === 'number') {
        score = resultData.result.score
      } else if (typeof resultData === 'number') {
        score = resultData
      }

      const totalScore = calculateTotalScore(examRes)

      const percentage = totalScore > 0 ? Math.round((score / totalScore) * 100) : 0

      if (examRes?.questions?.length > 0) {
        totalQuestions = examRes.questions.length

        if (percentage === 100) {
          correctAnswers = totalQuestions
        } else {
          correctAnswers = Math.round((percentage / 100) * totalQuestions)
        }
      }

      let timeSpentMinutes = 0
      if (resultData?.timeSpentMinutes) {
        timeSpentMinutes = resultData.timeSpentMinutes
      } else if (resultData?.timeSpent) {
        timeSpentMinutes = Math.round(resultData.timeSpent / 60)
      }

      const completedAt = resultData?.completedAt || resultData?.submittedAt || resultData?.updatedAt || new Date().toISOString()

      const finalResult = {
        score: score,
        totalScore: totalScore,
        percentage: percentage,
        timeSpentMinutes: timeSpentMinutes,
        completedAt: completedAt,
        correctAnswers: Math.max(correctAnswers, 0),
        totalQuestions: Math.max(totalQuestions, examRes?.questions?.length || 0)
      }

      setResult(finalResult)
      localStorage.setItem(storageKey, JSON.stringify(finalResult))

    } catch (error) {
      let errorMessage = t('exams.examResult.messages.loadingError')

      if (error.message?.includes('Session expired') || error.status === 401) {
        errorMessage = t('exams.examResult.errors.sessionExpired')
        localStorage.removeItem('token')
        navigate('/login')
      } else if (error.message?.includes('Network')) {
        errorMessage = t('exams.examResult.errors.networkError')
      } else {
        errorMessage = error.message || t('exams.examResult.errors.unknownError')
      }

      setError(errorMessage)
      toast({
        title: t('exams.examResult.errors.errorTitle'),
        description: errorMessage,
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      fetchResult()
    }
  }, [id])

  const handleRefresh = async () => {
    localStorage.removeItem(storageKey)
    await fetchResult()

    toast({
      title: t('exams.examResult.messages.refreshed'),
      description: t('exams.examResult.messages.refreshedDesc'),
      variant: 'default'
    })
  }

  const handleRetakeExam = () => {
    navigate(`/exams/${id}`)
  }

  const handlePrintCertificate = () => {
    const certificateWindow = window.open('', '_blank')
    if (certificateWindow) {
      certificateWindow.document.write(`
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
          <meta charset="UTF-8">
          <title>شهادة إنجاز - ${examDetails?.title}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&display=swap');
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Cairo', sans-serif; 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              min-height: 100vh;
              display: flex;
              justify-content: center;
              align-items: center;
              padding: 20px;
            }
            .certificate {
              width: 210mm;
              min-height: 297mm;
              background: linear-gradient(135deg, #fdfcfb 0%, #e2d1c3 100%);
              border: 20px solid #d4af37;
              position: relative;
              padding: 40px;
              box-shadow: 0 0 50px rgba(0,0,0,0.3);
              overflow: hidden;
            }
            .gold-border { border-color: #d4af37; }
            .header {
              text-align: center;
              margin-bottom: 40px;
              position: relative;
            }
            .header h1 {
              font-size: 42px;
              color: #2c3e50;
              margin-bottom: 10px;
              font-weight: 900;
            }
            .header-line {
              width: 200px;
              height: 3px;
              background: linear-gradient(to right, #d4af37, #f9d423);
              margin: 0 auto 20px;
            }
            .content {
              text-align: center;
              margin: 40px 0;
            }
            .student-name {
              font-size: 36px;
              color: #2980b9;
              margin: 20px 0;
              font-weight: 700;
            }
            .achievement-text {
              font-size: 24px;
              color: #34495e;
              margin: 30px 0;
              line-height: 1.6;
            }
            .exam-title {
              font-size: 28px;
              color: #e74c3c;
              font-weight: 700;
              margin: 20px 0;
              padding: 10px;
              background: rgba(255,255,255,0.8);
              border-radius: 10px;
              display: inline-block;
            }
            .stats {
              display: flex;
              justify-content: space-around;
              margin: 40px 0;
              flex-wrap: wrap;
            }
            .stat-item {
              text-align: center;
              padding: 20px;
              min-width: 200px;
            }
            .stat-value {
              font-size: 48px;
              font-weight: 900;
              color: #27ae60;
              margin-bottom: 10px;
            }
            .stat-label {
              font-size: 18px;
              color: #7f8c8d;
            }
            .signatures {
              display: flex;
              justify-content: space-between;
              margin-top: 60px;
              padding-top: 20px;
              border-top: 2px solid #bdc3c7;
            }
            .signature {
              text-align: center;
              width: 30%;
            }
            .signature-name {
              font-size: 22px;
              font-weight: 700;
              color: #2c3e50;
              margin-bottom: 10px;
            }
            .signature-title {
              font-size: 16px;
              color: #7f8c8d;
              margin-bottom: 20px;
            }
            .signature-line {
              width: 150px;
              height: 2px;
              background: #34495e;
              margin: 0 auto;
            }
            .seal {
              text-align: center;
              margin: 30px 0;
            }
            .seal-icon {
              width: 120px;
              height: 120px;
              background: linear-gradient(135deg, #d4af37, #f9d423);
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto 20px;
              box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            }
            .seal-icon svg {
              width: 60px;
              height: 60px;
              color: white;
            }
            .certificate-number {
              text-align: center;
              margin-top: 20px;
              color: #7f8c8d;
              font-size: 14px;
            }
            .watermark {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-45deg);
              font-size: 120px;
              color: rgba(212, 175, 55, 0.1);
              font-weight: 900;
              white-space: nowrap;
              pointer-events: none;
              z-index: 1;
            }
            @media print {
              body { background: none; }
              .certificate {
                box-shadow: none;
                border: 20px solid #d4af37;
                margin: 0;
                padding: 40px;
              }
            }
          </style>
        </head>
        <body>
          <div class="certificate">
            <div class="watermark">EduMaster</div>
            
            <div class="header">
              <h1>{t('exams.examResult.certificate.title')}</h1>
              <div class="header-line"></div>
              <p style="font-size: 18px; color: #7f8c8d;">تمنح هذه الشهادة {t('exams.examResult.certificate.forExcellence')}</p>
            </div>
            
            <div class="content">
              <p class="achievement-text">{t('exams.examResult.certificate.awardedTo')}</p>
              <div class="student-name">${user?.fullName || 'الطالب'}</div>
              <p class="achievement-text">{t('exams.examResult.certificate.forAchievement')}</p>
              <div class="exam-title">${examDetails?.title || 'الامتحان'}</div>
              <p class="achievement-text">{t('exams.examResult.certificate.exceptionalPerformance')}</p>
            </div>
            
            <div class="stats">
              <div class="stat-item">
                <div class="stat-value">${result?.percentage || 0}%</div>
                <div class="stat-label">{t('exams.examResult.stats.percentage')}</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">${getGradeInfo(result?.percentage || 0).label}</div>
                <div class="stat-label">{t('exams.examResult.certificate.grade')}</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">${result?.score || 0}/${result?.totalScore || 100}</div>
                <div class="stat-label">{t('exams.examResult.stats.finalScore')}</div>
              </div>
            </div>
            
            <div class="seal">
              <div class="seal-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
                  <path d="M19 4H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2z" />
                  <path d="M7 4v16" />
                  <path d="M17 4v16" />
                </svg>
              </div>
              <p style="color: #d4af37; font-weight: 700;">{t('exams.examResult.certificate.officialSeal')}</p>
            </div>
            
            <div class="signatures">
              <div class="signature">
                <div class="signature-name">{t('exams.examResult.certificate.managerName')}</div>
                <div class="signature-title">{t('exams.examResult.certificate.platformManager')}</div>
                <div class="signature-line"></div>
                <p style="margin-top: 10px; color: #7f8c8d;">{t('exams.examResult.certificate.signature')}</p>
              </div>
              
              <div class="signature">
                <div class="signature-name">{t('exams.examResult.certificate.supervisorName')}</div>
                <div class="signature-title">{t('exams.examResult.certificate.academicSupervisor')}</div>
                <div class="signature-line"></div>
                <p style="margin-top: 10px; color: #7f8c8d;">{t('exams.examResult.certificate.signature')}</p>
              </div>
            </div>
            
            <div class="certificate-number">
              <p>{t('exams.examResult.certificate.certificateNumber')}: ${id?.slice(0, 8).toUpperCase() || 'EDU'}-${Date.now().toString().slice(-6)}</p>
              <p>{t('exams.examResult.certificate.issueDate')}: ${new Date().toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p style="margin-top: 10px; font-size: 12px;">هذه شهادة معتمدة رسمياً من منصة EduMaster التعليمية</p>
            </div>
          </div>
          
          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => window.close(), 1000);
            }
          </script>
        </body>
        </html>
      `)
      certificateWindow.document.close()
    }
  }

  const handleDownloadCertificate = () => {
    toast({
      title: t('exams.examResult.messages.preparingPrint'),
      description: t('exams.examResult.messages.preparingPrintDesc'),
    })
    handlePrintCertificate()
  }

  const handleShareCertificate = () => {
    if (navigator.share) {
      navigator.share({
        title: `شهادة ${examDetails?.title}`,
        text: `لقد حصلت على ${result?.percentage}% في امتحان ${examDetails?.title}`,
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast({
        title: t('exams.examResult.messages.linkCopied'),
        description: t('exams.examResult.messages.linkCopiedDesc'),
      })
    }
  }

  const correctCount = result?.correctAnswers || 0
  const totalQuestions = result?.totalQuestions || 1
  const incorrectCount = Math.max(0, totalQuestions - correctCount)
  const accuracyRate = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0

  const percentage = result?.percentage || 0
  const isPassed = percentage >= 50
  const gradeInfo = getGradeInfo(percentage)

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

  if (error && !result) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {error.includes('لم تقدم') ? t('exams.examResult.messages.notSubmitted') : t('exams.examResult.errors.errorTitle')}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {error}
            </p>
            <div className="flex justify-center gap-4">
              <Link to="/exams">
                <Button>{t('exams.examResult.actions.backToExams')}</Button>
              </Link>
              {error.includes('لم تقدم') && (
                <Button onClick={handleRetakeExam}>{t('exams.examResult.actions.submitNow')}</Button>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  if (!result || !examDetails) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              النتيجة غير متاحة
            </h1>
            <Link to="/exams">
              <Button>{t('exams.examResult.actions.backToExams')}</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="flex justify-center mb-4">
            <div className="relative">
              {isPassed ? (
                <div className="relative">
                  <Award className="h-24 w-24 text-yellow-500" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Crown className="h-12 w-12 text-yellow-300" />
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <XCircle className="h-24 w-24 text-red-500" />
                </div>
              )}
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {examDetails.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            {isPassed ? t('exams.examResult.congratulations') : t('exams.examResult.tryAgain')}
          </p>

          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${gradeInfo.bgColor} ${gradeInfo.borderColor} border`}>
            <gradeInfo.icon className={`h-5 w-5 ${gradeInfo.color}`} />
            <span className={`font-bold ${gradeInfo.color}`}>
              {gradeInfo.label} ({percentage}%)
            </span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200">
            <CardContent className="p-6 text-center flex flex-col items-center justify-center h-full">
              <Trophy className="h-10 w-10 text-yellow-500 mx-auto mb-3" />
              <p className="text-sm text-gray-500 mb-1">{t('exams.examResult.stats.finalScore')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {result.score} / {result.totalScore}
              </p>
              <p className="text-xs text-gray-600 mt-2">
                {percentage}% {t('exams.examResult.stats.ofTotal')}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200">
            <CardContent className="p-6 text-center flex flex-col items-center justify-center h-full">
              <BarChart3 className="h-10 w-10 text-blue-500 mx-auto mb-3" />
              <p className="text-sm text-gray-500 mb-1">{t('exams.examResult.stats.percentage')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{percentage}%</p>
              <div className="mt-2 w-full">
                <Progress value={percentage} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200">
            <CardContent className="p-6 text-center flex flex-col items-center justify-center h-full">
              <Clock className="h-10 w-10 text-green-500 mx-auto mb-3" />
              <p className="text-sm text-gray-500 mb-1">{t('exams.examResult.stats.timeSpent')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{result.timeSpentMinutes}</p>
              <p className="text-xs text-gray-600 mt-2">{t('exams.examResult.stats.minutes')}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200">
            <CardContent className="p-6 text-center flex flex-col items-center justify-center h-full">
              <Calendar className="h-10 w-10 text-purple-500 mx-auto mb-3" />
              <p className="text-sm text-gray-500 mb-1">{t('exams.examResult.stats.completionDate')}</p>
              <p className="text-base font-bold text-gray-900 dark:text-white">
                {new Date(result.completedAt).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                {t('exams.examResult.stats.at')} {new Date(result.completedAt).toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-6 w-6 ml-2" />{t('exams.examResult.analysis.title')}</CardTitle>
            <CardDescription>{t('exams.examResult.analysis.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="text-center p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl flex flex-col items-center justify-center h-full">
                <div className="text-3xl md:text-4xl font-bold text-green-600 mb-2">{correctCount}</div>
                <p className="text-base font-medium text-green-700 mb-3">{t('exams.examResult.analysis.correctAnswers')}</p>
                <div className="mt-auto w-full">
                  <Progress value={accuracyRate} className="h-2 bg-green-100" />
                  <p className="text-xs text-green-600 mt-1">{accuracyRate}%</p>
                </div>
              </div>

              <div className="text-center p-6 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 rounded-xl flex flex-col items-center justify-center h-full">
                <div className="text-3xl md:text-4xl font-bold text-red-600 mb-2">{incorrectCount}</div>
                <p className="text-base font-medium text-red-700 mb-3">{t('exams.examResult.analysis.incorrectAnswers')}</p>
                <div className="mt-auto w-full">
                  <Progress value={100 - accuracyRate} className="h-2 bg-red-100" />
                  <p className="text-xs text-red-600 mt-1">{100 - accuracyRate}%</p>
                </div>
              </div>

              <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl flex flex-col items-center justify-center h-full">
                <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">{totalQuestions}</div>
                <p className="text-base font-medium text-blue-700 mb-3">{t('exams.examResult.analysis.totalQuestions')}</p>
                <div className="mt-auto">
                  <p className="text-xs text-blue-600">
                    {t('exams.examResult.analysis.successRate')}: {accuracyRate}%
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 p-6 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 text-center">{t('exams.examResult.analysis.performanceLevel')}</h3>
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-yellow-500" />
                  <span className="text-gray-700 dark:text-gray-300">{t('exams.examResult.analysis.classification')}:</span>
                </div>
                <Badge className={`text-base px-4 py-1.5 ${gradeInfo.bgColor} ${gradeInfo.color}`}>
                  {gradeInfo.label}
                </Badge>
              </div>
              <p className="mt-4 text-gray-600 dark:text-gray-400 text-center text-base">
                {percentage >= 90
                  ? t('exams.examResult.analysis.feedback.excellent')
                  : percentage >= 80
                    ? t('exams.examResult.analysis.feedback.veryGood')
                    : percentage >= 70
                      ? t('exams.examResult.analysis.feedback.good')
                      : percentage >= 50
                        ? t('exams.examResult.analysis.feedback.acceptable')
                        : t('exams.examResult.analysis.feedback.failed')}
              </p>
            </div>
          </CardContent>
        </Card>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row justify-center gap-4 mt-8"
        >
          <Link to="/exams">
            <Button variant="outline" className="w-full sm:w-auto">{t('exams.examResult.actions.backToExams')}</Button>
          </Link>

          <Button
            onClick={handleRefresh}
            className="w-full sm:w-auto flex items-center justify-center gap-2"
            variant="secondary"
          >
            <RefreshCw className="h-4 w-4" />{t('exams.examResult.actions.refreshResult')}</Button>

          {isPassed && (
            <Button
              onClick={() => setShowCertificate(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
            >
              <Star className="h-4 w-4" />{t('exams.examResult.certificate.viewCertificate')}</Button>
          )}

          {!isPassed && (
            <Button
              onClick={handleRetakeExam}
              className="w-full sm:w-auto"
              variant="destructive"
            >{t('exams.examResult.actions.retakeExam')}</Button>
          )}
        </motion.div>
      </div>

      <AnimatePresence>
        {showCertificate && (
          <Dialog open={showCertificate} onOpenChange={setShowCertificate}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
              <DialogHeader className="p-6">
                <DialogTitle className="text-2xl">{t('exams.examResult.certificate.title')}</DialogTitle>
                <DialogDescription>{t('exams.examResult.certificate.certifiedBy')}</DialogDescription>
              </DialogHeader>

              <div className="certificate-container border-8 border-yellow-500 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-gray-900 dark:to-gray-800 p-8 rounded-2xl shadow-2xl relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-5 rotate-45">
                  <div className="text-8xl font-bold text-gray-400 whitespace-nowrap">EduMaster</div>
                </div>

                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-400"></div>
                <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-400"></div>
                <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b from-yellow-400 via-orange-400 to-yellow-400"></div>
                <div className="absolute right-0 top-0 bottom-0 w-2 bg-gradient-to-b from-yellow-400 via-orange-400 to-yellow-400"></div>

                <div className="text-center space-y-8 relative z-10">
                  <div className="mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-yellow-300 mb-4">{t('exams.examResult.certificate.title')}</h1>
                    <div className="w-48 h-1 bg-gradient-to-r from-yellow-500 to-orange-500 mx-auto"></div>
                    <p className="text-base text-gray-600 dark:text-gray-400 mt-4">
                      تمنح هذه الشهادة {t('exams.examResult.certificate.forExcellence')}
                    </p>
                  </div>

                  <div className="mb-8">
                    <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 mb-6">{t('exams.examResult.certificate.awardedTo')}</p>
                    <div className="relative inline-block">
                      <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent p-4 border-4 border-double border-yellow-400 rounded-xl">
                        {user?.fullName || 'الطالب'}
                      </h2>
                      <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur opacity-30"></div>
                    </div>
                    <p className="text-base text-gray-600 dark:text-gray-400 mt-4">
                      {user?.email || ''}
                    </p>
                  </div>

                  <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-6 mb-8 border-2 border-yellow-200">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t('exams.examResult.certificate.forAchievement')}</h3>
                    <div className="inline-block px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full mb-6">
                      <p className="text-lg text-white font-bold">
                        "{examDetails.title}"
                      </p>
                    </div>
                    <p className="text-lg text-gray-700 dark:text-gray-300 mb-8">{t('exams.examResult.certificate.exceptionalPerformance')}</p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                      <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/30 dark:to-amber-900/30 rounded-xl border border-yellow-200">
                        <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{percentage}%</div>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">{t('exams.examResult.stats.percentage')}</p>
                        <div className="mt-3">
                          <Progress value={percentage} className="h-2 bg-yellow-100" />
                        </div>
                      </div>

                      <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl border border-green-200">
                        <div className="text-3xl font-bold text-green-600 dark:text-green-400">{result.score}/{result.totalScore}</div>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">{t('exams.examResult.stats.finalScore')}</p>
                        <div className="mt-3 flex items-center justify-center gap-2">
                          <Trophy className="h-4 w-4 text-green-500" />
                          <span className="text-xs text-green-600">{t('exams.examResult.certificate.distinctiveAchievement')}</span>
                        </div>
                      </div>

                      <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-xl border border-blue-200">
                        <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{gradeInfo.label}</div>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">{t('exams.examResult.certificate.academicGrade')}</p>
                        <div className="mt-3">
                          <gradeInfo.icon className="h-6 w-6 mx-auto text-blue-500" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="my-6">
                    <div className="relative inline-block">
                      <div className="w-24 h-24 mx-auto bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-2xl">
                        <Trophy className="h-12 w-12 text-white" />
                      </div>
                      <div className="absolute inset-0 animate-ping opacity-20">
                        <div className="w-full h-full bg-yellow-400 rounded-full"></div>
                      </div>
                    </div>
                    <p className="text-base font-bold text-yellow-600 dark:text-yellow-400 mt-4">{t('exams.examResult.certificate.officialSeal')}</p>
                  </div>

                  <div className="mt-8">
                    <div className="flex justify-between items-end flex-wrap gap-6">
                      <div className="text-center flex-1 min-w-[200px]">
                        <div className="border-t-2 border-gray-400 dark:border-gray-600 pt-4 w-full">
                          <p className="text-lg font-bold text-gray-900 dark:text-white mb-2">{t('exams.examResult.certificate.managerName')}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{t('exams.examResult.certificate.platformManager')}</p>
                          <div className="mt-2 h-0.5 w-32 mx-auto bg-gradient-to-r from-gray-400 to-gray-600"></div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{t('exams.examResult.certificate.officialSignature')}</p>
                        </div>
                      </div>

                      <div className="text-center flex-1 min-w-[200px]">
                        <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-xl">
                          <p className="text-base font-bold text-gray-900 dark:text-white">{t('exams.examResult.certificate.issueDate')}</p>
                          <p className="text-lg text-blue-600 dark:text-blue-400 my-1">
                            {new Date().toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                            {t('exams.examResult.certificate.certificateNumber')}: <span className="font-mono font-bold">{id.slice(0, 8).toUpperCase()}-${Date.now().toString().slice(-6)}</span>
                          </p>
                        </div>
                      </div>

                      <div className="text-center flex-1 min-w-[200px]">
                        <div className="border-t-2 border-gray-400 dark:border-gray-600 pt-4 w-full">
                          <p className="text-lg font-bold text-gray-900 dark:text-white mb-2">{t('exams.examResult.certificate.supervisorName')}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{t('exams.examResult.certificate.academicSupervisor')}</p>
                          <div className="mt-2 h-0.5 w-32 mx-auto bg-gradient-to-r from-gray-400 to-gray-600"></div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{t('exams.examResult.certificate.officialSignature')}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-300 dark:border-gray-700">
                      <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                        {t('exams.examResult.certificate.certifiedOfficial')} | {t('exams.examResult.certificate.allRightsReserved')} ${new Date().getFullYear()}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 text-center mt-1">{t('exams.examResult.certificate.verifyOnline')}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap justify-center gap-3 p-4 border-t">
                <Button
                  onClick={handlePrintCertificate}
                  className="flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-sm"
                >
                  <Printer className="h-4 w-4" />{t('exams.examResult.certificate.printCertificate')}</Button>

                <Button
                  onClick={handleDownloadCertificate}
                  variant="outline"
                  className="flex items-center gap-2 text-sm"
                >
                  <Download className="h-4 w-4" />{t('exams.examResult.certificate.downloadCertificate')}</Button>

                <Button
                  onClick={handleShareCertificate}
                  variant="secondary"
                  className="flex items-center gap-2 text-sm"
                >
                  <Share2 className="h-4 w-4" />{t('exams.examResult.certificate.shareCertificate')}</Button>

                <Button
                  onClick={() => setShowCertificate(false)}
                  variant="ghost"
                  className="flex items-center gap-2 text-sm"
                >
                  <X className="h-4 w-4" />{t('exams.examResult.actions.close')}</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ExamResultPage