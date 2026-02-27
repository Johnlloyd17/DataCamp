-- ==========================================
-- DATABASE SETUP FOR DATACAMP PROJECT
-- ==========================================
-- Run this SQL file in phpMyAdmin to create the database and tables

-- Create database (if not exists)
CREATE DATABASE IF NOT EXISTS datacamp;
USE datacamp;

-- ==========================================
-- USERS TABLE
-- ==========================================
-- Stores user account information
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fullname VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    organization VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- LOGS TABLE (Optional - for security auditing)
-- ==========================================
-- Stores all system and security logs
CREATE TABLE IF NOT EXISTS logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    type VARCHAR(50) DEFAULT 'INFO',
    message TEXT NOT NULL,
    ip_address VARCHAR(45) NULL,
    INDEX idx_timestamp (timestamp),
    INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- EXAMPLE DATA (Optional - for testing)
-- ==========================================
-- Insert test user (password: TestPassword123!)
-- Note: This is just an example - remove in production
INSERT INTO users (fullname, email, organization, password_hash) VALUES
(
    'Test User',
    'test@example.com',
    'Test Organization',
    '$2y$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36DyO9GK'
);

-- ==========================================
-- DATABASE NOTES
-- ==========================================
-- Password hash format: bcrypt ($2y$ prefix)
-- Character set: utf8mb4 (supports emojis and special characters)
-- Collation: utf8mb4_unicode_ci (case-insensitive, accent-insensitive)
-- Email is unique to prevent duplicate accounts
-- All timestamps use server time (UTC is recommended)

-- ==========================================
-- SECURITY BEST PRACTICES IMPLEMENTED
-- ==========================================
-- ✓ Password stored as bcrypt hash (never plain text)
-- ✓ Email uniqueness enforced at database level
-- ✓ Indexes on email for fast lookups
-- ✓ UTF-8 encoding for international characters
-- ✓ is_active flag for soft deletes
-- ✓ Timestamps for audit trail
-- ✓ Separate logs table for security events
