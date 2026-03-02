<?php
// =============================================================================
//  DATACAMP — PROJECTS API
//  php/api/projects.php
//
//  REST API for project CRUD operations.
//  • POST   /php/api/projects.php  — Create a new project
//  • GET    /php/api/projects.php  — List projects or get a specific project
//  • PUT    /php/api/projects.php  — Update a project
//  • DELETE /php/api/projects.php  — Delete a project
//
//  Authentication: Uses session-based auth (assumes user is logged in)
// =============================================================================

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../InputSanitizer.php';
require_once __DIR__ . '/../security-headers.php';

// Start session securely and send security headers
SecurityHeaders::init();

// Set JSON content type
header('Content-Type: application/json; charset=utf-8');

// Error handling - ensure we always return JSON
set_error_handler(function($errno, $errstr, $errfile, $errline) {
    error_log("[projects.php] Error: $errstr in $errfile:$errline");
    if (!headers_sent()) {
        http_response_code(500);
        echo json_encode(['error' => 'Internal server error: ' . $errstr]);
        exit;
    }
});

// Get the HTTP method
$method = $_SERVER['REQUEST_METHOD'];

// Check if user is authenticated (simple session check)
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$user_id = $_SESSION['user_id'];
$pdo = DB::connect();
$sanitizer = new InputSanitizer();

// Verify that required tables exist
try {
    $stmt = $pdo->query("SHOW TABLES LIKE 'projects'");
    if ($stmt->rowCount() === 0) {
        http_response_code(503);
        echo json_encode(['error' => 'Database tables not initialized. Please run sql/schema.sql in phpMyAdmin.']);
        exit;
    }
} catch (PDOException $e) {
    error_log('[projects.php] Table check failed: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Database connection error: ' . $e->getMessage()]);
    exit;
}

try {
    switch ($method) {
        case 'POST':
            createProject($pdo, $user_id, $sanitizer);
            break;

        case 'GET':
            getProjects($pdo, $user_id, $sanitizer);
            break;

        case 'PUT':
            updateProject($pdo, $user_id, $sanitizer);
            break;

        case 'DELETE':
            deleteProject($pdo, $user_id, $sanitizer);
            break;

        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method Not Allowed']);
            exit;
    }
} catch (Exception $e) {
    error_log('[projects.php] Exception: ' . get_class($e) . ' - ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine());
    if (!headers_sent()) {
        http_response_code(500);
        echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
    }
    exit;
}

// =============================================================================
//  CREATE — POST
// =============================================================================
function createProject($pdo, $user_id, $sanitizer) {
    $rawInput = file_get_contents('php://input');
    $input = json_decode($rawInput, true);

    if (!$input) {
        error_log('[projects.php] createProject - Invalid JSON received: ' . substr($rawInput, 0, 200));
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON: ' . json_last_error_msg()]);
        exit;
    }

    error_log('[projects.php] createProject - Input data: ' . json_encode($input));

    // Sanitize inputs
    $name = $sanitizer->sanitizeString($input['name'] ?? '');
    $description = $sanitizer->sanitizeString($input['description'] ?? '');
    $access_level = $input['access_level'] ?? 'invite-only';
    $all_access_type = $input['all_access_type'] ?? null;
    $start_date = $input['start_date'] ?? null;
    $end_date = $input['end_date'] ?? null;
    
    // Get tools or use defaults if not provided
    $tools = $input['tools'] ?? [];
    error_log('[projects.php] createProject - Tools received: ' . json_encode($tools));

    // Validate required fields
    if (empty($name)) {
        error_log('[projects.php] createProject - Empty project name');
        http_response_code(400);
        echo json_encode(['error' => 'Project name is required']);
        exit;
    }

    // Validate access level
    if (!in_array($access_level, ['invite-only', 'all-access'])) {
        $access_level = 'invite-only';
    }

    // Validate all_access_type (only if access_level is all-access)
    if ($access_level === 'all-access') {
        if (!in_array($all_access_type, ['data-prove', 'account'])) {
            $all_access_type = 'data-prove'; // Default to data-prove
        }
    } else {
        $all_access_type = null; // Null for invite-only
    }

    // Validate dates
    if ($start_date && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $start_date)) {
        $start_date = null;
    }
    if ($end_date && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $end_date)) {
        $end_date = null;
    }

    try {
        $stmt = $pdo->prepare('
            INSERT INTO projects (owner_id, name, description, access_level, all_access_type, start_date, end_date)
            VALUES (:owner_id, :name, :description, :access_level, :all_access_type, :start_date, :end_date)
        ');

        $stmt->execute([
            ':owner_id' => $user_id,
            ':name' => $name,
            ':description' => $description,
            ':access_level' => $access_level,
            ':all_access_type' => $all_access_type,
            ':start_date' => $start_date,
            ':end_date' => $end_date
        ]);

        $project_id = $pdo->lastInsertId();

        // Add creator as owner to project_members
        $memberStmt = $pdo->prepare('
            INSERT INTO project_members (project_id, user_id, role)
            VALUES (:project_id, :user_id, :role)
        ');

        $memberStmt->execute([
            ':project_id' => $project_id,
            ':user_id' => $user_id,
            ':role' => 'owner'
        ]);

        // Add default tools for the project
        $defaultTools = [
            'message-board' => isset($tools['message-board']) ? (bool)$tools['message-board'] : true,
            'todos' => isset($tools['todos']) ? (bool)$tools['todos'] : true,
            'docs-files' => isset($tools['docs-files']) ? (bool)$tools['docs-files'] : true,
            'chat' => isset($tools['chat']) ? (bool)$tools['chat'] : true,
            'schedule' => isset($tools['schedule']) ? (bool)$tools['schedule'] : true,
            'card-table' => isset($tools['card-table']) ? (bool)$tools['card-table'] : false,
        ];
        
        error_log('[projects.php] createProject - Tools to save: ' . json_encode($defaultTools));

        $toolStmt = $pdo->prepare('
            INSERT INTO project_tools (project_id, tool_name, enabled)
            VALUES (:project_id, :tool_name, :enabled)
        ');

        foreach ($defaultTools as $toolName => $enabled) {
            $enabledValue = $enabled ? 1 : 0;
            error_log('[projects.php] createProject - Inserting tool: ' . $toolName . ' = ' . $enabledValue);
            $toolStmt->execute([
                ':project_id' => $project_id,
                ':tool_name' => $toolName,
                ':enabled' => $enabledValue
            ]);
        }

        http_response_code(201);
        echo json_encode([
            'id' => (int)$project_id,
            'name' => $name,
            'description' => $description,
            'access_level' => $access_level,
            'all_access_type' => $all_access_type,
            'status' => 'active',
            'start_date' => $start_date,
            'end_date' => $end_date,
            'created_at' => date('Y-m-d H:i:s')
        ]);
        exit;
    } catch (PDOException $e) {
        error_log('[projects.php] createProject - PDO Error: ' . $e->getMessage() . ' (Code: ' . $e->getCode() . ')');
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
        exit;
    }
}

// =============================================================================
//  READ — GET
// =============================================================================
function getProjects($pdo, $user_id, $sanitizer) {
    $project_id = isset($_GET['id']) ? (int)$_GET['id'] : null;

    try {
        if ($project_id) {
            // Get a specific project — verify ownership or membership
            $stmt = $pdo->prepare('
                SELECT p.* 
                FROM projects p
                LEFT JOIN project_members pm ON p.id = pm.project_id
                WHERE p.id = :project_id 
                  AND (p.owner_id = :owner_id OR pm.user_id = :member_id)
                LIMIT 1
            ');

            $stmt->execute([
                ':project_id' => $project_id,
                ':owner_id' => $user_id,
                ':member_id' => $user_id
            ]);

            $project = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$project) {
                http_response_code(404);
                echo json_encode(['error' => 'Project not found or access denied']);
                exit;
            }

            // Fetch tools for this project
            $toolStmt = $pdo->prepare('
                SELECT tool_name, enabled 
                FROM project_tools 
                WHERE project_id = :project_id
                ORDER BY tool_name
            ');
            
            $toolStmt->execute([':project_id' => $project_id]);
            $toolsData = $toolStmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Convert tools array to associative array with tool_name => enabled
            $tools = [];
            foreach ($toolsData as $tool) {
                $tools[$tool['tool_name']] = (bool)$tool['enabled'];
            }
            
            $project['tools'] = $tools;

            echo json_encode($project);
            exit;
        } else {
            // Get all projects where user is owner or member
            $stmt = $pdo->prepare('
                SELECT DISTINCT p.* 
                FROM projects p
                LEFT JOIN project_members pm ON p.id = pm.project_id
                WHERE p.owner_id = :owner_id OR pm.user_id = :member_id
                ORDER BY p.created_at DESC
            ');

            $stmt->execute([':owner_id' => $user_id, ':member_id' => $user_id]);

            $projects = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode($projects);
            exit;
        }
    } catch (PDOException $e) {
        error_log('[projects.php] getProjects - DB Error: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
        exit;
    }
}

// =============================================================================
//  UPDATE — PUT
// =============================================================================
function updateProject($pdo, $user_id, $sanitizer) {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON']);
        exit;
    }

    $project_id = $input['id'] ?? null;

    if (!$project_id) {
        http_response_code(400);
        echo json_encode(['error' => 'Project ID is required']);
        exit;
    }

    // Verify ownership
    try {
        $stmt = $pdo->prepare('SELECT owner_id FROM projects WHERE id = :id');
        $stmt->execute([':id' => $project_id]);
        $project = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$project || $project['owner_id'] != $user_id) {
            http_response_code(403);
            echo json_encode(['error' => 'Forbidden: You can only edit your own projects']);
            exit;
        }

        // Sanitize updateable fields
        $name = isset($input['name']) ? $sanitizer->sanitizeString($input['name']) : null;
        $description = isset($input['description']) ? $sanitizer->sanitizeString($input['description']) : null;
        $status = isset($input['status']) ? $input['status'] : null;
        $access_level = isset($input['access_level']) ? $input['access_level'] : null;
        $all_access_type = isset($input['all_access_type']) ? $input['all_access_type'] : null;
        $start_date = isset($input['start_date']) ? $input['start_date'] : null;
        $end_date = isset($input['end_date']) ? $input['end_date'] : null;

        // Build dynamic UPDATE query
        $updates = [];
        $params = [':id' => $project_id];

        if ($name !== null) {
            $updates[] = 'name = :name';
            $params[':name'] = $name;
        }

        if ($description !== null) {
            $updates[] = 'description = :description';
            $params[':description'] = $description;
        }

        if ($status !== null && in_array($status, ['active', 'archived', 'completed'])) {
            $updates[] = 'status = :status';
            $params[':status'] = $status;
        }

        if ($access_level !== null && in_array($access_level, ['invite-only', 'all-access'])) {
            $updates[] = 'access_level = :access_level';
            $params[':access_level'] = $access_level;
            
            // Handle all_access_type based on access_level
            if ($access_level === 'all-access') {
                if ($all_access_type !== null && in_array($all_access_type, ['data-prove', 'account'])) {
                    $updates[] = 'all_access_type = :all_access_type';
                    $params[':all_access_type'] = $all_access_type;
                }
            } else {
                // For invite-only, set all_access_type to NULL
                $updates[] = 'all_access_type = NULL';
            }
        } elseif ($all_access_type !== null) {
            // Update all_access_type if access_level wasn't changed
            if (in_array($all_access_type, ['data-prove', 'account'])) {
                $updates[] = 'all_access_type = :all_access_type';
                $params[':all_access_type'] = $all_access_type;
            }
        }

        if ($start_date !== null) {
            $updates[] = 'start_date = :start_date';
            $params[':start_date'] = preg_match('/^\d{4}-\d{2}-\d{2}$/', $start_date) ? $start_date : null;
        }

        if ($end_date !== null) {
            $updates[] = 'end_date = :end_date';
            $params[':end_date'] = preg_match('/^\d{4}-\d{2}-\d{2}$/', $end_date) ? $end_date : null;
        }

        if (empty($updates)) {
            http_response_code(400);
            echo json_encode(['error' => 'No valid fields to update']);
            exit;
        }

        $sql = 'UPDATE projects SET ' . implode(', ', $updates) . ' WHERE id = :id';
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        // Return updated project
        $stmt = $pdo->prepare('SELECT * FROM projects WHERE id = :id');
        $stmt->execute([':id' => $project_id]);
        $updated = $stmt->fetch(PDO::FETCH_ASSOC);

        echo json_encode($updated);
        exit;
    } catch (PDOException $e) {
        error_log('[projects.php] updateProject - PDO Error: ' . $e->getMessage() . ' (Code: ' . $e->getCode() . ')');
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
        exit;
    }
}

// =============================================================================
//  DELETE — DELETE
// =============================================================================
function deleteProject($pdo, $user_id, $sanitizer) {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON']);
        exit;
    }

    $project_id = $input['id'] ?? null;

    if (!$project_id) {
        http_response_code(400);
        echo json_encode(['error' => 'Project ID is required']);
        exit;
    }

    try {
        // Verify ownership
        $stmt = $pdo->prepare('SELECT owner_id FROM projects WHERE id = :id');
        $stmt->execute([':id' => $project_id]);
        $project = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$project || $project['owner_id'] != $user_id) {
            http_response_code(403);
            echo json_encode(['error' => 'Forbidden: You can only delete your own projects']);
            exit;
        }

        // Delete project (cascades to project_members)
        $stmt = $pdo->prepare('DELETE FROM projects WHERE id = :id');
        $stmt->execute([':id' => $project_id]);

        http_response_code(200);
        echo json_encode(['message' => 'Project deleted successfully']);
        exit;
    } catch (PDOException $e) {
        error_log('[projects.php] deleteProject - PDO Error: ' . $e->getMessage() . ' (Code: ' . $e->getCode() . ')');
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
        exit;
    }
}
?>
