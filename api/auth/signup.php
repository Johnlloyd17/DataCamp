<?php
// ==========================================
// SIGN UP API ENDPOINT
// ==========================================

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

try {
    require_once __DIR__ . '/../config.php';
} catch (Exception $e) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'error' => 'Configuration error: ' . $e->getMessage()
    ]);
    exit;
}

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJSON(['error' => 'Method not allowed'], 405);
}

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    sendJSON(['success' => false, 'errors' => ['Invalid JSON']], 400);
}

logEvent('Sign up attempt received. Email: ' . ($input['email'] ?? 'unknown'));

// Extract and validate fields
$fullname = $input['fullname'] ?? '';
$email = $input['email'] ?? '';
$organization = $input['organization'] ?? '';
$password = $input['password'] ?? '';

$errors = [];

// ==========================================
// INPUT VALIDATION
// ==========================================

// Check for injection attacks
if (isSQLInjection($fullname) || isSQLInjection($email) || 
    isSQLInjection($organization) || isSQLInjection($password)) {
    logEvent('SQL Injection attempt detected on signup', 'WARNING');
    sendJSON(['success' => false, 'errors' => ['Invalid input detected']], 400);
}

// Validate required fields
if (empty($fullname)) $errors[] = 'Full name is required';
if (empty($email)) $errors[] = 'Email is required';
if (empty($organization)) $errors[] = 'Organization is required';
if (empty($password)) $errors[] = 'Password is required';

// Validate full name length
if (strlen($fullname) < 2 || strlen($fullname) > 100) {
    $errors[] = 'Full name must be between 2 and 100 characters';
}

// Validate email format
if (!isValidEmail($email)) {
    $errors[] = 'Invalid email address';
}

// Validate organization length
if (strlen($organization) < 2 || strlen($organization) > 100) {
    $errors[] = 'Organization must be between 2 and 100 characters';
}

// Validate password strength
if (!isValidPassword($password)) {
    $errors[] = 'Password must be at least 8 characters with uppercase, lowercase, number, and special character (@, $, !, %, *, ?)';
}

// Return errors if validation failed
if (!empty($errors)) {
    logEvent('Sign up validation failed: ' . implode(', ', $errors), 'WARNING');
    sendJSON(['success' => false, 'errors' => $errors], 400);
}

// ==========================================
// CHECK IF EMAIL EXISTS
// ==========================================

try {
    $stmt = $pdo->prepare("SELECT id FROM users WHERE LOWER(email) = LOWER(?)");
    $stmt->execute([$email]);
    
    if ($stmt->fetch()) {
        logEvent('Sign up failed: Email already registered - ' . $email, 'WARNING');
        sendJSON(['success' => false, 'errors' => ['Email already registered']], 400);
    }
} catch (PDOException $e) {
    logEvent('Database error checking email: ' . $e->getMessage(), 'ERROR');
    sendJSON(['success' => false, 'errors' => ['Database error']], 500);
}

// ==========================================
// HASH PASSWORD & STORE USER
// ==========================================

try {
    $hashedPassword = hashPassword($password);
    
    // Insert user with parameterized query (prevents SQL injection)
    $stmt = $pdo->prepare("
        INSERT INTO users (fullname, email, organization, password_hash, created_at)
        VALUES (?, ?, ?, ?, NOW())
    ");
    
    $stmt->execute([
        sanitizeInput($fullname),
        sanitizeInput($email),
        sanitizeInput($organization),
        $hashedPassword
    ]);
    
    $userId = $pdo->lastInsertId();
    
    logEvent('✓ Account created successfully - User ID: ' . $userId . ', Email: ' . $email, 'SUCCESS');
    logEvent('✓ Password hashed with bcrypt and stored securely (hash length: ' . strlen($hashedPassword) . ' chars)', 'SUCCESS');
    
    sendJSON([
        'success' => true,
        'message' => 'Account created successfully',
        'user' => [
            'id' => (int)$userId,
            'email' => $email,
            'fullname' => $fullname,
            'organization' => $organization,
            'createdAt' => date('c')
        ]
    ], 201);
    
} catch (PDOException $e) {
    logEvent('Database error during signup: ' . $e->getMessage(), 'ERROR');
    sendJSON(['success' => false, 'errors' => ['Account creation failed: ' . $e->getMessage()]], 500);
} catch (Exception $e) {
    logEvent('Unexpected error during signup: ' . $e->getMessage(), 'ERROR');
    sendJSON(['success' => false, 'errors' => ['Unexpected error: ' . $e->getMessage()]], 500);
}

// Set error handler to catch fatal errors
set_error_handler(function($errno, $errstr, $errfile, $errline) {
    logEvent("Fatal Error [$errno]: $errstr (File: $errfile, Line: $errline)", 'ERROR');
    sendJSON(['success' => false, 'errors' => ["Server error: $errstr"]], 500);
});
?>
