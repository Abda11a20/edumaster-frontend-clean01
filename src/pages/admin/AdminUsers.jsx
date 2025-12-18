import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, User, Mail, Calendar, Shield, Search, Filter, Phone, MapPin, Clock, ChevronDown, ChevronUp, X } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { adminAPI } from '../../services/api'
import LoadingSpinner from '../../components/LoadingSpinner'
import Navbar from '../../components/Navbar'
import { useTranslation } from '../../hooks/useTranslation'

const AdminUsers = () => {
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [expandedUserId, setExpandedUserId] = useState(null)
  const { toast } = useToast()
  const { t, lang } = useTranslation()

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true)
        const usersData = await adminAPI.getAllUsers()
        setUsers(usersData)
        setFilteredUsers(usersData)
      } catch (error) {
        console.error('Error fetching users:', error)
        toast({
          title: t('admin.users.filter.error_load'),
          description: t('admin.users.filter.error_load_desc'),
          variant: 'destructive'
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchUsers()
  }, [toast])

  useEffect(() => {
    let result = users

    if (searchTerm) {
      result = result.filter(user =>
        user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phoneNumber?.includes(searchTerm)
      )
    }

    if (roleFilter !== 'all') {
      result = result.filter(user => user.role === roleFilter)
    }

    setFilteredUsers(result)
  }, [searchTerm, roleFilter, users])

  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case 'admin':
        return 'default'
      case 'user':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const getRoleBadgeText = (role) => {
    switch (role) {
      case 'admin':
        return t('admin.users.list.role_admin')
      case 'user':
        return t('admin.users.list.role_user')
      default:
        return role
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return t('admin.users.details.not_available')
    return new Date(dateString).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleUserClick = (user) => {
    setSelectedUser(user)
    setIsDialogOpen(true)
  }

  const toggleExpand = (userId) => {
    if (expandedUserId === userId) {
      setExpandedUserId(null)
    } else {
      setExpandedUserId(userId)
    }
  }

  const UserDetailItem = ({ icon: Icon, label, value }) => (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
      <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
        <Icon className="h-4 w-4 ml-2" />
        <span>{label}</span>
      </div>
      <span className="text-sm font-medium text-gray-900 dark:text-white">
        {value || t('admin.users.details.not_available')}
      </span>
    </div>
  )

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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('admin.users.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {t('admin.users.subtitle')}
          </p>
        </motion.div>

        {/* بطاقة الإحصائيات */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">{t('admin.users.stats.total')}</p>
                  <p className="text-3xl font-bold">{users.length}</p>
                </div>
                <Users className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">{t('admin.users.stats.admins')}</p>
                  <p className="text-3xl font-bold">
                    {users.filter(user => user.role === 'admin').length}
                  </p>
                </div>
                <Shield className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">{t('admin.users.stats.regular')}</p>
                  <p className="text-3xl font-bold">
                    {users.filter(user => user.role === 'user').length}
                  </p>
                </div>
                <User className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* أدوات التصفية والبحث */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-6"
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder={t('admin.users.filter.placeholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-[130px]">
                      <SelectValue placeholder={t('admin.users.filter.all')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('admin.users.filter.all')}</SelectItem>
                      <SelectItem value="admin">{t('admin.users.filter.admin')}</SelectItem>
                      <SelectItem value="user">{t('admin.users.filter.user')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('')
                    setRoleFilter('all')
                  }}
                >
                  {t('admin.users.filter.reset')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* قائمة المستخدمين */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.users.list.title')}</CardTitle>
              <CardDescription>
                {t('admin.users.list.count_info', { shown: filteredUsers.length, total: users.length })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredUsers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredUsers.map((user) => (
                    <Card
                      key={user._id}
                      className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleUserClick(user)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <Badge variant={getRoleBadgeVariant(user.role)}>
                            {getRoleBadgeText(user.role)}
                          </Badge>
                        </div>

                        <div className="space-y-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {user.fullName || t('admin.users.list.no_name')}
                          </h3>

                          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                            <Mail className="h-4 w-4 ml-1" />
                            <span className="truncate">{user.email}</span>
                          </div>

                          {user.phoneNumber && (
                            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                              <Phone className="h-4 w-4 ml-1" />
                              <span>{user.phoneNumber}</span>
                            </div>
                          )}

                          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                            <Calendar className="h-4 w-4 ml-1" />
                            <span>{t('admin.users.list.joined')} {formatDate(user.createdAt)}</span>
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full flex items-center justify-center"
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleExpand(user._id)
                            }}
                          >
                            {expandedUserId === user._id ? (
                              <>
                                <ChevronUp className="h-4 w-4 ml-1" />
                                {t('admin.users.list.hide_details')}
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-4 w-4 ml-1" />
                                {t('admin.users.list.show_details')}
                              </>
                            )}
                          </Button>

                          <AnimatePresence>
                            {expandedUserId === user._id && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                                className="mt-3 space-y-2 text-sm"
                              >
                                <UserDetailItem
                                  icon={Mail}
                                  label={t('admin.users.details.email')}
                                  value={user.email}
                                />
                                <UserDetailItem
                                  icon={Phone}
                                  label={t('admin.users.details.phone')}
                                  value={user.phoneNumber}
                                />
                                <UserDetailItem
                                  icon={User}
                                  label={t('admin.users.details.role')}
                                  value={getRoleBadgeText(user.role)}
                                />
                                <UserDetailItem
                                  icon={Calendar}
                                  label={t('admin.users.details.join_date')}
                                  value={formatDate(user.createdAt)}
                                />
                                {user.address && (
                                  <UserDetailItem
                                    icon={MapPin}
                                    label={t('admin.users.details.address')}
                                    value={user.address}
                                  />
                                )}
                                {user.lastLogin && (
                                  <UserDetailItem
                                    icon={Clock}
                                    label={t('admin.users.details.last_login')}
                                    value={formatDate(user.lastLogin)}
                                  />
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    {t('admin.users.list.empty_title')}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    {searchTerm || roleFilter !== 'all'
                      ? t('admin.users.list.empty_search')
                      : t('admin.users.list.empty_system')
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* نافذة التفاصيل */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>{t('admin.users.details.title')}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsDialogOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </DialogTitle>
            </DialogHeader>

            {selectedUser && (
              <div className="space-y-4 mt-4">
                <div className="flex items-center justify-center">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <User className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>

                <div className="text-center">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {selectedUser.fullName || t('admin.users.list.no_name')}
                  </h3>
                  <Badge variant={getRoleBadgeVariant(selectedUser.role)} className="mt-2">
                    {getRoleBadgeText(selectedUser.role)}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <UserDetailItem
                    icon={Mail}
                    label={t('admin.users.details.email')}
                    value={selectedUser.email}
                  />
                  <UserDetailItem
                    icon={Phone}
                    label={t('admin.users.details.phone')}
                    value={selectedUser.phoneNumber}
                  />
                  <UserDetailItem
                    icon={Calendar}
                    label={t('admin.users.details.join_date')}
                    value={formatDate(selectedUser.createdAt)}
                  />
                  {selectedUser.address && (
                    <UserDetailItem
                      icon={MapPin}
                      label={t('admin.users.details.address')}
                      value={selectedUser.address}
                    />
                  )}
                  {selectedUser.lastLogin && (
                    <UserDetailItem
                      icon={Clock}
                      label={t('admin.users.details.last_login')}
                      value={formatDate(selectedUser.lastLogin)}
                    />
                  )}
                  {selectedUser.dateOfBirth && (
                    <UserDetailItem
                      icon={Calendar}
                      label={t('admin.users.details.dob')}
                      value={formatDate(selectedUser.dateOfBirth)}
                    />
                  )}
                  {selectedUser.gender && (
                    <UserDetailItem
                      icon={User}
                      label={t('admin.users.details.gender')}
                      value={selectedUser.gender === 'male' ? t('admin.users.details.male') : t('admin.users.details.female')}
                    />
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default AdminUsers