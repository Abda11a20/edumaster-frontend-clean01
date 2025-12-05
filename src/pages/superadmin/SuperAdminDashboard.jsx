import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ShieldCheck, Users, UserPlus } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { adminAPI } from '@/services/api'
import Navbar from '@/components/Navbar'

const SuperAdminDashboard = () => {
  const [counts, setCounts] = useState({ admins: 0, users: 0 })

  useEffect(() => {
    const load = async () => {
      try {
        const [adminsRes, usersRes] = await Promise.all([
          adminAPI.getAllAdmins().catch(() => []),
          adminAPI.getAllUsers().catch(() => [])
        ])
        const adminsCount = Array.isArray(adminsRes)
          ? adminsRes.length
          : (adminsRes?.data?.length || adminsRes?.admins?.length || 0)
        const usersCount = Array.isArray(usersRes)
          ? usersRes.length
          : (usersRes?.data?.length || usersRes?.users?.length || 0)
        setCounts({ admins: adminsCount, users: usersCount })
      } catch (_) {
        setCounts({ admins: 0, users: 0 })
      }
    }
    load()
  }, [])

  const QuickCard = ({ title, description, icon: Icon, to }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <a href={to}>
          <Button className="w-full">الانتقال</Button>
        </a>
      </CardContent>
    </Card>
  )

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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                لوحة السوبر أدمن
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                تحكم كامل بإدارة المشرفين والمستخدمين
              </p>
            </div>
            <ShieldCheck className="h-10 w-10 text-green-600" />
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>إجمالي المشرفين</CardTitle>
              <CardDescription>عدد حسابات الأدمن</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{counts.admins}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>إجمالي المستخدمين</CardTitle>
              <CardDescription>عدد حسابات المستخدمين</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{counts.users}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>إجراءات سريعة</CardTitle>
              <CardDescription>إدارة سريعة للحسابات</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2">
              <a href="/super-admin/admins" className="flex-1">
                <Button variant="outline" className="w-full">
                  <UserPlus className="h-4 w-4 ml-2" />
                  إدارة المشرفين
                </Button>
              </a>
              <a href="/super-admin/users" className="flex-1">
                <Button variant="outline" className="w-full">
                  <Users className="h-4 w-4 ml-2" />
                  إدارة المستخدمين
                </Button>
              </a>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <QuickCard
            title="إدارة المشرفين"
            description="عرض جميع المشرفين وإنشاء حساب أدمن جديد"
            icon={UserPlus}
            to="/super-admin/admins"
          />
          <QuickCard
            title="إدارة المستخدمين"
            description="عرض جميع المستخدمين المسجلين"
            icon={Users}
            to="/super-admin/users"
          />
        </div>
      </div>
    </div>
  )
}

export default SuperAdminDashboard
