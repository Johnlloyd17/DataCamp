<?php
// ==========================================
// SECURITY HEADERS - MUST BE FIRST
// ==========================================
require_once __DIR__ . '/headers.php';

// ==========================================
// DATABASE CONFIGURATION - PHP/MySQL
// ==========================================

// Database credentials - Read from environment variables (Railway) or use defaults (local)
define('DB_HOST', getenv('DB_HOST') ?: 'localhost:4306');
define('DB_PORT', getenv('DB_PORT') ?: '3306');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') ?: ''); // Default XAMPP password is empty
define('DB_NAME', getenv('DB_NAME') ?: 'datacamp');

// Build connection string
$host = DB_HOST;
// If DB_HOST already includes port (localhost:4306), use as-is; otherwise append port
if (strpos($host, ':') === false) {
    $host = DB_HOST . ':' . DB_PORT;
}

// Database connection
try {
    $pdo = new PDO(
        "mysql:host=" . $host . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        array(
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        )
    );
} catch (PDOException $e) {
    http_response_code(500);
    die(json_encode([
        'success' => false,
        'error' => 'Database connection failed: ' . $e->getMessage()
    ]));
}

// ==========================================
// SECURITY FUNCTIONS
// ==========================================

/**
 * Hash a password securely using PHP's password_hash
 * @param string $password
 * @return string Hashed password
 */
function hashPassword($password) {
    return password_hash($password, PASSWORD_BCRYPT, ['cost' => 10]);
}

/**
 * Verify a password against a hash
 * @param string $password Plain password
 * @param string $hash Stored password hash
 * @return bool
 */
function verifyPassword($password, $hash) {
    return password_verify($password, $hash);
}

/**
 * Check for SQL injection patterns
 * @param string $input
 * @return bool
 */
function isSQLInjection($input) {
    $patterns = [
        "/('|(--)|(\#)|(\*)|(\*\*)|(\+)|(-)|(\|)|(\^)|(;))/",
        "/(union|select|insert|update|delete|drop|create|alter|exec|execute|script|javascript|onload|onerror|onclick)/i",
        "/(\/\*|\*\/|xp_|sp_|exec|execute)/i"
    ];
    
    foreach ($patterns as $pattern) {
        if (preg_match($pattern, $input)) {
            return true;
        }
    }
    return false;
}

/**
 * Validate email format
 * @param string $email
 * @return bool
 */
function isValidEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false && strlen($email) <= 255;
}

/**
 * Validate password format (8+ chars, uppercase, lowercase, number, special)
 * @param string $password
 * @return bool
 */
function isValidPassword($password) {
    if (strlen($password) < 8 || strlen($password) > 256) {
        return false;
    }
    if (!preg_match('/[A-Z]/', $password)) return false; // uppercase
    if (!preg_match('/[a-z]/', $password)) return false; // lowercase
    if (!preg_match('/[0-9]/', $password)) return false; // number
    if (!preg_match('/[@$!%*?]/', $password)) return false; // special char
    return true;
}

/**
 * Sanitize string input
 * @param string $input
 * @return string
 */
function sanitizeInput($input) {
    return htmlspecialchars(trim($input), ENT_QUOTES, 'UTF-8');
}

// ==========================================
// LOGGING FUNCTION
// ==========================================

/**
 * Log security and application events
 * @param string $message
 * @param string $type (INFO, WARNING, ERROR, SUCCESS)
 */
function logEvent($message, $type = 'INFO') {
    $timestamp = date('Y-m-d H:i:s');
    $logEntry = "[{$timestamp}] [{$type}] {$message}";
    
    // Log to console/error_log
    error_log($logEntry);
    
    // Optional: Log to database table
    global $pdo;
    try {
        $pdo->prepare("INSERT INTO logs (timestamp, type, message) VALUES (?, ?, ?)")
            ->execute([$timestamp, $type, $message]);
    } catch (Exception $e) {
        // Silently fail if logs table doesn't exist
    }
}

/**
 * Send JSON response
 * @param array $data
 * @param int $statusCode
 */
function sendJSON($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data);
    exit;
}

// ==========================================
// CORS HEADERS
// ==========================================

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Max-Age: 3600');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// ==========================================
// SECURITY HEADERS
// ==========================================

header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');
header('Strict-Transport-Security: max-age=31536000; includeSubDomains; preload');
header('Content-Security-Policy: default-src \'self\'; script-src \'self\'; style-src \'self\' \'unsafe-inline\'; img-src \'self\' data: https:');
header('Referrer-Policy: strict-origin-when-cross-origin');
header('Permissions-Policy: geolocation=(), microphone=(), camera=(), payment=()');

?>
