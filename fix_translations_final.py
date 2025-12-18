# -*- coding: utf-8 -*-
import re

file_path = r'c:\Users\pc\Desktop\edumaster-frontend-clean\src\pages\ExamResultPage.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Fix t() calls that are not wrapped in {}
# We look for t('exams.examResult...') that is NOT preceded by { or a letter (to avoid matching inside other words, though unlikely)
# and NOT inside an existing {} block (approximate check)

def replace_raw_t(match):
    full_match = match.group(0)
    # If it's already {t(...)}, don't touch it
    # We check the character immediately before the match in the original string, but regex makes this hard
    # So we used lookbehind in regex below
    return "{" + full_match + "}"

# Regex for t('exams.examResult...') NOT preceded by {
# We use a negative lookbehind (?<!\{) to ensure there is no opening brace before t
# We also want to skip if it's inside a string assignment like className="... t(...)" - wait, actually className logic was processed before?
# If we have className="t(...)", we WANT it to become className={t(...)} ideally, or className={`... ${t(...)}`}.
# But the previous script might have generated className="... t(...)" which is invalid class.
# However, most replacements were in text content.

# Let's handle generic text content first
# Pattern: t('exams.examResult.[key]') found in text
# We'll match the whole function call
pattern = r"(?<!\{)(?<![a-zA-Z0-9_])t\('exams\.examResult\.[^']+'\)"
content = re.sub(pattern, replace_raw_t, content)

# 2. Fix the specific case of string concatenation that might have been messed up
# e.g. t('key') + ' '
# inner content: t('exams.examResult.stats.at') + ' '
# If this became {t(...)} + ' ' inside JSX, it renders "Time + ' '"
# It should be {t(...) + ' '}
# Let's look for: } + '
content = re.sub(r"\}\s*\+\s*'([^']*)'", r" + '\1'}", content)

# 3. Replace hardcoded names
replacements = [
    (r"محمود أشرف", "{t('exams.examResult.certificate.managerName')}"),
    (r"يوسف حسام", "{t('exams.examResult.certificate.supervisorName')}"),
    (r"EduMaster", "EduMaster"), # Keep brand name
]

for old, new in replacements:
    content = content.replace(old, new)

# 4. Clean up double braces if any {{t(...)}} -> {t(...)} (just in case)
content = re.sub(r"\{\{t\('([^']+)'\)\}\}", r"{t('\1')}", content)

# 5. Fix dates? 
# Content has: new Date().toLocaleDateString('ar-EG', ...)
# Let's change it to respect current locale if possible, or just 'en-US' for now?
# Actually cleaner to use the `t` function or a computed property. 
# But let's just make it dynamic based on current language would be hard without access to `i18n.language`.
# For now, let's leave the date locale as is, or change to undefined to use browser default?
# User wanted bilingual, so maybe `i18n.language` is needed.
# We have `const { t } = useTranslation()`. `useTranslation` usually returns `{ t, i18n }`.
# Let's update the hook usage.

content = content.replace("const { t } = useTranslation()", "const { t, i18n } = useTranslation()")
content = content.replace("'ar-EG'", "i18n.language === 'ar' ? 'ar-EG' : 'en-US'")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed translation syntax and hardcoded names.")
