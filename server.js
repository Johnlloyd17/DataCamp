const express = require('express');
const bcrypt = require('bcrypt');
const cors = require('cors');
const helmet = require('helmet');
const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// ========================================
// SECURITY HEADERS MIDDLEWARE (PRIORITY 1)
// ========================================
// Set security headers FIRST before any other middleware

// Strict-Transport-Security
app.use((req, res, next) => {
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  next();
});

// Content-Security-Policy
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; frame-src 'none'; object-src 'none'; media-src 'self'; child-src 'none'; base-uri 'self'; form-action 'self';");
  next();
});

// X-Content-Type-Options
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});

// Referrer-Policy
app.use((req, res, next) => {
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// X-Frame-Options
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  next();
});

// X-XSS-Protection
app.use((req, res, next) => {
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Permissions-Policy
app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()');
  next();
});

// Cache-Control
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  next();
});

// Remove server identification headers
app.use((req, res, next) => {
  res.removeHeader('Server');
  res.removeHeader('X-Powered-By');
  next();
});

// ========================================
// HELMET SECURITY
// ========================================
app.use(helmet({
  contentSecurityPolicy: false,  // We set CSP manually above
  hsts: false,  // We set HSTS manually above
  noSniff: true,
  frameguard: false,  // We set X-Frame-Options manually above
  xssFilter: true,
  hidePoweredBy: true,
  referrerPolicy: false,  // We set manually above
  permittedCrossDomainPolicies: false
}));

// ========================================
// OTHER MIDDLEWARE
// ========================================
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Database connection pool
// Support both individual variables and connection URL
let dbConfig;

if (process.env.DATABASE_URL) {
  // Parse Railway's DATABASE_URL format: mysql://user:pass@host:port/database
  const url = new URL(process.env.DATABASE_URL);
  dbConfig = {
    host: url.hostname,
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1), // Remove leading /
    port: parseInt(url.port) || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  };
} else {
  // Fallback to individual environment variables
  dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'datacamp',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  };
}

const pool = mysql.createPool(dbConfig);

// Logger function
function logEvent(message, type = 'INFO') {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${type}] ${message}`);
}

// Send JSON response
function sendJSON(res, data, statusCode = 200) {
  res.status(statusCode).json(data);
}

// Validation functions
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 255;
}

function isValidPassword(password) {
  if (password.length < 8 || password.length > 256) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  if (!/[@$!%*?]/.test(password)) return false;
  return true;
}

function sanitizeInput(input) {
  return String(input).trim();
}

// Hash password
async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

// Verify password
async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  sendJSON(res, { status: 'ok', message: 'Server is running' });
});

// Sign Up Endpoint
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { fullname, email, organization, password } = req.body;
    
    logEvent(`Sign up attempt received. Email: ${email || 'unknown'}`);
    
    // Validation
    const errors = [];
    
    if (!fullname) errors.push('Full name is required');
    if (!email) errors.push('Email is required');
    if (!organization) errors.push('Organization is required');
    if (!password) errors.push('Password is required');
    
    if (fullname && (fullname.length < 2 || fullname.length > 100)) {
      errors.push('Full name must be between 2 and 100 characters');
    }
    
    if (email && !isValidEmail(email)) {
      errors.push('Invalid email address');
    }
    
    if (organization && (organization.length < 2 || organization.length > 100)) {
      errors.push('Organization must be between 2 and 100 characters');
    }
    
    if (password && !isValidPassword(password)) {
      errors.push('Password must be at least 8 characters with uppercase, lowercase, number, and special character (@, $, !, %, *, ?)');
    }
    
    if (errors.length > 0) {
      logEvent(`Sign up validation failed: ${errors.join(', ')}`, 'WARNING');
      return sendJSON(res, { success: false, errors }, 400);
    }
    
    // Check if email exists
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.execute(
        'SELECT id FROM users WHERE LOWER(email) = LOWER(?)',
        [email]
      );
      
      if (rows.length > 0) {
        logEvent(`Sign up failed: Email already registered - ${email}`, 'WARNING');
        return sendJSON(res, { success: false, errors: ['Email already registered'] }, 400);
      }
      
      // Hash password
      const hashedPassword = await hashPassword(password);
      
      // Insert user
      const [result] = await conn.execute(
        'INSERT INTO users (fullname, email, organization, password_hash, created_at) VALUES (?, ?, ?, ?, NOW())',
        [sanitizeInput(fullname), sanitizeInput(email), sanitizeInput(organization), hashedPassword]
      );
      
      const userId = result.insertId;
      
      logEvent(`✓ Account created successfully - User ID: ${userId}, Email: ${email}`, 'SUCCESS');
      
      sendJSON(res, {
        success: true,
        message: 'Account created successfully',
        user: {
          id: userId,
          email,
          fullname,
          organization,
          createdAt: new Date().toISOString()
        }
      }, 201);
      
    } finally {
      conn.release();
    }
    
  } catch (error) {
    logEvent(`Database error during signup: ${error.message}`, 'ERROR');
    sendJSON(res, { success: false, errors: ['Account creation failed'] }, 500);
  }
});

// Sign In Endpoint
app.post('/api/auth/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return sendJSON(res, { success: false, errors: ['Email and password required'] }, 400);
    }
    
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.execute(
        'SELECT id, fullname, email, organization, password_hash FROM users WHERE LOWER(email) = LOWER(?)',
        [email]
      );
      
      if (rows.length === 0) {
        logEvent(`Sign in failed: User not found - ${email}`, 'WARNING');
        return sendJSON(res, { success: false, errors: ['Invalid email or password'] }, 401);
      }
      
      const user = rows[0];
      const passwordMatch = await verifyPassword(password, user.password_hash);
      
      if (!passwordMatch) {
        logEvent(`Sign in failed: Invalid password - ${email}`, 'WARNING');
        return sendJSON(res, { success: false, errors: ['Invalid email or password'] }, 401);
      }
      
      // Update last login
      await conn.execute('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);
      
      logEvent(`✓ User signed in successfully - User ID: ${user.id}`, 'SUCCESS');
      
      sendJSON(res, {
        success: true,
        message: 'Sign in successful',
        user: {
          id: user.id,
          email: user.email,
          fullname: user.fullname,
          organization: user.organization
        }
      }, 200);
      
    } finally {
      conn.release();
    }
    
  } catch (error) {
    logEvent(`Database error during signin: ${error.message}`, 'ERROR');
    sendJSON(res, { success: false, errors: ['Sign in failed'] }, 500);
  }
});

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Error handling
app.use((err, req, res, next) => {
  logEvent(`Unhandled error: ${err.message}`, 'ERROR');
  sendJSON(res, { success: false, errors: ['Internal server error'] }, 500);
});

// Start server
app.listen(PORT, () => {
  logEvent(`✓ Server running on port ${PORT}`);
  logEvent(`Database: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}`);
});
