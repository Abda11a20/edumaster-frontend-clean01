import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Edit, Trash2, BookOpen, Search, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { lessonsAPI } from '../../services/api'
import LoadingSpinner from '../../components/LoadingSpinner'
import Navbar from '../../components/Navbar'
import { useTranslation } from '../../hooks/useTranslation'

const AdminLessons = () => {
  const [lessons, setLessons] = useState([])
  const [filteredLessons, setFilteredLessons] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingLesson, setEditingLesson] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    video: '',
    classLevel: '',
    price: 0,
    scheduledDate: ''
  })
  const { toast } = useToast()
  const { t, lang } = useTranslation()

  const classLevels = [
    { value: 'Grade 1 Secondary', label: t('class_levels.grade1') },
    { value: 'Grade 2 Secondary', label: t('class_levels.grade2') },
    { value: 'Grade 3 Secondary', label: t('class_levels.grade3') }
  ]

  // pagination states
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  useEffect(() => {
    fetchLessonsPage(1, false)
  }, [])

  useEffect(() => {
    const filtered = lessons.filter(lesson =>
      (lesson.title && lesson.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (lesson.description && lesson.description.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    setFilteredLessons(filtered)
  }, [searchTerm, lessons])

  const fetchLessonsPage = async (p = 1, append = false) => {
    try {
      if (append) setIsLoadingMore(true)
      else setIsLoading(true)

      const response = await lessonsAPI.getAllLessons({ page: p, limit })

      let lessonsArray = []
      let pagination = null

      if (Array.isArray(response)) {
        lessonsArray = response
      } else if (response && Array.isArray(response.lessons)) {
        lessonsArray = response.lessons
        pagination = response.pagination ?? null
      } else if (response && Array.isArray(response.data)) {
        lessonsArray = response.data
        pagination = response.pagination ?? null
      } else if (response && Array.isArray(response.items)) {
        lessonsArray = response.items
        pagination = response.pagination ?? null
      } else if (response && response.data && Array.isArray(response.data.lessons)) {
        lessonsArray = response.data.lessons
        pagination = response.data.pagination ?? null
      } else if (response && response.lessons && Array.isArray(response.lessons)) {
        lessonsArray = response.lessons
        pagination = response.pagination ?? null
      } else {
        lessonsArray = response?.lessons ?? response?.data ?? response?.items ?? []
        if (!Array.isArray(lessonsArray)) lessonsArray = []
        pagination = response?.pagination ?? null
      }

      if (append) {
        setLessons(prev => {
          const merged = [...prev]
          const existing = new Set(prev.map(l => l._id))
          lessonsArray.forEach(l => {
            if (!existing.has(l._id)) merged.push(l)
          })
          return merged
        })
      } else {
        setLessons(Array.isArray(lessonsArray) ? lessonsArray : [])
      }

      if (pagination) {
        setTotal(pagination.total ?? (pagination.totalItems ?? 0))
        setTotalPages(pagination.totalPages ?? Math.max(1, Math.ceil((pagination.total ?? pagination.totalItems ?? lessonsArray.length) / (pagination.limit ?? limit))))
        setPage(pagination.page ?? p)
      } else {
        const returnedCount = Array.isArray(lessonsArray) ? lessonsArray.length : 0
        if (returnedCount === limit) {
          setTotalPages(p + 1)
        } else {
          setTotalPages(p)
        }
        setTotal(prev => (append ? prev + returnedCount : returnedCount))
        setPage(p)
      }
    } catch (error) {
      console.error('Error fetching lessons:', error)
      toast({
        title: t('admin.lessons.messages.error_load'),
        description: error.message || t('admin.admins.error_load_desc'),
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }

  const loadMore = () => {
    if (page >= totalPages) return
    fetchLessonsPage(page + 1, true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (!formData.title || !formData.description || !formData.classLevel) {
        toast({
          title: t('admin.lessons.messages.error'),
          description: t('admin.lessons.messages.fill_required'),
          variant: 'destructive'
        })
        return
      }

      const lessonData = {
        title: formData.title,
        description: formData.description,
        video: formData.video,
        classLevel: formData.classLevel,
        price: parseInt(formData.price) || 0,
      }

      console.log('بيانات الدرس المرسلة:', lessonData)

      if (editingLesson) {
        await lessonsAPI.updateLesson(editingLesson._id, lessonData)
        toast({
          title: t('admin.lessons.messages.update_success'),
          description: t('admin.lessons.messages.update_success_desc')
        })
      } else {
        lessonData.scheduledDate = formData.scheduledDate || new Date().toISOString().split('T')[0]
        await lessonsAPI.createLesson(lessonData)
        toast({
          title: t('admin.lessons.messages.add_success'),
          description: t('admin.lessons.messages.add_success_desc')
        })
      }
      setIsDialogOpen(false)
      setEditingLesson(null)
      setFormData({
        title: '',
        description: '',
        video: '',
        classLevel: '',
        price: 0,
        scheduledDate: ''
      })
      fetchLessonsPage(1, false)
    } catch (error) {
      console.error('Error saving lesson:', error)
      toast({
        title: t('admin.lessons.messages.error'),
        description: error.message || t('admin.lessons.messages.error_save'),
        variant: 'destructive'
      })
    }
  }

  const handleEdit = (lesson) => {
    setEditingLesson(lesson)
    setFormData({
      title: lesson.title || '',
      description: lesson.description || '',
      video: lesson.video || '',
      classLevel: lesson.classLevel || '',
      price: lesson.price || 0,
      scheduledDate: lesson.scheduledDate?.split('T')[0] || ''
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id) => {
    if (!confirm(t('admin.lessons.messages.delete_confirm'))) return

    try {
      await lessonsAPI.deleteLesson(id)
      toast({
        title: t('admin.lessons.messages.delete_success'),
        description: t('admin.lessons.messages.delete_success_desc')
      })
      fetchLessonsPage(1, false)
    } catch (error) {
      toast({
        title: t('admin.lessons.messages.error'),
        description: error.message || t('admin.lessons.messages.error_delete'),
        variant: 'destructive'
      })
    }
  }

  if (isLoading && lessons.length === 0) {
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
                {t('admin.lessons.title')}
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                {t('admin.lessons.subtitle')}
              </p>
            </div>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 ml-2" />
              {t('admin.lessons.add_new')}
            </Button>
          </div>
        </motion.div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>{t('admin.lessons.list.title')}</CardTitle>
                <CardDescription>
                  {t('admin.lessons.list.desc', { shown: filteredLessons.length, total: total || lessons.length })}
                </CardDescription>
              </div>
              <div className="relative">
                <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={t('admin.lessons.search_placeholder')}
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
                    <TableHead>{t('admin.lessons.table.title')}</TableHead>
                    <TableHead>{t('admin.lessons.table.level')}</TableHead>
                    <TableHead>{t('admin.lessons.table.price')}</TableHead>
                    <TableHead>{t('admin.lessons.table.date')}</TableHead>
                    <TableHead>{t('admin.lessons.table.desc')}</TableHead>
                    <TableHead>{t('admin.lessons.table.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLessons.length > 0 ? (
                    filteredLessons.map((lesson) => (
                      <TableRow key={lesson._id}>
                        <TableCell className="font-medium">{lesson.title}</TableCell>
                        <TableCell>{lesson.classLevel}</TableCell>
                        <TableCell>{lesson.price} {t('common.price_currency')}</TableCell>
                        <TableCell>
                          {lesson.scheduledDate ? new Date(lesson.scheduledDate).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-GB') : t('admin.users.details.not_available')}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{lesson.description}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleEdit(lesson)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => handleDelete(lesson._id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">
                        {t('admin.lessons.list.empty')}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

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

        {isDialogOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>{editingLesson ? t('admin.lessons.edit_title') : t('admin.lessons.add_new')}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">{t('admin.lessons.form.title')}</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">{t('admin.lessons.form.desc')}</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="video">{t('admin.lessons.form.video')}</Label>
                    <Input
                      id="video"
                      type="url"
                      value={formData.video}
                      onChange={(e) => setFormData({ ...formData, video: e.target.value })}
                      placeholder="https://example.com/video.mp4"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="classLevel">{t('admin.lessons.form.level')}</Label>
                    <Select
                      value={formData.classLevel}
                      onValueChange={(value) => setFormData({ ...formData, classLevel: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('admin.lessons.filter.level_placeholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        {classLevels.map((level) => (
                          <SelectItem key={level.value} value={level.value}>
                            {level.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">{t('admin.lessons.form.price')}</Label>
                    <Input
                      id="price"
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="scheduledDate">{t('admin.lessons.form.date')}</Label>
                    <div className="relative">
                      <Calendar className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="scheduledDate"
                        type="date"
                        value={formData.scheduledDate}
                        onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="flex space-x-2 pt-4">
                    <Button type="submit">
                      {editingLesson ? t('admin.lessons.form.update') : t('admin.lessons.form.save')}
                    </Button>
                    <Button variant="outline" onClick={() => {
                      setIsDialogOpen(false)
                      setEditingLesson(null)
                    }}>
                      {t('admin.lessons.form.cancel')}
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

export default AdminLessons