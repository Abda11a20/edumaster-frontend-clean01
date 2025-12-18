# -*- coding: utf-8 -*-
import re

# Read the file
with open(r'c:\Users\pc\Desktop\edumaster-frontend-clean\src\pages\ExamResultPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Certificate-related replacements
certificate_replacements = [
    # Certificate headers and titles
    (r"شهادة الإنجاز الأكاديمي", "t('exams.examResult.certificate.title')"),
    (r"شهادة معتمدة لإنجازك المتميز في الامتحان", "t('exams.examResult.certificate.certifiedBy')"),
    
    # Certificate content
    (r"تُمنح هذه الشهادة إلى الطالب المتميز", "t('exams.examResult.certificate.awardedTo')"),
    (r"تقديراً للتميز الأكاديمي", "t('exams.examResult.certificate.forExcellence')"),
    (r"تمنح هذه الشهادة تقديراً للتميز الأكاديمي", "t('exams.examResult.certificate.honoredFor')"),
    (r"تقديراً لإنجازه البارز في اجتياز امتحان", "t('exams.examResult.certificate.forAchievement')"),
    (r"بمستوى أداء استثنائي يدل على التميز والتفوق", "t('exams.examResult.certificate.exceptionalPerformance')"),
    
    # Certificate signatures and seals
    (r"ختم المنصة الرسمي", "t('exams.examResult.certificate.officialSeal')"),
    (r"مدير منصة EduMaster", "t('exams.examResult.certificate.platformManager')"),
    (r"المشرف الأكاديمي", "t('exams.examResult.certificate.academicSupervisor')"),
    (r">التوقيع<", ">{t('exams.examResult.certificate.signature')}<"),
    (r"التوقيع الرسمي", "t('exams.examResult.certificate.officialSignature')"),
    
    # Certificate metadata
    (r"تاريخ الإصدار", "t('exams.examResult.certificate.issueDate')"),
    (r"رقم الشهادة", "t('exams.examResult.certificate.certificateNumber')"),
    (r"هذه الشهادة معتمدة رسمياً من منصة EduMaster التعليمية", "t('exams.examResult.certificate.certifiedOfficial')"),
    (r"جميع الحقوق محفوظة ©", "t('exams.examResult.certificate.allRightsReserved')"),
    (r"للتحقق من صحة الشهادة، يرجى زيارة موقع المنصة الرسمي", "t('exams.examResult.certificate.verifyOnline')"),
    
    # Certificate stats labels
    (r"التقدير الأكاديمي", "t('exams.examResult.certificate.academicGrade')"),
    (r"التقدير", "t('exams.examResult.certificate.grade')"),
    (r"إنجاز متميز", "t('exams.examResult.certificate.distinctiveAchievement')"),
    
    # Names (we keep them in quotes so they don't get translated in the HTML template)
    # We've already added them as keys with proper structure for direction handling
]

# Apply replacements
for pattern, replacement in certificate_replacements:
    content = re.sub(pattern, replacement, content)

# Special handling for user names in certificate - replace with translation OR keep original
# The student name and platform names should be bilingual-aware
content = re.sub(
    r"user\?\\.fullName \|\| 'الطالب'", 
    "user?.fullName || t('exams.examResult.certificate.student')",
    content
)

# Write back
with open(r'c:\Users\pc\Desktop\edumaster-frontend-clean\src\pages\ExamResultPage.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Certificate translations completed successfully!")
