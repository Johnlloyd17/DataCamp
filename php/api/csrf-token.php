<?php
declare(strict_types=1);

ini_set('display_errors', '0');
ini_set('log_errors', '1');
ob_start();

// =============================================================================
//  DATACAMP — CSRF TOKEN ENDPOINT
//  php/api/csrf-token.php
//
//  Issues a fresh CSRF token (Synchronizer Token Pattern).
//  The JS client calls this on page load and attaches the token as
//  the X-CSRF-Token header on every mutating request (POST / PUT / DELETE).
//
//  OWASP Ref: Cross-Site Request Forgery Prevention Cheat Sheet
//
//  ⚠  GET only — this endpoint has no side effects.
// =============================================================================

require_once dirname(__DIR__, 1) . '/config.php';
require_once dirname(__DIR__, 1) . '/security-headers.php';

SecurityHeaders::init();

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'errors' => ['Method not allowed.']]);
    exit;
}

echo json_encode([
    'success' => true,
    'token'   => SecurityHeaders::csrfToken(),
]);
