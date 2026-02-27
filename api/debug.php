<?php
// ==========================================
// SECURITY HEADERS - MUST BE FIRST
// ==========================================
require_once __DIR__ . '/headers.php';

// ==========================================
// DEBUG API ENDPOINT - Test if PHP is working
// ==========================================

// Test 1: Check if config can be loaded
echo "<h2>🔍 DataCamp API Debug</h2>";

echo "<h3>1. Config File Test</h3>";
if (file_exists(__DIR__ . '/config.php')) {
    echo "✅ config.php found<br>";
    require_once __DIR__ . '/config.php';
    echo "✅ config.php loaded successfully<br>";
} else {
    echo "❌ config.php NOT FOUND<br>";
    exit;
}

// Test 2: Check database connection
echo "<h3>2. Database Connection Test</h3>";
try {
    $test = $pdo->query("SELECT 1");
    echo "✅ Database connected successfully<br>";
} catch (Exception $e) {
    echo "❌ Database error: " . $e->getMessage() . "<br>";
    exit;
}

// Test 3: Check tables
echo "<h3>3. Database Tables Test</h3>";
try {
    $tables = $pdo->query("SHOW TABLES")->fetchAll();
    if (count($tables) > 0) {
        echo "✅ Found " . count($tables) . " tables:<br>";
        foreach ($tables as $table) {
            echo "&nbsp;&nbsp;- " . $table[0] . "<br>";
        }
    } else {
        echo "❌ No tables found - Run database.sql to create tables<br>";
    }
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "<br>";
}

// Test 4: Check users table structure
echo "<h3>4. Users Table Test</h3>";
try {
    $columns = $pdo->query("DESCRIBE users")->fetchAll();
    if (count($columns) > 0) {
        echo "✅ Users table has " . count($columns) . " columns:<br>";
        foreach ($columns as $col) {
            echo "&nbsp;&nbsp;- " . $col['Field'] . " (" . $col['Type'] . ")<br>";
        }
    } else {
        echo "❌ Users table structure error<br>";
    }
} catch (Exception $e) {
    echo "❌ Users table not found - Run database.sql first<br>";
}

// Test 5: Check existing users
echo "<h3>5. Users Count Test</h3>";
try {
    $count = $pdo->query("SELECT COUNT(*) as total FROM users")->fetch();
    echo "✅ Total users registered: " . $count['total'] . "<br>";
    
    $users = $pdo->query("SELECT id, fullname, email, created_at FROM users ORDER BY created_at DESC LIMIT 5")->fetchAll();
    if (count($users) > 0) {
        echo "📋 Recent users:<br>";
        foreach ($users as $user) {
            echo "&nbsp;&nbsp;- " . $user['fullname'] . " (" . $user['email'] . ") - " . $user['created_at'] . "<br>";
        }
    }
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "<br>";
}

// Test 6: Test password hashing function
echo "<h3>6. Security Functions Test</h3>";
try {
    $testPassword = "TestPassword123!";
    $hashed = hashPassword($testPassword);
    echo "✅ Password hashing works<br>";
    echo "&nbsp;&nbsp;Test password: $testPassword<br>";
    echo "&nbsp;&nbsp;Hashed: " . substr($hashed, 0, 20) . "...<br>";
    
    $verified = verifyPassword($testPassword, $hashed);
    if ($verified) {
        echo "✅ Password verification works<br>";
    } else {
        echo "❌ Password verification failed<br>";
    }
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "<br>";
}

// Test 7: Test API endpoint
echo "<h3>7. Test Signup API</h3>";
echo "POST to: api/auth/signup.php<br>";
echo "Test data:<br>";
echo "<pre>";
$testData = [
    'fullname' => 'Test User',
    'email' => 'test' . time() . '@example.com',
    'organization' => 'Test Organization',
    'password' => 'TestPassword123!'
];
echo json_encode($testData, JSON_PRETTY_PRINT);
echo "</pre>";

// Test 8: List all logs
echo "<h3>8. Recent Logs</h3>";
try {
    $logs = $pdo->query("SELECT * FROM logs ORDER BY timestamp DESC LIMIT 10")->fetchAll();
    if (count($logs) > 0) {
        echo "✅ Found " . count($logs) . " logs:<br>";
        foreach ($logs as $log) {
            echo "&nbsp;&nbsp;[" . $log['timestamp'] . "] [" . $log['type'] . "] " . $log['message'] . "<br>";
        }
    } else {
        echo "ℹ️ No logs yet<br>";
    }
} catch (Exception $e) {
    echo "ℹ️ Logs table not found or empty<br>";
}

echo "<hr>";
echo "<p style='color: green; font-weight: bold;'>✅ If all tests pass, your API should be working!</p>";
echo "<p>Next steps:</p>";
echo "<ol>";
echo "<li>Open browser DevTools (F12)</li>";
echo "<li>Go to signup form</li>";
echo "<li>Fill in form and click 'Complete signup'</li>";
echo "<li>Check Console tab for messages</li>";
echo "<li>Check Network tab to see API response</li>";
echo "</ol>";
?>
