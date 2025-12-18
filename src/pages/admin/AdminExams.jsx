import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Edit, Trash2, FileText, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { examsAPI } from '../../services/api'
import LoadingSpinner from '../../components/LoadingSpinner'
import Navbar from '../../components/Navbar'
import { useTranslation } from '../../hooks/useTranslation'

const AdminExams = () => {
  const [exams, setExams] = useState([])
  const [filteredExams, setFilteredExams] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingExam, setEditingExam] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: 0,
    classLevel: '',
    startDate: '',
    endDate: '',
    isPublished: false
  })
  const { toast } = useToast()
  const { t, lang } = useTranslation()

  // pagination states
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  useEffect(() => {
    fetchExamsPage(1, false)
  }, [])

  useEffect(() => {
    const filtered = exams.filter(exam =>
      exam.title && exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exam.description && exam.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredExams(filtered)
  }, [searchTerm, exams])

  const fetchExamsPage = async (p = 1, append = false) => {
    try {
      if (append) setIsLoadingMore(true)
      else setIsLoading(true)

      const response = await examsAPI.getAllExams({ page: p, limit })

      // معالجة الاستجابة لاستخراج المصفوفة بشكل صحيح
      let examsArray = []
      let pagination = null

      if (Array.isArray(response)) {
        examsArray = response
      } else if (response && Array.isArray(response.exams)) {
        examsArray = response.exams
        pagination = response.pagination ?? null
      } else if (response && Array.isArray(response.data)) {
        examsArray = response.data
        pagination = response.pagination ?? null
      } else if (response && Array.isArray(response.items)) {
        examsArray = response.items
        pagination = response.pagination ?? null
      } else if (response && response.data && Array.isArray(response.data.exams)) {
        examsArray = response.data.exams
        pagination = response.data.pagination ?? null
      } else if (response && response.exams && Array.isArray(response.exams)) {
        examsArray = response.exams
        pagination = response.pagination ?? null
      } else {
        examsArray = response?.exams ?? response?.data ?? response?.items ?? []
        if (!Array.isArray(examsArray)) examsArray = []
        pagination = response?.pagination ?? null
      }

      // تحديث قائمة الامتحانات مع تفادي التكرار عند append
      if (append) {
        setExams(prev => {
          const merged = [...prev]
          const existing = new Set(prev.map(e => e._id))
          examsArray.forEach(e => {
            if (!existing.has(e._id)) merged.push(e)
          })
          return merged
        })
      } else {
        setExams(Array.isArray(examsArray) ? examsArray : [])
      }

      // تحديث معلومات pagination
      if (pagination) {
        setTotal(pagination.total ?? (pagination.totalItems ?? 0))
        setTotalPages(pagination.totalPages ?? Math.max(1, Math.ceil((pagination.total ?? pagination.totalItems ?? examsArray.length) / (pagination.limit ?? limit))))
        setPage(pagination.page ?? p)
      } else {
        // fallback: إن لم يتم توفير pagination
        const returnedCount = Array.isArray(examsArray) ? examsArray.length : 0
        if (returnedCount === limit) {
          setTotalPages(p + 1)
        } else {
          setTotalPages(p)
        }
        setTotal(prev => (append ? prev + returnedCount : returnedCount))
        setPage(p)
      }
    } catch (error) {
      console.error('Error fetching exams:', error)
      toast({
        title: t('admin.exams.messages.error_load'),
        description: t('admin.admins.error_load_desc'),
        variant: 'destructive'
      })
      setExams([])
      setFilteredExams([])
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }

  const loadMore = () => {
    if (page >= totalPages) return
    fetchExamsPage(page + 1, true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      // تحقق من أن جميع الحقول المطلوبة موجودة
      if (!formData.title || !formData.description || !formData.duration || !formData.classLevel) {
        toast({
          title: t('admin.exams.messages.error'),
          description: t('admin.exams.messages.fill_required'),
          variant: 'destructive'
        })
        return
      }

      // تحضير البيانات للإرسال
      const examData = {
        title: formData.title,
        description: formData.description,
        duration: parseInt(formData.duration) || 0,
        classLevel: formData.classLevel,
        startDate: formData.startDate,
        endDate: formData.endDate,
        isPublished: formData.isPublished || false
      }

      if (editingExam) {
        await examsAPI.updateExam(editingExam._id, examData)
        toast({
          title: t('admin.exams.messages.update_success'),
          description: t('admin.exams.messages.update_success_desc')
        })
      } else {
        await examsAPI.createExam(examData)
        toast({
          title: t('admin.exams.messages.add_success'),
          description: t('admin.exams.messages.add_success_desc')
        })
      }
      setIsDialogOpen(false)
      setEditingExam(null)
      setFormData({
        title: '',
        description: '',
        duration: 0,
        classLevel: '',
        startDate: '',
        endDate: '',
        isPublished: false
      })
      fetchExamsPage(1, false)
    } catch (error) {
      console.error('Error saving exam:', error)
      toast({
        title: t('admin.exams.messages.error'),
        description: error.message || t('admin.exams.messages.error_save'),
        variant: 'destructive'
      })
    }
  }

  const handleEdit = (exam) => {
    setEditingExam(exam)
    setFormData({
      title: exam.title || '',
      description: exam.description || '',
      duration: exam.duration || 0,
      classLevel: exam.classLevel || '',
      startDate: exam.startDate?.split('T')[0] || '',
      endDate: exam.endDate?.split('T')[0] || '',
      isPublished: exam.isPublished || false
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id) => {
    if (!confirm(t('admin.exams.messages.delete_confirm'))) return

    try {
      await examsAPI.deleteExam(id)
      toast({
        title: t('admin.exams.messages.delete_success'),
        description: t('admin.exams.messages.delete_success_desc')
      })
      fetchExamsPage(1, false)
    } catch (error) {
      toast({
        title: t('admin.exams.messages.error'),
        description: error.message || t('admin.exams.messages.error_delete'),
        variant: 'destructive'
      })
    }
  }

  if (isLoading && exams.length === 0) {
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
          className="mb-8"
        >
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {t('admin.exams.title')}
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                {t('admin.exams.subtitle')}
              </p>
            </div>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 ml-2" />
              {t('admin.exams.add_new')}
            </Button>
          </div>
        </motion.div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>{t('admin.exams.list.title')}</CardTitle>
                <CardDescription>
                  {t('admin.exams.list.desc', { shown: filteredExams.length, total: total || exams.length })}
                </CardDescription>
              </div>
              <div className="relative">
                <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={t('admin.exams.search_placeholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('admin.exams.table.title')}</TableHead>
                    <TableHead>{t('admin.exams.table.level')}</TableHead>
                    <TableHead>{t('admin.exams.table.duration')}</TableHead>
                    <TableHead>{t('admin.exams.table.status')}</TableHead>
                    <TableHead>{t('admin.exams.table.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExams.length > 0 ? (
                    filteredExams.map((exam) => (
                      <TableRow key={exam._id}>
                        <TableCell className="font-medium">{exam.title}</TableCell>
                        <TableCell>{exam.classLevel}</TableCell>
                        <TableCell>{exam.duration}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${exam.isPublished
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                            }`}>
                            {exam.isPublished ? t('admin.exams.table.published') : t('admin.exams.table.draft')}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleEdit(exam)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => handleDelete(exam._id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">
                        {t('admin.exams.list.empty')}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Load more / pagination controls for admin */}
            <div className="mt-6 flex justify-center items-center space-x-3">
              {isLoadingMore ? (
                <Button variant="outline" disabled>
                  <LoadingSpinner size="sm" /> جاري التحميل...
                </Button>
              ) : (
                page < totalPages && (
                  <Button onClick={loadMore}>
                    {t('common.more')}
                  </Button>
                )
              )}
            </div>
          </CardContent>
        </Card>

        {/* Dialog for Add/Edit Exam */}
        {isDialogOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>{editingExam ? t('admin.exams.edit_title') : t('admin.exams.add_new')}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">{t('admin.exams.form.title')}</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">{t('admin.exams.form.desc')}</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration">{t('admin.exams.form.duration')}</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="classLevel">{t('admin.exams.form.level')}</Label>
                    <Input
                      id="classLevel"
                      value={formData.classLevel}
                      onChange={(e) => setFormData({ ...formData, classLevel: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="startDate">{t('admin.exams.form.start_date')}</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">{t('admin.exams.form.end_date')}</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      id="isPublished"
                      type="checkbox"
                      checked={formData.isPublished}
                      onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="isPublished">{t('admin.exams.form.publish')}</Label>
                  </div>
                  <div className="flex space-x-2 pt-4">
                    <Button type="submit">
                      {editingExam ? t('admin.exams.form.update') : t('admin.exams.form.save')}
                    </Button>
                    <Button variant="outline" onClick={() => {
                      setIsDialogOpen(false)
                      setEditingExam(null)
                    }}>
                      {t('admin.exams.form.cancel')}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminExams