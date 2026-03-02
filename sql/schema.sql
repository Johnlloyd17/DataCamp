-- =============================================================================
--  DATACAMP — DATABASE SCHEMA (Tables Only)
--  sql/schema.sql
--
--  HOW TO IMPORT IN phpMyAdmin:
--  ─────────────────────────────
--  1. Open phpMyAdmin  →  http://localhost/phpmyadmin  (or :8080/phpmyadmin)
--  2. Click "New" in the left sidebar to create the database, OR let this
--     script create it (the CREATE DATABASE statement is included below).
--  3. Click "Import" in the top navigation bar.
--  4. Choose this file  →  sql/schema.sql
--  5. Leave all settings at their defaults and click "Go".
--
--  STORED PROCEDURES are in a SEPARATE file — import AFTER this file:
--    → sql/procedures.sql
--
--  OWASP SQL Injection Prevention notes:
--    • utf8mb4 charset blocks multi-byte charset evasion attacks (e.g. GBK).
--    • ENUM constraints on status/role reject invalid values at the DB level.
--    • Unique index on email prevents duplicate accounts.
--    • Passwords are stored as bcrypt hashes — NEVER plaintext/md5/sha1.
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
--  1. DATABASE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE DATABASE IF NOT EXISTS `datacamp`
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE `datacamp`;


-- ─────────────────────────────────────────────────────────────────────────────
--  2. USERS
--  Core authentication table.
--  • password_hash  — bcrypt output via DB::hashPassword() (see php/db.php)
--  • status         — controls login access; 'suspended' blocks sign-in
--  • role           — used for access control checks throughout the app
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `users` (
    `id`            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    `full_name`     VARCHAR(100)    NOT NULL,
    `email`         VARCHAR(255)    NOT NULL,
    `organisation`  VARCHAR(150)    NOT NULL DEFAULT '',
    `password_hash` VARCHAR(255)    NOT NULL,
    `status`        ENUM('active','suspended','pending')
                                    NOT NULL DEFAULT 'active',
    `role`          ENUM('admin','project manager','viewer','client')
                    NOT NULL DEFAULT 'client',
    `created_at`    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
                                             ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`),

    -- Unique index: prevents duplicate accounts and speeds up login lookup
    UNIQUE KEY `uq_users_email` (`email`),

    -- Index on status: used in the WHERE clause of every sign-in query
    KEY `idx_users_status` (`status`)

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- ─────────────────────────────────────────────────────────────────────────────
--  3. LOGIN_ATTEMPTS
--  Backing store for php/RateLimiter.php.
--  Stores a SHA-256 hash of (email + IP) — never the raw email address.
--  Records are purged automatically after LOGIN_LOCKOUT_SECS seconds.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `login_attempts` (
    `attempt_key`      CHAR(64)    NOT NULL,
    `attempts`         TINYINT     NOT NULL DEFAULT 1,
    `first_attempt_at` DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `last_attempt_at`  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (`attempt_key`),

    -- Allows efficient purge of expired windows
    KEY `idx_attempts_first` (`first_attempt_at`)

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- ─────────────────────────────────────────────────────────────────────────────
--  4. SECURITY_LOGS
--  Structured audit log consumed by php/api/logs.php.
--
--  log_type values:
--    'security' — SQL injection / XSS attempt detected by InputSanitizer.php
--    'auth'     — login success / failure / account lockout
--    'db'       — database-level errors (no sensitive data stored here)
--    'app'      — general application events
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `security_logs` (
    `id`          BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
    `log_type`    ENUM('security','auth','db','app')
                                   NOT NULL DEFAULT 'app',
    `message`     TEXT             NOT NULL,
    `ip_address`  VARCHAR(45)      NOT NULL DEFAULT '',
    `user_id`     INT UNSIGNED         NULL DEFAULT NULL,
    `created_at`  DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`),
    KEY `idx_logs_type`       (`log_type`),
    KEY `idx_logs_created_at` (`created_at`),
    KEY `idx_logs_user`       (`user_id`)

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
--  5. PROJECTS
--  Project management table.
--  • owner_id           — the user who created the project
--  • status             — active projects vs archived/completed
--  • access_level       — 'invite-only' or 'all-access'
--  • all_access_type    — when access_level='all-access', specifies:
--                         'data-prove' (anyone from Data Prove)
--                         'account' (anyone on account except clients)
--  • Description, start/end dates for project management
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `projects` (
    `id`                INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    `owner_id`          INT UNSIGNED    NOT NULL,
    `name`              VARCHAR(255)    NOT NULL,
    `description`       TEXT            NOT NULL DEFAULT '',
    `status`            ENUM('active','archived','completed')
                                        NOT NULL DEFAULT 'active',
    `access_level`      ENUM('invite-only','all-access')
                                        NOT NULL DEFAULT 'invite-only',
    `all_access_type`   ENUM('data-prove','account')
                                            NULL DEFAULT NULL,
    `start_date`        DATE                NULL DEFAULT NULL,
    `end_date`          DATE                NULL DEFAULT NULL,
    `created_at`        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
                                                 ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`),
    KEY `idx_projects_owner` (`owner_id`),
    KEY `idx_projects_status` (`status`),
    KEY `idx_projects_access` (`access_level`),
    CONSTRAINT `fk_projects_owner` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`) ON DELETE CASCADE

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- ─────────────────────────────────────────────────────────────────────────────
--  6. PROJECT_MEMBERS
--  Links users to projects they're part of.
--  • project_id     — the project
--  • user_id        — the team member
--  • role           — their role in the project
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `project_members` (
    `id`            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    `project_id`    INT UNSIGNED    NOT NULL,
    `user_id`       INT UNSIGNED    NOT NULL,
    `role`          ENUM('owner','editor','viewer')
                                    NOT NULL DEFAULT 'viewer',
    `joined_at`     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_project_members` (`project_id`, `user_id`),
    KEY `idx_pm_user` (`user_id`),
    CONSTRAINT `fk_pm_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_pm_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- ─────────────────────────────────────────────────────────────────────────────
--  7. PROJECT_TOOLS
--  Tracks which tools are enabled for each project.
--  • project_id     — the project
--  • tool_name      — the tool (message-board, todos, docs-files, chat, schedule, card-table)
--  • enabled        — whether the tool is active for this project
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `project_tools` (
    `id`            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    `project_id`    INT UNSIGNED    NOT NULL,
    `tool_name`     VARCHAR(50)     NOT NULL,
    `enabled`       BOOLEAN         NOT NULL DEFAULT TRUE,
    `created_at`    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_project_tools` (`project_id`, `tool_name`),
    CONSTRAINT `fk_pt_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
--  DONE — Next step: import sql/procedures.sql
-- ─────────────────────────────────────────────────────────────────────────────
