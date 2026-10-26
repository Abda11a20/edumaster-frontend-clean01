import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, Filter, Edit, Trash2, BookOpen, FileText, X, Save, ChevronDown, ChevronUp } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { questionsAPI, examsAPI } from '../../services/api'
import LoadingSpinner from '../../components/LoadingSpinner'
import Navbar from '../../components/Navbar'
import { useTranslation } from '../../hooks/useTranslation'

const AdminQuestions = () => {
  const [questions, setQuestions] = useState([])
  const [exams, setExams] = useState([])
  const [filteredQuestions, setFilteredQuestions] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [examFilter, setExamFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState(null)
  const [expandedQuestionId, setExpandedQuestionId] = useState(null)
  const { toast } = useToast()
  const { t, lang } = useTranslation()

  // حالة النموذج
  const [formData, setFormData] = useState({
    text: '',
    type: 'multiple-choice',
    options: ['', '', '', ''],
    correctAnswer: '',
    exam: 'no-exam',
    points: 1
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        setLoadError(null)
        const [questionsData, examsData] = await Promise.all([
          questionsAPI.getAllQuestions(),
          examsAPI.getAllExams()
        ])
        setQuestions(questionsData)
        setFilteredQuestions(questionsData)
        setExams(examsData)
      } catch (error) {
        console.error('Error fetching data:', error)
        setLoadError(t('admin.questions.messages.error_load_desc'))
        toast({
          title: t('admin.questions.messages.error_load'),
          description: t('admin.questions.messages.error_load_desc'),
          variant: 'destructive'
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [toast])

  useEffect(() => {
    let result = Array.isArray(questions) ? questions : []

    // تطبيق فلتر البحث
    if (searchTerm) {
      result = result.filter(question =>
        question.text?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // تطبيق فلتر الامتحان
    if (examFilter !== 'all') {
      result = result.filter(question => question.exam === examFilter)
    }

    // تطبيق فلتر النوع
    if (typeFilter !== 'all') {
      result = result.filter(question => question.type === typeFilter)
    }

    setFilteredQuestions(result)
  }, [searchTerm, examFilter, typeFilter, questions])

  // معالجة تغيير نوع السؤال
  useEffect(() => {
    if (formData.type === 'true-false') {
      setFormData(prev => ({
        ...prev,
        options: [t('admin.questions.types.true'), t('admin.questions.types.false')],
        correctAnswer: prev.correctAnswer || t('admin.questions.types.true')
      }))
    } else if (formData.type === 'multiple-choice' && formData.options.length === 0) {
      setFormData(prev => ({
        ...prev,
        options: ['', '', '', '']
      }))
    } else if (formData.type === 'short-answer') {
      setFormData(prev => ({
        ...prev,
        options: [],
        correctAnswer: prev.correctAnswer || ''
      }))
    }
  }, [formData.type])

  const resetForm = () => {
    setFormData({
      text: '',
      type: 'multiple-choice',
      options: ['', '', '', ''],
      correctAnswer: '',
      exam: 'no-exam',
      points: 1
    })
    setEditingQuestion(null)
  }

  const handleOpenDialog = (question = null) => {
    if (question) {
      // وضع التعديل
      setEditingQuestion(question)
      setFormData({
        text: question.text || '',
        type: question.type || 'multiple-choice',
        options: question.options && Array.isArray(question.options)
          ? [...question.options]
          : question.type === 'true-false'
            ? [t('admin.questions.types.true'), t('admin.questions.types.false')]
            : question.type === 'multiple-choice'
              ? ['', '', '', '']
              : [],
        correctAnswer: question.correctAnswer || '',
        exam: question.exam || 'no-exam',
        points: question.points ?? 1
      })


    } else {
      // وضع الإضافة
      resetForm()
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    resetForm()
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleOptionChange = (index, value) => {
    const newOptions = [...formData.options]
    newOptions[index] = value
    setFormData(prev => ({ ...prev, options: newOptions }))
  }

  const addOption = () => {
    setFormData(prev => ({ ...prev, options: [...prev.options, ''] }))
  }

  const removeOption = (index) => {
    if (formData.options.length <= 2) return
    const newOptions = formData.options.filter((_, i) => i !== index)
    setFormData(prev => ({ ...prev, options: newOptions }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      console.log('بدء عملية حفظ السؤال...')

      // التحققات الأولية
      if (!formData.text || !formData.text.toString().trim()) {
        throw new Error(t('admin.questions.messages.required_text'))
      }

      // عند الإنشاء: الباك‌اند يتحقق من وجود الامتحان
      if (!editingQuestion && (!formData.exam || formData.exam === 'no-exam' || formData.exam === '')) {
        throw new Error(t('admin.questions.messages.required_exam'))
      }

      // بناء payload أساسي
      const basePayload = {
        text: formData.text.toString().trim(),
        type: formData.type,
        points: parseInt(formData.points, 10) || 1
      }

      // إذا كان إنشاء جديد أضف exam (الخادم يتحقق منه في addQuestion)
      if (!editingQuestion) {
        basePayload.exam = formData.exam === 'no-exam' ? '' : formData.exam
      }

      // معالجة حسب النوع
      if (formData.type === 'multiple-choice') {
        const opts = (formData.options || [])
          .map(o => (o === undefined || o === null) ? '' : o.toString().trim())
          .filter(o => o)

        if (opts.length < 2) {
          throw new Error(t('admin.questions.messages.required_options'))
        }

        basePayload.options = opts
        basePayload.correctAnswer = formData.correctAnswer ? formData.correctAnswer.toString().trim() : ''

        // تحذير لو الإجابة الصحيحة لا تطابق أي خيار (غير قاطع)
        if (basePayload.correctAnswer && !opts.includes(basePayload.correctAnswer)) {
          console.warn('correctAnswer لا يطابق أي من الخيارات المرسلة — أُرسِل كما هو.')
        }
      } else if (formData.type === 'true-false') {
        // لا نرسل options لأن الباك‌اند قد يرفضها؛ نرسل correctAnswer كقيمة منطقية أو نصية
        const ca = formData.correctAnswer
        if (ca === true || ca === false) {
          basePayload.correctAnswer = ca
        } else if (typeof ca === 'string') {
          const norm = ca.toString().trim().toLowerCase()
          if (['صحيح', 'true', 'true'].includes(norm)) basePayload.correctAnswer = true
          else if (['خطأ', 'false', 'false'].includes(norm)) basePayload.correctAnswer = false
          else basePayload.correctAnswer = ca
        } else {
          basePayload.correctAnswer = ca
        }
      } else if (formData.type === 'short-answer') {
        // إرسال الإجابة الصحيحة كنص فقط، دون options
        basePayload.correctAnswer = formData.correctAnswer ? formData.correctAnswer.toString().trim() : ''
      }

      // أمان: لا نرسل المفتاح القديم choices
      if (Object.prototype.hasOwnProperty.call(basePayload, 'choices')) {
        delete basePayload.choices
      }

      console.log('Payload to send:', basePayload)

      // إرسال الطلب للبك‌اند
      let response
      if (editingQuestion) {
        response = await questionsAPI.updateQuestion(editingQuestion._id, basePayload)
        toast({ title: t('admin.questions.messages.update_success'), description: t('admin.questions.messages.update_success_desc') })
      } else {
        response = await questionsAPI.createQuestion(basePayload)
        toast({ title: t('admin.questions.messages.add_success'), description: t('admin.questions.messages.add_success_desc') })
      }

      console.log('استجابة الخادم:', response)

      // إعادة تحميل البيانات
      const questionsData = await questionsAPI.getAllQuestions()
      setQuestions(questionsData)
      handleCloseDialog()
    } catch (error) {
      console.error('Error saving question:', error)
      toast({
        title: t('admin.questions.messages.error'),
        description: error.message || t('admin.questions.messages.error_save'),
        variant: 'destructive'
      })
    }
  }

  const handleDelete = async () => {
    try {
      await questionsAPI.deleteQuestion(editingQuestion._id)
      toast({
        title: t('admin.questions.messages.delete_success'),
        description: t('admin.questions.messages.delete_success_desc')
      })

      // إعادة تحميل البيانات
      const questionsData = await questionsAPI.getAllQuestions()
      setQuestions(questionsData)
      setIsDeleteDialogOpen(false)
      setEditingQuestion(null)
    } catch (error) {
      console.error('Error deleting question:', error)
      toast({
        title: t('admin.questions.messages.error'),
        description: t('admin.questions.messages.error_delete'),
        variant: 'destructive'
      })
    }
  }

  const getExamName = (examId) => {
    if (!examId || examId === 'no-exam') return t('common.unknown')
    const exam = (Array.isArray(exams) ? exams : []).find(e => e._id === examId)
    return exam ? exam.title : t('common.unknown')
  }

  const toggleExpand = (questionId) => {
    if (expandedQuestionId === questionId) {
      setExpandedQuestionId(null)
    } else {
      setExpandedQuestionId(questionId)
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8 flex justify-between items-center"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {t('admin.questions.title')}
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              {t('admin.questions.subtitle')}
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 ml-2" />
            {t('admin.questions.add_new')}
          </Button>
        </motion.div>

        {/* بطاقة الإحصائيات */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-6"
        >
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">{t('admin.questions.stats.total')}</p>
                  <p className="text-3xl font-bold">{questions.length}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">{t('admin.questions.stats.mcq')}</p>
                  <p className="text-3xl font-bold">
                    {(Array.isArray(questions) ? questions : []).filter(q => q.type === 'multiple-choice').length}
                  </p>
                </div>
                <BookOpen className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 lg:col-span-1">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">{t('admin.questions.stats.target')}</p>
                  <p className="text-3xl font-bold">
                    {new Set((Array.isArray(questions) ? questions : []).filter(q => q.exam).map(q => q.exam)).size}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* أدوات التصفية والبحث */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-6"
        >
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="grid grid-cols-2 items-center gap-3 lg:flex lg:flex-row lg:gap-4">
                <div className="relative col-span-2 min-w-0 lg:flex-1">
                  <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder={t('admin.questions.filter.search')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="flex min-w-0 items-center gap-1 sm:gap-2">
                  <Filter className="hidden h-4 w-4 shrink-0 text-gray-400 sm:block" />
                  <Select value={examFilter} onValueChange={setExamFilter}>
                    <SelectTrigger className="h-9 w-full min-w-0 px-2 text-xs sm:w-[150px] sm:text-sm">
                      <SelectValue placeholder={t('admin.questions.filter.exam_all')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('admin.questions.filter.exam_all')}</SelectItem>
                      {(Array.isArray(exams) ? exams : []).map(exam => (
                        <SelectItem key={exam._id} value={exam._id}>
                          {exam.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex min-w-0 items-center gap-1 sm:gap-2">
                  <Filter className="hidden h-4 w-4 shrink-0 text-gray-400 sm:block" />
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="h-9 w-full min-w-0 px-2 text-xs sm:w-[150px] sm:text-sm">
                      <SelectValue placeholder={t('admin.questions.filter.type_all')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('admin.questions.filter.type_all')}</SelectItem>
                      <SelectItem value="multiple-choice">{t('admin.questions.types.mcq')}</SelectItem>
                      <SelectItem value="true-false">{t('admin.questions.types.true_false')}</SelectItem>
                      <SelectItem value="short-answer">{t('admin.questions.types.short')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  variant="outline"
                  className="col-span-2 h-9 justify-self-end px-3 lg:col-span-1 lg:justify-self-auto"
                  onClick={() => {
                    setSearchTerm('')
                    setExamFilter('all')
                    setTypeFilter('all')
                  }}
                >
                  {t('admin.questions.filter.reset')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* قائمة الأسئلة */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.questions.list.title')}</CardTitle>
              <CardDescription>
                {t('admin.questions.list.desc', { shown: filteredQuestions.length, total: questions.length })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadError ? (
                <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-4 text-red-700">{loadError}</div>
              ) : filteredQuestions.length > 0 ? (
                <div className="space-y-4">
                  {filteredQuestions.map((question) => (
                    <Card key={question._id} className="relative">
                      <CardContent className="min-w-0 p-4 sm:p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="min-w-0 flex-1">
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                              <Badge variant="secondary">
                                {question.points} {t('admin.questions.form.points')}
                              </Badge>
                              {question.exam && (
                                <Badge variant="outline">
                                  {getExamName(question.exam)}
                                </Badge>
                              )}
                            </div>
                            <h3 className="mb-2 break-words font-semibold text-gray-900 dark:text-white">
                              {question.text}
                            </h3>
                          </div>
                          <div className="flex shrink-0 items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0"
                              onClick={() => handleOpenDialog(question)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0"
                              onClick={() => {
                                setEditingQuestion(question)
                                setIsDeleteDialogOpen(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0"
                              onClick={() => toggleExpand(question._id)}
                            >
                              {expandedQuestionId === question._id ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>

                        <AnimatePresence>
                          {expandedQuestionId === question._id && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                            >
                              <h4 className="font-medium mb-2">{t('admin.questions.list.options')}</h4>
                              <ul className="space-y-2">
                                {(question.options || []).map((option, index) => (

                                  <li
                                    key={index}
                                    className={`flex items-center p-2 rounded ${option === question.correctAnswer
                                      ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                                      : 'bg-gray-100 dark:bg-gray-700'
                                      }`}
                                  >
                                    <span className="ml-2 font-medium">{String.fromCharCode(65 + index)}.</span>
                                    <span>{option}</span>
                                    {option === question.correctAnswer && (
                                      <Badge variant="default" className="mr-2">
                                        {t('admin.questions.list.correct')}
                                      </Badge>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    {t('admin.questions.list.empty')}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    {searchTerm || examFilter !== 'all' || typeFilter !== 'all'
                      ? t('admin.questions.list.empty_search')
                      : t('admin.questions.list.empty_system')
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* نافذة إضافة/تعديل السؤال */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className={editingQuestion
            ? "!left-[50dvw] !top-[50dvh] !right-auto !bottom-auto !m-0 !translate-x-[-50%] !translate-y-[-50%] max-h-[calc(100dvh_-_3rem)] w-[calc(100dvw_-_3rem)] max-w-[calc(100dvw_-_3rem)] overflow-y-auto p-3 sm:w-full sm:max-w-xl sm:p-5"
            : "!left-[50dvw] !top-[50dvh] !right-auto !bottom-auto !m-0 !translate-x-[-50%] !translate-y-[-50%] max-h-[calc(100dvh-2rem)] w-[calc(100dvw_-_2rem)] max-w-[calc(100dvw_-_2rem)] overflow-y-auto p-4 sm:max-w-2xl sm:p-6"} aria-describedby="question-form-description">
            <DialogHeader>
              <DialogTitle>
                {editingQuestion ? t('admin.questions.edit_title') : t('admin.questions.add_new')}
              </DialogTitle>
              <DialogDescription id="question-form-description">
                {editingQuestion ? t('admin.questions.form.edit_desc') : t('admin.questions.form.new_desc')}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="min-w-0 w-full space-y-4 [&_input]:w-full [&_[data-slot=select-trigger]]:w-full">
              <div>
                <label className="block text-sm font-medium mb-1">{t('admin.questions.form.text')}</label>
                <Input
                  name="text"
                  value={formData.text}
                  onChange={handleInputChange}
                  placeholder={t('admin.questions.form.text_ph')}
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-1">{t('admin.questions.form.type')}</label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, type: value, correctAnswer: '' }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t('admin.questions.form.type_ph')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="multiple-choice">{t('admin.questions.types.mcq')}</SelectItem>

                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">{t('admin.questions.form.points')}</label>
                  <Input
                    name="points"
                    type="number"
                    min="1"
                    value={formData.points}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">{t('admin.questions.form.exam')}</label>
                <Select
                  value={formData.exam}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, exam: value }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('admin.questions.form.exam_ph')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-exam">{t('admin.questions.form.no_exam')}</SelectItem>
                    {(Array.isArray(exams) ? exams : []).map(exam => (
                      <SelectItem key={exam._id} value={exam._id}>
                        {exam.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.type === 'multiple-choice' && (
                <div>
                  <label className="block text-sm font-medium mb-1">{t('admin.questions.form.options')}</label>
                  <div className="space-y-2">
                    {formData.options.map((option, index) => (
                      <div key={index} className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-2 sm:flex sm:items-center">
                        <span className="font-medium">{String.fromCharCode(65 + index)}.</span>
                        <Input
                          value={option}
                          onChange={(e) => handleOptionChange(index, e.target.value)}
                          placeholder={t('admin.questions.form.option_ph', { num: index + 1 })}
                          className="min-w-0 w-full"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="shrink-0"
                          onClick={() => removeOption(index)}
                          disabled={formData.options.length <= 2}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant={formData.correctAnswer === option ? "default" : "outline"}
                          size="sm"
                          className="col-span-3 w-full sm:col-span-1 sm:w-auto"
                          onClick={() => setFormData(prev => ({ ...prev, correctAnswer: option }))}
                        >
                          {t('admin.questions.list.correct')}
                        </Button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" onClick={addOption}>
                      {t('admin.questions.form.add_option')}
                    </Button>
                  </div>
                </div>
              )}

              {formData.type === 'true-false' && (
                <div>
                  <label className="block text-sm font-medium mb-1">{t('admin.questions.form.correct')}</label>
                  <Select
                    value={formData.correctAnswer}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, correctAnswer: value }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t('admin.questions.form.correct_select')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={t('admin.questions.types.true')}>{t('admin.questions.types.true')}</SelectItem>
                      <SelectItem value={t('admin.questions.types.false')}>{t('admin.questions.types.false')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-500 mt-1">
                    {t('admin.questions.form.auto_tf')}
                  </p>
                </div>
              )}

              {formData.type === 'short-answer' && (
                <div>
                  <label className="block text-sm font-medium mb-1">{t('admin.questions.form.correct')}</label>
                  <Input
                    name="correctAnswer"
                    value={formData.correctAnswer}
                    onChange={handleInputChange}
                    placeholder={t('admin.questions.form.correct_ph')}
                    required
                  />
                </div>
              )}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  {t('admin.questions.form.cancel')}
                </Button>
                <Button type="submit">
                  <Save className="h-4 w-4 ml-2" />
                  {editingQuestion ? t('admin.questions.form.update') : t('admin.questions.form.save')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* نافذة تأكيد الحذف */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('admin.questions.form.confirm_delete')}</DialogTitle>
              <DialogDescription>
                {t('admin.questions.form.data_loss_warning')}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                {t('admin.questions.form.cancel')}
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                {t('admin.questions.form.yes_delete')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default AdminQuestions

