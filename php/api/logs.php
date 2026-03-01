<?php
// =============================================================================
//  DATACAMP — SERVER LOGS API ENDPOINT
//  php/api/logs.php
//
//  Returns recent security / application log entries for the dev console
//  viewer (js/server-logs.js).
//
//  OWASP Controls:
//    • Session-gated — only authenticated users can fetch logs
//    • Parameterized query for all DB access
//    • SQL injection scan on any query parameters
//    • Error details suppressed from client responses
//    • Pagination via safe integer binding (no LIMIT injection possible)
//
//  ⚠  In production, restrict this endpoint to admin roles only and ship
//     logs to a dedicated SIEM rather than reading from the DB.
// =============================================================================

declare(strict_types=1);

require_once dirname(__DIR__, 1) . '/config.php';
require_once dirname(__DIR__, 1) . '/db.php';
require_once dirname(__DIR__, 1) . '/security-headers.php';
require_once dirname(__DIR__, 1) . '/InputSanitizer.php';

SecurityHeaders::init();

header('Content-Type: application/json; charset=utf-8');

// ── Method guard ─────────────────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'errors' => ['Method not allowed.']]);
    exit;
}

// ── Authentication guard ──────────────────────────────────────────────────────
if (empty($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'errors' => ['Authentication required.']]);
    exit;
}

// ── Inject-safe pagination parameter ─────────────────────────────────────────
// OWASPnote: even numeric parameters must be bound via prepared statements —
// never interpolated. e.g. LIMIT $limit is NOT safe without binding.
$limitRaw = $_GET['limit'] ?? '50';
$limit    = InputSanitizer::sanitizeInteger($limitRaw) ?? 50;
$limit    = max(1, min(200, $limit));  // clamp to 1–200

$offsetRaw = $_GET['offset'] ?? '0';
$offset    = InputSanitizer::sanitizeInteger($offsetRaw) ?? 0;
$offset    = max(0, $offset);

// Optional filter: 'security' | 'auth' | 'db' | '' (all)
$filterRaw = strtolower(trim($_GET['type'] ?? ''));

// Whitelist the filter value — never interpolate free-text user input into SQL
$allowedTypes = ['security', 'auth', 'db', 'app', ''];
if (!in_array($filterRaw, $allowedTypes, true)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'errors' => ['Invalid log type filter.']]);
    exit;
}

// ── Fetch logs (parameterized) ────────────────────────────────────────────────
try {
    if ($filterRaw === '') {
        $rows = DB::query(
            'SELECT id, log_type, message, ip_address, created_at
               FROM security_logs
              ORDER BY created_at DESC
              LIMIT :lim OFFSET :off',
            [':lim' => $limit, ':off' => $offset]
        );
    } else {
        $rows = DB::query(
            'SELECT id, log_type, message, ip_address, created_at
               FROM security_logs
              WHERE log_type = :type
              ORDER BY created_at DESC
              LIMIT :lim OFFSET :off',
            [':type' => $filterRaw, ':lim' => $limit, ':off' => $offset]
        );
    }
} catch (Throwable $e) {
    // Log internally; never expose DB error to client
    error_log('[logs] DB error: ' . $e->getMessage());

    // Return empty log list gracefully (client degrades silently)
    echo json_encode(['success' => true, 'logs' => []]);
    exit;
}

// ── Format log entries for the frontend ──────────────────────────────────────
$formatted = array_map(static function (array $row): string {
    $ts   = $row['created_at'] ?? '';
    $type = strtoupper($row['log_type'] ?? 'APP');
    $msg  = $row['message']    ?? '';
    $ip   = $row['ip_address'] ?? '';
    return "[{$ts}] [{$type}] {$msg}" . ($ip ? " — {$ip}" : '');
}, $rows);

echo json_encode(['success' => true, 'logs' => $formatted]);
