import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  BookOpen, 
  FileText, 
  Award, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  BarChart3,
  Target,
  RefreshCw,
  AlertCircle,
  Zap,
  Trophy,
  Flame,
  Rocket,
  TrendingDown,
  Sparkles,
  LineChart,
  Crown,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Clock as ClockIcon,
  Lightbulb,
  Medal,
  ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '../contexts/AuthContext'
import { lessonsAPI, examsAPI } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'
import Navbar from '../components/Navbar'

const DashboardPage = () => {
  const { user, isSuperAdmin, isAdmin } = useAuth()
  const navigate = useNavigate()
  const confettiRef = useRef(null)
  
  const [stats, setStats] = useState({
    totalLessons: 0,
    completedLessons: 0,
    totalExams: 0,
    completedExams: 0,
    averageScore: 0,
    totalPoints: 0,
    progressPercentage: 0,
    examScores: []
  })
  
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [error, setError] = useState(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [streakDays, setStreakDays] = useState(0)
  const [encouragementMessage, setEncouragementMessage] = useState('')
  const [nextGoal, setNextGoal] = useState(null)
  const [dailyTasks, setDailyTasks] = useState([])
  const [performanceLevel, setPerformanceLevel] = useState('beginner')
  const [activeTab, setActiveTab] = useState('overview')
  const [achievements, setAchievements] = useState([])
  const [showCelebration, setShowCelebration] = useState(false)
  const [showProgressAnimation, setShowProgressAnimation] = useState(false)
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  })

  // تحديث حجم النافذة
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Redirect admins and super admins to their respective dashboards
  useEffect(() => {
    if (isSuperAdmin()) {
      navigate('/super-admin', { replace: true });
    } else if (isAdmin()) {
      navigate('/admin', { replace: true });
    }
  }, [isSuperAdmin, isAdmin, navigate]);

  // توليد رسائل تشجيعية ذكية بناءً على الأداء
  const generateEncouragementMessage = (averageScore, completedLessons, completedExams, progressPercentage) => {
    const messages = {
      excellent: [
        { 
          message: "🎉 مذهل! أنت نجم متألق في سماء التعلم. استمر في هذا التميز!",
          icon: Crown,
          color: "text-yellow-500"
        },
        { 
          message: "💎 أداء استثنائي! مهاراتك تضعك في مصاف المتفوقين.",
          icon: Trophy,
          color: "text-purple-500"
        },
        { 
          message: "🚀 أنت تتجاوز التوقعات! اجتهادك يثمر نتائج مبهرة.",
          icon: Rocket,
          color: "text-orange-500"
        }
      ],
      good: [
        { 
          message: "💪 تقدم ممتاز! أنت على الطريق الصحيح للتفوق.",
          icon: TrendingUpIcon,
          color: "text-green-500"
        },
        { 
          message: "🌟 أداء مشرف! استمر في المثابرة لتحقيق المزيد.",
          icon: Trophy,
          color: "text-blue-500"
        },
        { 
          message: "📈 مستوى متقدم! جهودك تثمر نتائج إيجابية.",
          icon: LineChart,
          color: "text-teal-500"
        }
      ],
      average: [
        { 
          message: "📚 بداية قوية! ركز أكثر لتصل إلى مستويات أعلى.",
          icon: BookOpen,
          color: "text-blue-500"
        },
        { 
          message: "💡 لديك إمكانيات عالية! نظم وقتك للمذاكرة.",
          icon: Lightbulb,
          color: "text-yellow-500"
        },
        { 
          message: "🌱 نمو مستمر! كل يوم تتعلم شيء جديد.",
          icon: TrendingUpIcon,
          color: "text-orange-500"
        }
      ],
      needsImprovement: [
        { 
          message: "💪 لا تيأس! كل عظيم بدأ من حيث أنت الآن.",
          icon: Target,
          color: "text-red-500"
        },
        { 
          message: "🌅 اليوم بداية جديدة! ابدأ رحلة التعلم الآن.",
          icon: Target,
          color: "text-orange-500"
        },
        { 
          message: "📖 العلم بحر! كل قطرة معرفة تقربك من الشاطئ.",
          icon: BookOpen,
          color: "text-blue-500"
        }
      ]
    };

    let category = 'needsImprovement';
    let level = 'مبتدئ';
    let levelColor = 'bg-gray-500';
    
    if (averageScore >= 85) {
      category = 'excellent';
      level = 'خبير';
      levelColor = 'bg-yellow-500';
    } else if (averageScore >= 70) {
      category = 'good';
      level = 'متقدم';
      levelColor = 'bg-green-500';
    } else if (averageScore >= 50) {
      category = 'average';
      level = 'متوسط';
      levelColor = 'bg-blue-500';
    }
    
    const randomIndex = Math.floor(Math.random() * messages[category].length);
    setPerformanceLevel(level);
    
    return {
      ...messages[category][randomIndex],
      level,
      levelColor
    };
  };

  // تحديد الأهداف التالية
  const determineNextGoal = (completedLessons, completedExams, totalLessons, totalExams) => {
    const goals = [
      { 
        title: "أكمل 5 دروس", 
        icon: BookOpen, 
        color: "bg-blue-500",
        points: 25,
        current: completedLessons,
        target: Math.min(completedLessons + 5, totalLessons),
        type: "lessons"
      },
      { 
        title: "احصل على 80% في امتحان", 
        icon: Trophy, 
        color: "bg-yellow-500",
        points: 50,
        current: 0,
        target: 80,
        type: "score"
      },
      { 
        title: "حافظ على سلسلة 7 أيام نشاط", 
        icon: Flame, 
        color: "bg-orange-500",
        points: 100,
        current: streakDays,
        target: 7,
        type: "streak"
      },
      { 
        title: "أكمل 3 امتحانات", 
        icon: FileText, 
        color: "bg-green-500",
        points: 60,
        current: completedExams,
        target: Math.min(completedExams + 3, totalExams),
        type: "exams"
      }
    ];
    
    // اختيار هدف عشوائي غير مكتمل
    const incompleteGoals = goals.filter(goal => {
      if (goal.type === "score") return true;
      return goal.current < goal.target;
    });
    
    return incompleteGoals.length > 0 
      ? incompleteGoals[Math.floor(Math.random() * incompleteGoals.length)]
      : null;
  };

  // توليد مهام يومية
  const generateDailyTasks = (completedLessons, completedExams, totalLessons, totalExams) => {
    const tasks = [
      {
        id: 1,
        title: "شاهد درس واحد جديد",
        description: "اكتشف معرفة جديدة اليوم",
        icon: BookOpen,
        completed: false,
        points: 5,
        action: () => navigate('/lessons')
      },
      {
        id: 2,
        title: "راجع درس مكتمل",
        description: "التكرار يعزز التعلم",
        icon: RefreshCw,
        completed: completedLessons > 0,
        points: 3,
        action: () => navigate('/lessons')
      },
      {
        id: 3,
        title: "اختبر معلوماتك",
        description: "قياس التقدم مهم",
        icon: FileText,
        completed: false,
        points: 10,
        action: () => navigate('/exams')
      },
      {
        id: 4,
        title: "حقق 50 نقطة اليوم",
        description: "اجمع النقاط من الأنشطة",
        icon: Zap,
        completed: false,
        points: 15,
        action: () => navigate('/lessons')
      }
    ];
    
    return tasks;
  };

  // توليد الإنجازات
  const generateAchievements = (completedLessons, completedExams, averageScore, streakDays) => {
    const achievementList = [];
    
    if (completedLessons >= 1) {
      achievementList.push({
        id: 1,
        title: "المبتدئ",
        description: "أكمل أول درس",
        icon: BookOpen,
        unlocked: true,
        date: new Date().toLocaleDateString('ar-EG'),
        color: "bg-blue-100 text-blue-800"
      });
    }
    
    if (completedExams >= 1) {
      achievementList.push({
        id: 2,
        title: "المختبر الأول",
        description: "أكمل أول امتحان",
        icon: FileText,
        unlocked: true,
        date: new Date().toLocaleDateString('ar-EG'),
        color: "bg-green-100 text-green-800"
      });
    }
    
    if (averageScore >= 70) {
      achievementList.push({
        id: 3,
        title: "المتفوق",
        description: "حقق 70% أو أكثر",
        icon: Trophy,
        unlocked: true,
        date: new Date().toLocaleDateString('ar-EG'),
        color: "bg-yellow-100 text-yellow-800"
      });
    }
    
    if (streakDays >= 3) {
      achievementList.push({
        id: 4,
        title: "المثابر",
        description: "3 أيام نشاط متتالية",
        icon: Flame,
        unlocked: true,
        date: new Date().toLocaleDateString('ar-EG'),
        color: "bg-orange-100 text-orange-800"
      });
    }
    
    if (completedLessons >= 5) {
      achievementList.push({
        id: 5,
        title: "المتعلم النشط",
        description: "أكمل 5 دروس",
        icon: Medal,
        unlocked: completedLessons >= 5,
        date: completedLessons >= 5 ? new Date().toLocaleDateString('ar-EG') : null,
        color: "bg-purple-100 text-purple-800"
      });
    }
    
    return achievementList;
  };

  // تحديث سلسلة الأيام النشطة
  const updateStreak = () => {
    const today = new Date().toDateString();
    const lastActive = localStorage.getItem('lastActiveDate');
    
    if (lastActive === today) {
      return parseInt(localStorage.getItem('streakDays') || '0');
    }
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();
    
    let currentStreak = parseInt(localStorage.getItem('streakDays') || '0');
    
    if (lastActive === yesterdayStr) {
      currentStreak += 1;
    } else {
      currentStreak = 1;
    }
    
    localStorage.setItem('lastActiveDate', today);
    localStorage.setItem('streakDays', currentStreak.toString());
    
    return currentStreak;
  };

  // دالة لحساب الدرجة الكلية للامتحان (نفس الدالة في صفحة النتائج)
  const calculateExamTotalScore = (exam) => {
    if (exam.totalScore && exam.totalScore > 0) {
      return exam.totalScore;
    }
    
    if (Array.isArray(exam.questions) && exam.questions.length > 0) {
      const totalFromQuestions = exam.questions.reduce((sum, question) => {
        return sum + (question.points || 1);
      }, 0);
      
      if (totalFromQuestions > 0) {
        return totalFromQuestions;
      }
    }
    
    if (exam.questions?.length > 0) {
      return exam.questions.length;
    }
    
    return 100;
  };

  // دالة لجلب النتائج مثل صفحة النتائج
  const fetchScores = async (examsList) => {
    const results = {}
    
    const promises = examsList.map(async (ex) => {
      try {
        const res = await examsAPI.getStudentScore(ex._id)
        
        if (res === null) {
          return { examId: ex._id, score: null }
        } else {
          const score = res?.score
          return { examId: ex._id, score: typeof score === 'number' ? score : null }
        }
      } catch (e) {
        return { examId: ex._id, score: null }
      }
    })

    try {
      const resultsArray = await Promise.all(promises)
      resultsArray.forEach(({ examId, score }) => {
        results[examId] = score
      })
      return results
    } catch (error) {
      return {}
    }
  }

  const fetchDashboardData = async () => {
    if (isSuperAdmin()) return
    
    try {
      setIsLoading(true)
      setError(null)
      setShowProgressAnimation(false)
      
      // جلب البيانات
      const [
        lessonsResponse, 
        purchasedResponse, 
        examsResponse,
      ] = await Promise.all([
        lessonsAPI.getAllLessons({ page: 1, limit: 100 }),
        lessonsAPI.getPurchasedLessons(),
        examsAPI.getAllExams({ page: 1, limit: 100 }),
      ]);

      // حساب الدروس
      let totalLessons = 0;
      if (Array.isArray(lessonsResponse)) {
        totalLessons = lessonsResponse.length;
      } else if (lessonsResponse && lessonsResponse.lessons && Array.isArray(lessonsResponse.lessons)) {
        totalLessons = lessonsResponse.lessons.length;
      } else if (lessonsResponse && lessonsResponse.data && Array.isArray(lessonsResponse.data)) {
        totalLessons = lessonsResponse.data.length;
      } else if (lessonsResponse && lessonsResponse.data && lessonsResponse.data.lessons) {
        totalLessons = lessonsResponse.data.lessons.length;
      }
      
      const purchasedLessonsData = Array.isArray(purchasedResponse) 
        ? purchasedResponse 
        : (purchasedResponse?.lessons || purchasedResponse?.data || [])
      
      const completedLessonsCount = purchasedLessonsData.filter(
        lesson => lesson.watched === true
      ).length

      // حساب الامتحانات والنتائج - باستخدام نفس طريقة صفحة النتائج
      let allExams = [];
      if (Array.isArray(examsResponse)) {
        allExams = examsResponse;
      } else if (examsResponse && Array.isArray(examsResponse.exams)) {
        allExams = examsResponse.exams;
      } else if (examsResponse && Array.isArray(examsResponse.data)) {
        allExams = examsResponse.data;
      } else if (examsResponse && examsResponse.data && Array.isArray(examsResponse.data.exams)) {
        allExams = examsResponse.data.exams;
      }
      
      // جلب النتائج باستخدام نفس الدالة في صفحة النتائج
      const scores = await fetchScores(allExams)
      
      let completedExamsCount = 0
      let totalPercentage = 0
      const examScores = []

      // حساب الامتحانات المكتملة والنتائج
      allExams.forEach((exam) => {
        const score = scores[exam._id]
        
        if (typeof score === 'number') {
          completedExamsCount++
          
          // حساب النسبة المئوية
          const totalScore = calculateExamTotalScore(exam)
          const percentage = totalScore > 0 ? Math.round((score / totalScore) * 100) : 0
          totalPercentage += percentage
          
          examScores.push({ 
            examId: exam._id, 
            examTitle: exam.title || 'بدون عنوان',
            score: score,
            totalScore: totalScore,
            percentage: percentage
          })
        }
      })

      // حساب متوسط الدرجات
      let averageScore = 0
      if (completedExamsCount > 0) {
        averageScore = Math.round(totalPercentage / completedExamsCount)
      }

      const totalPoints = (completedLessonsCount * 5) + (completedExamsCount * 10)
      const totalItems = totalLessons + allExams.length
      const completedItems = completedLessonsCount + completedExamsCount
      const progressPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0

      // تحديث السلسلة
      const currentStreak = updateStreak();
      setStreakDays(currentStreak);

      // توليد الرسالة التشجيعية
      const encouragement = generateEncouragementMessage(
        averageScore, 
        completedLessonsCount, 
        completedExamsCount, 
        progressPercentage
      );
      setEncouragementMessage(encouragement);

      // تحديد الهدف التالي
      const nextGoalData = determineNextGoal(
        completedLessonsCount, 
        completedExamsCount, 
        totalLessons, 
        allExams.length
      );
      setNextGoal(nextGoalData);

      // توليد المهام اليومية
      const tasks = generateDailyTasks(
        completedLessonsCount, 
        completedExamsCount, 
        totalLessons, 
        allExams.length
      );
      setDailyTasks(tasks);

      // توليد الإنجازات
      const achievementsList = generateAchievements(
        completedLessonsCount, 
        completedExamsCount, 
        averageScore, 
        currentStreak
      );
      setAchievements(achievementsList);

      // التحقق من الإنجازات الجديدة
      const previousAchievements = JSON.parse(localStorage.getItem('achievements') || '[]');
      const newAchievements = achievementsList.filter(ach => 
        ach.unlocked && !previousAchievements.some(prev => prev.id === ach.id)
      );
      
      if (newAchievements.length > 0) {
        setShowConfetti(true);
        setShowCelebration(true);
        setTimeout(() => setShowConfetti(false), 5000);
        setTimeout(() => setShowCelebration(false), 3000);
      }
      
      localStorage.setItem('achievements', JSON.stringify(achievementsList.map(a => a.id)));

      // التحقق من التقدم الملحوظ
      const previousStats = JSON.parse(localStorage.getItem('previousStats') || '{}');
      if (previousStats.completedLessons < completedLessonsCount || 
          previousStats.completedExams < completedExamsCount) {
        setShowProgressAnimation(true);
        setTimeout(() => setShowProgressAnimation(false), 2000);
      }
      
      localStorage.setItem('previousStats', JSON.stringify({
        completedLessons: completedLessonsCount,
        completedExams: completedExamsCount,
        averageScore,
        totalPoints
      }));

      // تحديث الحالة
      setStats({
        totalLessons,
        completedLessons: completedLessonsCount,
        totalExams: allExams.length,
        completedExams: completedExamsCount,
        averageScore,
        totalPoints,
        progressPercentage,
        examScores
      })

      setLastUpdated(new Date())
      
    } catch (error) {
      
      let errorMessage = 'خطأ في تحميل البيانات'
      if (error.message?.includes('Session expired') || error.status === 401) {
        errorMessage = 'انتهت جلسة العمل. يرجى تسجيل الدخول مرة أخرى'
        localStorage.removeItem('token')
        navigate('/login')
      } else if (error.message?.includes('Network')) {
        errorMessage = 'خطأ في الاتصال بالإنترنت'
      } else {
        errorMessage = error.message || 'حدث خطأ غير معروف'
      }
      
      setError(errorMessage)
      
      // استخدام البيانات المخزنة مؤقتاً
      const cachedStats = JSON.parse(localStorage.getItem('cachedStats') || '{}');
      if (Object.keys(cachedStats).length > 0) {
        setStats(cachedStats);
      } else {
        setStats({
          totalLessons: 0,
          completedLessons: 0,
          totalExams: 0,
          completedExams: 0,
          averageScore: 0,
          totalPoints: 0,
          progressPercentage: 0,
          examScores: []
        })
      }
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
      
      // حفظ البيانات مؤقتاً
      localStorage.setItem('cachedStats', JSON.stringify(stats))
    }
  }

  useEffect(() => {
    if (user && !isSuperAdmin()) {
      fetchDashboardData()
      
      const interval = setInterval(() => {
        if (document.visibilityState === 'visible') {
          fetchDashboardData();
        }
      }, 5 * 60 * 1000);
      
      return () => clearInterval(interval);
    }
  }, [user, isSuperAdmin])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchDashboardData()
  }

  const handleTaskComplete = (taskId) => {
    setDailyTasks(tasks => 
      tasks.map(task => 
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
    
    const task = dailyTasks.find(t => t.id === taskId);
    if (task && !task.completed) {
      setStats(prev => ({
        ...prev,
        totalPoints: prev.totalPoints + task.points
      }));
    }
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
      color: 'bg-blue-500',
      gradient: 'from-blue-500 to-blue-600'
    },
    {
      title: 'الامتحانات',
      description: 'اختبر معلوماتك',
      icon: FileText,
      link: '/exams',
      color: 'bg-green-500',
      gradient: 'from-green-500 to-green-600'
    },
    {
      title: 'النتائج',
      description: 'شاهد أداءك',
      icon: Award,
      link: '/results',
      color: 'bg-purple-500',
      gradient: 'from-purple-500 to-purple-600'
    },
    {
      title: 'المسار التعليمي',
      description: 'تابع تقدمك',
      icon: BarChart3,
      link: '/progress',
      color: 'bg-orange-500',
      gradient: 'from-orange-500 to-orange-600'
    }
  ]

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-600 dark:text-gray-300">جاري تحميل بيانات لوحة التحكم...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      <Navbar />
      
      {/* تأثير الكونفيتي البديل */}
      {showConfetti && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          {Array.from({ length: 50 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-4 h-4 rounded-full"
              style={{
                background: `hsl(${Math.random() * 360}, 100%, 50%)`,
                left: `${Math.random() * 100}%`,
                top: '-10%'
              }}
              initial={{ y: 0, rotate: 0 }}
              animate={{ 
                y: windowSize.height + 100,
                rotate: 360,
                x: Math.sin(i) * 100
              }}
              transition={{
                duration: 2 + Math.random() * 3,
                ease: "linear",
                repeat: 0
              }}
            />
          ))}
        </div>
      )}
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                مرحباً، {user?.fullName || 'الطالب'}
              </h1>
              <Badge className={`${encouragementMessage?.levelColor || 'bg-blue-500'}`}>
                {performanceLevel}
              </Badge>
            </div>
            <p className="text-gray-600 dark:text-gray-300">
              استمر في رحلتك التعليمية وحقق أهدافك الأكاديمية
            </p>
            {lastUpdated && (
              <p className="text-xs text-gray-500 mt-1">
                آخر تحديث: {lastUpdated.toLocaleTimeString('ar-EG')} | 
                سلسلة نشاط: {streakDays} يوم
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {error && (
              <Alert variant="destructive" className="mb-0">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">{error}</AlertDescription>
              </Alert>
            )}
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
          </div>
        </motion.div>

        {/* الرسالة التشجيعية */}
        {encouragementMessage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className={`mb-6 p-4 rounded-xl border-2 shadow-lg ${
              stats.averageScore >= 85 
                ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200 dark:from-yellow-900/20 dark:to-amber-900/20' 
                : stats.averageScore >= 70
                ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 dark:from-green-900/20 dark:to-emerald-900/20'
                : stats.averageScore >= 50
                ? 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200 dark:from-blue-900/20 dark:to-cyan-900/20'
                : 'bg-gradient-to-r from-red-50 to-pink-50 border-red-200 dark:from-red-900/20 dark:to-pink-900/20'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${stats.averageScore >= 85 ? 'bg-yellow-100 dark:bg-yellow-900' : 
                stats.averageScore >= 70 ? 'bg-green-100 dark:bg-green-900' : 
                stats.averageScore >= 50 ? 'bg-blue-100 dark:bg-blue-900' : 'bg-red-100 dark:bg-red-900'}`}>
                {encouragementMessage.icon && <encouragementMessage.icon className={`h-5 w-5 ${encouragementMessage.color || 'text-blue-500'}`} />}
              </div>
              <div className="flex-1">
                <p className="font-bold text-lg mb-1">
                  {stats.averageScore >= 85 
                    ? '🎯 أداء استثنائي!' 
                    : stats.averageScore >= 70 
                    ? '💪 تقدم مذهل!' 
                    : stats.averageScore >= 50
                    ? '🌟 بداية واعدة!'
                    : '🚀 يمكنك التحسن!'}
                </p>
                <p className="text-sm">{encouragementMessage.message}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">إجمالي الدروس</p>
                  <p className="text-3xl font-bold">{stats.totalLessons}</p>
                  <p className="text-blue-200 text-xs mt-1">
                    {stats.completedLessons} مكتمل
                  </p>
                </div>
                <div className="relative">
                  <BookOpen className="h-8 w-8 text-blue-200" />
                  {stats.completedLessons > 0 && (
                    <div className="absolute -top-2 -right-2 w-5 h-5 bg-blue-300 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold">{stats.completedLessons}</span>
                    </div>
                  )}
                </div>
              </div>
              <Progress 
                value={stats.totalLessons > 0 ? (stats.completedLessons / stats.totalLessons) * 100 : 0} 
                className="h-1 mt-3 bg-blue-400" 
              />
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">الدروس المكتملة</p>
                  <p className="text-3xl font-bold">{stats.completedLessons}</p>
                  <p className="text-green-200 text-xs mt-1">
                    {stats.totalLessons > 0 ? Math.round((stats.completedLessons / stats.totalLessons) * 100) : 0}% إنجاز
                  </p>
                </div>
                <div className="relative">
                  <CheckCircle className="h-8 w-8 text-green-200" />
                  {showProgressAnimation && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1.5 }}
                      transition={{ duration: 0.5 }}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-green-300 rounded-full"
                    />
                  )}
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Badge variant="secondary" className="bg-green-400/20 text-green-100">
                  +{stats.completedLessons * 5} نقطة
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">الامتحانات المكتملة</p>
                  <p className="text-3xl font-bold">{stats.completedExams}</p>
                  <p className="text-purple-200 text-xs mt-1">
                    {stats.totalExams > 0 ? Math.round((stats.completedExams / stats.totalExams) * 100) : 0}% إنجاز
                  </p>
                </div>
                <div className="relative">
                  <FileText className="h-8 w-8 text-purple-200" />
                  {stats.completedExams > 0 && (
                    <motion.div
                      initial={{ rotate: 0 }}
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-purple-300 rounded-full"
                    />
                  )}
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Badge variant="secondary" className="bg-purple-400/20 text-purple-100">
                  +{stats.completedExams * 10} نقطة
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">متوسط الدرجات</p>
                  <p className="text-3xl font-bold">{stats.averageScore}%</p>
                  <p className="text-orange-200 text-xs mt-1">
                    {stats.completedExams > 0 ? 'بناءً على ' + stats.completedExams + ' امتحان' : 'لا توجد نتائج'}
                  </p>
                </div>
                <div className="relative">
                  <TrendingUp className="h-8 w-8 text-orange-200" />
                  {stats.averageScore >= 70 ? (
                    <TrendingUpIcon className="absolute -top-2 -right-2 h-5 w-5 text-green-300" />
                  ) : (
                    <TrendingDownIcon className="absolute -top-2 -right-2 h-5 w-5 text-red-300" />
                  )}
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-center gap-2">
                  {stats.averageScore >= 85 ? (
                    <Badge className="bg-yellow-500">ممتاز</Badge>
                  ) : stats.averageScore >= 70 ? (
                    <Badge className="bg-green-500">جيد جداً</Badge>
                  ) : stats.averageScore >= 50 ? (
                    <Badge className="bg-blue-500">متوسط</Badge>
                  ) : (
                    <Badge className="bg-red-500">بحاجة لتحسين</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content Area */}
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
            <TabsTrigger value="progress">التقدم</TabsTrigger>
            <TabsTrigger value="achievements">الإنجازات</TabsTrigger>
            <TabsTrigger value="tasks">المهام</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Progress & Quick Actions */}
              <div className="lg:col-span-2 space-y-6">
                {/* Progress Section */}
                <Card className="border-2 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
                    <CardTitle className="flex items-center text-xl">
                      <BarChart3 className="h-6 w-6 ml-2 text-blue-600" />
                      تقدمك الأكاديمي الشامل
                    </CardTitle>
                    <CardDescription>
                      تتبع إنجازاتك ومستوى تقدمك في المنهج التعليمي
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-6">
                      {/* Overall Progress */}
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-5 rounded-xl">
                        <div className="flex justify-between items-center mb-4">
                          <div>
                            <span className="text-sm font-medium">التقدم الشامل</span>
                            <p className="text-xs text-gray-500">إنجازك في جميع المواد</p>
                          </div>
                          <div className="text-right">
                            <span className="text-2xl font-bold text-gray-900 dark:text-white">
                              {stats.progressPercentage}%
                            </span>
                            <p className="text-xs text-gray-500">من إجمالي المهام</p>
                          </div>
                        </div>
                        <div className="relative">
                          <Progress value={stats.progressPercentage} className="h-4 rounded-full" />
                          <motion.div
                            className="absolute top-0 left-0 h-4 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${stats.progressPercentage}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-2">
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            <span>مكتمل: {stats.completedLessons + stats.completedExams}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-gray-400" />
                            <span>متبقي: {(stats.totalLessons + stats.totalExams) - (stats.completedLessons + stats.completedExams)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Target className="h-3 w-3 text-blue-500" />
                            <span>الإجمالي: {stats.totalLessons + stats.totalExams}</span>
                          </div>
                        </div>
                      </div>

                      {/* Detailed Progress */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="border border-blue-200 dark:border-blue-800">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center">
                                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mr-3">
                                  <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                  <p className="font-medium">تقدم الدروس</p>
                                  <p className="text-sm text-gray-500">المعرفة النظرية</p>
                                </div>
                              </div>
                              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                                {stats.totalLessons > 0 ? Math.round((stats.completedLessons / stats.totalLessons) * 100) : 0}%
                              </Badge>
                            </div>
                            <Progress 
                              value={stats.totalLessons > 0 ? (stats.completedLessons / stats.totalLessons) * 100 : 0} 
                              className="h-2" 
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-2">
                              <span>{stats.completedLessons} مكتمل</span>
                              <span>{stats.totalLessons - stats.completedLessons} متبقي</span>
                            </div>
                            <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/30 rounded">
                              <div className="flex items-center justify-between">
                                <span className="text-sm">النقاط المكتسبة</span>
                                <Badge variant="outline" className="bg-white dark:bg-gray-800">
                                  +{stats.completedLessons * 5}
                                </Badge>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="border border-green-200 dark:border-green-800">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center">
                                <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mr-3">
                                  <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                  <p className="font-medium">تقدم الامتحانات</p>
                                  <p className="text-sm text-gray-500">التطبيق العملي</p>
                                </div>
                              </div>
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                                {stats.totalExams > 0 ? Math.round((stats.completedExams / stats.totalExams) * 100) : 0}%
                              </Badge>
                            </div>
                            <Progress 
                              value={stats.totalExams > 0 ? (stats.completedExams / stats.totalExams) * 100 : 0} 
                              className="h-2" 
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-2">
                              <span>{stats.completedExams} مكتمل</span>
                              <span>{stats.totalExams - stats.completedExams} متبقي</span>
                            </div>
                            <div className="mt-3 p-2 bg-green-50 dark:bg-green-900/30 rounded">
                              <div className="flex items-center justify-between">
                                <span className="text-sm">النقاط المكتسبة</span>
                                <Badge variant="outline" className="bg-white dark:bg-gray-800">
                                  +{stats.completedExams * 10}
                                </Badge>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Points & Rewards */}
                      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
                        <CardContent className="p-5">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h3 className="font-bold text-lg">النقاط والمكافآت</h3>
                              <p className="text-sm text-gray-600 dark:text-gray-300">اجمع النقاط وارتقِ بمستواك</p>
                            </div>
                            <div className="text-right">
                              <p className="text-3xl font-bold text-purple-600">{stats.totalPoints}</p>
                              <p className="text-sm text-purple-500">نقطة إجمالية</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                                  <BookOpen className="h-4 w-4 text-blue-600" />
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">من الدروس</p>
                                  <p className="font-bold">+{stats.completedLessons * 5}</p>
                                </div>
                              </div>
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-2">
                                  <FileText className="h-4 w-4 text-green-600" />
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">من الامتحانات</p>
                                  <p className="font-bold">+{stats.completedExams * 10}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>الإجراءات السريعة</CardTitle>
                    <CardDescription>
                      الوصول السريع للأقسام المهمة في المنصة
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {quickActions.map((action, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Link to={action.link}>
                            <Card className="h-full border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-300 hover:shadow-xl cursor-pointer">
                              <CardContent className="p-5 text-center">
                                <div className={`w-14 h-14 ${action.color} rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg`}>
                                  <action.icon className="h-7 w-7 text-white" />
                                </div>
                                <h3 className="font-semibold mb-1">{action.title}</h3>
                                <p className="text-sm text-gray-500">{action.description}</p>
                                <ChevronRight className="h-4 w-4 mx-auto mt-2 text-gray-400" />
                              </CardContent>
                            </Card>
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Sidebar */}
              <div className="space-y-6">
                {/* Next Goal Card */}
                <Card className="border-2 border-dashed border-blue-300 dark:border-blue-700">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Target className="h-5 w-5 ml-2 text-blue-600" />
                      هدفك القادم
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {nextGoal ? (
                      <div className="text-center">
                        <div className={`w-16 h-16 ${nextGoal.color} rounded-full flex items-center justify-center mx-auto mb-3`}>
                          <nextGoal.icon className="h-8 w-8 text-white" />
                        </div>
                        <h3 className="font-bold text-lg mb-2">{nextGoal.title}</h3>
                        <div className="mb-4">
                          <div className="flex justify-between text-sm mb-1">
                            <span>التقدم</span>
                            <span>{nextGoal.current}/{nextGoal.target}</span>
                          </div>
                          <Progress 
                            value={nextGoal.target > 0 ? (nextGoal.current / nextGoal.target) * 100 : 0} 
                            className="h-2" 
                          />
                        </div>
                        <Badge className="bg-gradient-to-r from-blue-500 to-purple-500">
                          +{nextGoal.points} نقطة مكافأة
                        </Badge>
                        <p className="text-xs text-gray-500 mt-2">
                          اكمل هذا الهدف لتحصل على نقاط إضافية
                        </p>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Target className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500">لا توجد أهداف حالية</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Streak Card */}
                <Card className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Flame className="h-5 w-5 ml-2 text-orange-600" />
                      سلسلة النشاط
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="inline-block relative">
                        <div className="w-20 h-20 bg-gradient-to-r from-orange-400 to-red-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                          <Flame className="h-10 w-10 text-white" />
                        </div>
                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold">{streakDays}</span>
                        </div>
                      </div>
                      <h3 className="text-2xl font-bold mb-1">{streakDays} يوم</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                        نشاط متتالي على المنصة
                      </p>
                      <div className="grid grid-cols-7 gap-1">
                        {[...Array(7)].map((_, i) => (
                          <div
                            key={i}
                            className={`h-2 rounded ${i < streakDays ? 'bg-gradient-to-r from-orange-500 to-red-500' : 'bg-gray-200 dark:bg-gray-700'}`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-3">
                        {streakDays >= 7 
                          ? '🎉 مذهل! حافظ على سلسلتك!' 
                          : streakDays >= 3 
                          ? '🔥 استمر! أنت على الطريق الصحيح' 
                          : '💪 ابدأ سلسلة نشاطك اليوم!'}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Performance Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <TrendingUp className="h-5 w-5 ml-2 text-green-600" />
                      أداء الامتحانات
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="relative inline-block mb-4">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900 flex items-center justify-center">
                          <div className="text-center">
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">
                              {stats.averageScore}%
                            </p>
                            <p className="text-xs text-gray-500">المتوسط</p>
                          </div>
                        </div>
                        {stats.averageScore >= 70 && (
                          <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center animate-pulse">
                            <Crown className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                            <p className="text-xs text-gray-500">أعلى درجة</p>
                            <p className="font-bold text-lg">
                              {stats.examScores.length > 0 
                                ? Math.max(...stats.examScores.map(e => e.percentage || 0), 0)
                                : 0}%
                            </p>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                            <p className="text-xs text-gray-500">أدنى درجة</p>
                            <p className="font-bold text-lg">
                              {stats.examScores.length > 0 
                                ? Math.min(...stats.examScores.map(e => e.percentage || 100), 100)
                                : 0}%
                            </p>
                          </div>
                        </div>
                        
                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-3 rounded-lg">
                          <div className="flex justify-between text-sm">
                            <span>امتحانات مكتملة</span>
                            <span className="font-bold">{stats.completedExams}</span>
                          </div>
                          <div className="flex justify-between text-sm mt-1">
                            <span>إجمالي الامتحانات</span>
                            <span className="font-bold">{stats.totalExams}</span>
                          </div>
                        </div>
                      </div>
                      
                      {stats.completedExams === 0 ? (
                        <Button 
                          className="w-full mt-4" 
                          onClick={() => navigate('/exams')}
                        >
                          ابدأ أول امتحان
                        </Button>
                      ) : stats.averageScore < 50 ? (
                        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                          <p className="text-sm font-medium">نصيحة:</p>
                          <p className="text-xs text-gray-600 dark:text-gray-300">
                            راجع الدروس قبل الامتحانات القادمة
                          </p>
                        </div>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="achievements" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">إنجازاتك</CardTitle>
                <CardDescription>الشهادات والميداليات التي حصلت عليها</CardDescription>
              </CardHeader>
              <CardContent>
                {achievements.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {achievements.map((achievement, index) => (
                      <motion.div
                        key={achievement.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card className={`h-full border-2 ${achievement.unlocked ? 'border-yellow-300' : 'border-gray-200'} overflow-hidden`}>
                          <CardContent className="p-5 text-center">
                            <div className={`w-16 h-16 ${achievement.color.split(' ')[0]} rounded-full flex items-center justify-center mx-auto mb-3`}>
                              <achievement.icon className="h-8 w-8 text-white" />
                            </div>
                            <h3 className="font-bold text-lg mb-1">{achievement.title}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                              {achievement.description}
                            </p>
                            {achievement.unlocked ? (
                              <div className="space-y-2">
                                <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500">
                                  <Trophy className="h-3 w-3 mr-1" />
                                  مكتسب
                                </Badge>
                                <p className="text-xs text-gray-500">
                                  {achievement.date}
                                </p>
                              </div>
                            ) : (
                              <Badge variant="outline" className="border-gray-300">
                                قيد التقدم
                              </Badge>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2">لا توجد إنجازات بعد</h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      ابدأ رحلة التعلم لاكتساب أول إنجاز لك
                    </p>
                    <Button onClick={() => navigate('/lessons')}>
                      ابدأ التعلم الآن
                    </Button>
                  </div>
                )}
                
                {showCelebration && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl text-center"
                  >
                    <div className="flex items-center justify-center gap-3 mb-2">
                      <Sparkles className="h-6 w-6 text-yellow-600" />
                      <h3 className="font-bold text-lg">🎉 تهانينا! إنجاز جديد 🎉</h3>
                      <Sparkles className="h-6 w-6 text-yellow-600" />
                    </div>
                    <p className="text-gray-700 dark:text-gray-300">
                      لقد حصلت على إنجاز جديد! استمر في التقدم لاكتساب المزيد من الإنجازات.
                    </p>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* تشجيع إضافي في الأسفل */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 p-6 bg-gradient-to-r from-gray-900 to-black dark:from-gray-800 dark:to-gray-900 rounded-2xl text-white"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">🚀 استعد للقفزة التالية!</h2>
              <p className="text-gray-300">
                {stats.completedLessons + stats.completedExams === 0 
                  ? 'ابدأ رحلتك التعليمية اليوم واكتشف عالم المعرفة' 
                  : `أنت على الطريق الصحيح! أكمل ${stats.totalLessons + stats.totalExams - (stats.completedLessons + stats.completedExams)} مهمة أخرى لتحقيق إنجاز كامل`}
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="secondary" 
                className="bg-white text-gray-900 hover:bg-gray-100"
                onClick={() => navigate('/lessons')}
              >
                <BookOpen className="h-4 w-4 ml-2" />
                ابدأ التعلم
              </Button>
              <Button 
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                onClick={() => navigate('/exams')}
              >
                <FileText className="h-4 w-4 ml-2" />
                اختبر نفسك
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default DashboardPage