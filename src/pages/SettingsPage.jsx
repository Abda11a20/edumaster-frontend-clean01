import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Settings,
    Globe,
    Calendar as CalendarIcon,
    CheckSquare,
    Plus,
    Trash2,
    Check,
    Clock,
    ArrowRight,
    ArrowLeft,
    Palette,
    Languages,
    ListTodo
} from 'lucide-react'
import { DayPicker } from 'react-day-picker'
import { format, isToday, parseISO, compareAsc, isPast } from 'date-fns'
import { ar } from 'date-fns/locale'
import { useTranslation } from '../hooks/useTranslation'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import ThemeToggleIcon from '@/components/ThemeToggleIcon'
import 'react-day-picker/dist/style.css'

const SettingsPage = () => {
    const { t, lang, toggleLanguage } = useTranslation()
    const { theme, toggleTheme, isDark } = useTheme()
    const { user } = useAuth()
    const navigate = useNavigate()

    // Todo List State
    const [todos, setTodos] = useState(() => {
        const saved = localStorage.getItem(`todos_${user?.id || 'guest'}`)
        return saved ? JSON.parse(saved) : []
    })
    const [newTodo, setNewTodo] = useState('')
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [selectedTime, setSelectedTime] = useState('12:00')

    // Save todos to localStorage
    useEffect(() => {
        localStorage.setItem(`todos_${user?.id || 'guest'}`, JSON.stringify(todos))
    }, [todos, user?.id])

    const handleAddTodo = (e) => {
        e.preventDefault()
        if (!newTodo.trim()) return

        // Create a date object with the selected time
        const [hours, minutes] = selectedTime.split(':')
        const taskDate = new Date(selectedDate)
        taskDate.setHours(parseInt(hours), parseInt(minutes))

        const todo = {
            id: Date.now(),
            text: newTodo,
            date: taskDate.toISOString(),
            completed: false
        }

        setTodos([...todos, todo])
        setNewTodo('')
    }

    const toggleTodo = (id) => {
        setTodos(todos.map(todo =>
            todo.id === id ? { ...todo, completed: !todo.completed } : todo
        ))
    }

    const deleteTodo = (id) => {
        setTodos(todos.filter(todo => todo.id !== id))
    }

    // Sort todos: Incomplete first (by date), then Completed (by date)
    const sortedTodos = [...todos].sort((a, b) => {
        // First by completion status
        if (a.completed !== b.completed) return a.completed ? 1 : -1

        // Then by date
        return compareAsc(parseISO(a.date), parseISO(b.date))
    })

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5, staggerChildren: 0.1 }
        }
    }

    const itemVariants = {
        hidden: { opacity: 0, x: -20 },
        visible: { opacity: 1, x: 0 }
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto space-y-6">

                {/* Back Button */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex justify-start"
                >
                    <Button
                        variant="ghost"
                        onClick={() => navigate('/dashboard')}
                        className="gap-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 group"
                    >
                        {lang === 'ar' ? (
                            <ArrowRight className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        ) : (
                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        )}
                        {t('common.back_to_dashboard')}
                    </Button>
                </motion.div>

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center space-x-4 rtl:space-x-reverse"
                >
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/20">
                        <Settings className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            {t('common.settings_page.title')}
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                            {t('common.settings_page.subtitle')}
                        </p>
                    </div>
                </motion.div>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 lg:grid-cols-2 gap-8"
                >
                    {/* Appearance & Language Settings */}
                    <motion.div variants={itemVariants} className="space-y-8">
                        <Card className="border-none shadow-lg dark:bg-gray-800 overflow-hidden">
                            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-800 pt-6">
                                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                        <Palette className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <CardTitle>{t('common.settings_page.appearance.title')}</CardTitle>
                                </div>
                                <CardDescription className="mt-2">
                                    {t('common.settings_page.appearance.desc')}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6">

                                {/* Language Toggle */}
                                <div className="group flex items-center justify-between p-4 bg-white dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-900 transition-colors shadow-sm hover:shadow-md">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-colors">
                                            <Languages className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-base font-medium cursor-pointer">
                                                {t('common.language')}
                                            </Label>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {lang === 'ar' ? t('common.settings_page.appearance.lang_ar') : t('common.settings_page.appearance.lang_en')}
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={toggleLanguage}
                                        className="min-w-[100px] font-medium"
                                    >
                                        {lang === 'ar' ? 'English' : 'العربية'}
                                    </Button>
                                </div>

                                {/* Theme Toggle */}
                                <div className="group flex items-center justify-between p-4 bg-white dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-900 transition-colors shadow-sm hover:shadow-md">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg group-hover:bg-amber-100 dark:group-hover:bg-amber-900/40 transition-colors">
                                            <ThemeToggleIcon theme={isDark ? 'dark' : 'light'} />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-base font-medium cursor-pointer">
                                                {t('common.settings_page.appearance.theme_light')} / {t('common.settings_page.appearance.theme_dark')}
                                            </Label>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {isDark ? t('common.settings_page.appearance.theme_dark') : t('common.settings_page.appearance.theme_light')}
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={toggleTheme}
                                        className="rounded-full h-10 w-10 hover:bg-gray-100 dark:hover:bg-gray-800"
                                    >
                                        <ThemeToggleIcon theme={isDark ? 'dark' : 'light'} />
                                    </Button>
                                </div>

                            </CardContent>
                        </Card>

                        {/* Calendar Widget */}
                        <Card className="border-none shadow-lg dark:bg-gray-800 overflow-hidden">
                            <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-gray-800 dark:to-gray-800 pt-6">
                                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                        <CalendarIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <CardTitle>{t('common.settings_page.calendar.title')}</CardTitle>
                                </div>
                                <CardDescription className="mt-2">
                                    {t('common.settings_page.calendar.desc')}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex justify-center p-6 bg-white dark:bg-gray-900">
                                <div className="p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800/50">
                                    <DayPicker
                                        mode="single"
                                        selected={selectedDate}
                                        onSelect={(date) => date && setSelectedDate(date)}
                                        className="!m-0"
                                        showOutsideDays
                                        modifiers={{
                                            selected: selectedDate,
                                            today: new Date()
                                        }}
                                        modifiersStyles={{
                                            selected: {
                                                backgroundColor: 'var(--blue-600)',
                                                color: 'white',
                                                borderRadius: '8px'
                                            },
                                            today: {
                                                fontWeight: 'bold',
                                                color: 'var(--blue-500)',
                                                border: '2px solid var(--blue-200)',
                                                borderRadius: '8px'
                                            }
                                        }}
                                    />
                                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 text-center">
                                        <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                            {isToday(new Date()) ? (
                                                lang === 'ar' ? 'اليوم: ' + format(new Date(), 'PPPP', { locale: ar }) : 'Today: ' + format(new Date(), 'PPPP')
                                            ) : ''}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* To-Do List */}
                    <motion.div variants={itemVariants} className="h-full">
                        <Card className="h-full border-none shadow-lg dark:bg-gray-800 flex flex-col overflow-hidden">
                            <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-gray-800 dark:to-gray-800 pt-6">
                                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                                        <ListTodo className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                    <CardTitle>{t('common.settings_page.todo.title')}</CardTitle>
                                </div>
                                <CardDescription className="mt-2">
                                    {t('common.settings_page.todo.desc')}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1 flex flex-col space-y-4 pt-6 bg-white dark:bg-gray-900/50">

                                {/* Add Task Input */}
                                <form onSubmit={handleAddTodo} className="space-y-3 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                                    <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                                        {t('common.settings_page.todo.add_label')}
                                    </Label>

                                    <div className="flex flex-col gap-3">
                                        <Input
                                            placeholder={t('common.settings_page.todo.add_placeholder')}
                                            value={newTodo}
                                            onChange={(e) => setNewTodo(e.target.value)}
                                            className="w-full border-gray-200 dark:border-gray-700 focus:ring-emerald-500"
                                        />

                                        <div className="flex gap-2">
                                            {/* Date Picker Input (HTML5) for Clarity */}
                                            <div className="relative flex-1">
                                                <Input
                                                    type="date"
                                                    value={format(selectedDate, 'yyyy-MM-dd')}
                                                    onChange={(e) => setSelectedDate(new Date(e.target.value))}
                                                    className="w-full text-sm text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700"
                                                />
                                            </div>

                                            {/* Time Picker */}
                                            <div className="w-1/3">
                                                <Input
                                                    type="time"
                                                    value={selectedTime}
                                                    onChange={(e) => setSelectedTime(e.target.value)}
                                                    className="w-full ltr:text-center text-sm border-gray-200 dark:border-gray-700"
                                                />
                                            </div>

                                            <Button
                                                type="submit"
                                                disabled={!newTodo.trim()}
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </form>

                                {/* Tasks List */}
                                <div className="flex-1 overflow-y-auto space-y-3 max-h-[600px] pr-2 custom-scrollbar">
                                    <AnimatePresence initial={false} mode="popLayout">
                                        {sortedTodos.length === 0 ? (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="flex flex-col items-center justify-center py-12 text-gray-400"
                                            >
                                                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-full mb-3">
                                                    <CheckSquare className="w-8 h-8 opacity-50" />
                                                </div>
                                                <p>{t('common.settings_page.todo.empty')}</p>
                                            </motion.div>
                                        ) : (
                                            sortedTodos.map((todo) => {
                                                const isDone = todo.completed;
                                                const isOverdue = !isDone && isPast(parseISO(todo.date)) && !isToday(parseISO(todo.date));

                                                return (
                                                    <motion.div
                                                        layout
                                                        key={todo.id}
                                                        initial={{ opacity: 0, scale: 0.95 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.95 }}
                                                        className={`
                                                            group flex items-center justify-between p-3.5 rounded-xl border transition-all duration-200
                                                            ${isDone
                                                                ? 'bg-gray-50 dark:bg-gray-800/30 border-gray-100 dark:border-gray-800/50 opacity-60'
                                                                : isOverdue
                                                                    ? 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/20 hover:shadow-md'
                                                                    : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-emerald-200 dark:hover:border-emerald-900 hover:shadow-md'
                                                            }
                                                        `}
                                                    >
                                                        <div className="flex items-center gap-3.5 flex-1 min-w-0">
                                                            <button
                                                                onClick={() => toggleTodo(todo.id)}
                                                                className={`
                                                                    flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200
                                                                    ${isDone
                                                                        ? 'bg-emerald-500 border-emerald-500 text-white scale-100'
                                                                        : 'border-gray-300 dark:border-gray-500 hover:border-emerald-500 active:scale-95'
                                                                    }
                                                                `}
                                                            >
                                                                <Check className={`w-3.5 h-3.5 transition-transform ${isDone ? 'scale-100' : 'scale-0'}`} />
                                                            </button>

                                                            <div className="flex flex-col min-w-0 gap-0.5">
                                                                <span className={`text-sm font-medium truncate transition-colors ${isDone ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-white'}`}>
                                                                    {todo.text}
                                                                </span>
                                                                <div className={`flex items-center gap-2 text-xs ${isOverdue ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                                                                    <span className={`flex items-center gap-1 ${isToday(parseISO(todo.date)) && !isDone ? 'text-blue-600 dark:text-blue-400 font-bold' : ''}`}>
                                                                        <CalendarIcon className="w-3 h-3" />
                                                                        {format(parseISO(todo.date), 'dd/MM/yyyy')}
                                                                    </span>
                                                                    <span>•</span>
                                                                    <span className="flex items-center gap-1">
                                                                        <Clock className="w-3 h-3" />
                                                                        {format(parseISO(todo.date), 'p', { locale: lang === 'ar' ? ar : undefined })}
                                                                    </span>
                                                                    {isOverdue && <span className="text-[10px] bg-red-100 dark:bg-red-900/30 px-1.5 py-0.5 rounded text-red-600 dark:text-red-400">{lang === 'ar' ? 'متأخرة' : 'Overdue'}</span>}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => deleteTodo(todo.id)}
                                                            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all h-8 w-8"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </motion.div>
                                                )
                                            })
                                        )}
                                    </AnimatePresence>
                                </div>

                            </CardContent>
                        </Card>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    )
}

export default SettingsPage
