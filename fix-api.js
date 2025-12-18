/**
 * Quick fix script to remove password validation cleanup code
 */

const fs = require('fs');
const path = require('path');

const apiPath = path.join(__dirname, 'src', 'services', 'api.js');
let content = fs.readFileSync(apiPath, 'utf8');

// Remove the problematic lines
const linesToRemove = `
    // Clean up validation error messages (e.g., password pattern errors)
    if (typeof errorMessage === 'string' && errorMessage.includes('fails to match the required pattern')) {
      if (errorMessage.includes('password')) {
        errorMessage = 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character';
      }
    }
`;

content = content.replace(linesToRemove.trim(), '');

// Also change let to const
content = content.replace(
    '    let errorMessage = errorData.message',
    '    const errorMessage = errorData.message'
);

fs.writeFileSync(apiPath, content, 'utf8');
console.log('✅ Fixed api.js - removed password validation cleanup');
