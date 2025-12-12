import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  GraduationCap, 
  Home, 
  BookOpen, 
  FileText, 
  BarChart3,
  User, 
  Users,
  Settings, 
  LogOut, 
  Menu, 
  X,
  Bell,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { useNotifications } from '../contexts/NotificationsContext'
import SearchBar from './SearchBar'
import ThemeToggleIcon from './ThemeToggleIcon'


const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  
  const { user, logout, isAdmin, isSuperAdmin } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const location = useLocation()
  const navigate = useNavigate()
  const notificationsRef = useRef(null)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  // إغلاق قائمة الإشعارات عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleNotificationClick = (id) => {
    markAsRead(id)
    setShowNotifications(false)
  }

  const handleMarkAllAsRead = () => {
    markAllAsRead()
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case 'lesson':
        return <BookOpen className="h-5 w-5 text-blue-500" />
      case 'exam':
        return <FileText className="h-5 w-5 text-purple-500" />
      default:
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  const navigationItems = [
    {
      name: 'الرئيسية',
      href: '/dashboard',
      icon: Home
    },
    {
      name: 'الدروس',
      href: '/lessons',
      icon: BookOpen
    },
    {
      name: 'الامتحانات',
      href: '/exams',
      icon: FileText
    },
    {
      name: 'نتائجي',
      href: '/results',
      icon: BarChart3
    }
  ]

  const adminNavigationItems = [
    {
      name: 'إدارة الدروس',
      href: '/admin/lessons',
      icon: BookOpen
    },
    {
      name: 'إدارة الامتحانات',
      href: '/admin/exams',
      icon: FileText
    },
    {
      name: 'نتائج الامتحانات',
      href: '/admin/exam-results',
      icon: BarChart3
    },
    {
      name: 'إدارة الأسئلة',
      href: '/admin/questions',
      icon: FileText
    },
    {
      name: 'إدارة المستخدمين',
      href: '/admin/users',
      icon: User
    }
  ]

  const superAdminNavigationItems = [
    {
      name: 'إدارة المشرفين',
      href: '/super-admin/admins',
      icon: Users
    }
  ]

  // تصفية عناصر التنقل بناءً على دور المستخدم
  const getFilteredNavigationItems = () => {
    if (isAdmin() || isSuperAdmin()) {
      // للمسؤولين: إظهار فقط الرئيسية + عناصر الإدارة
      return [
        {
          name: 'الرئيسية',
          href: '/dashboard',
          icon: Home
        }
      ];
    }
    // للمستخدمين العاديين: إظهار جميع العناصر
    return navigationItems;
  };

  const filteredNavigationItems = getFilteredNavigationItems();

  const isActivePath = (path) => {
    return location.pathname === path
  }

  const getInitials = (name) => {
    return name
      ?.split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U'
  }

  return (
    <nav className="sticky top-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center">
              <GraduationCap className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">
                EduMaster
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {filteredNavigationItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActivePath(item.href)
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                        : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.name}
                  </Link>
                )
              })}
              
              {/* Admin Navigation */}
              {(isAdmin() || isSuperAdmin()) && (
                <>
                  {filteredNavigationItems.length > 0 && (
                    <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-2" />
                  )}
                  {adminNavigationItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          isActivePath(item.href)
                            ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300'
                            : 'text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        <Icon className="h-4 w-4 mr-2" />
                        {item.name}
                      </Link>
                    )
                  })}
                  {isSuperAdmin() && superAdminNavigationItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          isActivePath(item.href)
                            ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300'
                            : 'text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        <Icon className="h-4 w-4 mr-2" />
                        {item.name}
                      </Link>
                    )
                  })}
                </>
              )}
            </div>
          </div>

          {/* Search Bar */}
          <div className="hidden md:block flex-1 max-w-md mx-8">
            <SearchBar />
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
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
              
              {/* تأثير هالة عند التمرير فوق الزر */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                whileHover={{ scale: 1.5, opacity: 0.1 }}
                className="absolute inset-0 bg-current rounded-full"
              />
              
              {/* تلميح توضيحي */}
              <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                {theme === 'light' ? 'التبديل إلى الوضع الداكن' : 'التبديل إلى الوضع الفاتح'}
              </div>
            </Button>

            {/* Notifications */}
            <div className="relative" ref={notificationsRef}>
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-2 relative"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                )}
              </Button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-md shadow-lg overflow-hidden z-50 border border-gray-200 dark:border-gray-700">
                  <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h3 className="font-semibold">الإشعارات</h3>
                    {unreadCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleMarkAllAsRead}
                      >
                        تعيين الكل كمقروء
                      </Button>
                    )}
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                        لا توجد إشعارات
                      </div>
                    ) : (
                      notifications.map(notification => (
                        <div
                          key={notification.id}
                          className={`p-3 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                            !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                          }`}
                          onClick={() => handleNotificationClick(notification.id)}
                        >
                          <div className="flex items-start">
                            <div className="flex-shrink-0 mt-1">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="ml-3 flex-1">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {notification.title}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-300 mt-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                {new Date(notification.timestamp).toLocaleString('ar-EG')}
                              </p>
                            </div>
                            {!notification.read && (
                              <div className="flex-shrink-0">
                                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.avatar} alt={user?.fullName} />
                    <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300">
                      {getInitials(user?.fullName)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user?.fullName}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                    {isAdmin() && (
                      <Badge variant="secondary" className="w-fit text-xs">
                        مدير
                      </Badge>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    <span>الملف الشخصي</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>الإعدادات</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 dark:text-red-400">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>تسجيل الخروج</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700"
          >
            <div className="px-2 pt-2 pb-3 space-y-1">
              {/* Search Bar Mobile */}
              <div className="px-3 py-2">
                <SearchBar />
              </div>

              {/* Navigation Items */}
              {filteredNavigationItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${
                      isActivePath(item.href)
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                        : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {item.name}
                  </Link>
                )
              })}

              {/* Admin Navigation Mobile */}
              {isAdmin() && (
                <>
                  {filteredNavigationItems.length > 0 && (
                    <div className="border-t border-gray-200 dark:border-gray-700 my-2" />
                  )}
                  <div className="px-3 py-2">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      إدارة النظام
                    </p>
                  </div>
                  {adminNavigationItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${
                          isActivePath(item.href)
                            ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300'
                            : 'text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Icon className="h-5 w-5 mr-3" />
                        {item.name}
                      </Link>
                    )
                  })}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}

export default Navbar