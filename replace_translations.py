# -*- coding: utf-8 -*-
import re

# Read the file
with open(r'c:\Users\pc\Desktop\edumaster-frontend-clean\src\pages\ExamResultPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Define replacements (Arabic text -> translation key)
replacements = [
    # Error messages
    (r"'لم تقدم هذا الامتحان بعد\. يجب تقديم الامتحان أولاً لرؤية النتيجة\.'", "t('exams.examResult.messages.notSubmittedDesc')"),
    (r"'لم تقدم الامتحان'", "t('exams.examResult.messages.notSubmitted')"),
    (r"'يجب تقديم الامتحان أولاً لرؤية النتيجة'", "t('exams.examResult.messages.notSubmittedDesc')"),
    (r"'خطأ في تحميل النتيجة'", "t('exams.examResult.messages.loadingError')"),
    (r"'انتهت جلسة العمل\. يرجى تسجيل الدخول مرة أخرى'", "t('exams.examResult.errors.sessionExpired')"),
    (r"'خطأ في الاتصال بالإنترنت'", "t('exams.examResult.errors.networkError')"),
    (r"'حدث خطأ غير معروف'", "t('exams.examResult.errors.unknownError')"),
    (r"'خطأ'", "t('exams.examResult.errors.errorTitle')"),
    
    # Success messages
    (r"'تم التحديث'", "t('exams.examResult.messages.refreshed')"),
    (r"'تم جلب أحدث بيانات النتيجة'", "t('exams.examResult.messages.refreshedDesc')"),
    (r"'جاري التحضير'", "t('exams.examResult.messages.preparingPrint')"),
    (r"'سيتم فتح نافذة جديدة لطباعة الشهادة'", "t('exams.examResult.messages.preparingPrintDesc')"),
    (r"'تم النسخ'", "t('exams.examResult.messages.linkCopied')"),
    (r"'تم نسخ رابط الشهادة'", "t('exams.examResult.messages.linkCopiedDesc')"),
    
    # Page content
    (r"'لم تقدم الامتحان'", "t('exams.examResult.messages.notSubmitted')"),
    (r"'النتيجة غير متاحة'", "t('exams.examResult.messages.resultNotAvailable')"),
    (r"'تهانينا! لقد أنهيت الامتحان بنجاح'", "t('exams.examResult.congratulations')"),
    (r"'حاول مرة أخرى للوصول إلى النسبة المطلوبة'", "t('exams.examResult.tryAgain')"),
    
    # Buttons
    (r"العودة إلى الامتحانات", "t('exams.examResult.actions.backToExams')"),
    (r"تقديم الامتحان الآن", "t('exams.examResult.actions.submitNow')"),
    (r"تحديث النتيجة", "t('exams.examResult.actions.refreshResult')"),
    (r"عرض الشهادة", "t('exams.examResult.certificate.viewCertificate')"),
    (r"إعادة الامتحان", "t('exams.examResult.actions.retakeExam')"),
    (r"طباعة الشهادة", "t('exams.examResult.certificate.printCertificate')"),
    (r"تنزيل الشهادة", "t('exams.examResult.certificate.downloadCertificate')"),
    (r"مشاركة الشهادة", "t('exams.examResult.certificate.shareCertificate')"),
    (r"إغلاق", "t('exams.examResult.actions.close')"),
    
    # Stats labels
    (r"الدرجة النهائية", "t('exams.examResult.stats.finalScore')"),
    (r"النسبة المئوية", "t('exams.examResult.stats.percentage')"),
    (r"الوقت المستغرق", "t('exams.examResult.stats.timeSpent')"),
    (r"تاريخ الإكمال", "t('exams.examResult.stats.completionDate')"),
    (r"من الدرجة الكلية", "t('exams.examResult.stats.ofTotal')"),
    (r">دقيقة<", ">{t('exams.examResult.stats.minutes')}<"),
    (r"الساعة ", "t('exams.examResult.stats.at') + ' "),
    
    # Analysis section
    (r"تحليل مفصل للأداء", "t('exams.examResult.analysis.title')"),
    (r"ملخص أدائك في الامتحان", "t('exams.examResult.analysis.subtitle')"),
    (r"إجابات صحيحة", "t('exams.examResult.analysis.correctAnswers')"),
    (r"إجابات خاطئة", "t('exams.examResult.analysis.incorrectAnswers')"),
    (r"إجمالي الأسئلة", "t('exams.examResult.analysis.totalQuestions')"),
    (r"معدل النجاح", "t('exams.examResult.analysis.successRate')"),
    (r"مستوى الأداء", "t('exams.examResult.analysis.performanceLevel')"),
    (r"التصنيف", "t('exams.examResult.analysis.classification')"),
    
    # Performance feedback (these are more complex - need to be done after)
    (r"'أداء استثنائي! أنت من الطلاب المتميزين'", "t('exams.examResult.analysis.feedback.excellent')"),
    (r"'أداء ممتاز! حافظ على هذا المستوى'", "t('exams.examResult.analysis.feedback.veryGood')"),
    (r"'أداء جيد جداً! يمكنك التحسين أكثر'", "t('exams.examResult.analysis.feedback.good')"),
    (r"'أداء مقبول! تحتاج إلى مزيد من الجهد'", "t('exams.examResult.analysis.feedback.acceptable')"),
    (r"'تحتاج إلى التركيز أكثر والاستعداد جيداً'", "t('exams.examResult.analysis.feedback.failed')"),
]

# Apply text replacements
for pattern, replacement in replacements:
    content = re.sub(pattern, replacement, content)

# Write back
with open(r'c:\Users\pc\Desktop\edumaster-frontend-clean\src\pages\ExamResultPage.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Replacements completed successfully!")
