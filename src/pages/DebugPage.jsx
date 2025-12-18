import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { authAPI, examsAPI, lessonsAPI } from '../services/api';
import Navbar from '../components/Navbar';

const DebugPage = () => {
  const [debugInfo, setDebugInfo] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const runDiagnostics = async () => {
    const info = {
      localStorage: {},
      apiStatus: {},
      userStatus: {},
      examsStatus: {},
      lessonsStatus: {},
      timestamp: new Date().toISOString()
    };

    // 1) فحص localStorage
    info.localStorage = {
      token: localStorage.getItem('token') ? '✅ موجود' : '❌ غير موجود',
      tokenLength: localStorage.getItem('token')?.length || 0,
      csrfToken: localStorage.getItem('csrfToken') ? '✅ موجود' : '❌ غير موجود',
      userId: localStorage.getItem('userId') || 'غير محفوظ'
    };

    // 2) فحص API الأساسي
    try {
      const profile = await authAPI.getProfile();
      info.userStatus = {
        status: '✅ متصل',
        user: profile?.fullName || 'غير معروف',
        email: profile?.email || 'غير معروف',
        role: profile?.role || 'غير معروف',
        id: profile?._id || 'غير معروف'
      };
    } catch (error) {
      info.userStatus = {
        status: '❌ فشل',
        error: error.message,
        statusCode: error.status
      };
    }

    // 3) فحص الامتحانات
    try {
      const exams = await examsAPI.getAllExams({ page: 1, limit: 5 });
      info.examsStatus = {
        status: '✅ متصل',
        count: Array.isArray(exams) ? exams.length : 0,
        sample: exams.length > 0 ? exams[0] : 'لا توجد امتحانات'
      };
    } catch (error) {
      info.examsStatus = {
        status: '❌ فشل',
        error: error.message,
        statusCode: error.status
      };
    }

    // 4) فحص الدروس
    try {
      const lessons = await lessonsAPI.getAllLessons({ page: 1, limit: 5 });
      info.lessonsStatus = {
        status: '✅ متصل',
        count: Array.isArray(lessons) ? lessons.length : 0
      };
    } catch (error) {
      info.lessonsStatus = {
        status: '❌ فشل',
        error: error.message
      };
    }

    // 5) فحص حالة الـ API العامة
    info.apiStatus = {
      baseURL: 'https://edu-master-delta.vercel.app',
      timestamp: new Date().toLocaleString('ar-EG')
    };

    setDebugInfo(info);
    setIsLoading(false);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const clearStorage = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">صفحة تصحيح النظام</h1>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Button onClick={runDiagnostics}>
            تشغيل التشخيص
          </Button>
          <Button variant="outline" onClick={clearStorage}>
            مسح التخزين المحلي
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/'}>
            العودة للرئيسية
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p>جاري التشخيص...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Local Storage */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <span className={`h-3 w-3 rounded-full mr-2 ${debugInfo.localStorage.token === '✅ موجود' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  التخزين المحلي
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto">
                  {JSON.stringify(debugInfo.localStorage, null, 2)}
                </pre>
              </CardContent>
            </Card>

            {/* User Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <span className={`h-3 w-3 rounded-full mr-2 ${debugInfo.userStatus.status === '✅ متصل' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  حالة المستخدم
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto">
                  {JSON.stringify(debugInfo.userStatus, null, 2)}
                </pre>
              </CardContent>
            </Card>

            {/* Exams Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <span className={`h-3 w-3 rounded-full mr-2 ${debugInfo.examsStatus.status === '✅ متصل' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  حالة الامتحانات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto">
                  {JSON.stringify(debugInfo.examsStatus, null, 2)}
                </pre>
              </CardContent>
            </Card>

            {/* Lessons Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <span className={`h-3 w-3 rounded-full mr-2 ${debugInfo.lessonsStatus.status === '✅ متصل' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  حالة الدروس
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto">
                  {JSON.stringify(debugInfo.lessonsStatus, null, 2)}
                </pre>
              </CardContent>
            </Card>

            {/* API Status */}
            <Card>
              <CardHeader>
                <CardTitle>معلومات الـ API</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto">
                  {JSON.stringify(debugInfo.apiStatus, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default DebugPage;