-- =============================================================================
--  DATACAMP — STORED PROCEDURES
--  sql/procedures.sql
--
--  Import via phpMyAdmin Import tab:
--  1. Open phpMyAdmin → select "datacamp" database in the left sidebar.
--  2. Click the "Import" tab.
--  3. Choose this file and click "Go".
--
--  Run AFTER sql/schema.sql has already been imported.
-- =============================================================================

USE `datacamp`;

DELIMITER $$

-- ─────────────────────────────────────────────────────────────────────────────
--  sp_get_user_by_email
-- ─────────────────────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS `sp_get_user_by_email`$$

CREATE PROCEDURE `sp_get_user_by_email`(
    IN p_email VARCHAR(255)
)
BEGIN
    SELECT id, email, full_name, password_hash, status, role
      FROM users
     WHERE email = p_email
     LIMIT 1;
END$$

-- ─────────────────────────────────────────────────────────────────────────────
--  sp_create_user
--  OUT p_status = 0 → created, 1 → email already exists
-- ─────────────────────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS `sp_create_user`$$

CREATE PROCEDURE `sp_create_user`(
    IN  p_full_name     VARCHAR(100),
    IN  p_email         VARCHAR(255),
    IN  p_organisation  VARCHAR(150),
    IN  p_password_hash VARCHAR(255),
    OUT p_new_id        INT UNSIGNED,
    OUT p_status        TINYINT
)
BEGIN
    DECLARE dup_count INT DEFAULT 0;

    SELECT COUNT(*) INTO dup_count
      FROM users
     WHERE email = p_email;

    IF dup_count > 0 THEN
        SET p_status = 1;
        SET p_new_id = 0;
    ELSE
        INSERT INTO users
            (full_name, email, organisation, password_hash, status, role, created_at)
        VALUES
            (p_full_name, p_email, p_organisation, p_password_hash, 'active', 'user', NOW());

        SET p_new_id = LAST_INSERT_ID();
        SET p_status = 0;
    END IF;
END$$

-- ─────────────────────────────────────────────────────────────────────────────
--  sp_log_security_event
-- ─────────────────────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS `sp_log_security_event`$$

CREATE PROCEDURE `sp_log_security_event`(
    IN p_log_type ENUM('security','auth','db','app'),
    IN p_message  TEXT,
    IN p_ip       VARCHAR(45),
    IN p_user_id  INT UNSIGNED
)
BEGIN
    INSERT INTO security_logs
        (log_type, message, ip_address, user_id, created_at)
    VALUES
        (p_log_type, p_message, p_ip, p_user_id, NOW());
END$$

DELIMITER ;
