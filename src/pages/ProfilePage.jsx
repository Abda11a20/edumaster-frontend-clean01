import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Calendar, 
  Phone, 
  GraduationCap, 
  Edit, 
  Save, 
  X, 
  LogOut, 
  Shield,
  Bell,
  Lock,
  CheckCircle,
  AlertCircle,
  Trash2,
  Key,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
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
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import Navbar from '../components/Navbar';
import ChangePasswordDialog from '../components/ChangePasswordDialog';

const ProfilePage = () => {
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    classLevel: ''
  });
  const { user, logout, updateProfile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        const profileData = await authAPI.getProfile();
        
        const userProfile = profileData;
        setUserData(userProfile);
        setEditForm({
          fullName: userProfile.fullName || userProfile.name || '',
          email: userProfile.email || '',
          phoneNumber: userProfile.phoneNumber || '',
          classLevel: userProfile.classLevel || ''
        });
      } catch (error) {
        toast({
          title: 'خطأ في تحميل البيانات',
          description: 'تحقق من اتصالك بالإنترنت وحاول مرة أخرى',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [toast]);

  const handleEditToggle = () => {
    if (isEditing) {
      setEditForm({
        fullName: userData?.fullName || userData?.name || '',
        email: userData?.email || '',
        phoneNumber: userData?.phoneNumber || '',
        classLevel: userData?.classLevel || ''
      });
    }
    setIsEditing(!isEditing);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const result = await updateProfile(editForm);
      
      if (result.success) {
        toast({
          title: 'تم التحديث',
          description: 'تم تحديث الملف الشخصي بنجاح',
          variant: 'default'
        });
        setIsEditing(false);
        setUserData(prev => ({ ...prev, ...editForm }));
      } else {
        toast({
          title: 'خطأ في التحديث',
          description: result.error || 'فشل في تحديث الملف الشخصي',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'خطأ في التحديث',
        description: 'فشل في تحديث الملف الشخصي',
        variant: 'destructive'
      });
    }
  };

  const handleInputChange = (e) => {
    setEditForm({
      ...editForm,
      [e.target.name]: e.target.value
    });
  };

  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true);
      await authAPI.deleteAccount();
      toast({
        title: 'تم حذف الحساب',
        description: 'تم حذف حسابك بنجاح. سيتم تحويلك إلى الصفحة الرئيسية.',
        variant: 'default'
      });
      logout();
      window.location.href = '/';
    } catch (error) {
      toast({
        title: 'فشل حذف الحساب',
        description: error.message || 'حدث خطأ أثناء حذف الحساب',
        variant: 'destructive'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                الملف الشخصي
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                إدارة معلومات حسابك وتتبع تقدمك الدراسي
              </p>
            </div>
            <Badge variant="outline" className="mt-2 sm:mt-0 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <User className="h-3 w-3 ml-1" />
              حساب {user?.role === 'admin' ? 'مدير' : 'طالب'}
            </Badge>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* معلومات المستخدم */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-white dark:from-gray-800 dark:to-gray-900 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl flex items-center gap-2">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                          <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span>معلومات المستخدم</span>
                      </CardTitle>
                      <CardDescription className="mt-2">
                        المعلومات الأساسية والتفاصيل الشخصية لحسابك
                      </CardDescription>
                    </div>
                    {!isEditing ? (
                      <Button 
                        variant="outline" 
                        onClick={handleEditToggle}
                        className="border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                      >
                        <Edit className="h-4 w-4 ml-2" />
                        تعديل الملف
                      </Button>
                    ) : null}
                  </div>
                </CardHeader>
                
                <CardContent className="p-6">
                  {isEditing ? (
                    <form onSubmit={handleEditSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="fullName" className="flex items-center gap-2 text-sm font-medium">
                            <User className="h-4 w-4 text-gray-500" />
                            الاسم الكامل
                          </Label>
                          <Input
                            id="fullName"
                            name="fullName"
                            value={editForm.fullName}
                            onChange={handleInputChange}
                            required
                            className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="أدخل اسمك الكامل"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium">
                            <Mail className="h-4 w-4 text-gray-500" />
                            البريد الإلكتروني
                          </Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            value={editForm.email}
                            onChange={handleInputChange}
                            required
                            className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="example@email.com"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="phoneNumber" className="flex items-center gap-2 text-sm font-medium">
                            <Phone className="h-4 w-4 text-gray-500" />
                            رقم الهاتف
                          </Label>
                          <Input
                            id="phoneNumber"
                            name="phoneNumber"
                            value={editForm.phoneNumber}
                            onChange={handleInputChange}
                            className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="+20XXXXXXXXXX"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="classLevel" className="flex items-center gap-2 text-sm font-medium">
                            <GraduationCap className="h-4 w-4 text-gray-500" />
                            الصف الدراسي
                          </Label>
                          <Input
                            id="classLevel"
                            name="classLevel"
                            value={editForm.classLevel}
                            onChange={handleInputChange}
                            className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="الصف الأول الثانوي"
                          />
                        </div>
                      </div>
                      
                      <div className="flex gap-3 pt-4">
                        <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
                          <Save className="h-4 w-4 ml-2" />
                          حفظ التغييرات
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={handleEditToggle}
                          className="flex-1"
                        >
                          <X className="h-4 w-4 ml-2" />
                          إلغاء التعديل
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                            <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">الاسم الكامل</p>
                            <p className="font-semibold text-gray-900 dark:text-white mt-1">
                              {userData?.fullName || userData?.name || 'غير معروف'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700">
                          <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                            <Mail className="h-5 w-5 text-green-600 dark:text-green-400" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">البريد الإلكتروني</p>
                            <p className="font-semibold text-gray-900 dark:text-white mt-1">
                              {userData?.email || 'غير معروف'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700">
                          <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                            <Phone className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">رقم الهاتف</p>
                            <p className="font-semibold text-gray-900 dark:text-white mt-1">
                              {userData?.phoneNumber || 'غير معروف'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700">
                          <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                            <GraduationCap className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">الصف الدراسي</p>
                            <p className="font-semibold text-gray-900 dark:text-white mt-1">
                              {userData?.classLevel || 'غير معروف'}
                            </p>
                          </div>
                        </div>

                        <div className="md:col-span-2 flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700">
                          <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                            <Calendar className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">تاريخ الانضمام</p>
                            <p className="font-semibold text-gray-900 dark:text-white mt-1 flex items-center gap-2">
                              {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString('ar-EG') : 'غير معروف'}
                              <Badge variant="outline" className="text-xs">
                                <Clock className="h-3 w-3 ml-1" />
                                منذ {userData?.createdAt ? Math.floor((new Date() - new Date(userData.createdAt)) / (1000 * 60 * 60 * 24)) : 0} يوم
                              </Badge>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* القائمة الجانبية */}
          <div className="space-y-6">
            {/* إدارة الحساب */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="border border-gray-200 dark:border-gray-700 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                      <Lock className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    إدارة الحساب
                  </CardTitle>
                  <CardDescription>
                    إعدادات الحساب والأمان
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start hover:bg-gray-50 dark:hover:bg-gray-800"
                    onClick={logout}
                  >
                    <LogOut className="h-4 w-4 ml-2 text-gray-600 dark:text-gray-400" />
                    تسجيل الخروج
                  </Button>
                  
                  <Separator />
                  
                  <div className="space-y-3">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start hover:bg-blue-50 dark:hover:bg-blue-900/30"
                      onClick={() => setIsChangePasswordOpen(true)}
                    >
                      <Key className="h-4 w-4 ml-2 text-blue-600 dark:text-blue-400" />
                      تغيير كلمة المرور
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="w-full justify-start hover:bg-purple-50 dark:hover:bg-purple-900/30"
                      onClick={() => {/* Add notifications settings */}}
                    >
                      <Bell className="h-4 w-4 ml-2 text-purple-600 dark:text-purple-400" />
                      إعدادات الإشعارات
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="w-full justify-start hover:bg-green-50 dark:hover:bg-green-900/30"
                      onClick={() => {/* Add privacy settings */}}
                    >
                      <Shield className="h-4 w-4 ml-2 text-green-600 dark:text-green-400" />
                      الخصوصية والأمان
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* حالة الحساب */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="border border-gray-200 dark:border-gray-700 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    حالة الحساب
                  </CardTitle>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">البريد الإلكتروني</span>
                      <Badge variant="outline" className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                        <CheckCircle className="h-3 w-3 ml-1" />
                        مفعل
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">رقم الهاتف</span>
                      <Badge variant="outline" className={userData?.phoneNumber ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400" : "bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"}>
                        {userData?.phoneNumber ? (
                          <>
                            <CheckCircle className="h-3 w-3 ml-1" />
                            مفعل
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-3 w-3 ml-1" />
                            غير مضاف
                          </>
                        )}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">نوع الحساب</span>
                      <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                        {user?.role === 'admin' ? 'مدير' : 'طالب'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* حذف الحساب */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card className="border border-red-200 dark:border-red-900 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-red-600 dark:text-red-400">
                    <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                      <Trash2 className="h-5 w-5" />
                    </div>
                    منطقة الخطر
                  </CardTitle>
                  <CardDescription className="text-red-500 dark:text-red-400">
                    إجراءات غير قابلة للاسترجاع
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="destructive" 
                        className="w-full"
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-4 w-4 ml-2" />
                        {isDeleting ? 'جارٍ الحذف...' : 'حذف الحساب نهائيًا'}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="border-red-200 dark:border-red-900">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                          <AlertCircle className="h-5 w-5" />
                          تأكيد حذف الحساب
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-600 dark:text-gray-300">
                          <div className="space-y-2 mt-2">
                            <p>هل أنت متأكد أنك تريد حذف حسابك نهائيًا؟</p>
                            <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-md border border-red-200 dark:border-red-800 mt-3">
                              <p className="text-sm font-medium text-red-600 dark:text-red-400">⚠️ تحذير: هذه العملية غير قابلة للاسترجاع</p>
                              <ul className="list-disc mr-4 mt-2 text-sm text-gray-600 dark:text-gray-300 space-y-1">
                                <li>سيتم حذف جميع بياناتك الشخصية</li>
                                <li>سيتم فقدان جميع الإنجازات والنتائج</li>
                                <li>لا يمكن استعادة الحساب بعد الحذف</li>
                              </ul>
                            </div>
                          </div>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="border-gray-300 dark:border-gray-600">
                          إلغاء
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteAccount}
                          className="bg-red-600 hover:bg-red-700 text-white"
                          disabled={isDeleting}
                        >
                          {isDeleting ? 'جارٍ الحذف...' : 'نعم، احذف الحساب'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Change Password Dialog */}
      <ChangePasswordDialog 
        open={isChangePasswordOpen} 
        onOpenChange={setIsChangePasswordOpen}
        userEmail={userData?.email}
      />
    </div>
  );
};

export default ProfilePage;