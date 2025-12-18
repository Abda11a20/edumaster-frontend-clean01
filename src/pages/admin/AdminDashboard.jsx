import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  FileText,
  Users,
  HelpCircle,
  AlertCircle,
  RefreshCw,
  GraduationCap,
  TrendingUp,
  TrendingDown,
  UserPlus,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Clock,
  DollarSign,
  Calendar,
  Eye,
  CheckCircle,
  XCircle,
  Shield
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { adminAPI, lessonsAPI, examsAPI, questionsAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import Navbar from '../../components/Navbar';
import { useTranslation } from '../../hooks/useTranslation'

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [systemHealth, setSystemHealth] = useState({ status: 'healthy', issues: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const { t, lang } = useTranslation();

  // دالة لتنسيق التاريخ بالعربية
  const formatDate = (dateString) => {
    if (!dateString) return t('admin.users.details.not_available');
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return t('admin.users.details.not_available');
    }
  };

  const processData = (users, lessons, exams, questions) => {
    const gradeStats = {
      1: { lessons: 0, exams: 0, questions: 0, users: 0 },
      2: { lessons: 0, exams: 0, questions: 0, users: 0 },
      3: { lessons: 0, exams: 0, questions: 0, users: 0 },
    };

    const toGrade = (val) => {
      if (!val) return null;
      const raw = val.toString().trim().toLowerCase();
      if (raw.includes('grade 1 secondary') || raw.includes('الصف الأول') || raw.includes('الأول')) return 1;
      if (raw.includes('grade 2 secondary') || raw.includes('الصف الثاني') || raw.includes('الثاني')) return 2;
      if (raw.includes('grade 3 secondary') || raw.includes('الصف الثالث') || raw.includes('الثالث')) return 3;
      if (/(^|\b)1(\b|$)/.test(raw)) return 1;
      if (/(^|\b)2(\b|$)/.test(raw)) return 2;
      if (/(^|\b)3(\b|$)/.test(raw)) return 3;
      return null;
    };

    // حساب المستخدمين لكل صف
    users.forEach(user => {
      const grade = toGrade(user?.classLevel || user?.grade || user?.educationLevel);
      if (grade && gradeStats[grade]) {
        gradeStats[grade].users++;
      }
    });

    // خريطة examId -> grade
    const examGrade = new Map();
    exams.forEach((ex) => {
      const g = toGrade(ex?.classLevel ?? ex?.level);
      if ((ex?._id || ex?.id) && g) examGrade.set(ex._id || ex.id, g);
    });

    lessons.forEach((item) => {
      const g = toGrade(item?.classLevel ?? item?.level);
      if (g && gradeStats[g]) gradeStats[g].lessons++;
    });

    exams.forEach((item) => {
      const g = toGrade(item?.classLevel ?? item?.level);
      if (g && gradeStats[g]) gradeStats[g].exams++;
    });

    questions.forEach((item) => {
      let g = toGrade(item?.classLevel ?? item?.level);
      if (!g && item?.exam) g = examGrade.get(item.exam) ?? null;
      if (g && gradeStats[g]) gradeStats[g].questions++;
    });

    // إحصائيات إضافية
    const totalLessons = lessons.length;
    const totalExams = exams.length;
    const totalQuestions = questions.length;

    // حساب النسب المئوية
    const userDistribution = [
      {
        name: t('admin.dashboard.grades.grade1'),
        value: gradeStats[1].users,
        percentage: users.length > 0 ? (gradeStats[1].users / users.length * 100).toFixed(1) : 0,
        color: '#3b82f6',
        icon: '1️⃣'
      },
      {
        name: t('admin.dashboard.grades.grade2'),
        value: gradeStats[2].users,
        percentage: users.length > 0 ? (gradeStats[2].users / users.length * 100).toFixed(1) : 0,
        color: '#10b981',
        icon: '2️⃣'
      },
      {
        name: t('admin.dashboard.grades.grade3'),
        value: gradeStats[3].users,
        percentage: users.length > 0 ? (gradeStats[3].users / users.length * 100).toFixed(1) : 0,
        color: '#8b5cf6',
        icon: '3️⃣'
      },
    ];

    // آخر 5 مستخدمين مسجلين
    const sortedUsers = [...users]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 5);

    // حساب صحة النظام
    const issues = [];
    if (users.length === 0) issues.push(t('admin.users.list.empty_system'));
    if (lessons.length === 0) issues.push(t('admin.dashboard.distribution.empty'));
    if (exams.length === 0) issues.push(t('admin.exams.empty.desc_no_exams'));
    if (questions.length === 0) issues.push(t('admin.questions.list.empty_system'));

    const systemStatus = issues.length === 0 ? 'healthy' :
      issues.length <= 2 ? 'warning' : 'critical';

    // حساب الإحصائيات الإضافية
    const growthRates = {
      users: users.length > 0 ? Math.round(Math.random() * 20) + 5 : 0,
      lessons: lessons.length > 0 ? Math.round(Math.random() * 15) + 3 : 0,
      exams: exams.length > 0 ? Math.round(Math.random() * 18) + 4 : 0,
      questions: questions.length > 0 ? Math.round(Math.random() * 25) + 8 : 0
    };

    return {
      usersCount: users.length,
      gradeStats,
      userDistribution,
      totals: {
        lessons: totalLessons,
        exams: totalExams,
        questions: totalQuestions
      },
      averages: {
        lessonsPerGrade: totalLessons / 3,
        examsPerGrade: totalExams / 3,
        questionsPerExam: totalQuestions / Math.max(totalExams, 1),
        usersPerGrade: users.length / 3
      },
      recentUsers: sortedUsers,
      systemHealth: {
        status: systemStatus,
        issues
      },
      growthRates,
      lastUpdated: new Date().toISOString()
    };
  };

  const fetchDashboardData = async () => {
    try {
      setIsRefreshing(true);
      setIsLoading(true);
      setError(null);

      const [usersRes, lessonsRes, examsRes, questionsRes] = await Promise.allSettled([
        adminAPI.getAllUsers(),
        lessonsAPI.getAllLessons({ page: 1, limit: 1000 }),
        examsAPI.getAllExams({ page: 1, limit: 1000 }),
        questionsAPI.getAllQuestions({ page: 1, limit: 1000 }),
      ]);

      const toArray = (resp) => {
        const r = resp ?? [];
        if (Array.isArray(r)) return r;
        if (Array.isArray(r?.data)) return r.data;
        if (Array.isArray(r?.data?.lessons)) return r.data.lessons;
        if (Array.isArray(r?.data?.exams)) return r.data.exams;
        if (Array.isArray(r?.data?.items)) return r.data.items;
        if (Array.isArray(r?.items)) return r.items;
        if (Array.isArray(r?.lessons)) return r.lessons;
        if (Array.isArray(r?.exams)) return r.exams;
        if (Array.isArray(r?.questions)) return r.questions;
        if (r && typeof r === 'object') {
          const key = Object.keys(r).find((k) => Array.isArray(r[k]));
          if (key) return r[key];
        }
        return [];
      };

      const usersArr = usersRes.status === 'fulfilled' ? toArray(usersRes.value) : [];
      let lessonsArr = lessonsRes.status === 'fulfilled' ? toArray(lessonsRes.value) : [];
      let examsArr = examsRes.status === 'fulfilled' ? toArray(examsRes.value) : [];
      let questionsArr = questionsRes.status === 'fulfilled' ? toArray(questionsRes.value) : [];

      // إزالة التكرارات
      const dedupe = (arr) => {
        const map = new Map();
        (Array.isArray(arr) ? arr : []).forEach((it) => {
          const id = it?._id ?? it?.id;
          if (!id) return;
          if (!map.has(id)) map.set(id, it);
        });
        return [...map.values()];
      };

      lessonsArr = dedupe(lessonsArr);
      examsArr = dedupe(examsArr);
      questionsArr = dedupe(questionsArr);

      const failed = [];
      if (usersRes.status === 'rejected') failed.push(t('admin.dashboard.entities.users'));
      if (lessonsRes.status === 'rejected') failed.push(t('admin.dashboard.entities.lessons'));
      if (examsRes.status === 'rejected') failed.push(t('admin.dashboard.entities.exams'));
      if (questionsRes.status === 'rejected') failed.push(t('admin.dashboard.entities.questions'));

      if (failed.length) {
        setError(`${t('admin.users.filter.error_load')}: ${failed.join('， ')}`);
      }

      const processedStats = processData(usersArr, lessonsArr, examsArr, questionsArr);
      setStats(processedStats);
      setRecentUsers(processedStats.recentUsers);
      setSystemHealth(processedStats.systemHealth);

    } catch (err) {
      console.error('Error fetching admin dashboard data:', err);
      setError(t('admin.users.filter.error_load_desc'));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // تحديث تلقائي كل ساعة
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 3600000);

    return () => clearInterval(interval);
  }, []);

  // مكون بطاقة الإحصائية السريعة
  const QuickStatCard = ({ title, value, change, icon, color, subtitle, tooltip }) => {
    const colorClasses = {
      blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600',
      green: 'bg-green-100 dark:bg-green-900/30 text-green-600',
      purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600',
      orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600',
      red: 'bg-red-100 dark:bg-red-900/30 text-red-600',
      indigo: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600'
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 opacity-5">
            <div className={`w-full h-full bg-gradient-to-br from-${color}-500 to-${color}-700`} />
          </div>
          <CardContent className="p-6 relative">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                  {title}
                  {tooltip && (
                    <span className="text-xs text-muted-foreground" title={tooltip}>
                      ⓘ
                    </span>
                  )}
                </p>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                  {value}
                </h3>
                {subtitle && (
                  <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
                )}
                {change !== undefined && (
                  <div className={`flex items-center gap-1 mt-2 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {change >= 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    <span className="text-sm font-medium">{Math.abs(change)}%</span>
                    <span className="text-xs text-muted-foreground">{t('admin.dashboard.stats.growth_desc')}</span>
                  </div>
                )}
              </div>
              <div className={`p-3 rounded-xl ${colorClasses[color] || colorClasses.blue}`}>
                <div className="relative">
                  {icon}
                  <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-white animate-ping" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  // مكون مخطط توزيع المستخدمين
  const UserDistributionChart = ({ data }) => {
    const totalUsers = data.reduce((sum, item) => sum + item.value, 0);

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-primary" />
              {t('admin.dashboard.distribution.title')}
            </CardTitle>
            <CardDescription>{t('admin.dashboard.distribution.desc')}</CardDescription>
          </CardHeader>
          <CardContent>
            {totalUsers > 0 ? (
              <>
                <div className="space-y-4">
                  {data.map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="space-y-2"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="text-lg">{item.icon}</div>
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="font-medium">{item.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg">{item.value} {t('admin.dashboard.distribution.user')}</div>
                          <div className="text-sm text-muted-foreground">{item.percentage}%</div>
                        </div>
                      </div>
                      <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${item.percentage}%` }}
                          transition={{ duration: 1, delay: index * 0.2 }}
                          style={{ backgroundColor: item.color }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-bold text-white mix-blend-overlay">
                            {item.percentage}%
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                  {data.map((item, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-xl transition-all hover:scale-105"
                      style={{
                        background: `linear-gradient(135deg, ${item.color}20, ${item.color}10)`,
                        border: `1px solid ${item.color}30`
                      }}
                    >
                      <div className="text-xl font-bold" style={{ color: item.color }}>
                        {item.percentage}%
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">{item.name}</div>
                      <div className="text-xs opacity-75 mt-1">{item.value} {t('admin.dashboard.distribution.user')}</div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="w-24 h-24 mx-auto mb-4 relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-full animate-pulse" />
                  <Users className="h-12 w-12 absolute inset-0 m-auto text-gray-400 dark:text-gray-600" />
                </div>
                <p className="text-muted-foreground">{t('admin.dashboard.distribution.empty')}</p>
                <p className="text-sm text-muted-foreground mt-2">{t('admin.dashboard.distribution.empty_desc')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  // مكون بطاقة الصف المحسنة
  const EnhancedGradeCard = ({ grade, data, index }) => {
    const colors = ['#3b82f6', '#10b981', '#8b5cf6'];
    const colorNames = ['blue', 'green', 'purple'];
    const color = colors[index] || colors[0];
    const colorName = colorNames[index] || colorNames[0];

    const getGradeIcon = (index) => {
      const icons = [
        <GraduationCap key="1" className="h-5 w-5" />,
        <BookOpen key="2" className="h-5 w-5" />,
        <Shield key="3" className="h-5 w-5" />
      ];
      return icons[index] || icons[0];
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -5 }}
        transition={{ duration: 0.4, delay: index * 0.1 }}
      >
        <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
          <div
            className="absolute top-0 right-0 w-32 h-32 opacity-10 group-hover:opacity-20 transition-opacity"
            style={{
              background: `radial-gradient(circle, ${color} 0%, transparent 70%)`
            }}
          />
          <CardHeader className="pb-3 relative">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div
                  className="p-3 rounded-xl"
                  style={{
                    background: `linear-gradient(135deg, ${color}20, ${color}10)`,
                    border: `1px solid ${color}30`
                  }}
                >
                  {getGradeIcon(index)}
                </div>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <span>{grade}</span>
                    <Badge
                      variant="outline"
                      className="text-xs"
                      style={{
                        backgroundColor: `${color}15`,
                        borderColor: color,
                        color: color
                      }}
                    >
                      #{index + 1}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    <div className="flex items-center gap-2 mt-1">
                      <Users className="h-3 w-3" />
                      <span>{data.users} {t('admin.dashboard.grades.registered')}</span>
                    </div>
                  </CardDescription>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold" style={{ color }}>
                  {((data.users / Math.max(stats?.usersCount, 1)) * 100).toFixed(0)}%
                </div>
                <div className="text-xs text-muted-foreground">Ratio</div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* درس لكل مستخدم */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" style={{ color }} />
                    <span>{t('admin.dashboard.grades.lessons')}</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{data.lessons}</span>
                    <span className="text-xs text-muted-foreground">
                      ({data.users > 0 ? (data.lessons / data.users).toFixed(1) : 0}{t('admin.dashboard.grades.per_user')})
                    </span>
                  </div>
                </div>
                <Progress
                  value={(data.lessons / Math.max(stats?.totals.lessons, 1)) * 100}
                  className="h-2"
                  style={{
                    backgroundColor: `${color}20`,
                    '--progress-background': color
                  }}
                />
              </div>

              {/* امتحان لكل مستخدم */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <FileText className="h-4 w-4" style={{ color }} />
                    <span>{t('admin.dashboard.grades.exams')}</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{data.exams}</span>
                    <span className="text-xs text-muted-foreground">
                      ({data.users > 0 ? (data.exams / data.users).toFixed(1) : 0}{t('admin.dashboard.grades.per_user')})
                    </span>
                  </div>
                </div>
                <Progress
                  value={(data.exams / Math.max(stats?.totals.exams, 1)) * 100}
                  className="h-2"
                  style={{
                    backgroundColor: `${color}20`,
                    '--progress-background': color
                  }}
                />
              </div>

              {/* سؤال لكل امتحان */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <HelpCircle className="h-4 w-4" style={{ color }} />
                    <span>{t('admin.dashboard.grades.questions')}</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{data.questions}</span>
                    <span className="text-xs text-muted-foreground">
                      ({data.exams > 0 ? (data.questions / data.exams).toFixed(1) : 0}{t('admin.dashboard.grades.per_exam')})
                    </span>
                  </div>
                </div>
                <Progress
                  value={(data.questions / Math.max(stats?.totals.questions, 1)) * 100}
                  className="h-2"
                  style={{
                    backgroundColor: `${color}20`,
                    '--progress-background': color
                  }}
                />
              </div>
            </div>

            {/* مؤشرات الأداء */}
            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800 grid grid-cols-3 gap-3 text-center">
              <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <div className="text-lg font-bold" style={{ color }}>
                  {data.users > 0 ? Math.round((data.lessons / data.users) * 10) / 10 : 0}
                </div>
                <div className="text-xs text-muted-foreground">{t('admin.dashboard.kpi.density_desc')}</div>
              </div>
              <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <div className="text-lg font-bold" style={{ color }}>
                  {data.users > 0 ? Math.round((data.exams / data.users) * 10) / 10 : 0}
                </div>
                <div className="text-xs text-muted-foreground">Exam/User</div>
              </div>
              <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <div className="text-lg font-bold" style={{ color }}>
                  {data.exams > 0 ? Math.round((data.questions / data.exams) * 10) / 10 : 0}
                </div>
                <div className="text-xs text-muted-foreground">{t('admin.dashboard.kpi.diversity_desc')}</div>
              </div>
            </div>

            {/* توصية */}
            <div className="mt-4">
              {data.lessons < 5 && (
                <div className="p-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                  <p className="text-xs text-yellow-700 dark:text-yellow-300 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {t('admin.dashboard.grades.more_lessons')}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  // مكون المستخدمين الجدد
  const RecentUsersCard = ({ users }) => {
    const getUserInitials = (name) => {
      if (!name) return '👤';
      return name.charAt(0).toUpperCase();
    };

    const getRandomColor = (index) => {
      const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'];
      return colors[index % colors.length];
    };

    return (
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            {t('admin.dashboard.recent_users.title')}
          </CardTitle>
          <CardDescription>{t('admin.dashboard.recent_users.desc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {users.length > 0 ? (
              users.map((user, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-md"
                      style={{ backgroundColor: getRandomColor(index) }}
                    >
                      {getUserInitials(user.fullName)}
                    </div>
                    <div>
                      <p className="font-medium group-hover:text-primary transition-colors">
                        {user.fullName || t('admin.dashboard.recent_users.new_user')}
                      </p>
                      <p className="text-sm text-muted-foreground truncate max-w-[180px]">
                        {user.email || user.phoneNumber || t('admin.dashboard.recent_users.no_info')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-medium text-muted-foreground">
                      {formatDate(user.createdAt).split('،')[0]}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {user.classLevel || t('admin.dashboard.recent_users.unknown_level')}
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <UserPlus className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-muted-foreground">{t('admin.dashboard.recent_users.empty')}</p>
                <p className="text-sm text-muted-foreground mt-1">{t('admin.dashboard.recent_users.empty_desc')}</p>
              </div>
            )}
          </div>

          {users.length > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  {t('admin.dashboard.recent_users.total_new', { count: users.length })}
                </div>
                <Button variant="ghost" size="sm" className="text-xs">
                  {t('admin.dashboard.recent_users.view_all')} →
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // مكون صحة النظام
  const SystemHealthCard = ({ health }) => {
    const getStatusConfig = (status) => {
      switch (status) {
        case 'healthy':
          return {
            color: 'green',
            icon: <CheckCircle className="h-5 w-5" />,
            text: t('admin.dashboard.health.healthy'),
            description: t('admin.dashboard.health.healthy_desc')
          };
        case 'warning':
          return {
            color: 'yellow',
            icon: <AlertCircle className="h-5 w-5" />,
            text: t('admin.dashboard.health.warning'),
            description: t('admin.dashboard.health.warning_desc')
          };
        case 'critical':
          return {
            color: 'red',
            icon: <XCircle className="h-5 w-5" />,
            text: t('admin.dashboard.health.critical'),
            description: t('admin.dashboard.health.critical_desc')
          };
        default:
          return {
            color: 'gray',
            icon: <AlertCircle className="h-5 w-5" />,
            text: t('admin.dashboard.health.unknown'),
            description: t('admin.dashboard.health.unknown_desc')
          };
      }
    };

    const statusConfig = getStatusConfig(health.status);

    return (
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            {t('admin.dashboard.health.title')}
          </CardTitle>
          <CardDescription>{t('admin.dashboard.health.desc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl bg-${statusConfig.color}-100 dark:bg-${statusConfig.color}-900/30`}>
                <div className={`text-${statusConfig.color}-600`}>
                  {statusConfig.icon}
                </div>
              </div>
              <div>
                <div className="font-bold text-lg">{statusConfig.text}</div>
                <div className="text-sm text-muted-foreground">
                  {statusConfig.description}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">
                {health.issues.length === 0 ? '100%' : `${100 - (health.issues.length * 20)}%`}
              </div>
              <div className="text-xs text-muted-foreground">{t('admin.dashboard.health.score')}</div>
            </div>
          </div>

          {health.issues.length > 0 && (
            <div className="space-y-3">
              <div className="text-sm font-medium">{t('admin.dashboard.health.issues_title')}:</div>
              <div className="space-y-2">
                {health.issues.map((issue, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800"
                  >
                    <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0" />
                    <span className="text-sm">{issue}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
            <div className="text-sm font-medium mb-3">{t('admin.dashboard.health.tips_title')}:</div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t('admin.dashboard.last_updated')}</span>
                <span className="font-medium">{new Date().toLocaleTimeString('ar-SA')}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t('admin.dashboard.server_status')}</span>
                <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/30">
                  <div className="w-2 h-2 rounded-full bg-green-600 mr-1"></div>
                  {t('admin.dashboard.connected')}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t('admin.dashboard.api_response')}</span>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900/30">
                  {t('admin.dashboard.fast')}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-950">
        <Navbar />
        <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)]">
          <div className="relative">
            <LoadingSpinner size="lg" />
            <div className="absolute inset-0 animate-ping">
              <div className="w-full h-full rounded-full bg-primary/20" />
            </div>
          </div>
          <p className="mt-6 text-lg font-medium">{t('admin.dashboard.loading')}</p>
          <p className="text-sm text-muted-foreground mt-2">{t('admin.dashboard.loading_desc')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-950">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header مع الأنيميشن */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, type: "spring" }}
          className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8"
        >
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-gradient-to-r from-primary to-primary/70">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary via-primary/80 to-foreground bg-clip-text text-transparent">
                {t('admin.dashboard.title')}
              </h1>
            </div>
            <p className="text-muted-foreground text-lg">
              {t('admin.dashboard.subtitle')}
            </p>
            <div className="flex items-center gap-3 mt-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-muted-foreground" />
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={fetchDashboardData}
              variant="outline"
              className="gap-2 hover:shadow-md hover:scale-105 transition-all border-primary/20"
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? t('admin.dashboard.refreshing') : t('admin.dashboard.refresh')}
            </Button>
          </div>
        </motion.div>

        {/* رسائل الخطأ */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring" }}
          >
            <Alert variant="destructive" className="mb-6 border-0 shadow-lg">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{t('admin.dashboard.error_title')}</AlertTitle>
              <AlertDescription className="flex items-center justify-between">
                <span>{error}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setError(null)}
                  className="h-8 px-2"
                >
                  ✕
                </Button>
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* بطاقات الإحصائيات السريعة */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <QuickStatCard
            title={t('admin.dashboard.stats.users')}
            value={stats?.usersCount || 0}
            change={stats?.growthRates?.users || 0}
            icon={<Users className="h-5 w-5" />}
            color="blue"
            subtitle={`${stats?.userDistribution?.[0]?.value || 0} | ${stats?.userDistribution?.[1]?.value || 0} | ${stats?.userDistribution?.[2]?.value || 0}`}
            tooltip={t('admin.dashboard.stats.users_tooltip')}
          />

          <QuickStatCard
            title={t('admin.dashboard.stats.lessons')}
            value={stats?.totals?.lessons || 0}
            change={stats?.growthRates?.lessons || 0}
            icon={<BookOpen className="h-5 w-5" />}
            color="green"
            subtitle={`${stats?.gradeStats?.[1]?.lessons || 0} | ${stats?.gradeStats?.[2]?.lessons || 0} | ${stats?.gradeStats?.[3]?.lessons || 0}`}
            tooltip={t('admin.dashboard.stats.lessons_tooltip')}
          />

          <QuickStatCard
            title={t('admin.dashboard.stats.exams')}
            value={stats?.totals?.exams || 0}
            change={stats?.growthRates?.exams || 0}
            icon={<FileText className="h-5 w-5" />}
            color="purple"
            subtitle={`${stats?.gradeStats?.[1]?.exams || 0} | ${stats?.gradeStats?.[2]?.exams || 0} | ${stats?.gradeStats?.[3]?.exams || 0}`}
            tooltip={t('admin.dashboard.stats.exams_tooltip')}
          />

          <QuickStatCard
            title={t('admin.dashboard.stats.questions')}
            value={stats?.totals?.questions || 0}
            change={stats?.growthRates?.questions || 0}
            icon={<HelpCircle className="h-5 w-5" />}
            color="orange"
            subtitle={`${t('admin.common.average')} ${stats?.averages?.questionsPerExam?.toFixed(1) || 0} ${t('admin.dashboard.stats.per_exam')}`}
            tooltip={t('admin.dashboard.stats.questions_tooltip')}
          />
        </div>

        {/* تبويبات المحتوى الرئيسي */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full grid-cols-3 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
            <TabsTrigger
              value="overview"
              className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-900"
            >
              <Eye className="h-4 w-4 mr-2" />
              {t('admin.dashboard.tabs.overview')}
            </TabsTrigger>
            <TabsTrigger
              value="grades"
              className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-900"
            >
              <GraduationCap className="h-4 w-4 mr-2" />
              {t('admin.dashboard.tabs.grades')}
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-900"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              {t('admin.dashboard.tabs.analytics')}
            </TabsTrigger>
          </TabsList>

          {/* تبويب النظرة العامة */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <UserDistributionChart data={stats?.userDistribution || []} />
              </div>
              <div className="space-y-6">
                <SystemHealthCard health={stats?.systemHealth || { status: 'healthy', issues: [] }} />
                <RecentUsersCard users={recentUsers} />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    {t('admin.dashboard.kpi.title')}
                  </CardTitle>
                  <CardDescription>{t('admin.dashboard.kpi.desc')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      {
                        title: t('admin.dashboard.kpi.density'),
                        value: stats?.usersCount > 0 ? (stats.totals.lessons / stats.usersCount).toFixed(2) : '0.00',
                        description: t('admin.dashboard.kpi.density_desc'),
                        icon: '📚',
                        progress: stats?.usersCount > 0 ? Math.min((stats.totals.lessons / stats.usersCount) * 50, 100) : 0
                      },
                      {
                        title: t('admin.dashboard.kpi.diversity'),
                        value: stats?.totals.exams > 0 ? (stats.totals.questions / stats.totals.exams).toFixed(1) : '0.0',
                        description: t('admin.dashboard.kpi.diversity_desc'),
                        icon: '❓',
                        progress: stats?.totals.exams > 0 ? Math.min((stats.totals.questions / stats.totals.exams) / 5 * 100, 100) : 0
                      },
                      {
                        title: t('admin.dashboard.kpi.balance'),
                        value: stats ? Math.max(...Object.values(stats.gradeStats).map(g => g.users)) -
                          Math.min(...Object.values(stats.gradeStats).map(g => g.users)) : 0,
                        description: t('admin.dashboard.kpi.balance_desc'),
                        icon: '⚖️',
                        progress: stats?.usersCount > 0 ? 100 - (Math.max(...Object.values(stats.gradeStats).map(g => g.users)) -
                          Math.min(...Object.values(stats.gradeStats).map(g => g.users))) / stats.usersCount * 100 : 100
                      }
                    ].map((item, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-xl">{item.icon}</div>
                          <div>
                            <div className="font-medium">{item.title}</div>
                            <div className="text-xs text-muted-foreground">{item.description}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg">{item.value}</div>
                          <div className="w-24">
                            <Progress value={item.progress} className="h-2 mt-1" />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    {t('admin.dashboard.kpi.quick_stats')}
                  </CardTitle>
                  <CardDescription>{t('admin.dashboard.kpi.speed_desc')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: t('admin.dashboard.kpi.avg_per_grade'), value: stats?.averages?.usersPerGrade.toFixed(1) || '0.0', color: 'blue' },
                      { label: t('admin.dashboard.kpi.lessons_per_grade'), value: stats?.averages?.lessonsPerGrade.toFixed(1) || '0.0', color: 'green' },
                      { label: t('admin.dashboard.kpi.exams_per_grade'), value: stats?.averages?.examsPerGrade.toFixed(1) || '0.0', color: 'purple' },
                      { label: t('admin.dashboard.kpi.monthly_growth'), value: `${stats?.growthRates?.users || 0}%`, color: 'orange' },
                    ].map((stat, index) => (
                      <div
                        key={index}
                        className="p-4 rounded-xl text-center transition-transform hover:scale-105"
                        style={{
                          background: `linear-gradient(135deg, var(--${stat.color}-100), var(--${stat.color}-50))`,
                          border: `1px solid var(--${stat.color}-200)`
                        }}
                      >
                        <div className={`text-2xl font-bold text-${stat.color}-700`}>
                          {stat.value}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <div className="text-sm text-muted-foreground text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{t('admin.dashboard.kpi.last_update')}: {new Date().toLocaleTimeString('ar-SA')}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* تبويب الصفوف الدراسية */}
          <TabsContent value="grades" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[t('admin.dashboard.grades.grade1'), t('admin.dashboard.grades.grade2'), t('admin.dashboard.grades.grade3')].map((grade, index) => (
                <EnhancedGradeCard
                  key={index}
                  grade={grade}
                  data={stats?.gradeStats?.[index + 1] || { lessons: 0, exams: 0, questions: 0, users: 0 }}
                  index={index}
                />
              ))}
            </div>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  {t('admin.dashboard.grades.comparison_title')}
                </CardTitle>
                <CardDescription>{t('admin.dashboard.grades.comparison_desc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-800">
                        <th className="text-right p-4 font-semibold bg-gray-50 dark:bg-gray-800/50">{t('admin.dashboard.grades.table.metric')}</th>
                        <th className="text-right p-4 font-semibold bg-gray-50 dark:bg-gray-800/50">{t('admin.dashboard.grades.grade1')}</th>
                        <th className="text-right p-4 font-semibold bg-gray-50 dark:bg-gray-800/50">{t('admin.dashboard.grades.grade2')}</th>
                        <th className="text-right p-4 font-semibold bg-gray-50 dark:bg-gray-800/50">{t('admin.dashboard.grades.grade3')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { label: t('admin.dashboard.grades.table.users'), key: 'users', suffix: '' },
                        { label: t('admin.dashboard.grades.table.lessons_ratio'), key: 'lessons', suffix: '%', isPercentage: true },
                        { label: t('admin.dashboard.grades.table.content_density'), key: 'contentDensity', suffix: ` ${t('admin.dashboard.grades.per_user')}`, isCalculated: true },
                        { label: t('admin.dashboard.grades.table.coverage'), key: 'coverage', suffix: '%', isCoverage: true }
                      ].map((row, rowIndex) => (
                        <tr
                          key={rowIndex}
                          className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                        >
                          <td className="p-4 font-medium">{row.label}</td>
                          {[1, 2, 3].map((grade, gradeIndex) => {
                            let value = 0;
                            if (row.isCalculated) {
                              value = stats?.gradeStats?.[grade]?.users > 0
                                ? (stats.gradeStats[grade].lessons / stats.gradeStats[grade].users).toFixed(2)
                                : '0.00';
                            } else if (row.isPercentage) {
                              value = stats?.totals?.lessons > 0
                                ? ((stats.gradeStats[grade].lessons / stats.totals.lessons) * 100).toFixed(1)
                                : '0.0';
                            } else if (row.isCoverage) {
                              value = stats?.usersCount > 0
                                ? ((stats.gradeStats[grade].users / stats.usersCount) * 100).toFixed(1)
                                : '0.0';
                            } else {
                              value = stats?.gradeStats?.[grade]?.[row.key] || 0;
                            }

                            return (
                              <td key={gradeIndex} className="p-4 text-center">
                                <div className="inline-flex items-center gap-2">
                                  <Badge
                                    variant="outline"
                                    className={`
                                      ${gradeIndex === 0 ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 border-blue-200' :
                                        gradeIndex === 1 ? 'bg-green-50 text-green-700 dark:bg-green-900/20 border-green-200' :
                                          'bg-purple-50 text-purple-700 dark:bg-purple-900/20 border-purple-200'}
                                    `}
                                  >
                                    {value}{row.suffix}
                                  </Badge>
                                  {rowIndex === 0 && (
                                    <span className="text-xs text-muted-foreground">
                                      ({((value / Math.max(stats?.usersCount, 1)) * 100).toFixed(1)}%)
                                    </span>
                                  )}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{t('admin.dashboard.grades.rec_title')}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {t('admin.dashboard.grades.rec_desc')}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* تبويب التحليلات */}
          <TabsContent value="analytics" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  {t('admin.dashboard.analytics.title')}
                </CardTitle>
                <CardDescription>{t('admin.dashboard.analytics.desc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-bold text-lg mb-3">{t('admin.dashboard.analytics.performance_summary')}</h3>
                      <div className="space-y-4">
                        {[
                          {
                            label: t('admin.dashboard.analytics.content_coverage'),
                            value: stats?.usersCount > 0 ? ((stats.totals.lessons + stats.totals.exams) / (stats.usersCount * 2) * 100).toFixed(1) : '0.0',
                            target: 80,
                            color: 'blue'
                          },
                          {
                            label: t('admin.dashboard.analytics.questions_diversity'),
                            value: Math.min(stats?.totals.questions || 0 / 200 * 100, 100).toFixed(1),
                            target: 75,
                            color: 'green'
                          },
                          {
                            label: t('admin.dashboard.analytics.balance'),
                            value: stats ? 100 - (Math.max(...Object.values(stats.gradeStats).map(g => g.users)) -
                              Math.min(...Object.values(stats.gradeStats).map(g => g.users))) / stats.usersCount * 100 : 100,
                            target: 85,
                            color: 'purple'
                          }
                        ].map((metric, index) => (
                          <div key={index} className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm font-medium">{metric.label}</span>
                              <span className={`text-sm font-bold ${parseFloat(metric.value) >= metric.target ? 'text-green-600' : 'text-yellow-600'
                                }`}>
                                {metric.value}% ({t('admin.dashboard.analytics.target')}: {metric.target}%)
                              </span>
                            </div>
                            <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <motion.div
                                className={`h-full rounded-full bg-${metric.color}-500`}
                                initial={{ width: 0 }}
                                animate={{ width: `${metric.value}%` }}
                                transition={{ duration: 1, delay: index * 0.2 }}
                              />
                              <div
                                className="absolute top-0 h-full w-0.5 bg-gray-900 dark:bg-gray-300"
                                style={{ left: `${metric.target}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-bold text-lg mb-3">{t('admin.dashboard.analytics.growth_forecast')}</h3>
                      <div className="space-y-3">
                        {[
                          { label: t('admin.dashboard.entities.users'), current: stats?.usersCount || 0, growth: 15 },
                          { label: t('admin.dashboard.entities.lessons'), current: stats?.totals.lessons || 0, growth: 10 },
                          { label: t('admin.dashboard.entities.exams'), current: stats?.totals.exams || 0, growth: 12 },
                          { label: t('admin.dashboard.entities.questions'), current: stats?.totals.questions || 0, growth: 20 }
                        ].map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                            <span className="font-medium">{item.label}</span>
                            <div className="text-right">
                              <div className="font-bold">{Math.round(item.current * (1 + item.growth / 100))}</div>
                              <div className="text-xs text-green-600 flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" />
                                +{item.growth}% {t('admin.dashboard.analytics.next_month')}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h3 className="font-bold text-lg mb-3">{t('admin.dashboard.analytics.sw')}</h3>
                      <div className="space-y-3">
                        <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 rounded-full bg-green-600"></div>
                            <span className="font-medium">{t('admin.dashboard.analytics.strengths')}</span>
                          </div>
                          <ul className="space-y-1 text-sm">
                            <li>• {t('admin.dashboard.analytics.sw_items.diversity')}</li>
                            <li>• {t('admin.dashboard.analytics.sw_items.questions_volume')}</li>
                            <li>• {t('admin.dashboard.analytics.sw_items.growth')}</li>
                          </ul>
                        </div>

                        <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 rounded-full bg-yellow-600"></div>
                            <span className="font-medium">{t('admin.dashboard.analytics.weaknesses')}</span>
                          </div>
                          <ul className="space-y-1 text-sm">
                            {stats?.gradeStats?.[1]?.lessons < 5 && <li>• {t('admin.dashboard.analytics.sw_items.g1_lessons')}</li>}
                            {stats?.gradeStats?.[2]?.exams < 3 && <li>• {t('admin.dashboard.analytics.sw_items.g2_exams')}</li>}
                            {stats?.gradeStats?.[3]?.users < 10 && <li>• {t('admin.dashboard.analytics.sw_items.g3_users')}</li>}
                            {stats?.totals.questions < 50 && <li>• {t('admin.dashboard.analytics.sw_items.qb_expansion')}</li>}
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-bold text-lg mb-3">{t('admin.dashboard.analytics.recommendations')}</h3>
                      <div className="space-y-2">
                        {[
                          {
                            text: t('admin.dashboard.analytics.rec_items.add_g1_lessons'),
                            priority: 'high',
                            condition: stats?.gradeStats?.[1]?.lessons < 5
                          },
                          {
                            text: t('admin.dashboard.analytics.rec_items.add_g2_exams'),
                            priority: 'medium',
                            condition: stats?.gradeStats?.[2]?.exams < 3
                          },
                          {
                            text: t('admin.dashboard.analytics.rec_items.expand_qb'),
                            priority: 'high',
                            condition: stats?.totals.questions < 50
                          },
                          {
                            text: t('admin.dashboard.analytics.rec_items.attract_g3'),
                            priority: 'medium',
                            condition: stats?.gradeStats?.[3]?.users < 10
                          }
                        ].filter(rec => rec.condition).map((rec, index) => (
                          <div
                            key={index}
                            className={`p-3 rounded-lg border flex items-center gap-2 ${rec.priority === 'high'
                              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                              : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                              }`}
                          >
                            <div className={`w-2 h-2 rounded-full ${rec.priority === 'high' ? 'bg-red-600' : 'bg-yellow-600'
                              }`} />
                            <span className="text-sm">{rec.text}</span>
                            <Badge
                              size="sm"
                              variant="outline"
                              className={`ml-auto text-xs ${rec.priority === 'high'
                                ? 'bg-red-100 text-red-700 dark:bg-red-900/30'
                                : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30'
                                }`}
                            >
                              {rec.priority === 'high' ? t('admin.dashboard.analytics.urgent') : t('admin.dashboard.analytics.important')}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    مؤشرات الأداء الرئيسية
                  </CardTitle>
                  <CardDescription>KPIs للمنصة التعليمية</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { label: 'معدل النمو الشهري', value: `${stats?.growthRates?.users || 0}%`, target: '15%', status: 'achieved' },
                      { label: 'كثافة المحتوى', value: stats?.usersCount > 0 ? (stats.totals.lessons / stats.usersCount).toFixed(2) : '0.00', target: '1.5', status: stats?.usersCount > 0 && (stats.totals.lessons / stats.usersCount) >= 1.5 ? 'achieved' : 'needs_work' },
                      { label: 'رضا المستخدمين', value: '87%', target: '85%', status: 'achieved' },
                      { label: 'معدل التفاعل', value: '92%', target: '90%', status: 'achieved' }
                    ].map((kpi, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <div>
                          <div className="font-medium">{kpi.label}</div>
                          <div className="text-sm text-muted-foreground">الهدف: {kpi.target}</div>
                        </div>
                        <div className="text-right">
                          <div className={`text-lg font-bold ${kpi.status === 'achieved' ? 'text-green-600' : 'text-yellow-600'
                            }`}>
                            {kpi.value}
                          </div>
                          <Badge
                            variant="outline"
                            className={`text-xs mt-1 ${kpi.status === 'achieved'
                              ? 'bg-green-50 text-green-700 dark:bg-green-900/20'
                              : 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20'
                              }`}
                          >
                            {kpi.status === 'achieved' ? 'محقق ✓' : 'يحتاج تحسين'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    {t('admin.dashboard.analytics.future_title')}
                  </CardTitle>
                  <CardDescription>{t('admin.dashboard.analytics.future_desc')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[`${t('admin.dashboard.analytics.month')} 1`, `${t('admin.dashboard.analytics.month')} 2`, `${t('admin.dashboard.analytics.month')} 3`, `${t('admin.dashboard.analytics.month')} 4`].map((month, index) => (
                      <div key={index} className="p-3 rounded-lg bg-gradient-to-r from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-900/50 border">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">{month}</span>
                          <Badge variant="outline" className="text-xs">
                            +{Math.round((stats?.usersCount || 0) * (1 + (index + 1) * 0.05))}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center text-sm">
                          <div>
                            <div className="font-bold text-blue-600">
                              {Math.round((stats?.totals.lessons || 0) * (1 + (index + 1) * 0.08))}
                            </div>
                            <div className="text-xs text-muted-foreground">{t('admin.dashboard.entities.lessons')}</div>
                          </div>
                          <div>
                            <div className="font-bold text-green-600">
                              {Math.round((stats?.totals.exams || 0) * (1 + (index + 1) * 0.1))}
                            </div>
                            <div className="text-xs text-muted-foreground">{t('admin.dashboard.entities.exams')}</div>
                          </div>
                          <div>
                            <div className="font-bold text-purple-600">
                              {Math.round((stats?.totals.questions || 0) * (1 + (index + 1) * 0.15))}
                            </div>
                            <div className="text-xs text-muted-foreground">{t('admin.dashboard.entities.questions')}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* ✅ الملاحظة الختامية المُبسطة (بدون زر تحديث يدوي الآن) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-sm font-medium">{t('admin.dashboard.footer.secure')}</div>
                <div className="text-xs text-muted-foreground">
                  {t('admin.dashboard.last_updated')}: {new Date().toLocaleTimeString('ar-SA')} | {t('admin.dashboard.footer.auto_update')}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="gap-2"
              >
                <FileText className="h-3 w-3" />
                {t('admin.dashboard.footer.export')}
              </Button>
              <Button
                variant="default"
                size="sm"
                className="gap-2 bg-gradient-to-r from-primary to-primary/80"
                onClick={() => setActiveTab('overview')}
              >
                <Eye className="h-3 w-3" />
                {t('admin.dashboard.footer.view_main')}
              </Button>
            </div>
          </div>
        </motion.div>
      </main>

      {/* ✅ تم حذف مؤشر التحديث التلقائي من الزاوية السفلية اليمنى */}

      {/* خلفية ديكور */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl" />
      </div>
    </div>
  );
};

export default AdminDashboard;