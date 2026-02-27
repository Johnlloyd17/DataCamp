<?php
// Test database connection
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "Testing database connection...\n\n";

// Database credentials
$host = 'localhost';
$user = 'root';
$pass = '';
$db = 'datacamp';

try {
    echo "1. Attempting to connect to MySQL server on port 4306...\n";
    $pdo = new PDO(
        "mysql:host=" . $host . ";port=4306",
        $user,
        $pass,
        array(
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        )
    );
    echo "✓ Connected to MySQL server\n\n";
    
    echo "2. Checking if database '$db' exists...\n";
    $result = $pdo->query("SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = '$db'");
    if ($result->fetch()) {
        echo "✓ Database 'datacamp' exists\n\n";
        
        echo "3. Checking tables in database...\n";
        $pdo->exec("USE $db");
        $result = $pdo->query("SHOW TABLES");
        $tables = $result->fetchAll();
        
        if (empty($tables)) {
            echo "✗ No tables found in 'datacamp' database!\n";
            echo "   You need to import database.sql to create the tables.\n";
        } else {
            echo "✓ Tables found:\n";
            foreach ($tables as $table) {
                echo "   - " . $table['Tables_in_' . $db] . "\n";
            }
        }
    } else {
        echo "✗ Database 'datacamp' does NOT exist!\n";
        echo "   You need to import database.sql to create the database and tables.\n";
    }
    
} catch (PDOException $e) {
    echo "✗ Connection failed: " . $e->getMessage() . "\n";
    echo "\nMake sure MySQL is running and the credentials are correct.\n";
}
?>
