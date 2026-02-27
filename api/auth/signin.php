<?php
// ==========================================
// SIGN IN API ENDPOINT
// ==========================================

require_once __DIR__ . '/../config.php';

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJSON(['error' => 'Method not allowed'], 405);
}

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    sendJSON(['success' => false, 'errors' => ['Invalid JSON']], 400);
}

logEvent('Sign in attempt received. Email: ' . ($input['email'] ?? 'unknown'));

// Extract fields
$email = $input['email'] ?? '';
$password = $input['password'] ?? '';

$errors = [];

// ==========================================
// INPUT VALIDATION
// ==========================================

// Check for injection attacks
if (isSQLInjection($email) || isSQLInjection($password)) {
    logEvent('SQL Injection attempt detected on signin', 'WARNING');
    sendJSON(['success' => false, 'errors' => ['Invalid input detected']], 400);
}

// Validate required fields
if (empty($email)) $errors[] = 'Email is required';
if (empty($password)) $errors[] = 'Password is required';

// Return errors if validation failed
if (!empty($errors)) {
    logEvent('Sign in validation failed: ' . implode(', ', $errors), 'WARNING');
    sendJSON(['success' => false, 'errors' => $errors], 400);
}

// Validate email format
if (!isValidEmail($email)) {
    $errors[] = 'Invalid email address';
    sendJSON(['success' => false, 'errors' => $errors], 400);
}

// ==========================================
// LOOKUP USER & VERIFY PASSWORD
// ==========================================

try {
    // Use parameterized query to prevent SQL injection
    $stmt = $pdo->prepare("SELECT id, fullname, email, password_hash FROM users WHERE LOWER(email) = LOWER(?)");
    $stmt->execute([$email]);
    $user = $stmt->fetch();
    
    if (!$user) {
        logEvent('Sign in failed: User not found - ' . $email, 'WARNING');
        // Return generic message for security (don't reveal if email exists)
        sendJSON(['success' => false, 'errors' => ['Invalid email or password']], 401);
    }
    
    // Verify password hash using bcrypt
    if (!verifyPassword($password, $user['password_hash'])) {
        logEvent('Sign in failed: Invalid password - ' . $email, 'WARNING');
        sendJSON(['success' => false, 'errors' => ['Invalid email or password']], 401);
    }
    
    // Password is correct - sign in successful
    logEvent('✓ Sign in successful - User ID: ' . $user['id'] . ', Email: ' . $email, 'SUCCESS');
    
    // Update last login time
    $updateStmt = $pdo->prepare("UPDATE users SET last_login = NOW() WHERE id = ?");
    $updateStmt->execute([$user['id']]);
    
    sendJSON([
        'success' => true,
        'message' => 'Sign in successful',
        'user' => [
            'id' => (int)$user['id'],
            'email' => $user['email'],
            'fullname' => $user['fullname']
        ]
    ], 200);
    
} catch (PDOException $e) {
    logEvent('Database error during signin: ' . $e->getMessage(), 'ERROR');
    sendJSON(['success' => false, 'errors' => ['Sign in failed']], 500);
}
?>
