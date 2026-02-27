// 🔐 SERVER-SIDE INPUT VALIDATION MODULE
// Prevents SQL Injection, XSS, and other injection attacks
// For Node.js/Express Backend

const SQLValidator = {
  // ========== EMAIL VALIDATION ==========
  isValidEmail: (email) => {
    if (typeof email !== 'string') return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 255;
  },

  // ========== USERNAME VALIDATION ==========
  isValidUsername: (username) => {
    if (typeof username !== 'string') return false;
    const usernameRegex = /^[a-zA-Z0-9_-]{3,32}$/;
    return usernameRegex.test(username);
  },

  // ========== SANITIZE STRING ==========
  sanitizeString: (input) => {
    if (typeof input !== 'string') return '';
    
    return input
      .trim()
      .replace(/['";\\]/g, '') // Remove SQL/quote chars
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/--|\/\*/g, '') // Remove SQL comments
      .replace(/\s+/g, ' ') // Normalize whitespace
      .substring(0, 1000); // Max length
  },

  // ========== CHECK FOR SQL INJECTION ==========
  isSQLInjection: (input) => {
    if (typeof input !== 'string') return false;

    const sqlPatterns = [
      /(\b(UNION|SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|SCRIPT)\b)/gi,
      /(-{2}|\/\*|\*\/|;)/g,
      /(\bOR\b|\bAND\b)\s*'?[^']*'?\s*=/gi,
      /xp_|sp_/gi
    ];

    return sqlPatterns.some(pattern => pattern.test(input));
  },

  // ========== CHECK FOR XSS ==========
  isXSS: (input) => {
    if (typeof input !== 'string') return false;

    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /on\w+\s*=/gi,
      /javascript:/gi,
      /<iframe|<object|<embed/gi
    ];

    return xssPatterns.some(pattern => pattern.test(input));
  },

  // ========== VALIDATE CLIENT REQUEST ==========
  validateRequest: (body, schema) => {
    const errors = [];
    const validated = {};

    for (const [field, rules] of Object.entries(schema)) {
      const value = body[field] || '';

      // Check if field is required
      if (rules.required && !value) {
        errors.push(`${field} is required`);
        continue;
      }

      // Check for injection attempts
      if (SQLValidator.isSQLInjection(value)) {
        errors.push(`${field} contains invalid characters (possible SQL injection)`);
        console.warn(`[SECURITY] SQL Injection attempt detected in ${field}`);
        continue;
      }

      if (SQLValidator.isXSS(value)) {
        errors.push(`${field} contains invalid characters (possible XSS)`);
        console.warn(`[SECURITY] XSS attempt detected in ${field}`);
        continue;
      }

      // Type-specific validation
      if (rules.type === 'email' && !SQLValidator.isValidEmail(value)) {
        errors.push(`${field} is not a valid email`);
        continue;
      }

      if (rules.type === 'number' && isNaN(value)) {
        errors.push(`${field} must be a number`);
        continue;
      }

      if (rules.minLength && value.length < rules.minLength) {
        errors.push(`${field} must be at least ${rules.minLength} characters`);
        continue;
      }

      if (rules.maxLength && value.length > rules.maxLength) {
        errors.push(`${field} must not exceed ${rules.maxLength} characters`);
        continue;
      }

      // Sanitize and store validated value
      validated[field] = SQLValidator.sanitizeString(value);
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
      data: validated
    };
  },

  // ========== MIDDLEWARE FOR EXPRESS ==========
  validationMiddleware: (schema) => {
    return (req, res, next) => {
      const validation = SQLValidator.validateRequest(req.body, schema);

      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          errors: validation.errors
        });
      }

      // Replace req.body with sanitized data
      req.validatedData = validation.data;
      next();
    };
  },

  // ========== PARAMETERIZED QUERY EXAMPLE ==========
  getLoginQuery: (email, password) => {
    // EXAMPLE: Never concatenate user input into SQL queries!
    // WRONG: `SELECT * FROM users WHERE email = '${email}'`
    // CORRECT: Use parameterized queries (prepared statements)
    
    return {
      sql: 'SELECT id, email, password_hash FROM users WHERE email = ? AND status = ?',
      params: [email, 'active'], // Parameters are escaped by the driver
      description: 'Parameterized query prevents SQL injection'
    };
  },

  // ========== ERROR LOGGING (DO NOT EXPOSE TO CLIENT) ==========
  logSecurityEvent: (eventType, field, value, ip) => {
    console.error(`[SECURITY_LOG] ${new Date().toISOString()}`);
    console.error(`  Type: ${eventType}`);
    console.error(`  Field: ${field}`);
    console.error(`  IP: ${ip}`);
    console.error(`  Details: Potential attack vector detected`);
    // In production, log to database or security monitoring service
  }
};

module.exports = SQLValidator;
