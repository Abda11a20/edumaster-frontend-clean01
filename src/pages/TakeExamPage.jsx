import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { examsAPI, questionsAPI } from '../services/api'
import { timeService } from '../services/timeService'
import LoadingSpinner from '../components/LoadingSpinner'
import Navbar from '../components/Navbar'

const TakeExamPage = () => {
  const { id } = useParams()
  const [exam, setExam] = useState(null)
  const [questions, setQuestions] = useState([])
  const [remainingTime, setRemainingTime] = useState(null)
  const [answers, setAnswers] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [timeExpired, setTimeExpired] = useState(false)
  const { toast } = useToast()
  const navigate = useNavigate()
  const timerRef = useRef(null)
  const [isResumed, setIsResumed] = useState(false)
  const storageKey = `exam_answers_${id}`

  // دالة لجلب تفاصيل الأسئلة
  const fetchQuestionsDetails = async (questionIdsOrObjects) => {
    try {
      if (!questionIdsOrObjects || questionIdsOrObjects.length === 0) {
        return []
      }

      // Helpers to normalize question type/options from backend
      const normalizeType = (t) => {
        const v = (t || '').toString().toLowerCase().replace(/_/g, '-')
        if (v === 'multiple-choice' || v === 'true-false' || v === 'multiplechoice') return 'multipleChoice'
        if (v === 'short-answer' || v === 'essay') return 'essay'
        // default fallback
        return 'multipleChoice'
      }
      const ensureOptions = (type, opts, rawType) => {
        // For choice-based questions, ensure we have options (true/false may lack explicit options)
        if (type === 'multipleChoice') {
          if (Array.isArray(opts) && opts.length > 0) return opts
          // If backend denotes true/false via type
          const v = (rawType || '').toString().toLowerCase()
          if (v === 'true-false' || v === 'truefalse') return ['صحيح', 'خطأ']
          // Reasonable fallback
          return []
        }
        return []
      }

      if (questionIdsOrObjects[0] && questionIdsOrObjects[0].text) {
        return questionIdsOrObjects.map(q => {
          const rawType = q.type
          const type = normalizeType(rawType)
          const options = ensureOptions(type, q.options || q.choices, rawType)
          return {
            _id: q._id || q.id,
            text: q.text || q.title || '',
            type,
            options,
            correctAnswer: q.correctAnswer || '',
            points: q.points || 1
          }
        })
      }

      const ids = Array.from(new Set(
        questionIdsOrObjects
          .map(q => (typeof q === 'string' ? q : (q._id || q.id)))
          .filter(Boolean)
      ))

      // Try batch endpoint first; fallback to individual fetch if it fails
      try {
        const batch = await questionsAPI.getQuestionsByIds(ids)
        const batchData = batch?.data || batch
        if (Array.isArray(batchData) && batchData.length > 0) {
          return batchData.map(questionData => {
            const rawType = questionData.type
            const type = normalizeType(rawType)
            const options = ensureOptions(type, questionData.options || questionData.choices, rawType)
            return {
              _id: questionData._id || questionData.id,
              text: questionData.text || questionData.title || '',
              type,
              options,
              correctAnswer: questionData.correctAnswer || '',
              points: questionData.points || 1
            }
          })
        }
      } catch (batchErr) {
        // Fallback to individual fetching
      }

      const questionsPromises = ids.map(qid => 
        questionsAPI.getQuestionById(qid).catch(error => {
          console.error(`Error fetching question ${qid}:`, error)
          return null
        })
      )

      const questionsResponses = await Promise.all(questionsPromises)

      return questionsResponses
        .filter(response => response !== null)
        .map(response => {
          const questionData = response.data || response
          const rawType = questionData.type
          const type = normalizeType(rawType)
          const options = ensureOptions(type, questionData.options || questionData.choices, rawType)
          return {
            _id: questionData._id || questionData.id,
            text: questionData.text || questionData.title || '',
            type,
            options,
            correctAnswer: questionData.correctAnswer || '',
            points: questionData.points || 1
          }
        })
    } catch (error) {
      console.error('Error fetching questions details:', error)
      return []
    }
  }

  useEffect(() => {
    const initializeExam = async () => {
      try {
        setIsLoading(true)

        // 1) Fetch exam details first
        const examRes = await examsAPI.getExamById(id)
        let examDetails = examRes?.data || examRes
        if (examDetails?.exam) {
          examDetails = examDetails.exam
        }
        setExam(examDetails)

        // 2) Load questions details
        const questionList = examDetails?.questions ?? []
        let questionsDetails = []
        if (Array.isArray(questionList) && questionList.length > 0) {
          questionsDetails = await fetchQuestionsDetails(questionList)
        } else {
          // Fallback: exam may not embed questions. Fetch and filter by exam id.
          try {
            const allQ = await questionsAPI.getAllQuestions({ page: 1, limit: 1000 })
            const filtered = (allQ?.data || allQ || []).filter(q => {
              const ex = q?.exam
              if (!ex) return false
              if (typeof ex === 'string') return ex === id
              return ex?._id === id
            })
            questionsDetails = await fetchQuestionsDetails(filtered)
          } catch (e) {
            // ignore, will remain empty
          }
        }
        setQuestions(questionsDetails)

        // Initialize answers
        const initialAnswers = {}
        questionsDetails.forEach(question => {
          if (question && question._id) {
            initialAnswers[question._id] = question.type === 'essay' ? '' : null
          }
        })
        setAnswers(initialAnswers)

        // Try to restore saved answers from localStorage (merge only for existing questions)
        try {
          const saved = localStorage.getItem(storageKey)
          if (saved) {
            const parsed = JSON.parse(saved)
            const merged = { ...initialAnswers }
            questionsDetails.forEach(q => {
              if (q && q._id && parsed[q._id] !== undefined && parsed[q._id] !== null) {
                merged[q._id] = parsed[q._id]
              }
            })
            setAnswers(merged)
          }
        } catch (e) {
          // ignore parse errors
        }

        // 3) Try to get remaining time; if not started, start the exam
        let remainingSeconds = null
        let gotRemainingFromServer = false
        try {
          const timeResponse = await examsAPI.getRemainingTime(id)
          const timeData = timeResponse?.data ?? timeResponse

          if (timeData?.remainingTime && typeof timeData.remainingTime === 'object') {
            const { minutes = 0, seconds = 0 } = timeData.remainingTime
            remainingSeconds = (parseInt(minutes) * 60) + parseInt(seconds)
            gotRemainingFromServer = true
          } else if (typeof timeData?.remainingTime === 'number') {
            remainingSeconds = timeData.remainingTime
            gotRemainingFromServer = true
          } else if (timeData?.expiresAt) {
            const expires = new Date(timeData.expiresAt)
            const now = new Date()
            remainingSeconds = Math.floor((expires - now) / 1000)
            gotRemainingFromServer = true
          }
        } catch (timeErr) {
          // If remaining time cannot be fetched (e.g., exam not started), we'll start it below
          if (timeErr.status && timeErr.status !== 401) {
            // swallow and fallback to start
          } else if (timeErr.status === 401) {
            throw timeErr
          }
        }

        // If remaining time equals 0, time is up; do NOT start a new exam
        if (remainingSeconds === 0) {
          setTimeExpired(true)
          setRemainingTime(0)
          return
        }

        // If no valid remaining time (null/NaN), start the exam now
        if (remainingSeconds === null || Number.isNaN(remainingSeconds)) {
          const startRes = await examsAPI.startExam(id)
          const startData = startRes?.data || startRes

          if (startData?.exam && !examDetails) {
            setExam(startData.exam)
          }

          if (startData?.endTime) {
            const end = new Date(startData.endTime)
            const now = new Date()
            remainingSeconds = Math.max(0, Math.floor((end - now) / 1000))
          } else {
            remainingSeconds = (examDetails?.duration || 60) * 60
          }
          setIsResumed(false)
        } else {
          // We got remaining time without starting now -> it's a resume
          setIsResumed(gotRemainingFromServer && remainingSeconds > 0)
        }

        setTimeExpired(remainingSeconds <= 0)
        setRemainingTime(Math.max(0, Math.floor(remainingSeconds)))
      } catch (error) {
        console.error('Error initializing exam:', error)
        toast({
          title: 'خطأ في تحميل الامتحان',
          description: error.message || 'لا يمكن تحميل تفاصيل الامتحان الآن',
          variant: 'destructive'
        })
        navigate(`/exams/${id}`)
      } finally {
        setIsLoading(false)
      }
    }

    if (id) {
      initializeExam()
    }
  }, [id])

  // Warn user before leaving during an ongoing exam
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!timeExpired && !isSubmitting && questions.length > 0) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [timeExpired, isSubmitting, questions.length])

  useEffect(() => {
    // Skip timer logic while loading or until we have a valid remainingTime
    if (isLoading) return
    if (remainingTime === null) return

    if (remainingTime <= 0 || timeExpired) {
      if (remainingTime <= 0 && !timeExpired) {
        setTimeExpired(true)
        handleAutoSubmit()
      }
      return
    }

    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    timerRef.current = setInterval(() => {
      setRemainingTime(prev => {
        if (prev <= 5) {
          clearInterval(timerRef.current)
          timerRef.current = null
          setTimeExpired(true)
          handleAutoSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [remainingTime, timeExpired, isLoading])

  const handleAutoSubmit = async () => {
    if (isSubmitting) return

    toast({
      title: 'انتهى وقت الامتحان',
      description: 'جاري إرسال إجاباتك تلقائياً...',
      variant: 'default'
    })

    await handleSubmitExam(true)
  }

  const handleAnswerChange = (questionId, answer) => {
    setAnswers(prev => {
      const updated = {
        ...prev,
        [questionId]: answer
      }
      try { localStorage.setItem(storageKey, JSON.stringify(updated)) } catch (_) {}
      return updated
    })
  }

  const handleEssayAnswerChange = (questionId, answer) => {
    setAnswers(prev => {
      const updated = {
        ...prev,
        [questionId]: answer
      }
      try { localStorage.setItem(storageKey, JSON.stringify(updated)) } catch (_) {}
      return updated
    })
  }

  const handleSubmitExam = async (isAutoSubmit = false) => {
    if (timeExpired && !isAutoSubmit) {
      toast({
        title: 'انتهى وقت الامتحان',
        description: 'لا يمكن إرسال الإجابات بعد انتهاء الوقت',
        variant: 'destructive'
      })
      return
    }

    const unansweredRequiredQuestions = questions.filter(question => {
      const answer = answers[question._id]
      return (question.type === 'multipleChoice' && (answer === null || answer === '')) ||
             (question.type === 'essay' && (answer === null || answer === ''))
    })

    if (unansweredRequiredQuestions.length > 0 && !isAutoSubmit) {
      const confirmSubmit = window.confirm(
        `لديك ${unansweredRequiredQuestions.length} أسئلة لم تتم الإجابة عليها. هل تريد بالتأكيد إنهاء الامتحان؟`
      )

      if (!confirmSubmit) {
        return
      }
    }

    try {
      setIsSubmitting(true)

      const normalizeTrueFalse = (val) => {
        if (typeof val === 'boolean') return val
        if (val == null) return val
        const s = val.toString().trim().toLowerCase()
        if (['true', 'صحيح', 'صح', 'yes', '1'].includes(s)) return true
        if (['false', 'خطأ', 'غلط', 'no', '0'].includes(s)) return false
        return val
      }

      const answersArray = Object.entries(answers)
        .filter(([_, answer]) => answer !== null && answer !== '')
        .map(([questionId, selectedAnswer]) => {
          // Try to infer true/false style by checking question options
          const q = questions.find(qq => (qq?._id === questionId))
          let out = selectedAnswer
          if (q && Array.isArray(q.options) && q.options.length === 2) {
            const a = q.options.map(o => (o || '').toString().trim().toLowerCase())
            const isTF = (a.includes('صحيح') && a.includes('خطأ')) || (a.includes('true') && a.includes('false'))
            if (isTF) {
              // Match backend's stored type for correctAnswer (boolean or string)
              if (typeof q.correctAnswer === 'boolean') {
                out = normalizeTrueFalse(selectedAnswer)
              } else {
                // keep as the selected label string (e.g., 'صحيح'/'خطأ')
                out = selectedAnswer
              }
            }
          }
          return ({ questionId, selectedAnswer: out })
        });

      const submitData = { answers: answersArray };

      console.log('Submitting exam data:', submitData);

      const response = await examsAPI.submitExam(id, submitData);

      // Persist a minimal result snapshot for the result page
      try {
        const score = response?.score ?? response?.data?.score ?? 0
        const totalScore = response?.totalPoints ?? response?.totalScore ?? response?.data?.totalPoints ?? 100
        const percentage = totalScore > 0 ? Math.round((score / totalScore) * 100) : 0
        const resultSnapshot = {
          score,
          totalScore,
          percentage,
          completedAt: new Date().toISOString(),
          // We could include 'questions' review here if backend returns it on submit
        }
        localStorage.setItem(`exam_result_${id}`, JSON.stringify(resultSnapshot))
      } catch (_) {
        // ignore storage errors
      }

      // Clear saved answers on successful submit
      try { localStorage.removeItem(storageKey) } catch (_) {}

      toast({
        title: 'تم إرسال الامتحان',
        description: 'تم تقديم إجاباتك بنجاح'
      })

      navigate(`/exams/${id}/result`)
    } catch (error) {
      console.error('Error submitting exam:', error)

      let errorMessage = 'فشل في إرسال الإجابات';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: 'خطأ في إرسال الامتحان',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatTime = (seconds) => {
    return timeService.formatTimeForDisplay(seconds);
  }

  const answeredQuestions = Object.values(answers).filter(answer => answer !== null && answer !== '').length
  const totalQuestions = questions.length

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
            <Button onClick={() => navigate('/exams')}>
              العودة إلى الامتحانات
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {exam.title}
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              {exam.description}
            </p>
          </div>

          <div className="flex items-center mt-4 md:mt-0">
            <Clock className="h-6 w-6 text-red-500 ml-2" />
            <span className="text-xl font-bold text-red-500">
              {formatTime(remainingTime ?? 0)}
            </span>
            {timeExpired && (
              <span className="text-sm text-red-500 mr-2">(انتهى الوقت)</span>
            )}
          </div>
        </div>

        {isResumed && (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 ml-2" />
              <div>
                <h4 className="font-medium text-blue-800 dark:text-blue-200">تم استئناف الامتحان</h4>
                <p className="text-blue-700 dark:text-blue-300 text-sm mt-1">
                  تُتابع امتحانك حيث توقفت. تم استئناف المؤقت تلقائيًا.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg mb-6">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 ml-2" />
            <div>
              <h4 className="font-medium text-yellow-800 dark:text-yellow-200">تنبيه هام</h4>
              <p className="text-yellow-700 dark:text-yellow-300 text-sm mt-1">
                لا تقم بتحديث الصفحة أو الخروج منها أثناء الامتحان، فقد يؤدي ذلك إلى فقدان تقدمك.
                {timeExpired && ' انتهى وقت الامتحان، سيتم إرسال إجاباتك تلقائياً.'}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {questions.length > 0 ? (
            questions.map((question, index) => (
              <motion.div
                key={question._id || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      السؤال {index + 1}: {question.text || 'بدون نص'}
                      {question.type === 'essay' && (
                        <span className="text-sm text-blue-500 mr-2"> (سؤال مقالي)</span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {question.type === 'multipleChoice' ? (
                      <RadioGroup
                        value={answers[question._id] ?? ''}
                        onValueChange={(value) => handleAnswerChange(question._id, value)}
                        disabled={timeExpired}
                      >
                        {question.options && question.options.map((option, optIndex) => (
                          <div key={optIndex} className="flex items-center space-x-2 space-x-reverse mb-2">
                            <RadioGroupItem 
                              value={option} 
                              id={`${question._id}-${optIndex}`}
                              disabled={timeExpired}
                            />
                            <Label htmlFor={`${question._id}-${optIndex}`} className="cursor-pointer">
                              {option}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    ) : (
                      <Textarea
                        placeholder="اكتب إجابتك هنا..."
                        value={answers[question._id] ?? ''}
                        onChange={(e) => handleEssayAnswerChange(question._id, e.target.value)}
                        disabled={timeExpired}
                        className="min-h-32"
                      />
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">لا توجد أسئلة متاحة لهذا الامتحان</p>
            </div>
          )}
        </div>

        {questions.length > 0 && !timeExpired && (
          <div className="fixed bottom-4 right-4">
            <Button
              size="lg"
              onClick={() => handleSubmitExam(false)}
              disabled={isSubmitting}
              className="shadow-lg"
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" className="ml-2" />
                  جاري الإرسال...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 ml-2" />
                  إنهاء الامتحان
                </>
              )}
            </Button>
          </div>
        )}

        {questions.length > 0 && (
          <div className="fixed bottom-4 left-4 bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {answeredQuestions} / {totalQuestions} أسئلة تمت الإجابة عليها
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default TakeExamPage
