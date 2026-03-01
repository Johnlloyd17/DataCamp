<?php
declare(strict_types=1);

// Suppress display_errors before any output — PHP warnings must never corrupt
// the JSON response body. Errors are still logged to the Apache error log.
ini_set('display_errors', '0');
ini_set('log_errors', '1');
ob_start(); // Buffer any stray output so it can be discarded before JSON is sent

// =============================================================================
//  DATACAMP — SIGN UP API ENDPOINT
//  php/api/auth/signup.php
//
//  OWASP Controls Implemented (WSTG-INPV-05 + Input Validation Cheat Sheet):
//    1. Parameterized queries   — all DB access via PDO prepared statements
//    2. Input validation        — InputSanitizer::validate() (whitelist approach)
//    3. SQL injection scanning  — blocks payloads before they reach the DB
//    4. Rate limiting           — caps registrations from a single IP
//    5. Duplicate e-mail check  — parameterized SELECT; no error reveals internals
//    6. Password hashing        — bcrypt via DB::hashPassword() (never md5/sha1)
//    7. Error suppression       — DB exceptions are caught; client gets no details
//    8. CSRF validation         — X-CSRF-Token header verified
//    9. Session init            — new session issued on successful registration
//   10. Output encoding         — sanitized values stored; htmlspecialchars on output
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
$submittedCsrf = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
if (!SecurityHeaders::validateCsrf($submittedCsrf)) {
    http_response_code(403);
    echo json_encode(['success' => false, 'errors' => ['Invalid or expired security token. Please refresh and try again.']]);
    exit;
}

// ── Parse JSON body ───────────────────────────────────────────────────────────
$raw  = file_get_contents('php://input');
$body = json_decode($raw, true);

if (!is_array($body)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'errors' => ['Invalid request format.']]);
    exit;
}

// ── Input validation + SQL injection scan ─────────────────────────────────────
// OWASP whitelist approach: only accept known-good patterns per field
$validation = InputSanitizer::validate($body, [
    'fullname'     => 'fullname',
    'email'        => 'email',
    'organisation' => 'organisation',
    'password'     => 'password',
]);

if (!$validation['ok']) {
    http_response_code(422);
    echo json_encode(['success' => false, 'errors' => $validation['errors']]);
    exit;
}

$fullName = $validation['data']['fullname'];
$email    = $validation['data']['email'];
$org      = $validation['data']['organisation'] ?? '';
$password = $validation['data']['password'];

// ── Rate limiting — cap signups per IP ───────────────────────────────────────
$clientIp = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
$signupKey = 'signup::' . $clientIp;

if (!RateLimiter::isAllowed($signupKey, $clientIp)) {
    http_response_code(429);
    echo json_encode([
        'success' => false,
        'errors'  => ['Too many registration attempts. Please try again later.'],
    ]);
    exit;
}

// ── Duplicate e-mail check (parameterized) ────────────────────────────────────
// OWASP: use COUNT() so we don't reveal whether a real user row exists
try {
    $existing = DB::queryOne(
        'SELECT COUNT(*) AS cnt FROM users WHERE email = :email',
        [':email' => $email]
    );
} catch (Throwable $e) {
    error_log('[signup] DB error (dup check): ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'errors' => ['A server error occurred. Please try again later.']]);
    exit;
}

if ($existing !== null && (int)$existing['cnt'] > 0) {
    // OWASP note: you MAY reveal "email already registered" for UX, OR
    // stay completely silent to prevent account enumeration. We choose UX here,
    // but do not confirm the password or any other account details.
    http_response_code(409);
    echo json_encode(['success' => false, 'errors' => ['An account with that email already exists.']]);
    exit;
}

// ── Hash password (bcrypt, cost from config) ──────────────────────────────────
// OWASP: NEVER store plain text or reversible hashes (md5/sha1)
$passwordHash = DB::hashPassword($password);

// ── Insert new user (parameterized INSERT) ────────────────────────────────────
// OWASP primary defence: all value binding is done by PDO driver, not string concat
try {
    $userId = DB::insert(
        'INSERT INTO users (full_name, email, organisation, password_hash, status, role, created_at)
              VALUES (:full_name, :email, :org, :password_hash, :status, :role, NOW())',
        [
            ':full_name'     => $fullName,
            ':email'         => $email,
            ':org'           => $org,
            ':password_hash' => $passwordHash,
            ':status'        => 'active',
            ':role'          => 'user',
        ]
    );
} catch (Throwable $e) {
    error_log('[signup] DB error (insert): ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'errors' => ['A server error occurred. Please try again later.']]);
    exit;
}

// ── Issue session ─────────────────────────────────────────────────────────────
session_regenerate_id(true);

$_SESSION['user_id']      = $userId;
$_SESSION['user_email']   = $email;
$_SESSION['user_role']    = 'user';
$_SESSION['logged_in_at'] = time();

http_response_code(201);
echo json_encode([
    'success' => true,
    'user'    => [
        'id'        => $userId,
        'email'     => $email,
        'full_name' => $fullName,
        'role'      => 'user',
    ],
]);
