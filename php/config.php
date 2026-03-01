<?php
// =============================================================================
//  DATACAMP — APPLICATION CONFIGURATION
//  php/config.php
//
//  ⚠  This file is blocked from direct browser access by .htaccess.
//     Include it server-side: require_once __DIR__ . '/config.php';
// =============================================================================

// ── Environment ───────────────────────────────────────────────────────────────
// Switch to 'production' before going live. Controls error display,
// HSTS enforcement, and cookie Secure flag.
define('APP_ENV', 'development');   // 'development' | 'production'

// ── Application Metadata ──────────────────────────────────────────────────────
define('APP_NAME',    'DataCamp');
define('APP_VERSION', '1.0.0');
define('APP_URL',     'http://localhost/DataCamp');   // no trailing slash

// ── Database Credentials ──────────────────────────────────────────────────────
// In production, load these from environment variables or a secrets manager —
// never keep real credentials in source control.
define('DB_HOST',    getenv('DB_HOST')    ?: 'localhost');
define('DB_PORT',    getenv('DB_PORT')    ?: '4306');
define('DB_NAME',    getenv('DB_NAME')    ?: 'datacamp');
define('DB_USER',    getenv('DB_USER')    ?: 'root');
define('DB_PASS',    getenv('DB_PASS')    ?: '');
define('DB_CHARSET', 'utf8mb4');    // Full Unicode (emoji-safe)

// ── Session Configuration ─────────────────────────────────────────────────────
define('SESSION_LIFETIME',    1800);   // 30 minutes (seconds)
define('SESSION_COOKIE_NAME', 'dc_sess');

// ── Security: CSRF ────────────────────────────────────────────────────────────
define('CSRF_TOKEN_NAME',    '_csrf_token');
define('CSRF_TOKEN_LENGTH',  32);         // bytes (produces 64-char hex)

// ── Security: Passwords ───────────────────────────────────────────────────────
define('PASSWORD_ALGO',    PASSWORD_BCRYPT);
define('PASSWORD_COST',    12);           // bcrypt work factor (10–14 recommended)
define('PASSWORD_MIN_LEN', 8);

// ── Security: Rate Limiting ───────────────────────────────────────────────────
define('LOGIN_MAX_ATTEMPTS',  5);         // max failed logins before lockout
define('LOGIN_LOCKOUT_SECS',  900);       // 15-minute lockout window

// ── Allowed Origins (CORS) ────────────────────────────────────────────────────
// Add your frontend domains here when you expose a REST API.
define('CORS_ALLOWED_ORIGINS', [
    'http://localhost',
    'http://localhost/DataCamp',
    // 'https://yourdomain.com',
]);

// ── Content-Security-Policy Nonce ────────────────────────────────────────────
// SecurityHeaders::init() generates a per-request nonce so that trusted
// inline <script> blocks can be whitelisted without 'unsafe-inline'.
// Usage in a PHP template:
//   <script nonce="{ SecurityHeaders::nonce() }"> ... </script>
// (use <?= and close with the PHP closing tag in actual code)
// SecurityHeaders::init() must be called BEFORE any output.

// ── Error Reporting ───────────────────────────────────────────────────────────
// NEVER display errors to the browser - they corrupt JSON API responses and
// expose internal details. Always log instead. This applies in all environments.
ini_set('display_errors',         '0');
ini_set('display_startup_errors', '0');
ini_set('log_errors',             '1');
error_reporting(E_ALL);
// To debug PHP locally, check XAMPP's Apache error log:
//   c:\xampp\apache\logs\error.log

// ── Session Bootstrap ─────────────────────────────────────────────────────────
// Called automatically by SecurityHeaders::init() — do not call session_start()
// elsewhere unless you know the session is not already active.
function dc_session_configure(): void {
    $secure   = (APP_ENV === 'production');   // Secure flag only on HTTPS
    $lifetime = SESSION_LIFETIME;

    session_name(SESSION_COOKIE_NAME);

    session_set_cookie_params([
        'lifetime' => $lifetime,
        'path'     => '/',
        'domain'   => '',
        'secure'   => $secure,
        'httponly' => true,        // JS cannot read the cookie
        'samesite' => 'Strict',    // Cookie not sent cross-site (CSRF protection)
    ]);

    ini_set('session.gc_maxlifetime', (string) $lifetime);
    ini_set('session.use_strict_mode',   '1');
    ini_set('session.use_only_cookies',  '1');
    ini_set('session.use_trans_sid',     '0');
}
