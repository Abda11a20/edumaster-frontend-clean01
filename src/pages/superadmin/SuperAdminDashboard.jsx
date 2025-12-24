import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  Users,
  UserCog,
  UserPlus,
  GraduationCap,
  User,
  Mail,
  Phone,
  Calendar,
  Clock,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Eye,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Key,
  Lock,
  ShieldAlert,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { adminAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import Navbar from '../../components/Navbar';
import { useTranslation } from '../../hooks/useTranslation';

const SuperAdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Data states
  const [admins, setAdmins] = useState([]);
  const [users, setUsers] = useState([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // New admin form
  const [newAdmin, setNewAdmin] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    cpassword: ''
  });
  const [isCreating, setIsCreating] = useState(false);

  const { toast } = useToast();
  const { t, lang } = useTranslation();

  // دالة تنسيق التاريخ
  const formatDate = useCallback((dateString) => {
    if (!dateString) return t('غير محدد');
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return t('الآن');
      if (diffMins < 60) return t('منذ {count} دقيقة', { count: diffMins });
      if (diffHours < 24) return t('منذ {count} ساعة', { count: diffHours });
      if (diffDays === 1) return t('أمس');
      if (diffDays < 7) return t('منذ {count} أيام', { count: diffDays });

      return date.toLocaleDateString(lang === 'en' ? 'en-US' : 'ar-SA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return t('غير محدد');
    }
  }, [t, lang]);

  // جلب جميع البيانات
  const fetchAllData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setError(null);

      const [adminsRes, usersRes] = await Promise.allSettled([
        adminAPI.getAllAdmins(),
        adminAPI.getAllUsers()
      ]);

      // معالجة استجابة المشرفين
      const adminsData = adminsRes.status === 'fulfilled' ? adminsRes.value : [];
      const usersData = usersRes.status === 'fulfilled' ? usersRes.value : [];

      // التأكد من أن البيانات مصفوفات
      setAdmins(Array.isArray(adminsData) ? adminsData : []);
      setUsers(Array.isArray(usersData) ? usersData : []);

    } catch (err) {
      console.error('Error fetching data:', err);
      setError(t('حدث خطأ أثناء تحميل البيانات. يرجى المحاولة مرة أخرى.'));
      toast({
        title: t('خطأ'),
        description: t('فشل في تحميل البيانات'),
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [toast, t]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // إنشاء مشرف جديد
  const handleCreateAdmin = async () => {
    try {
      setIsCreating(true);

      // التحقق من البيانات
      if (!newAdmin.fullName.trim()) {
        toast({
          title: t('خطأ'),
          description: t('الاسم الكامل مطلوب'),
          variant: 'destructive'
        });
        setIsCreating(false);
        return;
      }

      if (!newAdmin.email.trim()) {
        toast({
          title: t('خطأ'),
          description: t('البريد الإلكتروني مطلوب'),
          variant: 'destructive'
        });
        setIsCreating(false);
        return;
      }

      if (newAdmin.password !== newAdmin.cpassword) {
        toast({
          title: t('خطأ'),
          description: t('كلمات المرور غير متطابقة'),
          variant: 'destructive'
        });
        setIsCreating(false);
        return;
      }

      if (newAdmin.password.length < 6) {
        toast({
          title: t('خطأ'),
          description: t('كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
          variant: 'destructive'
        });
        setIsCreating(false);
        return;
      }

      const response = await adminAPI.createAdmin({
        fullName: newAdmin.fullName,
        email: newAdmin.email,
        phoneNumber: newAdmin.phoneNumber || '',
        password: newAdmin.password,
        cpassword: newAdmin.cpassword
      });

      console.log('Create Admin Response:', response);

      if (response && response.success) {
        toast({
          title: t('نجاح'),
          description: response.message ? t(response.message) : t('تم إنشاء المشرف بنجاح'),
        });

        // إعادة تعيين النموذج
        setNewAdmin({
          fullName: '',
          email: '',
          phoneNumber: '',
          password: '',
          cpassword: ''
        });

        setShowCreateDialog(false);
        fetchAllData(); // تحديث البيانات فقط بعد النجاح
      } else {
        toast({
          title: t('خطأ'),
          description: response?.message ? t(response.message) : t('فشل في إنشاء المشرف'),
          variant: 'destructive'
        });
      }
    } catch (err) {
      console.error('Error creating admin:', err);
      toast({
        title: t('خطأ'),
        description: err.message ? t(err.message) : t('حدث خطأ غير متوقع أثناء إنشاء المشرف'),
        variant: 'destructive'
      });
    } finally {
      setIsCreating(false);
    }
  };

  // الحسابات الأخيرة (آخر 5 حسابات مضافة)
  // الحسابات الأخيرة (آخر 8 حسابات مضافة)
  const recentAccounts = [
    ...admins.map(admin => ({
      ...admin,
      type: 'admin',
      role: t('مشرف'),
      sortDate: admin.createdAt ? new Date(admin.createdAt) : new Date(0)
    })),
    ...users.map(user => ({
      ...user,
      type: 'user',
      role: user.role === 'STUDENT' ? t('طالب') :
        user.role === 'TEACHER' ? t('معلم') : t('مستخدم'),
      sortDate: user.createdAt ? new Date(user.createdAt) : new Date(0)
    }))
  ]
    // ترتيب تنازلي من الأحدث إلى الأقدم
    .sort((a, b) => b.sortDate - a.sortDate)
    .slice(0, 8); // آخر 8 حسابات
  // Pagination للبيانات
  const filteredAdmins = admins.filter(admin =>
    admin.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    admin.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = selectedRole === 'all' || user.role === selectedRole;

    return matchesSearch && matchesRole;
  });

  // حساب Pagination
  const totalPagesAdmins = Math.ceil(filteredAdmins.length / itemsPerPage);
  const totalPagesUsers = Math.ceil(filteredUsers.length / itemsPerPage);

  const paginatedAdmins = filteredAdmins.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // مكون بطاقة الإحصائية المحسنة
  const EnhancedStatCard = ({ title, value, icon, color, subtitle, trend }) => {
    const colorClasses = {
      blue: 'bg-gradient-to-br from-blue-500 to-blue-600',
      green: 'bg-gradient-to-br from-green-500 to-emerald-600',
      purple: 'bg-gradient-to-br from-purple-500 to-violet-600',
      red: 'bg-gradient-to-br from-red-500 to-rose-600',
      orange: 'bg-gradient-to-br from-orange-500 to-amber-600'
    };

    const bgClasses = {
      blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800',
      green: 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800',
      purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-800',
      red: 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800',
      orange: 'bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-800'
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.03 }}
        transition={{ duration: 0.3 }}
      >
        <Card className={`overflow-hidden border-2 ${bgClasses[color]} transition-all duration-300 hover:shadow-xl`}>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {value}
                </h3>
                {subtitle && (
                  <p className="text-sm text-muted-foreground mt-2">{subtitle}</p>
                )}
                {trend && (
                  <div className={`flex items-center gap-2 mt-3 ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {trend > 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    <span className="text-sm font-medium">{Math.abs(trend)}%</span>
                  </div>
                )}
              </div>
              <div className={`p-4 rounded-2xl ${colorClasses[color]} text-white shadow-lg`}>
                {icon}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  // مكون بطاقة الحسابات الأخيرة
  const RecentAccountsCard = () => (
    <Card className="border-2 border-gray-100 dark:border-gray-800 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-r from-primary to-primary/80">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-lg font-bold">{t('آخر الحسابات المضافة')}</div>
            <CardDescription className="mt-1">{t('آخر 8 حسابات تم إنشاؤها في المنصة')}</CardDescription>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {recentAccounts.length > 0 ? (
            recentAccounts.map((account, index) => (
              <motion.div
                key={account._id || index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                    <AvatarFallback className={account.type === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}>
                      {account.fullName?.charAt(0) || account.name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {account.fullName || account.name || t('غير معروف')}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant="outline"
                        className={`text-xs ${account.type === 'admin'
                          ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30'
                          : 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30'
                          }`}
                      >
                        {account.role}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(account.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {account.type === 'admin' ? (
                    <div className="flex items-center gap-1 text-sm text-blue-600">
                      <Shield className="h-3 w-3" />
                      <span>{t('أدمن')}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-sm text-green-600">
                      <User className="h-3 w-3" />
                      <span>{t('مستخدم')}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          ) : (
            <div className="p-8 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400">{t('لا توجد حسابات حديثة')}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  // مكون جدول المشرفين
  const AdminsTable = () => (
    <Card className="border-2 border-gray-100 dark:border-gray-800 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="flex items-center gap-3">
              <UserCog className="h-6 w-6 text-blue-600" />
              <span className="text-xl font-bold">{t('إدارة المشرفين')}</span>
            </CardTitle>
            <CardDescription className="mt-2">{t('عرض وإدارة جميع مشرفي النظام')}</CardDescription>
          </div>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-lg"
          >
            <UserPlus className="h-4 w-4 ml-2" />
            {t('إضافة مشرف جديد')}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={t('ابحث عن مشرف بالاسم أو البريد...')}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pr-10 bg-white dark:bg-gray-900 border-2"
            />
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50 dark:bg-gray-800">
              <TableRow>
                <TableHead className="font-bold text-gray-700 dark:text-gray-300">{t('المشرف')}</TableHead>
                <TableHead className="font-bold text-gray-700 dark:text-gray-300">{t('البريد الإلكتروني')}</TableHead>
                <TableHead className="font-bold text-gray-700 dark:text-gray-300">{t('رقم الهاتف')}</TableHead>
                <TableHead className="font-bold text-gray-700 dark:text-gray-300">{t('الحالة')}</TableHead>
                <TableHead className="font-bold text-gray-700 dark:text-gray-300">{t('تاريخ الإنشاء')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedAdmins.length > 0 ? (
                paginatedAdmins.map((admin) => (
                  <TableRow key={admin._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="border-2 border-white shadow-sm">
                          <AvatarFallback className="bg-blue-100 text-blue-700">
                            {admin.fullName?.charAt(0) || 'م'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {admin.fullName || t('مشرف')}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {admin.role === 'SUPER_ADMIN' ? t('سوبر أدمن') : t('أدمن')}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">{admin.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span>{admin.phoneNumber || t('غير متوفر')}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={admin.isVerified
                        ? 'bg-green-100 text-green-800 hover:bg-green-100 border-green-200'
                        : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200'
                      }>
                        {admin.isVerified ? t('مفعل ✓') : t('غير مفعل')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(admin.createdAt)}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="flex flex-col items-center justify-center">
                      <UserCog className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">{t('لا توجد مشرفين')}</p>
                      <p className="text-sm text-gray-400 mt-2">{t('اضغط على "إضافة مشرف جديد" لبدء الإضافة')}</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPagesAdmins > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-800">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {t('عرض')} {Math.min((currentPage - 1) * itemsPerPage + 1, filteredAdmins.length)} {t('إلى')}{' '}
              {Math.min(currentPage * itemsPerPage, filteredAdmins.length)} {t('من')}{' '}
              {filteredAdmins.length} {t('مشرف')}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="h-9 w-9 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {Array.from({ length: Math.min(5, totalPagesAdmins) }, (_, i) => {
                let pageNum;
                if (totalPagesAdmins <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPagesAdmins - 2) {
                  pageNum = totalPagesAdmins - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    className="h-9 w-9 p-0"
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPagesAdmins))}
                disabled={currentPage === totalPagesAdmins}
                className="h-9 w-9 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  // مكون جدول المستخدمين
  const UsersTable = () => (
    <Card className="border-2 border-gray-100 dark:border-gray-800 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-800/20">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="flex items-center gap-3">
              <Users className="h-6 w-6 text-green-600" />
              <span className="text-xl font-bold">{t('إدارة المستخدمين')}</span>
            </CardTitle>
            <CardDescription className="mt-2">{t('عرض جميع المستخدمين المسجلين في المنصة')}</CardDescription>
          </div>
          <Select value={selectedRole} onValueChange={(value) => {
            setSelectedRole(value);
            setCurrentPage(1);
          }}>
            <SelectTrigger className="w-[180px] bg-white dark:bg-gray-900 border-2">
              <SelectValue placeholder={t('جميع المستخدمين')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('جميع المستخدمين')}</SelectItem>
              <SelectItem value="USER">{t('مستخدم عادي')}</SelectItem>
              <SelectItem value="STUDENT">{t('طالب')}</SelectItem>
              <SelectItem value="TEACHER">{t('معلم')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={t('ابحث عن مستخدم بالاسم أو البريد...')}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pr-10 bg-white dark:bg-gray-900 border-2"
            />
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50 dark:bg-gray-800">
              <TableRow>
                <TableHead className="font-bold text-gray-700 dark:text-gray-300">{t('المستخدم')}</TableHead>
                <TableHead className="font-bold text-gray-700 dark:text-gray-300">{t('البريد الإلكتروني')}</TableHead>
                <TableHead className="font-bold text-gray-700 dark:text-gray-300">{t('رقم الهاتف')}</TableHead>
                <TableHead className="font-bold text-gray-700 dark:text-gray-300">{t('الدور')}</TableHead>
                <TableHead className="font-bold text-gray-700 dark:text-gray-300">{t('الحالة')}</TableHead>
                <TableHead className="font-bold text-gray-700 dark:text-gray-300">{t('تاريخ التسجيل')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedUsers.length > 0 ? (
                paginatedUsers.map((user) => (
                  <TableRow key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="border-2 border-white shadow-sm">
                          <AvatarFallback className="bg-green-100 text-green-700">
                            {user.fullName?.charAt(0) || 'م'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {user.fullName || t('مستخدم')}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {user.classLevel || t('غير محدد')}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">{user.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span>{user.phoneNumber || t('غير متوفر')}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-50 border-blue-200">
                        {user.role === 'STUDENT' ? t('طالب') :
                          user.role === 'TEACHER' ? t('معلم') : t('مستخدم')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={user.isVerified
                        ? 'bg-green-100 text-green-800 hover:bg-green-100 border-green-200'
                        : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200'
                      }>
                        {user.isVerified ? t('مفعل ✓') : t('غير مفعل')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(user.createdAt)}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex flex-col items-center justify-center">
                      <Users className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">{t('لا توجد مستخدمين')}</p>
                      <p className="text-sm text-gray-400 mt-2">{t('قم بتعديل معايير البحث للحصول على نتائج')}</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPagesUsers > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-800">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {t('عرض')} {Math.min((currentPage - 1) * itemsPerPage + 1, filteredUsers.length)} {t('إلى')}{' '}
              {Math.min(currentPage * itemsPerPage, filteredUsers.length)} {t('من')}{' '}
              {filteredUsers.length} {t('مستخدم')}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="h-9 w-9 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {Array.from({ length: Math.min(5, totalPagesUsers) }, (_, i) => {
                let pageNum;
                if (totalPagesUsers <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPagesUsers - 2) {
                  pageNum = totalPagesUsers - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    className="h-9 w-9 p-0"
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPagesUsers))}
                disabled={currentPage === totalPagesUsers}
                className="h-9 w-9 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

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
          <p className="mt-6 text-lg font-medium text-gray-700 dark:text-gray-300">{t('جاري تحميل لوحة السوبر أدمن...')}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{t('قد يستغرق هذا بضع ثوانٍ')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-950">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header مع تصميم جديد */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, type: "spring" }}
          className="mb-8"
        >
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-gray-800 to-gray-900 p-8 shadow-2xl">
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-white/10 rounded-full blur-3xl" />

            <div className="relative z-10">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                      <Shield className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h1 className="text-3xl lg:text-4xl font-bold text-white">
                        {t('لوحة تحكم السوبر أدمن')}
                      </h1>
                      <p className="text-white/90 mt-2 text-lg">
                        {t('التحكم الكامل في إدارة المشرفين والمستخدمين')}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 mt-6">
                    <div className="flex items-center gap-2 text-white/80">
                      <Calendar className="h-5 w-5" />
                      <span>{new Date().toLocaleDateString(lang === 'en' ? 'en-US' : 'ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-white/50" />
                    <div className="flex items-center gap-2 text-white/80">
                      <Clock className="h-5 w-5" />
                      <span>{new Date().toLocaleTimeString(lang === 'en' ? 'en-US' : 'ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-white/50" />
                    <Badge className="bg-white/20 text-white border-0 hover:bg-white/30">
                      <Shield className="h-3 w-3 ml-2" />
                      {t('المستوى: سوبر أدمن')}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    onClick={fetchAllData}
                    className="bg-white text-gray-800 hover:bg-white/90 shadow-lg gap-2"
                    disabled={isRefreshing}
                  >
                    <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    {isRefreshing ? t('جاري التحديث...') : t('تحديث البيانات')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* رسائل الخطأ */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring" }}
          >
            <Alert variant="destructive" className="mb-6 border-2 border-red-200 dark:border-red-800 shadow-lg">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5" />
                <div className="flex-1">
                  <AlertTitle>{t('تنبيه هام')}</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setError(null)}
                  className="h-8 w-8 p-0"
                >
                  ✕
                </Button>
              </div>
            </Alert>
          </motion.div>
        )}

        {/* بطاقات الإحصائيات السريعة */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <EnhancedStatCard
            title={t('إجمالي المشرفين')}
            value={admins.length}
            icon={<UserCog className="h-5 w-5" />}
            color="blue"
            subtitle={`${admins.filter(a => a.isVerified).length} ${t('مفعل')}`}
            trend={12}
          />

          <EnhancedStatCard
            title={t('إجمالي المستخدمين')}
            value={users.length}
            icon={<Users className="h-5 w-5" />}
            color="green"
            subtitle={`${users.filter(u => u.isVerified).length} ${t('مفعل')}`}
            trend={18}
          />

          <EnhancedStatCard
            title={t('آخر الحسابات')}
            value={recentAccounts.length}
            icon={<Activity className="h-5 w-5" />}
            color="purple"
            subtitle={t('آخر 8 حسابات مضافة')}
            trend={8}
          />

          <EnhancedStatCard
            title={t('الحسابات النشطة')}
            value={admins.filter(a => a.isVerified).length + users.filter(u => u.isVerified).length}
            icon={<CheckCircle className="h-5 w-5" />}
            color="orange"
            subtitle={t('إجمالي الحسابات المفعلة')}
            trend={5}
          />
        </div>

        {/* محتوى التبويبات */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl border h-auto">
            <TabsTrigger
              value="overview"
              className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-lg dark:data-[state=active]:bg-gray-900 transition-all"
            >
              <Eye className="h-4 w-4 ml-2" />
              {t('نظرة عامة')}
            </TabsTrigger>
            <TabsTrigger
              value="admins"
              className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-lg dark:data-[state=active]:bg-gray-900 transition-all"
            >
              <UserCog className="h-4 w-4 ml-2" />
              {t('المشرفين')}
            </TabsTrigger>
            <TabsTrigger
              value="users"
              className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-lg dark:data-[state=active]:bg-gray-900 transition-all"
            >
              <Users className="h-4 w-4 ml-2" />
              {t('المستخدمين')}
            </TabsTrigger>
          </TabsList>

          {/* تبويب النظرة العامة */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <RecentAccountsCard />
              </div>

              <div className="space-y-6">
                <Card className="border-2 border-gray-100 dark:border-gray-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-bold">{t('ملخص النظام')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <div className="font-medium">{t('حالة النظام')}</div>
                          <div className="text-sm text-muted-foreground">{t('جميع الخدمات تعمل')}</div>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">{t('سليم')}</Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                          <Shield className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">{t('الأمان')}</div>
                          <div className="text-sm text-muted-foreground">{t('جميع الأنظمة آمنة')}</div>
                        </div>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">{t('محمي')}</Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                          <Activity className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                          <div className="font-medium">{t('آخر تحديث')}</div>
                          <div className="text-sm text-muted-foreground">{new Date().toLocaleTimeString(lang === 'en' ? 'en-US' : 'ar-SA')}</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 border-gray-100 dark:border-gray-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-bold">{t('إجراءات سريعة')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => setActiveTab('admins')}
                    >
                      <UserCog className="h-4 w-4 ml-2" />
                      {t('عرض جميع المشرفين')}
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => setActiveTab('users')}
                    >
                      <Users className="h-4 w-4 ml-2" />
                      {t('عرض جميع المستخدمين')}
                    </Button>
                    <Button
                      className="w-full justify-start bg-gradient-to-r from-blue-600 to-blue-500"
                      onClick={() => setShowCreateDialog(true)}
                    >
                      <UserPlus className="h-4 w-4 ml-2" />
                      {t('إضافة مشرف جديد')}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* تبويب المشرفين */}
          <TabsContent value="admins">
            <AdminsTable />
          </TabsContent>

          {/* تبويب المستخدمين */}
          <TabsContent value="users">
            <UsersTable />
          </TabsContent>
        </Tabs>

        {/* حوار إنشاء مشرف جديد */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                {t('إضافة مشرف جديد')}
              </DialogTitle>
              <DialogDescription>
                {t('قم بملء البيانات التالية لإنشاء مشرف جديد في النظام')}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">{t('الاسم الكامل *')}</Label>
                <Input
                  id="fullName"
                  value={newAdmin.fullName}
                  onChange={(e) => setNewAdmin({ ...newAdmin, fullName: e.target.value })}
                  placeholder={t('أحمد محمد')}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t('البريد الإلكتروني *')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={newAdmin.email}
                  onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                  placeholder={t('ahmed@example.com')}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">{t('رقم الهاتف')}</Label>
                <Input
                  id="phoneNumber"
                  value={newAdmin.phoneNumber}
                  onChange={(e) => setNewAdmin({ ...newAdmin, phoneNumber: e.target.value })}
                  placeholder={t('01012345678')}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">{t('كلمة المرور *')}</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newAdmin.password}
                    onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                    placeholder="••••••••"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpassword">{t('تأكيد كلمة المرور *')}</Label>
                  <Input
                    id="cpassword"
                    type="password"
                    value={newAdmin.cpassword}
                    onChange={(e) => setNewAdmin({ ...newAdmin, cpassword: e.target.value })}
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                {t('إلغاء')}
              </Button>
              <Button
                type="button"
                className="bg-gradient-to-r from-blue-600 to-blue-500"
                onClick={handleCreateAdmin}
                disabled={isCreating}
              >
                {isCreating ? (
                  <>
                    <RefreshCw className="h-4 w-4 ml-2 animate-spin" />
                    {t('جاري الإنشاء...')}
                  </>
                ) : (
                  t('إنشاء المشرف')
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default SuperAdminDashboard;