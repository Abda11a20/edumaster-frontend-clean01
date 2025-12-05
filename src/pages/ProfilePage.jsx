import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { User, Mail, Calendar, BookOpen, BarChart3, Award, Edit, Save, X, Phone, GraduationCap, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '../contexts/AuthContext'
import { authAPI, examsAPI, lessonsAPI } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'
import Navbar from '../components/Navbar'

const ProfilePage = () => {
  const [userData, setUserData] = useState(null)
  const [userStats, setUserStats] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [editForm, setEditForm] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    classLevel: ''
  })
  const { user, logout, updateProfile } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true)
        const profileData = await authAPI.getProfile()
        
        const userProfile = profileData
        setUserData(userProfile)
        setEditForm({
          fullName: userProfile.fullName || userProfile.name || '',
          email: userProfile.email || '',
          phoneNumber: userProfile.phoneNumber || '',
          classLevel: userProfile.classLevel || ''
        })
        
        try {
          const examsResponse = await examsAPI.getAllExams()
          const lessonsResponse = await lessonsAPI.getAllLessons()
          
          setUserStats({
            examsCount: Array.isArray(examsResponse) ? examsResponse.length : 0,
            lessonsCount: Array.isArray(lessonsResponse) ? lessonsResponse.length : 0,
            completedExams: userProfile.completedExams || 0,
            averageScore: userProfile.averageScore || 0
          })
        } catch {
          setUserStats({
            examsCount: 0,
            lessonsCount: 0,
            completedExams: 0,
            averageScore: 0
          })
        }
      } catch (error) {
        toast({
          title: 'خطأ في تحميل البيانات',
          description: 'تحقق من اتصالك بالإنترنت وحاول مرة أخرى',
          variant: 'destructive'
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [toast])

  const handleEditToggle = () => {
    if (isEditing) {
      setEditForm({
        fullName: userData?.fullName || userData?.name || '',
        email: userData?.email || '',
        phoneNumber: userData?.phoneNumber || '',
        classLevel: userData?.classLevel || ''
      })
    }
    setIsEditing(!isEditing)
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const result = await updateProfile(editForm)
      
      if (result.success) {
        toast({
          title: 'تم التحديث',
          description: 'تم تحديث الملف الشخصي بنجاح'
        })
        setIsEditing(false)
        setUserData(prev => ({ ...prev, ...editForm }))
      } else {
        toast({
          title: 'خطأ في التحديث',
          description: result.error || 'فشل في تحديث الملف الشخصي',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'خطأ في التحديث',
        description: 'فشل في تحديث الملف الشخصي',
        variant: 'destructive'
      })
    }
  }

  const handleInputChange = (e) => {
    setEditForm({
      ...editForm,
      [e.target.name]: e.target.value
    })
  }

  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true)
      await authAPI.deleteAccount()
      toast({
        title: 'تم حذف الحساب',
        description: 'تم حذف حسابك بنجاح. سيتم تحويلك إلى الصفحة الرئيسية.'
      })
      logout()
      window.location.href = '/'
    } catch (error) {
      toast({
        title: 'فشل حذف الحساب',
        description: error.message || 'حدث خطأ أثناء حذف الحساب',
        variant: 'destructive'
      })
    } finally {
      setIsDeleting(false)
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
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            الملف الشخصي
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            إدارة معلومات حسابك وتتبع تقدمك الدراسي
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>معلومات المستخدم</CardTitle>
                  <CardDescription>
                    المعلومات الأساسية لحسابك
                  </CardDescription>
                </div>
                {!isEditing ? (
                  <Button variant="outline" onClick={handleEditToggle}>
                    <Edit className="h-4 w-4 ml-2" />
                    تعديل الملف الشخصي
                  </Button>
                ) : null}
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <form onSubmit={handleEditSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">الاسم الكامل</Label>
                      <Input
                        id="fullName"
                        name="fullName"
                        value={editForm.fullName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">البريد الإلكتروني</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={editForm.email}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phoneNumber">رقم الهاتف</Label>
                      <Input
                        id="phoneNumber"
                        name="phoneNumber"
                        value={editForm.phoneNumber}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="classLevel">الصف الدراسي</Label>
                      <Input
                        id="classLevel"
                        name="classLevel"
                        value={editForm.classLevel}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    <div className="flex space-x-2 pt-4">
                      <Button type="submit">
                        <Save className="h-4 w-4 ml-2" />
                        حفظ التغييرات
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handleEditToggle}
                      >
                        <X className="h-4 w-4 ml-2" />
                        إلغاء
                      </Button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="flex items-center">
                      <User className="h-5 w-5 text-gray-400 ml-3" />
                      <div>
                        <p className="text-sm text-gray-500">الاسم الكامل</p>
                        <p className="font-medium">{userData?.fullName || userData?.name || 'غير معروف'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <Mail className="h-5 w-5 text-gray-400 ml-3" />
                      <div>
                        <p className="text-sm text-gray-500">البريد الإلكتروني</p>
                        <p className="font-medium">{userData?.email || 'غير معروف'}</p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <Phone className="h-5 w-5 text-gray-400 ml-3" />
                      <div>
                        <p className="text-sm text-gray-500">رقم الهاتف</p>
                        <p className="font-medium">{userData?.phoneNumber || 'غير معروف'}</p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <GraduationCap className="h-5 w-5 text-gray-400 ml-3" />
                      <div>
                        <p className="text-sm text-gray-500">الصف الدراسي</p>
                        <p className="font-medium">{userData?.classLevel || 'غير معروف'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 text-gray-400 ml-3" />
                      <div>
                        <p className="text-sm text-gray-500">تاريخ الانضمام</p>
                        <p className="font-medium">
                          {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString('ar-EG') : 'غير معروف'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="pt-4">
                      <Button variant="outline" onClick={logout}>
                        تسجيل الخروج
                      </Button>
                    </div>
                    <div className="pt-2">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" disabled={isDeleting}>
                            <Trash2 className="h-4 w-4 ml-2" />
                            {isDeleting ? 'جارٍ الحذف...' : 'حذف الحساب'}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>حذف الحساب</AlertDialogTitle>
                            <AlertDialogDescription>
                              هل أنت متأكد أنك تريد حذف حسابك نهائيًا؟ هذه العملية غير قابلة للاسترجاع وسيتم حذف جميع بياناتك.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleDeleteAccount}
                              className="bg-destructive text-white hover:bg-destructive/90"
                              disabled={isDeleting}
                            >
                              تأكيد الحذف
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>الإحصائيات</CardTitle>
                <CardDescription>
                  تتبع تقدمك الدراسي
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center">
                  <BookOpen className="h-5 w-5 text-blue-400 ml-3" />
                  <div>
                    <p className="text-sm text-gray-500">الدروس المتاحة</p>
                    <p className="font-medium">{userStats.lessonsCount} درس</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <BarChart3 className="h-5 w-5 text-green-400 ml-3" />
                  <div>
                    <p className="text-sm text-gray-500">الامتحانات المتاحة</p>
                    <p className="font-medium">{userStats.examsCount} امتحان</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Award className="h-5 w-5 text-yellow-400 ml-3" />
                  <div>
                    <p className="text-sm text-gray-500">متوسط الدرجات</p>
                    <p className="font-medium">{userStats.averageScore}%</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <BarChart3 className="h-5 w-5 text-purple-400 ml-3" />
                  <div>
                    <p className="text-sm text-gray-500">الامتحانات المكتملة</p>
                    <p className="font-medium">{userStats.completedExams} امتحان</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage