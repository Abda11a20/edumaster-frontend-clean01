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

const AdminQuestions = () => {
  const [questions, setQuestions] = useState([])
  const [exams, setExams] = useState([])
  const [filteredQuestions, setFilteredQuestions] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [examFilter, setExamFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState(null)
  const [expandedQuestionId, setExpandedQuestionId] = useState(null)
  const { toast } = useToast()

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
        const [questionsData, examsData] = await Promise.all([
          questionsAPI.getAllQuestions(),
          examsAPI.getAllExams()
        ])
        setQuestions(questionsData)
        setFilteredQuestions(questionsData)
        setExams(examsData)
      } catch (error) {
        console.error('Error fetching data:', error)
        toast({
          title: 'خطأ في تحميل البيانات',
          description: 'فشل في تحميل الأسئلة أو الامتحانات',
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
        options: ['صحيح', 'خطأ'],
        correctAnswer: prev.correctAnswer || 'صحيح'
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
      ? ['صحيح', 'خطأ']
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
      throw new Error('يجب إدخال نص السؤال')
    }

    // عند الإنشاء: الباك‌اند يتحقق من وجود الامتحان
    if (!editingQuestion && (!formData.exam || formData.exam === 'no-exam' || formData.exam === '')) {
      throw new Error('يجب اختيار الامتحان قبل إنشاء السؤال')
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
        throw new Error('يجب إضافة خيارين على الأقل للاختيار المتعدد')
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
      toast({ title: 'تم التحديث', description: 'تم تحديث السؤال بنجاح' })
    } else {
      response = await questionsAPI.createQuestion(basePayload)
      toast({ title: 'تم الإضافة', description: 'تم إضافة السؤال بنجاح' })
    }

    console.log('استجابة الخادم:', response)

    // إعادة تحميل البيانات
    const questionsData = await questionsAPI.getAllQuestions()
    setQuestions(questionsData)
    handleCloseDialog()
  } catch (error) {
    console.error('Error saving question:', error)
    toast({
      title: 'خطأ',
      description: error.message || 'فشل في حفظ السؤال',
      variant: 'destructive'
    })
  }
}

  const handleDelete = async () => {
    try {
      await questionsAPI.deleteQuestion(editingQuestion._id)
      toast({
        title: 'تم الحذف',
        description: 'تم حذف السؤال بنجاح'
      })
      
      // إعادة تحميل البيانات
      const questionsData = await questionsAPI.getAllQuestions()
      setQuestions(questionsData)
      setIsDeleteDialogOpen(false)
      setEditingQuestion(null)
    } catch (error) {
      console.error('Error deleting question:', error)
      toast({
        title: 'خطأ',
        description: 'فشل في حذف السؤال',
        variant: 'destructive'
      })
    }
  }

  const getExamName = (examId) => {
    if (!examId || examId === 'no-exam') return 'غير معين'
    const exam = (Array.isArray(exams) ? exams : []).find(e => e._id === examId)
    return exam ? exam.title : 'غير معروف'
  }

  const getTypeText = (type) => {
    switch (type) {
      case 'multiple-choice':
        return 'اختيار متعدد'
      case 'true-false':
        return 'صحيح/خطأ'
      case 'short-answer':
        return 'إجابة قصيرة'
      default:
        return type
    }
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
              بنك الأسئلة
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              إدارة الأسئلة وإضافتها إلى الامتحانات
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 ml-2" />
            إضافة سؤال جديد
          </Button>
        </motion.div>

        {/* بطاقة الإحصائيات */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">إجمالي الأسئلة</p>
                  <p className="text-3xl font-bold">{questions.length}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">أسئلة الاختيار المتعدد</p>
                  <p className="text-3xl font-bold">
                    {(Array.isArray(questions) ? questions : []).filter(q => q.type === 'multiple-choice').length}
                  </p>
                </div>
                <BookOpen className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">الامتحانات المستهدفة</p>
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
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="ابحث في نص السؤال..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <Select value={examFilter} onValueChange={setExamFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="جميع الامتحانات" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الامتحانات</SelectItem>
                      {(Array.isArray(exams) ? exams : []).map(exam => (
                        <SelectItem key={exam._id} value={exam._id}>
                          {exam.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="جميع الأنواع" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الأنواع</SelectItem>
                      <SelectItem value="multiple-choice">اختيار متعدد</SelectItem>
                      <SelectItem value="true-false">صحيح/خطأ</SelectItem>
                      <SelectItem value="short-answer">إجابة قصيرة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm('')
                    setExamFilter('all')
                    setTypeFilter('all')
                  }}
                >
                  إعادة الضبط
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
              <CardTitle>الأسئلة المتاحة</CardTitle>
              <CardDescription>
                {filteredQuestions.length} من أصل {questions.length} سؤال
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredQuestions.length > 0 ? (
                <div className="space-y-4">
                  {filteredQuestions.map((question) => (
                    <Card key={question._id} className="relative">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline">
                                {getTypeText(question.type)}
                              </Badge>
                              <Badge variant="secondary">
                                {question.points} نقطة
                              </Badge>
                              {question.exam && (
                                <Badge variant="outline">
                                  {getExamName(question.exam)}
                                </Badge>
                              )}
                            </div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                              {question.text}
                            </h3>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDialog(question)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
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
                              <h4 className="font-medium mb-2">الخيارات:</h4>
                              <ul className="space-y-2">
                          {(question.options || []).map((option, index) => (

                                  <li 
                                    key={index} 
                                    className={`flex items-center p-2 rounded ${
                                      option === question.correctAnswer
                                        ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                                        : 'bg-gray-100 dark:bg-gray-700'
                                    }`}
                                  >
                                    <span className="ml-2 font-medium">{String.fromCharCode(65 + index)}.</span>
                                    <span>{option}</span>
                                    {option === question.correctAnswer && (
                                      <Badge variant="default" className="mr-2">
                                        الإجابة الصحيحة
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
                    لا يوجد أسئلة
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    {searchTerm || examFilter !== 'all' || typeFilter !== 'all'
                      ? 'لم يتم العثور على أسئلة مطابقة للبحث' 
                      : 'لا يوجد أسئلة في النظام'
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* نافذة إضافة/تعديل السؤال */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby="question-form-description">
            <DialogHeader>
              <DialogTitle>
                {editingQuestion ? 'تعديل السؤال' : 'إضافة سؤال جديد'}
              </DialogTitle>
              <DialogDescription id="question-form-description">
                {editingQuestion ? 'قم بتعديل بيانات السؤال' : 'أدخل بيانات السؤال الجديد'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">نص السؤال</label>
                <Input
                  name="text"
                  value={formData.text}
                  onChange={handleInputChange}
                  placeholder="أدخل نص السؤال..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">نوع السؤال</label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, type: value, correctAnswer: '' }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر نوع السؤال" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="multiple-choice">اختيار متعدد</SelectItem>
                      
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">عدد النقاط</label>
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
                <label className="block text-sm font-medium mb-1">الامتحان (اختياري)</label>
                <Select 
                  value={formData.exam} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, exam: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الامتحان" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-exam">لا يوجد</SelectItem>
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
                  <label className="block text-sm font-medium mb-1">خيارات الإجابة</label>
                  <div className="space-y-2">
                    {formData.options.map((option, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="font-medium">{String.fromCharCode(65 + index)}.</span>
                        <Input
                          value={option}
                          onChange={(e) => handleOptionChange(index, e.target.value)}
                          placeholder={`الخيار ${index + 1}`}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeOption(index)}
                          disabled={formData.options.length <= 2}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant={formData.correctAnswer === option ? "default" : "outline"}
                          size="sm"
                          onClick={() => setFormData(prev => ({ ...prev, correctAnswer: option }))}
                        >
                          صحيح
                        </Button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" onClick={addOption}>
                      إضافة خيار
                    </Button>
                  </div>
                </div>
              )}

              {formData.type === 'true-false' && (
                <div>
                  <label className="block text-sm font-medium mb-1">الإجابة الصحيحة</label>
                  <Select 
                    value={formData.correctAnswer} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, correctAnswer: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الإجابة الصحيحة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="صحيح">صحيح</SelectItem>
                      <SelectItem value="خطأ">خطأ</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-500 mt-1">
                    سيتم تعيين الخيارات تلقائياً إلى "صحيح" و "خطأ"
                  </p>
                </div>
              )}

              {formData.type === 'short-answer' && (
                <div>
                  <label className="block text-sm font-medium mb-1">الإجابة الصحيحة</label>
                  <Input
                    name="correctAnswer"
                    value={formData.correctAnswer}
                    onChange={handleInputChange}
                    placeholder="أدخل الإجابة الصحيحة..."
                    required
                  />
                </div>
              )}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  إلغاء
                </Button>
                <Button type="submit">
                  <Save className="h-4 w-4 ml-2" />
                  {editingQuestion ? 'تحديث' : 'إضافة'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* نافذة تأكيد الحذف */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>تأكيد الحذف</DialogTitle>
              <DialogDescription>
                هل أنت متأكد من أنك تريد حذف هذا السؤال؟ هذا الإجراء لا يمكن التراجع عنه.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                إلغاء
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                حذف
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default AdminQuestions

