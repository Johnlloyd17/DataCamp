<?php
// ==========================================
// USERS LIST API ENDPOINT
// ==========================================

require_once __DIR__ . '/../config.php';

// Only accept GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendJSON(['error' => 'Method not allowed'], 405);
}

logEvent('Users list requested');

try {
    // Get all users (without passwords for security)
    $stmt = $pdo->query("
        SELECT 
            id,
            fullname,
            email,
            organization,
            created_at as createdAt,
            last_login as lastLogin,
            1 as passwordStored
        FROM users
        ORDER BY created_at DESC
    ");
    
    $users = $stmt->fetchAll();
    
    sendJSON([
        'message' => 'Created user accounts',
        'totalUsers' => count($users),
        'users' => $users
    ], 200);
    
} catch (PDOException $e) {
    logEvent('Database error fetching users: ' . $e->getMessage(), 'ERROR');
    sendJSON(['success' => false, 'error' => 'Database error'], 500);
}
?>
