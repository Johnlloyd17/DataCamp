# 🔐 DataCamp - Input Validation & Injection Prevention Guide

## Overview

This document explains the security measures implemented in DataCamp to prevent **SQL Injection**, **XSS (Cross-Site Scripting)**, and other injection attacks, based on OWASP guidelines.

## What is Input Validation?

Input validation is the process of verifying that user-provided data conforms to expected formats and doesn't contain malicious content.

### Why It Matters
- **SQL Injection**: Attackers inject SQL commands via form inputs
- **XSS Attacks**: Attackers inject malicious JavaScript code
- **Data Integrity**: Ensures data meets business requirements
- **Application Stability**: Prevents crashes from unexpected input

---

## 🛡️ Security Layers Implemented

### Layer 1: Client-Side Validation (JavaScript)
**File**: `js/input-validator.js`

Provides real-time validation in the browser:
- Email format validation
- Password strength requirements
- SQL injection pattern detection
- XSS pattern detection
- Input sanitization
- Length constraints

**Benefits**:
- Immediate user feedback
- Reduced server load
- Better user experience

⚠️ **Important**: Client-side validation alone is NOT sufficient! Always validate on the server.

### Layer 2: Server-Side Validation (PHP/MySQL)
**Files**: `api/` directory (PHP backend handlers)

Validates all incoming requests on the backend:
- Checks for SQL injection attempts via prepared statements
- Detects XSS payloads
- Sanitizes all input
- Enforces type validation
- Database-level constraints

**Benefits**:
- Cannot be bypassed by client tampering
- Database-enforced security
- Protects against direct API attacks
- Enforces business rules

### Layer 3: Security Headers
**File**: `vercel.json` (for Vercel deployment)

HTTP headers that tell browsers how to handle content:
- **CSP**: Prevents inline script execution
- **HSTS**: Forces HTTPS connections
- **X-Frame-Options**: Prevents clickjacking
- **X-Content-Type-Options**: Prevents MIME sniffing

---

## 📋 Implementation Guide

### Client-Side Usage

#### Basic Form Validation
```javascript
// Validate an email
const isValid = InputValidator.isValidEmail('user@example.com');

// Validate a password
const passwordCheck = InputValidator.isValidPassword('SecurePass123!');

// Validate any string
const stringCheck = InputValidator.isValidString(input, 3, 100);
```

#### Detect Injection Attempts
```javascript
// Check for SQL injection
if (InputValidator.detectSQLInjection(userInput)) {
  console.warn('SQL injection attempt detected');
  // Reject input
}

// Check for XSS
if (InputValidator.detectXSS(userInput)) {
  console.warn('XSS attempt detected');
  // Reject input
}
```

#### Validate Entire Form
```javascript
const schema = {
  'Email': 'email',
  'Full Name': 'text',
  'Password': 'password'
};

const formData = {
  'Email': 'user@example.com',
  'Full Name': 'John Doe',
  'Password': 'SecurePass123!'
};

const result = InputValidator.validateForm(formData, schema);

if (result.isValid) {
  // Submit form
  console.log('Form is valid');
  // Use result.fields to get sanitized data
} else {
  // Show errors
  result.errors.forEach(error => console.error(error));
}
```

#### Sanitize Output
```javascript
// Remove dangerous characters
const safe = InputValidator.sanitizeString(userInput);

// Escape HTML entities
const htmlSafe = InputValidator.escapeHTML(userInput);

// Safe display
const display = InputValidator.displayUserInput(userInput);
```

### Server-Side Usage

#### Example: Sign Up API with Validation

```javascript
app.post('/api/auth/signup', (req, res) => {
  // Validate incoming data
  const validation = SQLValidator.validateRequest(req.body, {
    email: {
      required: true,
      type: 'email'
    },
    password: {
      required: true,
      minLength: 8,
      maxLength: 256
    },
    fullname: {
      required: true,
      minLength: 2,
      maxLength: 100
    }
  });

  // Check validation result
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      errors: validation.errors
    });
  }

  // Use validated, sanitized data
  const { email, password, fullname } = validation.data;

  // Proceed with secure operations
  // 1. Hash password with bcrypt
  // 2. Use parameterized queries for database
  // 3. Check for duplicates
});
```

---

## 🚫 Common Injection Patterns Detected

### SQL Injection Examples (Blocked)
```
' OR '1'='1
' OR 1=1--
' UNION SELECT * FROM users--
'; DROP TABLE users;--
admin' --
1' ORDER BY 10--
1 UNION SELECT password FROM users--
```

### XSS Examples (Blocked)
```
<script>alert('XSS')</script>
<img src=x onerror=alert('XSS')>
javascript:alert('XSS')
<iframe src=javascript:alert('XSS')>
<svg onload=alert('XSS')>
```

---

## 📐 Validation Schema Reference

### Email
- Format: `user@example.com`
- Max length: 255 characters
- Regular expression: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`

### Username
- Format: Alphanumeric, underscore, hyphen only
- Length: 3-32 characters
- Example: `john_doe-123`

### Password
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character (@, $, !, %, *, ?)

### Phone
- International format supported
- Length: 10-20 characters
- Example: `+1(555)123-4567`

### URL
- Must be valid HTTP/HTTPS URL
- Example: `https://example.com`

### Number
- Can specify min/max range
- Example: `InputValidator.isValidNumber(50, 0, 100)`

---

## 🔑 Best Practices

### DO ✅
- ✅ Always validate on the server (never trust client)
- ✅ Use parameterized queries (prepared statements)
- ✅ Sanitize all user input
- ✅ Log security events
- ✅ Use HTTPS for all connections
- ✅ Hash passwords with strong algorithms (bcrypt)
- ✅ Implement rate limiting on APIs
- ✅ Keep dependencies updated

### DON'T ❌
- ❌ Don't concatenate user input into SQL: `"SELECT * FROM users WHERE id = " + userId`
- ❌ Don't disable CSP or security headers
- ❌ Don't store passwords in plain text
- ❌ Don't trust client-side validation alone
- ❌ Don't expose database error messages to users
- ❌ Don't log sensitive data (passwords, tokens)
- ❌ Don't use deprecated authentication methods

---

## 📊 Validation Checklist

### User Registration
- [ ] Email format validated
- [ ] Email checked for uniqueness
- [ ] Password meets strength requirements
- [ ] Password confirmed (user types twice)
- [ ] Name/organization fields sanitized
- [ ] Terms & conditions accepted

### User Login
- [ ] Email format validated
- [ ] No SQL injection patterns detected
- [ ] No XSS patterns detected
- [ ] Password validated
- [ ] Account status checked (active/locked)
- [ ] Login attempts logged

### Search/Query Parameters
- [ ] Query string sanitized
- [ ] SQL injection patterns detected
- [ ] XSS patterns detected
- [ ] Length limits enforced
- [ ] Results are safe to display

### API Endpoints
- [ ] Request method validated (GET vs POST)
- [ ] Content-Type header checked
- [ ] All parameters validated
- [ ] CORS headers properly set
- [ ] Response data sanitized

---

## 🔍 Testing Injection Attempts

### Safe Testing (for development only)
```javascript
// Test SQL injection detection
const testInputs = [
  "' OR '1'='1",
  "1' UNION SELECT * FROM users--",
  "admin'; DROP TABLE users;--"
];

testInputs.forEach(input => {
  if (InputValidator.detectSQLInjection(input)) {
    console.log('✓ SQL Injection detected:', input);
  }
});

// Test XSS detection
const xssTests = [
  "<script>alert('XSS')</script>",
  "<img src=x onerror=alert('XSS')>",
  "javascript:alert('XSS')"
];

xssTests.forEach(input => {
  if (InputValidator.detectXSS(input)) {
    console.log('✓ XSS detected:', input);
  }
});
```

---

## 📝 Security Event Logging

When a suspicious input is detected, the system logs:
```
[SECURITY] 2026-02-24 15:30:45
  Type: SQL Injection Attempt
  Field: email
  IP: 192.168.1.1
  Details: Pattern detected in input
```

### Logs to Monitor
- Multiple failed login attempts
- Injection patterns in form fields
- Unusually large input values
- Rate limiting triggers
- Unusual API access patterns

---

## 🚀 Deployment Checklist

Before deploying to production:

- [ ] Enable HTTPS/SSL everywhere
- [ ] Configure CSP headers correctly
- [ ] Set up rate limiting on APIs
- [ ] Enable security headers (HSTS, X-Frame-Options, etc.)
- [ ] Implement logging and monitoring
- [ ] Use parameterized queries for all database operations
- [ ] Hash passwords with bcrypt
- [ ] Setup database backups
- [ ] Configure Web Application Firewall (WAF)
- [ ] Regular security audits
- [ ] Keep dependencies updated
- [ ] Test security posture with [SecurityHeaders.com](https://securityheaders.com)

---

## 📚 OWASP References

- [OWASP SQL Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)
- [OWASP Input Validation Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)
- [OWASP Top 10 - Injection](https://owasp.org/Top10/A03_2021-Injection/)
- [OWASP Testing Guide - SQL Injection](https://owasp.org/www-project-web-security-testing-guide/v42/4-Web_Application_Security_Testing/07-Input_Validation_Testing/05-Testing_for_SQL_Injection)

---

## 🆘 Reporting Security Issues

If you discover a security vulnerability, please:
1. **Do not** publicly disclose the vulnerability
2. Email: security@datacamp.example.com
3. Include: Issue description, impact, and reproduction steps
4. Allow 48 hours for initial response

---

**Last Updated**: February 24, 2026  
**Version**: 1.0.0  
**Status**: ✅ Active & Maintained
