import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  BookOpen, 
  Users, 
  Award, 
  TrendingUp, 
  Play, 
  CheckCircle, 
  Star,
  ArrowRight,
  Menu,
  X,
  GraduationCap,
  Zap,
  Mail,
  Phone,
  MessageCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import ThemeToggleIcon from '../components/ThemeToggleIcon';
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../contexts/AuthContext'

const LandingPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showVideo, setShowVideo] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard')
    }
  }, [isAuthenticated, navigate])

  const features = [
    {
      icon: BookOpen,
      title: 'دروس تفاعلية',
      description: 'محتوى تعليمي غني بالفيديوهات والتمارين التفاعلية'
    },
    {
      icon: Award,
      title: 'امتحانات ذكية',
      description: 'نظام امتحانات متطور مع تقييم فوري ونتائج مفصلة'
    },
    {
      icon: TrendingUp,
      title: 'تتبع التقدم',
      description: 'راقب تطورك الأكاديمي مع إحصائيات مفصلة'
    },
    {
      icon: Users,
      title: 'مجتمع تعليمي',
      description: 'تفاعل مع زملائك والمعلمين في بيئة تعليمية محفزة'
    }
  ]

  const stats = [
    { number: '10,000+', label: 'طالب نشط' },
    { number: '500+', label: 'درس تفاعلي' },
    { number: '50+', label: 'معلم خبير' },
    { number: '95%', label: 'معدل النجاح' }
  ]

  const testimonials = [
    {
      name: 'أحمد محمد',
      role: 'طالب ثانوية عامة',
      content: 'منصة رائعة ساعدتني في تحسين درجاتي بشكل كبير',
      rating: 5
    },
    {
      name: 'فاطمة علي',
      role: 'طالبة الصف الثاني الثانوي',
      content: 'الدروس واضحة والامتحانات زي الامتحانات الحقيقية',
      rating: 5
    },
    {
      name: 'محمد حسن',
      role: 'طالب الصف الأول الثانوي',
      content: 'أفضل منصة تعليمية استخدمتها في حياتي',
      rating: 5
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-md z-50 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <GraduationCap className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">EduMaster</span>
            </div>
            
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <a href="#features" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  المميزات
                </a>
                <a href="#about" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  عن المنصة
                </a>
                <a href="#testimonials" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  آراء الطلاب
                </a>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="p-2 relative overflow-hidden group"
                aria-label={theme === 'light' ? 'التبديل إلى الوضع الداكن' : 'التبديل إلى الوضع الفاتح'}
              >
                <ThemeToggleIcon theme={theme} />
                
                {/* تأثير إضافي عند التمرير */}
                <motion.div
                  initial={false}
                  animate={{
                    scale: theme === 'light' ? 0 : 1,
                    opacity: theme === 'light' ? 0 : 0.1,
                  }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full"
                />
                
                {/* تلميح توضيحي */}
                <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                  {theme === 'light' ? 'التبديل إلى الوضع الداكن' : 'التبديل إلى الوضع الفاتح'}
                </div>
              </Button>
              
              <div className="hidden md:flex items-center space-x-2">
                <Link to="/login">
                  <Button variant="ghost">تسجيل الدخول</Button>
                </Link>
                <Link to="/register">
                  <Button>إنشاء حساب</Button>
                </Link>
              </div>

              <div className="md:hidden">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                  {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700"
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <a href="#features" className="block px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
                المميزات
              </a>
              <a href="#about" className="block px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
                عن المنصة
              </a>
              <a href="#testimonials" className="block px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
                آراء الطلاب
              </a>
              <div className="flex flex-col space-y-2 px-3 pt-4">
                <Link to="/login">
                  <Button variant="ghost" className="w-full">تسجيل الدخول</Button>
                </Link>
                <Link to="/register">
                  <Button className="w-full">إنشاء حساب</Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
                مستقبلك التعليمي
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                  يبدأ من هنا
                </span>
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
                انضم إلى آلاف الطلاب الذين يحققون أحلامهم الأكاديمية مع منصة EduMaster التعليمية المتطورة
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/register">
                  <Button size="lg" className="text-lg px-8 py-3">
                    ابدأ رحلتك التعليمية
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="text-lg px-8 py-3"
                  onClick={() => setShowVideo(true)}
                >
                  <Play className="mr-2 h-5 w-5" />
                  شاهد العرض التوضيحي
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 dark:text-gray-300">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              لماذا تختار EduMaster?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              نوفر لك أحدث التقنيات التعليمية لضمان تجربة تعلم فريدة ومثمرة
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow duration-300 border-0 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <feature.icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-purple-900 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              ماذا يقول طلابنا؟
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              اكتشف تجارب الطلاب الناجحة مع منصتنا
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="h-full bg-white dark:bg-gray-800 border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 mb-4 italic">
                      "{testimonial.content}"
                    </p>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {testimonial.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {testimonial.role}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
              هل أنت مستعد لتغيير مستقبلك؟
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              انضم إلى آلاف الطلاب الذين حققوا أهدافهم الأكاديمية معنا
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button size="lg" className="text-lg px-8 py-3">
                  ابدأ مجاناً الآن
                  <Zap className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="lg" className="text-lg px-8 py-3">
                  لديك حساب؟ سجل دخولك
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-gray-950 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-4">
                <GraduationCap className="h-8 w-8 text-blue-400" />
                <span className="ml-2 text-xl font-bold">EduMaster</span>
              </div>
              <p className="text-gray-400 mb-4">
                منصة تعليمية متطورة تهدف إلى تمكين الطلاب من تحقيق أهدافهم الأكاديمية بأحدث الوسائل التقنية
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">روابط سريعة</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">المميزات</a></li>
                <li><a href="#about" className="hover:text-white transition-colors">عن المنصة</a></li>
                <li><a href="#testimonials" className="hover:text-white transition-colors">آراء الطلاب</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">تواصل معنا</h3>
              <ul className="space-y-3 text-gray-400">
                <li className="flex items-center">
                  <Mail className="h-4 w-4 ml-2" />
                  <a href="mailto:abdallarageb662@gmail.com" className="hover:text-white transition-colors">
                    abdallarageb662@gmail.com
                  </a>
                </li>
                <li className="flex items-center">
                  <Phone className="h-4 w-4 ml-2" />
                  <a href="tel:+201016864615" className="hover:text-white transition-colors">
                    +201016864615
                  </a>
                </li>
                <li className="flex items-center">
                  <MessageCircle className="h-5 w-5 ml-2 text-green-500" />
                  <a 
                    href="https://wa.me/201016864615" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-full transition-colors"
                  >
                    تواصل عبر واتساب
                  </a>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 EduMaster. جميع الحقوق محفوظة.</p>
          </div>
        </div>
      </footer>

      {/* Video Modal */}
      {showVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative bg-black rounded-lg overflow-hidden max-w-4xl w-full">
            <button 
              className="absolute top-4 right-4 text-white z-10 bg-gray-800 rounded-full p-2 hover:bg-gray-700"
              onClick={() => setShowVideo(false)}
            >
              <X className="h-6 w-6" />
            </button>
            <div className="aspect-video">
              <video 
                controls 
                autoPlay 
                className="w-full h-full"
                onEnded={() => setShowVideo(false)}
              >
                <source src="/videos/demo-video.mp4" type="video/mp4" />
                متصفحك لا يدعم تشغيل الفيديو
              </video>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default LandingPage