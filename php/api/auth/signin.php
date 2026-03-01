<?php
declare(strict_types=1);

ini_set('display_errors', '0');
ini_set('log_errors', '1');
ob_start();

// =============================================================================
//  DATACAMP — SIGN IN API ENDPOINT
//  php/api/auth/signin.php
//
//  OWASP Controls Implemented (WSTG-INPV-05 + Authentication Cheat Sheet):
//    1. Parameterized queries   — DB::queryOne() uses PDO prepared statements
//    2. Input validation        — InputSanitizer::validate() (whitelist approach)
//    3. SQL injection scanning  — InputSanitizer::scanFields() on all POST fields
//    4. Rate limiting           — RateLimiter blocks after LOGIN_MAX_ATTEMPTS
//    5. Generic error messages  — never reveal which field (email vs password) failed
//    6. Error suppression       — DB exceptions are caught; clients get no SQL details
//    7. Session fixation prevention — session_regenerate_id(true) on successful login
//    8. CSRF validation         — X-CSRF-Token header verified against session token
//    9. Password rehash         — if bcrypt cost has changed, hash is updated silently
//   10. Constant-time compare   — hash_equals() via DB::verifyPassword()
//
//  ⚠  Accepts JSON body (application/json) only.
//  ⚠  POST requests only.
// =============================================================================

// ── Bootstrap ────────────────────────────────────────────────────────────────
require_once dirname(__DIR__, 2) . '/config.php';
require_once dirname(__DIR__, 2) . '/db.php';
require_once dirname(__DIR__, 2) . '/security-headers.php';
require_once dirname(__DIR__, 2) . '/InputSanitizer.php';
require_once dirname(__DIR__, 2) . '/RateLimiter.php';

SecurityHeaders::init();

header('Content-Type: application/json; charset=utf-8');

// ── Method guard ─────────────────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'errors' => ['Method not allowed.']]);
    exit;
}

// ── CSRF validation ───────────────────────────────────────────────────────────
// Token is sent as an HTTP header (X-CSRF-Token) by the JS client.
$submittedCsrf = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
if (!SecurityHeaders::validateCsrf($submittedCsrf)) {
    http_response_code(403);
    echo json_encode(['success' => false, 'errors' => ['Invalid or expired security token. Please refresh and try again.']]);
    exit;
}

// ── Parse JSON body ───────────────────────────────────────────────────────────
$raw = file_get_contents('php://input');
$body = json_decode($raw, true);

if (!is_array($body)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'errors' => ['Invalid request format.']]);
    exit;
}

// ── Input validation + SQL injection scan (OWASP defence layer 1–2) ──────────
$validation = InputSanitizer::validate($body, [
    'email'    => 'email',
    'password' => 'password',
]);

if (!$validation['ok']) {
    http_response_code(422);
    echo json_encode(['success' => false, 'errors' => $validation['errors']]);
    exit;
}

$email    = $validation['data']['email'];     // Lowercased, trimmed
$password = $validation['data']['password'];  // Raw (never sanitized/trimmed)

// ── Rate limit check (OWASP: brute-force / credential stuffing protection) ───
$clientIp = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';

if (!RateLimiter::isAllowed($email, $clientIp)) {
    $wait = RateLimiter::lockoutRemainingSeconds($email, $clientIp);
    http_response_code(429);
    echo json_encode([
        'success' => false,
        // Generic message — do not confirm whether the account exists
        'errors'  => ["Too many failed attempts. Please try again in {$wait} seconds."],
    ]);
    exit;
}

// ── Database lookup (parameterized — OWASP defence layer 3) ──────────────────
// NEVER: "SELECT … WHERE email = '{$email}'"
// ALWAYS: use placeholders — PDO with ATTR_EMULATE_PREPARES=false enforces this
try {
    $user = DB::queryOne(
        'SELECT id, email, full_name, password_hash, status, role
           FROM users
          WHERE email = :email
          LIMIT 1',
        [':email' => $email]
    );
} catch (Throwable $e) {
    // Log internally; never expose DB error details to the client
    error_log('[signin] DB error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'errors' => ['A server error occurred. Please try again later.']]);
    exit;
}

// ── Credential verification ───────────────────────────────────────────────────
// OWASP: return the SAME generic error whether the email is wrong OR the password
// is wrong — this prevents account enumeration (WSTG-IDENT-04).
$genericError = 'Invalid email or password.';

if ($user === null) {
    RateLimiter::recordFailure($email, $clientIp);
    http_response_code(401);
    echo json_encode(['success' => false, 'errors' => [$genericError]]);
    exit;
}

if ($user['status'] !== 'active') {
    // Account exists but is disabled / pending — still return generic error
    RateLimiter::recordFailure($email, $clientIp);
    http_response_code(401);
    echo json_encode(['success' => false, 'errors' => [$genericError]]);
    exit;
}

// Constant-time hash comparison (prevents timing attacks)
$needsRehash = false;
if (!DB::verifyPassword($password, $user['password_hash'], $needsRehash)) {
    RateLimiter::recordFailure($email, $clientIp);
    http_response_code(401);
    echo json_encode(['success' => false, 'errors' => [$genericError]]);
    exit;
}

// ── Rehash silently if the bcrypt cost has changed ────────────────────────────
if ($needsRehash) {
    $newHash = DB::hashPassword($password);
    try {
        DB::execute(
            'UPDATE users SET password_hash = :hash WHERE id = :id',
            [':hash' => $newHash, ':id' => $user['id']]
        );
    } catch (Throwable $e) {
        error_log('[signin] rehash failed for user ' . $user['id'] . ': ' . $e->getMessage());
        // Non-fatal — login still succeeds
    }
}

// ── Success path ──────────────────────────────────────────────────────────────
// Clear brute-force counter
RateLimiter::clearFailures($email, $clientIp);

// Regenerate session ID to prevent session fixation (OWASP A2)
session_regenerate_id(true);

$_SESSION['user_id']   = $user['id'];
$_SESSION['user_email'] = $user['email'];
$_SESSION['user_role']  = $user['role'];
$_SESSION['logged_in_at'] = time();

http_response_code(200);
echo json_encode([
    'success' => true,
    'user'    => [
        'id'        => $user['id'],
        'email'     => $user['email'],
        'full_name' => $user['full_name'],
        'role'      => $user['role'],
    ],
]);
