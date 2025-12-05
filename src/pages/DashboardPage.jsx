import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  BookOpen, 
  FileText, 
  Award, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  Play,
  Calendar,
  Star,
  ArrowRight,
  BarChart3,
  GraduationCap,
  Target,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '../contexts/AuthContext'
import { lessonsAPI, examsAPI } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'
import Navbar from '../components/Navbar'

const DashboardPage = () => {
  const { user, isSuperAdmin } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalLessons: 0,
    completedLessons: 0,
    totalExams: 0,
    completedExams: 0,
    averageScore: 0,
    totalPoints: 0,
    progressPercentage: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)

  // توجيه السوبر أدمن مباشرة إلى لوحة التحكم الخاصة به
  useEffect(() => {
    if (isSuperAdmin()) {
      navigate('/super-admin', { replace: true })
      return
    }
  }, [isSuperAdmin, navigate])

  const fetchDashboardData = async () => {
    // إذا كان المستخدم سوبر أدمن، لا نحمل البيانات
    if (isSuperAdmin()) return
    
    try {
      setIsLoading(true)
      
      // جلب جميع البيانات بشكل متوازي
      const [
        lessonsResponse, 
        purchasedResponse, 
        examsResponse,
        examsProgressResponse
      ] = await Promise.all([
        lessonsAPI.getAllLessons({ page: 1, limit: 100 }),
        lessonsAPI.getPurchasedLessons(),
        examsAPI.getAllExams({ page: 1, limit: 100 }),
        examsAPI.getUserProgress().catch(() => ({ completedExams: [], scores: [] })) // استرجاع بيانات افتراضية في حال فشل API
      ])

      // معالجة بيانات الدروس
      const totalLessons = Array.isArray(lessonsResponse) 
        ? lessonsResponse.length 
        : (lessonsResponse?.lessons?.length || lessonsResponse?.data?.length || lessonsResponse?.data?.lessons?.length || 0)
      
      const purchasedLessonsData = Array.isArray(purchasedResponse) 
        ? purchasedResponse 
        : (purchasedResponse?.lessons || purchasedResponse?.data || [])
      
      // حساب الدروس المكتملة (watched === true)
      const completedLessonsCount = purchasedLessonsData.filter(
        lesson => lesson.watched === true
      ).length

      // معالجة بيانات الامتحانات
      const allExams = Array.isArray(examsResponse) 
        ? examsResponse 
        : (examsResponse?.exams || examsResponse?.data || examsResponse?.data?.exams || [])
      
      const now = new Date()
      
      // تصفية الامتحانات المتاحة (لم تنته بعد وتناسب مستوى الطالب)
      const userClassLevel = user?.classLevel || ''
      const availableExamsData = allExams.filter(exam => {
        // التحقق من تاريخ الانتهاء
        const isActive = !exam.endDate || new Date(exam.endDate) > now
        
        // التحقق من مستوى الصف إذا كان متوفرًا
        const matchesLevel = !userClassLevel || !exam.classLevel || 
                            exam.classLevel === userClassLevel
        
        return isActive && matchesLevel
      })

      // حساب الامتحانات المكتملة والدرجات
      let completedExamsCount = 0
      let totalScore = 0
      let completedExamsWithScores = 0

      // محاولة الحصول على نتائج الامتحانات لكل امتحان
      const examScoresPromises = allExams.map(async (exam) => {
        try {
          const scoreData = await examsAPI.getStudentScore(exam._id)
          if (scoreData && typeof scoreData.score === 'number') {
            completedExamsCount++
            totalScore += scoreData.score
            completedExamsWithScores++
            return { examId: exam._id, score: scoreData.score }
          }
        } catch (error) {
          // إذا فشل جلب النتيجة، نتخطى هذا الامتحان
          console.log(`No score found for exam ${exam._id}`)
        }
        return null
      })

      const examScores = await Promise.all(examScoresPromises)
      const validScores = examScores.filter(score => score !== null)

      // حساب متوسط الدرجات
      let averageScore = 0
      if (completedExamsWithScores > 0) {
        averageScore = Math.round(totalScore / completedExamsWithScores)
      }

      // حساب النقاط (5 نقاط لكل درس مكتمل + 10 نقاط لكل امتحان مكتمل)
      const totalPoints = (completedLessonsCount * 5) + (completedExamsCount * 10)

      // حساب نسبة التقدم الشاملة
      const totalItems = totalLessons + allExams.length
      const completedItems = completedLessonsCount + completedExamsCount
      const progressPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0

      // تحديث الإحصائيات
      setStats({
        totalLessons,
        completedLessons: completedLessonsCount,
        totalExams: allExams.length,
        completedExams: completedExamsCount,
        averageScore,
        totalPoints,
        progressPercentage
      })

      setLastUpdated(new Date())
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      // في حالة الخطأ، نستخدم بيانات افتراضية مع رسالة للمستخدم
      setStats({
        totalLessons: 0,
        completedLessons: 0,
        totalExams: 0,
        completedExams: 0,
        averageScore: 0,
        totalPoints: 0,
        progressPercentage: 0
      })
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    if (user && !isSuperAdmin()) {
      fetchDashboardData()
    }
  }, [user, isSuperAdmin])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchDashboardData()
  }

  // إذا كان المستخدم سوبر أدمن، لا نعرض أي محتوى
  if (isSuperAdmin()) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  const quickActions = [
    {
      title: 'تصفح الدروس',
      description: 'استكشف المحتوى التعليمي',
      icon: BookOpen,
      link: '/lessons',
      color: 'bg-blue-500'
    },
    {
      title: 'الامتحانات',
      description: 'اختبر معلوماتك',
      icon: FileText,
      link: '/exams',
      color: 'bg-green-500'
    },
    {
      title: 'النتائج',
      description: 'شاهد أداءك',
      icon: Award,
      link: '/results',
      color: 'bg-purple-500'
    }
  ]

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
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8 flex justify-between items-center"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              مرحباً، {user?.fullName || 'الطالب'}
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              استمر في رحلتك التعليمية وحقق أهدافك الأكاديمية
            </p>
            {lastUpdated && (
              <p className="text-xs text-gray-500 mt-1">
                آخر تحديث: {lastUpdated.toLocaleTimeString('ar-EG')}
              </p>
            )}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">إجمالي الدروس</p>
                  <p className="text-3xl font-bold">{stats.totalLessons}</p>
                  <p className="text-blue-200 text-xs mt-1">
                    {stats.completedLessons} مكتمل
                  </p>
                </div>
                <BookOpen className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">الدروس المكتملة</p>
                  <p className="text-3xl font-bold">{stats.completedLessons}</p>
                  <p className="text-green-200 text-xs mt-1">
                    {stats.totalLessons > 0 ? Math.round((stats.completedLessons / stats.totalLessons) * 100) : 0}% إنجاز
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">الامتحانات المكتملة</p>
                  <p className="text-3xl font-bold">{stats.completedExams}</p>
                  <p className="text-purple-200 text-xs mt-1">
                    {stats.totalExams > 0 ? Math.round((stats.completedExams / stats.totalExams) * 100) : 0}% إنجاز
                  </p>
                </div>
                <FileText className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">متوسط الدرجات</p>
                  <p className="text-3xl font-bold">{stats.averageScore}%</p>
                  <p className="text-orange-200 text-xs mt-1">
                    {stats.completedExams > 0 ? 'بناءً على ' + stats.completedExams + ' امتحان' : 'لا توجد نتائج'}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Progress Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-2"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  تقدمك الأكاديمي
                </CardTitle>
                <CardDescription>
                  تتبع إنجازاتك ومستوى تقدمك في المنهج
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">التقدم الشامل</span>
                      <span className="text-sm text-gray-500">
                        {stats.progressPercentage}% إنجاز
                      </span>
                    </div>
                    <Progress value={stats.progressPercentage} className="h-3" />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>إجمالي المهام: {stats.totalLessons + stats.totalExams}</span>
                      <span>مكتمل: {stats.completedLessons + stats.completedExams}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="flex items-center mb-2">
                        <BookOpen className="h-4 w-4 text-blue-600 mr-2" />
                        <span className="text-sm font-medium">تقدم الدروس</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-600">
                        {stats.completedLessons}/{stats.totalLessons}
                      </p>
                      <p className="text-xs text-gray-500">
                        {stats.totalLessons > 0 ? Math.round((stats.completedLessons / stats.totalLessons) * 100) : 0}% مكتمل
                      </p>
                    </div>

                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="flex items-center mb-2">
                        <FileText className="h-4 w-4 text-green-600 mr-2" />
                        <span className="text-sm font-medium">تقدم الامتحانات</span>
                      </div>
                      <p className="text-2xl font-bold text-green-600">
                        {stats.completedExams}/{stats.totalExams}
                      </p>
                      <p className="text-xs text-gray-500">
                        {stats.totalExams > 0 ? Math.round((stats.completedExams / stats.totalExams) * 100) : 0}% مكتمل
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div className="flex items-center mb-2">
                      <Star className="h-4 w-4 text-purple-600 mr-2" />
                      <span className="text-sm font-medium">النقاط المكتسبة</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-600">{stats.totalPoints}</p>
                    <p className="text-xs text-gray-500">
                      {stats.completedLessons * 5} نقطة من الدروس + {stats.completedExams * 10} نقطة من الامتحانات
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>الإجراءات السريعة</CardTitle>
                <CardDescription>
                  الوصول السريع للأقسام المهمة
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {quickActions.map((action, index) => (
                    <Link key={index} to={action.link}>
                      <Card className="hover:shadow-md transition-shadow cursor-pointer border-2 border-transparent hover:border-gray-200 dark:hover:border-gray-700">
                        <CardContent className="p-4 text-center">
                          <div className={`w-12 h-12 ${action.color} rounded-full flex items-center justify-center mx-auto mb-3`}>
                            <action.icon className="h-6 w-6 text-white" />
                          </div>
                          <h3 className="font-semibold mb-1">{action.title}</h3>
                          <p className="text-sm text-gray-500">{action.description}</p>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="space-y-6"
          >
            {/* كارد التقدم في التعلم */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <GraduationCap className="h-5 w-5 mr-2" />
                  تقدمك في التعلم
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg">
                  <Target className="h-12 w-12 text-blue-500 mx-auto mb-3" />
                  <h3 className="font-bold text-lg mb-2">استمر في التقدم!</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-3">
                    {stats.completedLessons === 0 && stats.completedExams === 0 
                      ? 'ابدأ رحلتك التعليمية مع أول درس أو امتحان'
                      : `لقد أكملت ${stats.completedLessons} درساً و${stats.completedExams} امتحاناً. استمر في التعلم لتحقيق أهدافك.`
                    }
                  </p>
                  <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">دروس مكتملة</span>
                      <span className="text-sm font-bold text-green-600">
                        {stats.completedLessons}/{stats.totalLessons}
                      </span>
                    </div>
                    <Progress 
                      value={stats.totalLessons > 0 ? (stats.completedLessons / stats.totalLessons) * 100 : 0} 
                      className="h-2" 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* كارد الامتحانات */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  أداء الامتحانات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center p-4 bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 rounded-lg">
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                    <div className="flex items-center justify-center mb-3">
                      <div className="w-14 h-14 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                        <TrendingUp className="h-7 w-7 text-green-600" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                      {stats.averageScore}%
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      متوسط درجاتك
                    </p>
                    <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>امتحانات مكتملة</span>
                        <span className="font-medium">{stats.completedExams}</span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>إجمالي الامتحانات</span>
                        <span className="font-medium">{stats.totalExams}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* كارد الإنجازات */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="h-5 w-5 mr-2" />
                  إنجازاتك
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                    <span className="text-sm">النقاط الإجمالية</span>
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      {stats.totalPoints} نقطة
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                    <span className="text-sm">الدروس المكتملة</span>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      {stats.completedLessons}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded">
                    <span className="text-sm">الامتحانات المكتملة</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      {stats.completedExams}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage