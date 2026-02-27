<?php
/**
 * ==========================================================
 * HTTP SECURE HEADERS CONFIGURATION
 * ==========================================================
 * 
 * This file sets comprehensive security headers for the entire application.
 * Include this at the very beginning of every PHP page and API endpoint.
 * 
 * Security Headers Implemented:
 * - Content-Security-Policy (CSP): Prevent XSS attacks
 * - Strict-Transport-Security (HSTS): Force HTTPS
 * - X-Content-Type-Options: Prevent MIME sniffing
 * - Referrer-Policy: Control referrer information
 * - X-Frame-Options: Prevent clickjacking
 * - Permissions-Policy: Control browser features
 * - X-XSS-Protection: Legacy XSS protection
 * - Remove X-Powered-By: Hide server information
 * - Cache-Control: Control caching behavior
 */

// Prevent output buffering issues by setting headers as early as possible
if (!headers_sent()) {

    // ========== 1. CONTENT-SECURITY-POLICY (CSP) ==========
    // Prevent XSS attacks by controlling which resources can be loaded
    header(
        "Content-Security-Policy: " .
        "default-src 'self'; " .
        "script-src 'self' 'unsafe-inline'; " .
        "style-src 'self' 'unsafe-inline'; " .
        "img-src 'self' data: https:; " .
        "font-src 'self'; " .
        "connect-src 'self'; " .
        "frame-src 'none'; " .
        "object-src 'none'; " .
        "media-src 'self'; " .
        "child-src 'none'; " .
        "base-uri 'self'; " .
        "form-action 'self'; " .
        "upgrade-insecure-requests; " .
        "block-all-mixed-content"
    );

    // ========== 2. HSTS (Strict-Transport-Security) ==========
    // Force HTTPS connections for enhanced security
    // Note: Only enforced in HTTPS environments
    if (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') {
        header(
            "Strict-Transport-Security: max-age=31536000; includeSubDomains; preload",
            true
        );
    }

    // ========== 3. X-Content-Type-Options ==========
    // Prevent MIME sniffing - ensures browsers respect Content-Type header
    header("X-Content-Type-Options: nosniff", true);

    // ========== 4. Referrer-Policy ==========
    // Control how much referrer information is shared
    header("Referrer-Policy: strict-origin-when-cross-origin", true);

    // ========== 5. X-Frame-Options ==========
    // Prevent clickjacking attacks
    header("X-Frame-Options: DENY", true);

    // ========== 6. Permissions-Policy (formerly Feature-Policy) ==========
    // Control which browser features can be used
    header(
        "Permissions-Policy: " .
        "geolocation=(), " .
        "microphone=(), " .
        "camera=(), " .
        "payment=(), " .
        "usb=(), " .
        "magnetometer=(), " .
        "gyroscope=(), " .
        "accelerometer=()",
        true
    );

    // ========== 7. X-XSS-Protection ==========
    // Legacy XSS protection header (for older browsers)
    header("X-XSS-Protection: 1; mode=block", true);

    // ========== 8. Remove X-Powered-By Header ==========
    // Hide server implementation details
    header_remove('X-Powered-By');

    // ========== 9. Cache-Control ==========
    // Prevent caching of sensitive content
    header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0", true);
    header("Pragma: no-cache", true);
    header("Expires: Thu, 01 Jan 1970 00:00:00 GMT", true);

    // ========== 10. Content-Type ==========
    // Ensure proper content type is set
    header("Content-Type: text/html; charset=UTF-8", true);

    // ========== 11. Remove unnecessary headers ==========
    header_remove('Server');

    // ========== 12. CORS (Cross-Origin Resource Sharing) ==========
    // Uncomment and customize for your domain if you need CORS
    // header("Access-Control-Allow-Origin: https://yourdomain.com", true);
    // header("Access-Control-Allow-Methods: GET, POST, OPTIONS", true);
    // header("Access-Control-Allow-Headers: Content-Type, Authorization", true);
    // header("Access-Control-Max-Age: 3600", true);
    // header("Access-Control-Allow-Credentials: true", true);

    // Handle CORS preflight requests
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit();
    }
}

?>
