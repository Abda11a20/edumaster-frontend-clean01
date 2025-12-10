import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { authAPI } from '../services/api';
import { Key, Mail, Eye, EyeOff, Lock, ArrowLeft, CheckCircle } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

const ChangePasswordDialog = ({ open, onOpenChange, userEmail }) => {
  const [step, setStep] = useState(1); // 1: إرسال OTP, 2: إدخال OTP وكلمة المرور الجديدة
  const [email, setEmail] = useState(userEmail || '');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isOTPSent, setIsOTPSent] = useState(false);
  const { toast } = useToast();

  // إرسال OTP إلى البريد الإلكتروني
  const handleSendOTP = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        title: 'خطأ في البيانات',
        description: 'يرجى إدخال البريد الإلكتروني',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await authAPI.forgotPassword(email);
      
      if (result.success) {
        setIsOTPSent(true);
        toast({
          title: 'تم إرسال رمز التحقق',
          description: 'تحقق من بريدك الإلكتروني للحصول على رمز إعادة تعيين كلمة المرور'
        });
        setStep(2);
      } else {
        toast({
          title: 'خطأ في إرسال الرمز',
          description: result.error || 'تحقق من البريد الإلكتروني المدخل',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'خطأ في الاتصال',
        description: 'تحقق من اتصالك بالإنترنت وحاول مرة أخرى',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // إعادة تعيين كلمة المرور باستخدام OTP
  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    // التحقق من صحة البيانات
    if (!otp.trim()) {
      toast({
        title: 'خطأ في البيانات',
        description: 'يرجى إدخال رمز التحقق',
        variant: 'destructive'
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: 'خطأ في كلمة المرور',
        description: 'يجب أن تكون كلمة المرور 6 أحرف على الأقل',
        variant: 'destructive'
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'خطأ في تأكيد كلمة المرور',
        description: 'كلمة المرور وتأكيدها غير متطابقتين',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await authAPI.resetPassword({
        email,
        otp,
        newPassword,
        cpassword: confirmPassword
      });
      
      if (result.success) {
        toast({
          title: 'تم تغيير كلمة المرور بنجاح',
          description: 'يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة'
        });
        // إعادة تعيين الحقول وإغلاق الـ dialog
        resetForm();
        onOpenChange(false);
      } else {
        toast({
          title: 'خطأ في إعادة تعيين كلمة المرور',
          description: result.error || 'تحقق من البيانات المدخلة',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'خطأ في الاتصال',
        description: 'تحقق من اتصالك بالإنترنت وحاول مرة أخرى',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // إعادة تعيين الحقول
  const resetForm = () => {
    setStep(1);
    setEmail(userEmail || '');
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setIsOTPSent(false);
  };

  // إغلاق الـ dialog
  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {step === 1 ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-blue-600" />
                تغيير كلمة المرور
              </DialogTitle>
              <p className="text-sm text-gray-500 mt-2">
                سنرسل رمز تحقق إلى بريدك الإلكتروني لإعادة تعيين كلمة المرور
              </p>
            </DialogHeader>
            
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">
                  البريد الإلكتروني
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    placeholder="أدخل بريدك الإلكتروني"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={handleClose}>
                  إلغاء
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      جاري الإرسال...
                    </>
                  ) : (
                    'إرسال رمز التحقق'
                  )}
                </Button>
              </div>
            </form>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                تعيين كلمة مرور جديدة
              </DialogTitle>
              <p className="text-sm text-gray-500 mt-2">
                أدخل رمز التحقق المرسل إلى {email} وكلمة المرور الجديدة
              </p>
            </DialogHeader>
            
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp" className="text-gray-700 dark:text-gray-300">
                  رمز التحقق
                </Label>
                <Input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="أدخل رمز التحقق المكون من 6 أرقام"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-gray-700 dark:text-gray-300">
                  كلمة المرور الجديدة
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-10 pr-10"
                    placeholder="كلمة المرور الجديدة"
                    required
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    disabled={isLoading}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-700 dark:text-gray-300">
                  تأكيد كلمة المرور
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 pr-10"
                    placeholder="أعد إدخال كلمة المرور الجديدة"
                    required
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex justify-between gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setStep(1)}
                  disabled={isLoading}
                >
                  <ArrowLeft className="h-4 w-4 ml-2" />
                  العودة
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      جاري التحديث...
                    </>
                  ) : (
                    'تغيير كلمة المرور'
                  )}
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ChangePasswordDialog;