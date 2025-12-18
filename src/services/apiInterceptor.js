/**
 * API Response Interceptor
 * Wraps the existing apiRequest function to automatically show notifications
 * for all API responses without modifying the original api.js file
 */

import { showNotification } from './notificationService';

// Store language getter function (will be set by initialization)
let getLanguage = () => 'en';

/**
 * Initialize the interceptor with language getter
 * @param {Function} langGetter - Function that returns current language ('ar' or 'en')
 */
export const initializeInterceptor = (langGetter) => {
    if (typeof langGetter === 'function') {
        getLanguage = langGetter;
    }
};

/**
 * Wraps API request function to intercept responses
 * @param {Function} apiRequestFn - Original apiRequest function
 * @returns {Function} Wrapped function with notification support
 */
export const createInterceptedRequest = (apiRequestFn) => {
    return async (...args) => {
        try {
            // Call original API request
            const response = await apiRequestFn(...args);

            // Check if response contains a message
            if (response && typeof response === 'object') {
                const message = response.message || response.msg || response.success;

                // Show success notification if message exists
                if (message && typeof message === 'string') {
                    const lang = getLanguage();
                    showNotification(message, {
                        lang,
                        type: 'success',
                        statusCode: 200
                    });
                }
            }

            return response;
        } catch (error) {
            // Extract error message
            const errorMessage = error.message || error.error || 'An error occurred';
            const statusCode = error.status || 500;

            // Show error notification
            const lang = getLanguage();
            showNotification(errorMessage, {
                lang,
                type: 'error',
                statusCode
            });

            // Re-throw error for component handling
            throw error;
        }
    };
};

/**
 * Higher-order function to wrap API object methods
 * @param {Object} apiObject - Object containing API methods
 * @returns {Object} New object with wrapped methods
 */
export const interceptAPI = (apiObject) => {
    const interceptedAPI = {};

    Object.keys(apiObject).forEach(key => {
        if (typeof apiObject[key] === 'function') {
            // Wrap the function
            interceptedAPI[key] = createInterceptedRequest(apiObject[key]);
        } else if (typeof apiObject[key] === 'object' && apiObject[key] !== null) {
            // Recursively wrap nested objects
            interceptedAPI[key] = interceptAPI(apiObject[key]);
        } else {
            // Copy non-function properties as-is
            interceptedAPI[key] = apiObject[key];
        }
    });

    return interceptedAPI;
};

export default {
    initializeInterceptor,
    createInterceptedRequest,
    interceptAPI
};
