# -*- coding: utf-8 -*-
import re

file_path = r'c:\Users\pc\Desktop\edumaster-frontend-clean\src\pages\ExamResultPage.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Fix hook destructuring
content = content.replace("const { t, i18n } = useTranslation()", "const { t, lang } = useTranslation()")

# 2. Fix variable usage
content = content.replace("i18n.language", "lang")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed i18n variable usage.")
