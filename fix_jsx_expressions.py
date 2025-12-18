# -*- coding: utf-8 -*-
import re

# Read the file
with open(r'c:\Users\pc\Desktop\edumaster-frontend-clean\src\pages\ExamResultPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix all instances where we have string 't(...)' that should be {t(...)}
# This happens in JSX children and attribute values

# Pattern 1: In JSX children like <span>t('key')</span> -> <span>{t('key')}</span>
# But we need to be careful not to match t() that's already in {}
content = re.sub(r'>t\((\'[^\']+\')\)<', r'>{t(\1)}<', content)

# Pattern 2: In JSX element content after an opening tag
content = re.sub(r'>\s*t\((\'exams\.[^\']+\')\)\s*<', r'>{t(\1)}<', content)

# Pattern 3: String concatenations with t() 
# Like: "الساعة " + t(...) -> {t('at') + " "}
# This is complex, let's handle it separately in specific patterns

# Pattern 4: In attributes (but this is tricky - we keep as is since they might be in template strings)

# Let's do a more comprehensive fix for all JSX text content:
# Find any standalone t('...') that's not already wrapped in {}, and wrap it

# More specific fixes for common patterns
replacements = [
    # Fix text content patterns
    (r'>(\s*)t\(([^\)]+)\)(\s*)<', r'>{\1t(\2)\3}<'),
    
    # Fix in className and other attributes where they might be raw strings
    (r'"t\(([^\)]+)\)"', r'{t(\1)}'),
]

for pattern, replacement in replacements:
    content = re.sub(pattern, replacement, content)

# Write back
with open(r'c:\Users\pc\Desktop\edumaster-frontend-clean\src\pages\ExamResultPage.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed translation function calls!")
