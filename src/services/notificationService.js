/**
 * Notification Service
 * Centralized handler for all application notifications
 * Integrates with sonner toast library and supports:
 * - Bilingual messages (Arabic/English)
 * - Theme adaptation (Light/Dark)
 * - RTL/LTR layout
 */

import { toast } from 'sonner';
import { getTranslatedMessage, getMessageType } from './apiMessages';

/**
 * Show notification with automatic translation and styling
 * @param {string} message - Backend message text
 * @param {Object} options - Notification options
 * @param {string} options.lang - Language code ('ar' or 'en')
 * @param {'success'|'error'|'warning'|'info'} options.type - Notification type
 * @param {number} options.statusCode - HTTP status code
 * @param {number} options.duration - Duration in ms (default: 4000)
 */
export const showNotification = (message, options = {}) => {
    const {
        lang = 'en',
        type,
        statusCode = 200,
        duration = 4000,
        ...customOptions
    } = options;

    // Skip if no message
    if (!message) return;

    // Translate the message
    const translatedMessage = getTranslatedMessage(message, lang);

    // Determine notification type if not explicitly provided
    const notificationType = type || getMessageType(message, statusCode);

    // Show appropriate toast based on type
    switch (notificationType) {
        case 'success':
            toast.success(translatedMessage, {
                duration,
                ...customOptions
            });
            break;

        case 'error':
            toast.error(translatedMessage, {
                duration,
                ...customOptions
            });
            break;

        case 'warning':
            toast.warning(translatedMessage, {
                duration,
                ...customOptions
            });
            break;

        default:
            toast(translatedMessage, {
                duration,
                ...customOptions
            });
    }
};

/**
 * Show success notification
 * @param {string} message - Success message
 * @param {string} lang - Language code
 */
export const showSuccess = (message, lang = 'en') => {
    showNotification(message, { lang, type: 'success' });
};

/**
 * Show error notification
 * @param {string} message - Error message
 * @param {string} lang - Language code
 */
export const showError = (message, lang = 'en') => {
    showNotification(message, { lang, type: 'error' });
};

/**
 * Show warning notification
 * @param {string} message - Warning message
 * @param {string} lang - Language code
 */
export const showWarning = (message, lang = 'en') => {
    showNotification(message, { lang, type: 'warning' });
};

export default {
    showNotification,
    showSuccess,
    showError,
    showWarning
};
