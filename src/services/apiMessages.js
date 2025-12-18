/**
 * API Message Mapping
 * Maps backend plain-text messages to bilingual (Arabic/English) translations
 * 
 * Usage: When backend returns a message like "invalid password",
 * this maps it to user-friendly translations in both languages.
 */

export const API_MESSAGE_TRANSLATIONS = {
    // ===== FILE MESSAGES =====
    'file is required': {
        ar: 'الملف مطلوب',
        en: 'File is required'
    },

    // ===== USER MESSAGES =====
    // General user operations
    'user already exist': {
        ar: 'المستخدم موجود مسبقاً',
        en: 'User already exists'
    },
    'user not found': {
        ar: 'المستخدم غير موجود',
        en: 'User not found'
    },
    'user created successfully': {
        ar: 'تم إنشاء المستخدم بنجاح',
        en: 'User created successfully'
    },
    'Failed to create user': {
        ar: 'فشل إنشاء المستخدم',
        en: 'Failed to create user'
    },
    'user updated successfully': {
        ar: 'تم تحديث المستخدم بنجاح',
        en: 'User updated successfully'
    },
    'Failed to update user': {
        ar: 'فشل تحديث المستخدم',
        en: 'Failed to update user'
    },
    'user deleted successfully': {
        ar: 'تم حذف المستخدم بنجاح',
        en: 'User deleted successfully'
    },
    'Failed to delete user': {
        ar: 'فشل حذف المستخدم',
        en: 'Failed to delete user'
    },
    'user fetched successfully': {
        ar: 'تم جلب بيانات المستخدم بنجاح',
        en: 'User fetched successfully'
    },
    'user failed to fetch': {
        ar: 'فشل جلب بيانات المستخدم',
        en: 'Failed to fetch user'
    },

    // Authentication
    'user verified successfully': {
        ar: 'تم التحقق من المستخدم بنجاح',
        en: 'User verified successfully'
    },
    'invalid credentials': {
        ar: 'بيانات الدخول غير صحيحة',
        en: 'Invalid credentials'
    },
    // Handle backend typo
    'invalid credntiols': {
        ar: 'بيانات الدخول غير صحيحة',
        en: 'Invalid credentials'
    },
    'user not verified': {
        ar: 'المستخدم غير موثق',
        en: 'User not verified'
    },
    'invalid token': {
        ar: 'رمز التحقق غير صالح',
        en: 'Invalid token'
    },
    'login successfully': {
        ar: 'تم تسجيل الدخول بنجاح',
        en: 'Login successful'
    },
    'unauthorized to access this api': {
        ar: 'غير مصرح لك بالوصول لهذه الخدمة',
        en: 'Unauthorized to access this API'
    },
    'invalid password': {
        ar: 'كلمة المرور غير صحيحة',
        en: 'Invalid password'
    },
    'password updated successfully': {
        ar: 'تم تحديث كلمة المرور بنجاح',
        en: 'Password updated successfully'
    },
    'invalid OTP': {
        ar: 'رمز التحقق غير صحيح',
        en: 'Invalid OTP'
    },
    'failed to update password': {
        ar: 'فشل تحديث كلمة المرور',
        en: 'Failed to update password'
    },
    'no accounts found': {
        ar: 'لم يتم العثور على حسابات',
        en: 'No accounts found'
    },
    'OTP sent successfully': {
        ar: 'تم إرسال رمز التحقق بنجاح',
        en: 'OTP sent successfully'
    },
    'Acount created successfully plese check your mail to verify': {
        ar: 'تم إنشاء الحساب بنجاح، يرجى التحقق من بريدك الإلكتروني',
        en: 'Account created successfully, please check your email to verify'
    },

    // Password validation errors
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character': {
        ar: 'كلمة المرور يجب أن تحتوي على حرف كبير وحرف صغير ورقم ورمز خاص على الأقل',
        en: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    },

    // ===== LESSON MESSAGES =====
    'lesson already exist': {
        ar: 'الدرس موجود مسبقاً',
        en: 'Lesson already exists'
    },
    'lesson not found': {
        ar: 'الدرس غير موجود',
        en: 'Lesson not found'
    },
    'lesson created successfully': {
        ar: 'تم إنشاء الدرس بنجاح',
        en: 'Lesson created successfully'
    },
    'Failed to create lesson': {
        ar: 'فشل إنشاء الدرس',
        en: 'Failed to create lesson'
    },
    'lesson updated successfully': {
        ar: 'تم تحديث الدرس بنجاح',
        en: 'Lesson updated successfully'
    },
    'Failed to update lesson': {
        ar: 'فشل تحديث الدرس',
        en: 'Failed to update lesson'
    },
    'lesson deleted successfully': {
        ar: 'تم حذف الدرس بنجاح',
        en: 'Lesson deleted successfully'
    },
    'Failed to delete lesson': {
        ar: 'فشل حذف الدرس',
        en: 'Failed to delete lesson'
    },
    'lesson fetched successfully': {
        ar: 'تم جلب الدرس بنجاح',
        en: 'Lesson fetched successfully'
    },
    'lesson failed to fetch': {
        ar: 'فشل جلب الدرس',
        en: 'Failed to fetch lesson'
    },

    // ===== QUESTION MESSAGES =====
    'question already exist': {
        ar: 'السؤال موجود مسبقاً',
        en: 'Question already exists'
    },
    'question not found': {
        ar: 'السؤال غير موجود',
        en: 'Question not found'
    },
    'question created successfully': {
        ar: 'تم إنشاء السؤال بنجاح',
        en: 'Question created successfully'
    },
    'Failed to create question': {
        ar: 'فشل إنشاء السؤال',
        en: 'Failed to create question'
    },
    'question updated successfully': {
        ar: 'تم تحديث السؤال بنجاح',
        en: 'Question updated successfully'
    },
    'Failed to update question': {
        ar: 'فشل تحديث السؤال',
        en: 'Failed to update question'
    },
    'question deleted successfully': {
        ar: 'تم حذف السؤال بنجاح',
        en: 'Question deleted successfully'
    },
    'Failed to delete question': {
        ar: 'فشل حذف السؤال',
        en: 'Failed to delete question'
    },
    'question fetched successfully': {
        ar: 'تم جلب السؤال بنجاح',
        en: 'Question fetched successfully'
    },
    'question failed to fetch': {
        ar: 'فشل جلب السؤال',
        en: 'Failed to fetch question'
    },

    // ===== EXAM MESSAGES =====
    'exam already exist': {
        ar: 'الامتحان موجود مسبقاً',
        en: 'Exam already exists'
    },
    'exam not found': {
        ar: 'الامتحان غير موجود',
        en: 'Exam not found'
    },
    'exam created successfully': {
        ar: 'تم إنشاء الامتحان بنجاح',
        en: 'Exam created successfully'
    },
    'Failed to create exam': {
        ar: 'فشل إنشاء الامتحان',
        en: 'Failed to create exam'
    },
    'exam updated successfully': {
        ar: 'تم تحديث الامتحان بنجاح',
        en: 'Exam updated successfully'
    },
    'Failed to update exam': {
        ar: 'فشل تحديث الامتحان',
        en: 'Failed to update exam'
    },
    'exam deleted successfully': {
        ar: 'تم حذف الامتحان بنجاح',
        en: 'Exam deleted successfully'
    },
    'Failed to delete exam': {
        ar: 'فشل حذف الامتحان',
        en: 'Failed to delete exam'
    },
    'exam fetched successfully': {
        ar: 'تم جلب الامتحان بنجاح',
        en: 'Exam fetched successfully'
    },
    'exam failed to fetch': {
        ar: 'فشل جلب الامتحان',
        en: 'Failed to fetch exam'
    },

    // ===== ADMIN MESSAGES =====
    'admin already exist': {
        ar: 'المسؤول موجود مسبقاً',
        en: 'Admin already exists'
    },
    'admin not found': {
        ar: 'المسؤول غير موجود',
        en: 'Admin not found'
    },
    'admin created successfully': {
        ar: 'تم إنشاء المسؤول بنجاح',
        en: 'Admin created successfully'
    },
    'Failed to create admin': {
        ar: 'فشل إنشاء المسؤول',
        en: 'Failed to create admin'
    },
    'admin updated successfully': {
        ar: 'تم تحديث المسؤول بنجاح',
        en: 'Admin updated successfully'
    },
    'Failed to update admin': {
        ar: 'فشل تحديث المسؤول',
        en: 'Failed to update admin'
    },
    'admin deleted successfully': {
        ar: 'تم حذف المسؤول بنجاح',
        en: 'Admin deleted successfully'
    },
    'Failed to delete admin': {
        ar: 'فشل حذف المسؤول',
        en: 'Failed to delete admin'
    },
    'admin fetched successfully': {
        ar: 'تم جلب بيانات المسؤول بنجاح',
        en: 'Admin fetched successfully'
    },
    'admin failed to fetch': {
        ar: 'فشل جلب بيانات المسؤول',
        en: 'Failed to fetch admin'
    },

    // ===== GENERIC ERROR MESSAGES =====
    'Network Error': {
        ar: 'خطأ في الاتصال بالشبكة',
        en: 'Network Error'
    },
    'Request failed': {
        ar: 'فشل الطلب',
        en: 'Request failed'
    },
    'Server Error': {
        ar: 'خطأ في الخادم',
        en: 'Server Error'
    },
    'Connection error': {
        ar: 'خطأ في الاتصال',
        en: 'Connection error'
    },
    'Session expired. Please log in again.': {
        ar: 'انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى',
        en: 'Session expired. Please log in again.'
    },
    'Something went wrong': {
        ar: 'حدث خطأ ما',
        en: 'Something went wrong'
    }
};

/**
 * Get translated message based on backend text
 * @param {string} backendMessage - Plain text message from backend
 * @param {string} lang - Language code ('ar' or 'en')
 * @returns {string} Translated message or original if not found
 */
export const getTranslatedMessage = (backendMessage, lang = 'en') => {
    if (!backendMessage) return '';

    // Normalize the message (trim whitespace)
    const normalizedMessage = backendMessage.trim();

    // ===== HANDLE VALIDATION ERRORS =====
    // Convert validation errors (e.g., regex pattern) to simple messages
    if (normalizedMessage.includes('fails to match the required pattern')) {
        const simpleMessage = {
            ar: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
            en: 'Invalid email or password'
        };
        return simpleMessage[lang] || simpleMessage.en;
    }

    // Try exact match first
    const translation = API_MESSAGE_TRANSLATIONS[normalizedMessage];
    if (translation) {
        return translation[lang] || translation.en || normalizedMessage;
    }

    // Try case-insensitive match
    const lowerMessage = normalizedMessage.toLowerCase();
    const matchingKey = Object.keys(API_MESSAGE_TRANSLATIONS).find(
        key => key.toLowerCase() === lowerMessage
    );

    if (matchingKey) {
        const translation = API_MESSAGE_TRANSLATIONS[matchingKey];
        return translation[lang] || translation.en || normalizedMessage;
    }

    // Fallback: return original message
    return backendMessage;
};

/**
 * Determine message type based on content
 * @param {string} message - Message text
 * @param {number} statusCode - HTTP status code
 * @returns {'success'|'error'|'warning'}
 */
export const getMessageType = (message, statusCode) => {
    if (statusCode >= 200 && statusCode < 300) return 'success';
    if (statusCode >= 400 && statusCode < 500) return 'warning';
    if (statusCode >= 500) return 'error';

    const lowerMessage = message.toLowerCase();

    // Success indicators
    if (lowerMessage.includes('successfully') ||
        lowerMessage.includes('created') ||
        lowerMessage.includes('updated') ||
        lowerMessage.includes('deleted') ||
        lowerMessage.includes('sent')) {
        return 'success';
    }

    // Error indicators
    if (lowerMessage.includes('failed') ||
        lowerMessage.includes('invalid') ||
        lowerMessage.includes('error') ||
        lowerMessage.includes('not found') ||
        lowerMessage.includes('unauthorized')) {
        return 'error';
    }

    return 'warning';
};
