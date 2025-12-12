// components/SearchBar.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, BookOpen, FileText, Home, User, Award, BarChart3, Calendar, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const SearchBar = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const navigate = useNavigate();
  const searchRef = useRef(null);

  // قائمة الصفحات الرئيسية للتطبيق
  const appPages = [
    { 
      id: 'dashboard',
      title: 'لوحة التحكم', 
      description: 'نظرة عامة على أدائك وإحصائياتك',
      path: '/', 
      icon: Home,
      category: 'صفحات',
      keywords: ['لوحة التحكم', 'الرئيسية', 'dashboard', 'home', 'البيانات']
    },
    { 
      id: 'lessons-page',
      title: 'الدروس', 
      description: 'تصفح جميع الدروس التعليمية',
      path: '/lessons', 
      icon: BookOpen,
      category: 'صفحات',
      keywords: ['دروس', 'تعلم', 'تعليم', 'كورسات', 'محتوى']
    },
    { 
      id: 'exams-page',
      title: 'الامتحانات', 
      description: 'اختبر معلوماتك من خلال الامتحانات',
      path: '/exams', 
      icon: FileText,
      category: 'صفحات',
      keywords: ['امتحانات', 'اختبارات', 'تقييم', 'أسئلة', 'فحص']
    },
    { 
      id: 'results',
      title: 'النتائج', 
      description: 'عرض نتائجك في الامتحانات',
      path: '/results', 
      icon: Award,
      category: 'صفحات',
      keywords: ['نتائج', 'درجات', 'تقييمات', 'أداء', 'معدل']
    },
    { 
      id: 'progress',
      title: 'التقدم الدراسي', 
      description: 'تابع تقدمك في المنهج التعليمي',
      path: '/progress', 
      icon: BarChart3,
      category: 'صفحات',
      keywords: ['تقدم', 'إحصائيات', 'نمو', 'تطور', 'مسيرة']
    },
    { 
      id: 'profile',
      title: 'الملف الشخصي', 
      description: 'إدارة حسابك الشخصي وإعداداتك',
      path: '/profile', 
      icon: User,
      category: 'صفحات',
      keywords: ['ملف', 'حساب', 'إعدادات', 'معلومات', 'بيانات شخصية']
    },
  ];

  // جلب الدروس من localStorage
  const getLessonsFromStorage = () => {
    try {
      const lessonsData = localStorage.getItem('lessons');
      if (lessonsData) {
        const parsed = JSON.parse(lessonsData);
        if (Array.isArray(parsed)) {
          return parsed.map(lesson => ({
            id: lesson._id || lesson.id,
            title: lesson.title || 'درس بدون عنوان',
            description: lesson.description || 'لا يوجد وصف',
            type: 'درس',
            path: `/lessons/${lesson._id || lesson.id}`,
            icon: BookOpen,
            category: 'دروس',
            keywords: [lesson.subject || '', lesson.classLevel || '']
          }));
        }
      }
    } catch (error) {
      // لا تظهر أي أخطاء
    }
    return [];
  };

  // جلب الامتحانات من localStorage
  const getExamsFromStorage = () => {
    try {
      const examsData = localStorage.getItem('exams');
      if (examsData) {
        const parsed = JSON.parse(examsData);
        if (Array.isArray(parsed)) {
          return parsed.map(exam => ({
            id: exam._id || exam.id,
            title: exam.title || 'امتحان بدون عنوان',
            description: exam.description || 'لا يوجد وصف',
            type: 'امتحان',
            path: `/exams/${exam._id || exam.id}`,
            icon: FileText,
            category: 'امتحانات',
            keywords: [exam.subject || '', exam.classLevel || '', 'اختبار', 'فحص']
          }));
        }
      }
    } catch (error) {
      // لا تظهر أي أخطاء
    }
    return [];
  };

  // جلب عمليات البحث الأخيرة
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch {
        setRecentSearches([]);
      }
    }
  }, []);

  // حفظ عملية بحث جديدة
  const saveToRecentSearches = (searchTerm) => {
    if (!searchTerm.trim()) return;
    
    const newRecent = [
      { term: searchTerm, timestamp: Date.now() },
      ...recentSearches.filter(item => item.term !== searchTerm)
    ].slice(0, 5); // حفظ آخر 5 عمليات بحث فقط
    
    setRecentSearches(newRecent);
    localStorage.setItem('recentSearches', JSON.stringify(newRecent));
  };

  // البحث في جميع المصادر
  const performSearch = (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    
    // البحث في الصفحات الرئيسية
    const pageResults = appPages.filter(page => 
      page.title.toLowerCase().includes(query) ||
      page.description.toLowerCase().includes(query) ||
      page.keywords.some(keyword => keyword.toLowerCase().includes(query))
    );

    // البحث في الدروس
    const lessons = getLessonsFromStorage();
    const lessonResults = lessons.filter(lesson =>
      lesson.title.toLowerCase().includes(query) ||
      lesson.description.toLowerCase().includes(query) ||
      lesson.keywords.some(keyword => keyword && keyword.toLowerCase().includes(query))
    );

    // البحث في الامتحانات
    const exams = getExamsFromStorage();
    const examResults = exams.filter(exam =>
      exam.title.toLowerCase().includes(query) ||
      exam.description.toLowerCase().includes(query) ||
      exam.keywords.some(keyword => keyword && keyword.toLowerCase().includes(query))
    );

    // دمج وترتيب النتائج
    const allResults = [
      ...pageResults.map(item => ({ ...item, relevance: 3 })),
      ...lessonResults.map(item => ({ ...item, relevance: 2 })),
      ...examResults.map(item => ({ ...item, relevance: 1 }))
    ];

    // ترتيب حسب الأهمية
    allResults.sort((a, b) => {
      // أولوية: مطابقة العنوان > الوصف > الكلمات المفتاحية
      const aTitleMatch = a.title.toLowerCase().includes(query) ? 3 : 0;
      const bTitleMatch = b.title.toLowerCase().includes(query) ? 3 : 0;
      
      const aDescMatch = a.description.toLowerCase().includes(query) ? 2 : 0;
      const bDescMatch = b.description.toLowerCase().includes(query) ? 2 : 0;
      
      const aTotal = aTitleMatch + aDescMatch + a.relevance;
      const bTotal = bTitleMatch + bDescMatch + b.relevance;
      
      return bTotal - aTotal;
    });

    setResults(allResults.slice(0, 10)); // عرض أول 10 نتائج فقط
  };

  const handleSearch = (value) => {
    setQuery(value);
    performSearch(value);
    if (value.trim()) {
      setIsOpen(true);
    }
  };

  const handleSelectResult = (result) => {
    saveToRecentSearches(result.title);
    navigate(result.path);
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && query.trim() && results.length > 0) {
      handleSelectResult(results[0]);
    }
  };

  // إغلاق البحث عند النقر خارج المربع
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full max-w-2xl" ref={searchRef}>
      <div className="relative">
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="search"
          placeholder="ابحث عن دروس، امتحانات، صفحات..."
          className="w-full pl-10 pr-10 rounded-full bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-primary"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute left-3 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-transparent"
            onClick={clearSearch}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* نتائج البحث */}
      {isOpen && (
        <Card className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl z-50 max-h-[500px] overflow-y-auto">
          {/* نتائج البحث */}
          {query.trim() && results.length > 0 && (
            <div className="p-3">
              <div className="flex items-center justify-between mb-2 px-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  نتائج البحث ({results.length})
                </span>
                <Badge variant="outline" className="text-xs">
                  بحث داخلي
                </Badge>
              </div>
              
              <div className="space-y-2">
                {results.map((result, index) => {
                  const Icon = result.icon;
                  return (
                    <div
                      key={`${result.id}-${index}`}
                      className="p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg cursor-pointer transition-colors duration-150 group border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                      onClick={() => handleSelectResult(result)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-800/30 flex items-center justify-center group-hover:scale-105 transition-transform">
                          <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                              {result.title}
                            </h4>
                            <Badge variant="secondary" className="text-xs">
                              {result.category}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                            {result.description}
                          </p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-500 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* حالة عدم وجود نتائج */}
          {query.trim() && results.length === 0 && (
            <div className="p-8 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
                <Search className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                لم يتم العثور على نتائج
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                حاول استخدام كلمات بحث مختلفة
              </p>
            </div>
          )}

          {/* عمليات البحث الأخيرة */}
          {!query.trim() && recentSearches.length > 0 && (
            <div className="p-3 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 px-2">
                عمليات البحث الأخيرة
              </h3>
              <div className="space-y-1">
                {recentSearches.map((search, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    className="w-full justify-start text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                    onClick={() => handleSearch(search.term)}
                  >
                    <Search className="h-4 w-4 ml-2 text-gray-400" />
                    <span className="truncate">{search.term}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* التصنيفات المقترحة */}
          {!query.trim() && (
            <div className="p-3 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 px-2">
                تصفح سريع
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start"
                  onClick={() => navigate('/lessons')}
                >
                  <BookOpen className="h-4 w-4 ml-2" />
                  الدروس
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start"
                  onClick={() => navigate('/exams')}
                >
                  <FileText className="h-4 w-4 ml-2" />
                  الامتحانات
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start"
                  onClick={() => navigate('/results')}
                >
                  <Award className="h-4 w-4 ml-2" />
                  النتائج
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start"
                  onClick={() => navigate('/progress')}
                >
                  <BarChart3 className="h-4 w-4 ml-2" />
                  التقدم
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default SearchBar;