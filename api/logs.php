<?php
// ==========================================
// LOGS API ENDPOINT
// ==========================================

require_once __DIR__ . '/../config.php';

// Only accept GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendJSON(['error' => 'Method not allowed'], 405);
}

try {
    // Get last 100 logs
    $stmt = $pdo->query("
        SELECT 
            id,
            timestamp,
            type,
            message
        FROM logs
        ORDER BY timestamp DESC
        LIMIT 100
    ");
    
    $logs = $stmt->fetchAll();
    
    sendJSON([
        'message' => 'Application logs',
        'totalLogs' => count($logs),
        'logs' => $logs
    ], 200);
    
} catch (PDOException $e) {
    // If logs table doesn't exist, return empty
    sendJSON([
        'message' => 'Application logs (table not created yet)',
        'totalLogs' => 0,
        'logs' => []
    ], 200);
}
?>
