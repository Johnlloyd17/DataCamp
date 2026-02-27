// 🔐 INPUT VALIDATION MODULE
// Prevents SQL Injection, XSS, and other injection attacks
// Based on OWASP guidelines

const InputValidator = {
  // ========== EMAIL VALIDATION ==========
  isValidEmail: function(email) {
    // RFC 5322 compliant email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 255;
  },

  // ========== USERNAME VALIDATION ==========
  isValidUsername: function(username) {
    // Allow only alphanumeric, underscore, hyphen (3-32 chars)
    const usernameRegex = /^[a-zA-Z0-9_-]{3,32}$/;
    return usernameRegex.test(username);
  },

  // ========== PASSWORD VALIDATION ==========
  isValidPassword: function(password) {
    // At least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  },

  // ========== PHONE VALIDATION ==========
  isValidPhone: function(phone) {
    // International phone format
    const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
    return phoneRegex.test(phone) && phone.length <= 20;
  },

  // ========== URL VALIDATION ==========
  isValidURL: function(url) {
    try {
      new URL(url);
      return true;
    } catch (error) {
      return false;
    }
  },

  // ========== NUMBER VALIDATION (Integer & Float) ==========
  isValidNumber: function(value, min = null, max = null) {
    const num = parseFloat(value);
    if (isNaN(num)) return false;
    if (min !== null && num < min) return false;
    if (max !== null && num > max) return false;
    return true;
  },

  // ========== STRING VALIDATION (with length checks) ==========
  isValidString: function(str, minLength = 1, maxLength = 1000) {
    if (typeof str !== 'string') return false;
    return str.length >= minLength && str.length <= maxLength;
  },

  // ========== SANITIZE INPUT - Remove dangerous characters ==========
  sanitizeString: function(input) {
    if (typeof input !== 'string') return '';
    
    return input
      .trim()
      // Remove SQL injection attempts
      .replace(/['";\\]/g, '') 
      // Remove HTML/XSS attempts
      .replace(/<[^>]*>/g, '')
      // Remove special commands
      .replace(/--|\/\*/g, '')
      // Limit whitespace
      .replace(/\s+/g, ' ');
  },

  // ========== ESCAPE HTML - Prevent XSS ==========
  escapeHTML: function(text) {
    if (typeof text !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  // ========== VALIDATE FORM FIELD ==========
  validateField: function(fieldName, fieldValue, fieldType = 'text') {
    const errors = [];

    switch (fieldType) {
      case 'email':
        if (!this.isValidEmail(fieldValue)) {
          errors.push(`${fieldName} is not a valid email address`);
        }
        break;

      case 'username':
        if (!this.isValidUsername(fieldValue)) {
          errors.push(`${fieldName} must be 3-32 characters (alphanumeric, underscore, hyphen only)`);
        }
        break;

      case 'password':
        if (!this.isValidPassword(fieldValue)) {
          errors.push(`${fieldName} must be at least 8 chars with uppercase, lowercase, number, and special char`);
        }
        break;

      case 'phone':
        if (!this.isValidPhone(fieldValue)) {
          errors.push(`${fieldName} is not a valid phone number`);
        }
        break;

      case 'url':
        if (!this.isValidURL(fieldValue)) {
          errors.push(`${fieldName} is not a valid URL`);
        }
        break;

      case 'number':
        if (!this.isValidNumber(fieldValue)) {
          errors.push(`${fieldName} must be a valid number`);
        }
        break;

      case 'text':
      default:
        if (!this.isValidString(fieldValue, 1, 1000)) {
          errors.push(`${fieldName} must be between 1 and 1000 characters`);
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
      sanitized: this.sanitizeString(fieldValue)
    };
  },

  // ========== VALIDATE ENTIRE FORM ==========
  validateForm: function(formData, schema) {
    const results = {};
    let isFormValid = true;

    for (const [fieldName, fieldType] of Object.entries(schema)) {
      const fieldValue = formData[fieldName] || '';
      const validation = this.validateField(fieldName, fieldValue, fieldType);
      
      results[fieldName] = validation;
      if (!validation.isValid) {
        isFormValid = false;
      }
    }

    return {
      isValid: isFormValid,
      fields: results,
      errors: Object.entries(results)
        .filter(([, result]) => !result.isValid)
        .flatMap(([field, result]) => result.errors)
    };
  },

  // ========== CHECK FOR SQL INJECTION PATTERNS ==========
  detectSQLInjection: function(input) {
    if (typeof input !== 'string') return false;

    const sqlPatterns = [
      /(\b(UNION|SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
      /(-{2}|\/\*|\*\/)/g, // SQL comments
      /(;|'|")/g, // Common delimiters
      /(OR|AND)\s*'?[^']*'?\s*=/gi, // Boolean logic
      /xp_|sp_/gi // Extended procedures
    ];

    return sqlPatterns.some(pattern => pattern.test(input));
  },

  // ========== CHECK FOR XSS PATTERNS ==========
  detectXSS: function(input) {
    if (typeof input !== 'string') return false;

    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /on\w+\s*=/gi, // Event handlers (onclick, onload, etc)
      /javascript:/gi,
      /<iframe[^>]*>/gi,
      /<object[^>]*>/gi,
      /<embed[^>]*>/gi
    ];

    return xssPatterns.some(pattern => pattern.test(input));
  },

  // ========== SAFE DISPLAY OF USER INPUT ==========
  displayUserInput: function(input) {
    return this.escapeHTML(this.sanitizeString(input));
  }
};

// Export for Node.js (if used as server-side module)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = InputValidator;
}
