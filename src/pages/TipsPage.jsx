import { motion } from 'framer-motion'
import { BookOpen, Lightbulb, Clock, Brain, Target, Coffee, ArrowRight, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from '../hooks/useTranslation'
import Navbar from '../components/Navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const TipsPage = () => {
    const { t, lang } = useTranslation()
    const navigate = useNavigate()

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    }

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    }

    const tips = [
        {
            icon: Clock,
            title: lang === 'ar' ? 'تنظيم الوقت' : 'Time Management',
            desc: lang === 'ar'
                ? 'قسم وقتك بين المذاكرة والراحة. استخدم تقنية بومودورو (25 دقيقة مذاكرة، 5 دقائق راحة) لزيادة التركيز.'
                : 'Divide your time between study and rest. Use the Pomodoro technique (25 min study, 5 min break) to boost focus.',
            color: 'text-blue-500',
            bg: 'bg-blue-50 dark:bg-blue-900/20'
        },
        {
            icon: Target,
            title: lang === 'ar' ? 'تحديد الأهداف' : 'Goal Setting',
            desc: lang === 'ar'
                ? 'ضع أهدافاً صغيرة ويومية قابلة للتحقيق بدلاً من الأهداف الكبيرة الغامضة. هذا يعزز شعورك بالإنجاز.'
                : 'Set small, daily achievable goals instead of vague big ones. This boosts your sense of achievement.',
            color: 'text-purple-500',
            bg: 'bg-purple-50 dark:bg-purple-900/20'
        },
        {
            icon: Brain,
            title: lang === 'ar' ? 'الفهم لا الحفظ' : 'Understand, Don\'t Memorize',
            desc: lang === 'ar'
                ? 'حاول ربط المعلومات ببعضها واستخدام الخرائط الذهنية. الفهم العميق يثبت المعلومة لفترة أطول.'
                : 'Try to connect information and use mind maps. Deep understanding retains information longer.',
            color: 'text-emerald-500',
            bg: 'bg-emerald-50 dark:bg-emerald-900/20'
        },
        {
            icon: Coffee,
            title: lang === 'ar' ? 'الراحة والنوم' : 'Rest & Sleep',
            desc: lang === 'ar'
                ? 'النوم الجيد يساعد عقلك على تخزين المعلومات. لا ترهق نفسك بالسهر الطويل ليلة الامتحان.'
                : 'Good sleep helps your brain store information. Do not exhaust yourself with all-nighters before exams.',
            color: 'text-orange-500',
            bg: 'bg-orange-50 dark:bg-orange-900/20'
        },
        {
            icon: Brain,
            title: lang === 'ar' ? 'الاستدعاء النشط' : 'Active Recall',
            desc: lang === 'ar'
                ? 'اختبر نفسك باستمرار بدلاً من مجرد إعادة القراءة. حاول استرجاع المعلومات من ذاكرتك لتقويتها.'
                : 'Test yourself constantly instead of just re-reading. Try to retrieve information from memory to strengthen it.',
            color: 'text-pink-500',
            bg: 'bg-pink-50 dark:bg-pink-900/20'
        },
        {
            icon: Clock,
            title: lang === 'ar' ? 'التكرار المتباعد' : 'Spaced Repetition',
            desc: lang === 'ar'
                ? 'راجع المعلومات على فترات متباعدة (بعد يوم، أسبوع، شهر) لترسيخها في الذاكرة طويلة المدى.'
                : 'Review information at spaced ranges (after a day, week, month) to cement it in long-term memory.',
            color: 'text-indigo-500',
            bg: 'bg-indigo-50 dark:bg-indigo-900/20'
        },
        {
            icon: Coffee,
            title: lang === 'ar' ? 'بيئة دراسية صحية' : 'Healthy Environment',
            desc: lang === 'ar'
                ? 'خصص مكاناً هادئاً ومرتباً للدراسة بعيداً عن المشتتات، مع إضاءة جيدة وتهوية مناسبة.'
                : 'Designate a quiet, tidy place for study away from distractions, with good lighting and ventilation.',
            color: 'text-teal-500',
            bg: 'bg-teal-50 dark:bg-teal-900/20'
        },
        {
            icon: BookOpen,
            title: lang === 'ar' ? 'شرح ما تعلمته' : 'Teach What You Learn',
            desc: lang === 'ar'
                ? 'حاول شرح الدرس لشخص آخر أو لنفسك بصوت عالٍ. إذا لم تستطع شرحه ببساطة، فأنت لم تفهمه جيداً بعد.'
                : 'Try explaining the lesson to someone else or yourself aloud. If you can\'t explain it simply, you don\'t understand it well enough.',
            color: 'text-cyan-500',
            bg: 'bg-cyan-50 dark:bg-cyan-900/20'
        }
    ]

    const quotes = [
        {
            text: lang === 'ar' ? "التعليم هو أقوى سلاح يمكنك استخدامه لتغيير العالم." : "Education is the most powerful weapon which you can use to change the world.",
            author: lang === 'ar' ? "نيلسون مانديلا" : "Nelson Mandela",
            role: lang === 'ar' ? "زعيم سياسي" : "Political Leader"
        },
        {
            text: lang === 'ar' ? "العلم يحرسك وأنت تحرس المال، والعلم حاكم والمال محكوم عليه." : "Knowledge guards you while you guard wealth. Knowledge judges while wealth is judged.",
            author: lang === 'ar' ? "علي بن أبي طالب (رضي الله عنه)" : "Ali ibn Abi Talib",
            role: lang === 'ar' ? "صحابي جليل" : "Companion of the Prophet"
        },
        {
            text: lang === 'ar' ? "العلم نور لا يهدى لعاصي." : "Knowledge is a light that is not given to a sinner.",
            author: lang === 'ar' ? "الإمام الشافعي" : "Imam Al-Shafi'i",
            role: lang === 'ar' ? "عالم فقيه" : "Islamic Scholar"
        },
        {
            text: lang === 'ar' ? "الخيال أهم من المعرفة." : "Imagination is more important than knowledge.",
            author: lang === 'ar' ? "ألبرت أينشتاين" : "Albert Einstein",
            role: lang === 'ar' ? "عالم فيزياء" : "Physicist"
        },
        {
            text: lang === 'ar' ? "التفاؤل هو الإيمان الذي يؤدي إلى الإنجاز." : "Optimism is the faith that leads to achievement.",
            author: lang === 'ar' ? "هيلين كيلر" : "Helen Keller",
            role: lang === 'ar' ? "كاتبة وناشطة" : "Author & Activist"
        },
        {
            text: lang === 'ar' ? "الحكمة الحقيقية الوحيدة هي في معرفة أنك لا تعرف شيئاً." : "The only true wisdom is in knowing you know nothing.",
            author: lang === 'ar' ? "سقراط" : "Socrates",
            role: lang === 'ar' ? "فيلسوف يوناني" : "Greek Philosopher"
        },
        {
            text: lang === 'ar' ? "التعليم هو جواز السفر للمستقبل." : "Education is the passport to the future.",
            author: lang === 'ar' ? "مالكوم إكس" : "Malcolm X",
            role: lang === 'ar' ? "داعية حقوقي" : "Human Rights Activist"
        }
    ]

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Navbar />

            <main className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
                {/* Back Button */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="mb-8"
                >
                    <Button
                        variant="ghost"
                        onClick={() => navigate('/profile')}
                        className="group flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm hover:shadow-md transition-all duration-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    >
                        {lang === 'ar' ? (
                            <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-blue-600 dark:text-gray-400 dark:group-hover:text-blue-400 group-hover:-translate-x-1 transition-transform" />
                        ) : (
                            <ArrowLeft className="w-5 h-5 text-gray-500 group-hover:text-blue-600 dark:text-gray-400 dark:group-hover:text-blue-400 group-hover:-translate-x-1 transition-transform" />
                        )}
                        <span className="font-medium text-gray-700 dark:text-gray-200 group-hover:text-blue-700 dark:group-hover:text-blue-300">
                            {t('common.back') || (lang === 'ar' ? 'عودة' : 'Back')}
                        </span>
                    </Button>
                </motion.div>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-8"
                >
                    {/* Header */}
                    <div className="text-center space-y-2">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="inline-flex p-3 rounded-full bg-yellow-100 dark:bg-yellow-900/30 mb-4"
                        >
                            <Lightbulb className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
                        </motion.div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            {lang === 'ar' ? 'نصائح وإرشادات' : 'Tips & Guidance'}
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
                            {lang === 'ar'
                                ? 'مجموعة من النصائح الذهبية لمساعدتك في رحلتك التعليمية وتحقيق التفوق'
                                : 'A collection of golden tips to help you in your educational journey and achieve excellence'}
                        </p>
                    </div>

                    {/* Religious Verse Section */}
                    <motion.div variants={itemVariants}>
                        <Card className="border-none shadow-lg overflow-hidden relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 opacity-90" />
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] opacity-10" />

                            <CardContent className="relative p-8 md:p-12 text-center text-white space-y-8">
                                <div className="space-y-6">
                                    <p className="text-lg opacity-90 font-light tracking-widest font-amiri">
                                        بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
                                    </p>
                                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-amiri leading-loose font-bold" style={{ lineHeight: '1.8' }}>
                                        يَرْفَعِ اللَّهُ الَّذِينَ آمَنُوا مِنكُمْ وَالَّذِينَ أُوتُوا الْعِلْمَ دَرَجَاتٍ وَاللَّهُ بِمَا تَعْمَلُونَ خَبِيرٌ
                                    </h2>
                                </div>
                                <div className="w-24 h-px bg-white/30 mx-auto" />
                                <div className="space-y-2">
                                    <p className="text-lg font-medium opacity-90">
                                        حثّ النبي -صلى الله عليه وسلم- على طلب العلم، فقال:
                                    </p>
                                    <p className="text-xl font-amiri">
                                        (من سلك طريقًا يلتمسُ فيه علمًا، سهَّل اللهُ له طريقًا إلى الجنَّةِ)
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Inspirational Quotes Section */}
                    <motion.div variants={containerVariants} className="space-y-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="h-8 w-1 bg-purple-500 rounded-full" />
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {lang === 'ar' ? 'أقوال مأثورة عن العلم' : 'Inspirational Quotes'}
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {quotes.map((quote, index) => (
                                <motion.div key={index} variants={itemVariants} whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 300 }}>
                                    <Card className="h-full bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300">
                                        <CardContent className="p-6 flex flex-col h-full relative overflow-hidden">
                                            <div className="absolute top-4 right-4 text-6xl text-gray-100 dark:text-gray-700 font-serif opacity-50 z-0">
                                                "
                                            </div>
                                            <div className="relative z-10 flex-1">
                                                <p className="text-lg text-gray-700 dark:text-gray-300 font-medium leading-relaxed italic mb-4">
                                                    "{quote.text}"
                                                </p>
                                            </div>
                                            <div className="relative z-10 flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-gray-700 mt-auto">
                                                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-500 dark:text-gray-400">
                                                    {quote.author.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                                        {quote.author}
                                                    </p>
                                                    <p className="text-xs text-blue-600 dark:text-blue-400">
                                                        {quote.role}
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Tips Grid */}
                    <motion.div variants={containerVariants} className="space-y-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="h-8 w-1 bg-amber-500 rounded-full" />
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {lang === 'ar' ? 'نصائح دراسية' : 'Study Tips'}
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {tips.map((tip, index) => (
                                <motion.div key={index} variants={itemVariants}>
                                    <Card className="h-full border-none shadow-md hover:shadow-lg transition-shadow dark:bg-gray-800">
                                        <CardContent className="p-6 flex items-start space-x-4 rtl:space-x-reverse">
                                            <div className={`p-3 rounded-xl ${tip.bg}`}>
                                                <tip.icon className={`w-6 h-6 ${tip.color}`} />
                                            </div>
                                            <div className="flex-1 space-y-2">
                                                <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                                                    {tip.title}
                                                </h3>
                                                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                                                    {tip.desc}
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </motion.div>
            </main>
        </div>
    )
}

export default TipsPage
