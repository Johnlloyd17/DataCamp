<?php
// =============================================================================
//  DATACAMP — SECURE DATABASE CONNECTION
//  php/db.php
//
//  Uses PDO with prepared statements to eliminate SQL injection.
//  Credentials come from config.php — never hardcode them here.
//
//  Usage (server-side only):
//    require_once __DIR__ . '/db.php';
//    $pdo = DB::connect();
//    $stmt = $pdo->prepare('SELECT id, email FROM users WHERE email = :email');
//    $stmt->execute([':email' => $email]);
//    $user = $stmt->fetch();
//
//  ⚠  This file is blocked from direct browser access by php/.htaccess.
// =============================================================================

require_once __DIR__ . '/config.php';

class DB
{
    /** @var PDO|null  Singleton connection instance */
    private static ?PDO $instance = null;

    // =========================================================================
    //  PUBLIC API
    // =========================================================================

    /**
     * Return (or create) the singleton PDO connection.
     *
     * Connection options:
     *  • ERRMODE_EXCEPTION  – throw PDOException on errors (never silent failures)
     *  • DEFAULT_FETCH_ASSOC – fetch rows as associative arrays by default
     *  • EMULATE_PREPARES false  – use native prepared statements (real param binding)
     *  • STRINGIFY_FETCHES false – return ints/floats as PHP native types
     *
     * @throws RuntimeException  if the connection fails
     */
    public static function connect(): PDO
    {
        if (self::$instance !== null) {
            return self::$instance;
        }

        $dsn = sprintf(
            'mysql:host=%s;port=%s;dbname=%s;charset=%s',
            DB_HOST,
            DB_PORT,
            DB_NAME,
            DB_CHARSET
        );

        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,  // throw on error
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,        // assoc arrays
            PDO::ATTR_EMULATE_PREPARES   => false,                    // real prepared stmts
            PDO::ATTR_STRINGIFY_FETCHES  => false,                    // native PHP types
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES '" . DB_CHARSET . "' COLLATE 'utf8mb4_unicode_ci'",
        ];

        try {
            self::$instance = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            // Log the real error but NEVER expose it to the client
            error_log('[DB] Connection failed: ' . $e->getMessage());
            throw new RuntimeException('Database connection failed. Please try again later.');
        }

        return self::$instance;
    }

    /**
     * Execute a SELECT query and return all rows.
     *
     * @param  string  $sql     Parameterised SQL (use :placeholder or ?)
     * @param  array   $params  Bound parameter values
     * @return array<int, array<string, mixed>>
     *
     * @example
     *   $users = DB::query('SELECT id, name FROM users WHERE active = :a', [':a' => 1]);
     */
    public static function query(string $sql, array $params = []): array
    {
        $stmt = self::connect()->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    /**
     * Execute a SELECT query and return the first row only (or null).
     *
     * @param  string  $sql
     * @param  array   $params
     * @return array<string, mixed>|null
     */
    public static function queryOne(string $sql, array $params = []): ?array
    {
        $stmt = self::connect()->prepare($sql);
        $stmt->execute($params);
        $row  = $stmt->fetch();
        return $row !== false ? $row : null;
    }

    /**
     * Execute an INSERT / UPDATE / DELETE statement.
     * Returns the number of affected rows.
     *
     * @param  string  $sql
     * @param  array   $params
     * @return int  Rows affected
     */
    public static function execute(string $sql, array $params = []): int
    {
        $stmt = self::connect()->prepare($sql);
        $stmt->execute($params);
        return $stmt->rowCount();
    }

    /**
     * Execute an INSERT and return the auto-increment ID of the new row.
     *
     * @param  string  $sql
     * @param  array   $params
     * @return string  Last insert ID
     */
    public static function insert(string $sql, array $params = []): string
    {
        $pdo = self::connect();
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        return $pdo->lastInsertId();
    }

    /**
     * Wrap multiple statements in a transaction.
     * Automatically commits on success, rolls back on any exception.
     *
     * @param  callable  $callback  Receives the PDO instance; return value is forwarded
     * @return mixed  Whatever $callback returns
     *
     * @example
     *   DB::transaction(function (PDO $pdo) {
     *       DB::execute('INSERT INTO orders ...', [...]);
     *       DB::execute('UPDATE inventory ...', [...]);
     *   });
     */
    public static function transaction(callable $callback): mixed
    {
        $pdo = self::connect();
        $pdo->beginTransaction();

        try {
            $result = $callback($pdo);
            $pdo->commit();
            return $result;
        } catch (Throwable $e) {
            $pdo->rollBack();
            error_log('[DB] Transaction rolled back: ' . $e->getMessage());
            throw $e;
        }
    }

    // =========================================================================
    //  SECURITY HELPERS
    // =========================================================================

    /**
     * Hash a password using the algorithm defined in config.php.
     * Always use this instead of md5 / sha1.
     */
    public static function hashPassword(string $password): string
    {
        return password_hash($password, PASSWORD_ALGO, ['cost' => PASSWORD_COST]);
    }

    /**
     * Verify a plain-text password against a stored hash.
     * Returns true on match. Also returns true + sets $needsRehash if the hash
     * algorithm/cost has changed (so the caller can update the stored hash).
     *
     * @param  string  $password
     * @param  string  $hash
     * @param  bool    $needsRehash  Set to true if the hash should be updated
     */
    public static function verifyPassword(
        string $password,
        string $hash,
        bool &$needsRehash = false
    ): bool {
        if (!password_verify($password, $hash)) {
            return false;
        }

        $needsRehash = password_needs_rehash($hash, PASSWORD_ALGO, ['cost' => PASSWORD_COST]);
        return true;
    }
}
