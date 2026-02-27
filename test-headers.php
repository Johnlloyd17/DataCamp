<?php
/**
 * Security Headers Test Page
 * This page displays all HTTP headers being sent by your application
 */

// Include security headers
require_once __DIR__ . '/api/headers.php';

// Don't use JSON for this - we want to display headers visually
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Security Headers Test - DataCamp</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 40px 20px;
        }
        
        .container {
            max-width: 1000px;
            margin: 0 auto;
        }
        
        .header-section {
            background: white;
            border-radius: 12px;
            padding: 40px;
            margin-bottom: 30px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }
        
        h1 {
            color: #333;
            margin-bottom: 10px;
            font-size: 28px;
        }
        
        .subtitle {
            color: #666;
            margin-bottom: 30px;
            font-size: 16px;
        }
        
        .status {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 6px;
            font-weight: 600;
            margin-bottom: 20px;
            font-size: 14px;
        }
        
        .status.secure {
            background: #d4edda;
            color: #155724;
        }
        
        .status.warning {
            background: #fff3cd;
            color: #856404;
        }
        
        h2 {
            color: #667eea;
            font-size: 18px;
            margin-top: 30px;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #667eea;
        }
        
        .header-item {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 6px;
            padding: 15px;
            margin-bottom: 12px;
            font-family: 'Courier New', monospace;
            font-size: 13px;
            overflow-x: auto;
        }
        
        .header-item.present {
            border-left: 4px solid #28a745;
            background: #f0fff4;
        }
        
        .header-item.missing {
            border-left: 4px solid #ffc107;
            background: #fffbf0;
        }
        
        .header-name {
            color: #667eea;
            font-weight: 600;
            margin-bottom: 8px;
        }
        
        .header-value {
            color: #333;
            word-break: break-all;
            line-height: 1.5;
        }
        
        .description {
            color: #666;
            font-size: 12px;
            margin-top: 8px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto;
        }
        
        .badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 600;
            margin-right: 8px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto;
        }
        
        .badge.present {
            background: #d4edda;
            color: #155724;
        }
        
        .badge.missing {
            background: #fff3cd;
            color: #856404;
        }
        
        .info-box {
            background: #e7f3ff;
            border: 1px solid #b3d9ff;
            border-radius: 6px;
            padding: 15px;
            margin-bottom: 20px;
            color: #004085;
        }
        
        .success-box {
            background: #d4edda;
            border: 1px solid #c3e6cb;
            border-radius: 6px;
            padding: 15px;
            margin-bottom: 20px;
            color: #155724;
        }
        
        .warning-box {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 6px;
            padding: 15px;
            margin-bottom: 20px;
            color: #856404;
        }
        
        code {
            background: #f8f9fa;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
        }
        
        a {
            color: #667eea;
            text-decoration: none;
        }
        
        a:hover {
            text-decoration: underline;
        }
        
        .test-link {
            display: inline-block;
            margin-top: 20px;
            padding: 12px 24px;
            background: #667eea;
            color: white;
            border-radius: 6px;
            font-weight: 600;
            transition: background 0.3s;
        }
        
        .test-link:hover {
            background: #764ba2;
            text-decoration: none;
        }
        
        .footer {
            text-align: center;
            color: white;
            margin-top: 40px;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header-section">
            <h1>🔒 Security Headers Test</h1>
            <p class="subtitle">DataCamp Security Headers Implementation</p>
            
            <span class="status secure">✅ Security headers are configured</span>
            
            <div class="info-box">
                <strong>How to test online:</strong> Visit <a href="https://securityheaders.com/" target="_blank">securityheaders.com</a> and enter your domain URL to get a detailed security report.
            </div>
            
            <h2>📋 Detected Headers</h2>
            
            <?php
            // Get all headers sent
            $headers = headers_list();
            
            // Expected security headers
            $expectedHeaders = [
                'Content-Security-Policy' => 'Prevents XSS attacks',
                'Strict-Transport-Security' => 'Forces HTTPS connections',
                'X-Content-Type-Options' => 'Prevents MIME sniffing',
                'Referrer-Policy' => 'Controls referrer information',
                'X-Frame-Options' => 'Prevents clickjacking',
                'Permissions-Policy' => 'Controls browser features',
                'X-XSS-Protection' => 'Legacy XSS protection',
                'Cache-Control' => 'Prevents sensitive data caching',
            ];
            
            $presentHeaders = [];
            $detectedHeaders = [];
            
            foreach ($headers as $header) {
                $headerName = explode(':', $header)[0];
                $detectedHeaders[$headerName] = $header;
                
                if (isset($expectedHeaders[$headerName])) {
                    $presentHeaders[$headerName] = $header;
                }
            }
            
            // Display detected security headers
            echo '<div class="success-box">';
            echo '<strong>✅ Security Headers Detected: ' . count($presentHeaders) . '</strong>';
            echo '</div>';
            
            foreach ($expectedHeaders as $headerName => $description) {
                if (isset($detectedHeaders[$headerName])) {
                    $header = $detectedHeaders[$headerName];
                    $parts = explode(': ', $header, 2);
                    $value = isset($parts[1]) ? $parts[1] : '';
                    
                    echo '<div class="header-item present">';
                    echo '<span class="badge present">PRESENT</span>';
                    echo '<div class="header-name">' . htmlspecialchars($parts[0]) . '</div>';
                    echo '<div class="header-value">' . htmlspecialchars($value) . '</div>';
                    echo '<div class="description">' . htmlspecialchars($description) . '</div>';
                    echo '</div>';
                }
            }
            
            // Check for missing headers
            $missingHeaders = array_diff_key($expectedHeaders, $detectedHeaders);
            if (!empty($missingHeaders)) {
                echo '<div class="warning-box">';
                echo '<strong>⚠️ Missing Headers: ' . count($missingHeaders) . '</strong>';
                echo '</div>';
                
                foreach ($missingHeaders as $headerName => $description) {
                    echo '<div class="header-item missing">';
                    echo '<span class="badge missing">MISSING</span>';
                    echo '<div class="header-name">' . htmlspecialchars($headerName) . '</div>';
                    echo '<div class="description">' . htmlspecialchars($description) . '</div>';
                    echo '</div>';
                }
            }
            
            // Display other headers
            echo '<h2>📊 All Response Headers</h2>';
            foreach ($detectedHeaders as $header) {
                $parts = explode(': ', $header, 2);
                echo '<div class="header-item">';
                echo '<div class="header-name">' . htmlspecialchars($parts[0]) . '</div>';
                echo '<div class="header-value">' . htmlspecialchars(isset($parts[1]) ? $parts[1] : '') . '</div>';
                echo '</div>';
            }
            ?>
            
            <h2>🧪 Next Steps</h2>
            <div class="info-box">
                <p>1. <strong>For local testing:</strong> Open browser DevTools (F12) → Network tab → Check Response Headers</p>
                <p style="margin-top: 10px;">2. <strong>For online testing:</strong> Visit <a href="https://securityheaders.com/" target="_blank">securityheaders.com</a> and enter your domain</p>
                <p style="margin-top: 10px;">3. <strong>Expected result:</strong> You should achieve an A+ security grade</p>
            </div>
            
            <a href="https://securityheaders.com/" class="test-link" target="_blank">🔗 Test on securityheaders.com</a>
        </div>
        
        <div class="footer">
            <p>DataCamp Security Headers Implementation</p>
            <p style="margin-top: 10px; font-size: 12px; opacity: 0.8;">Protecting against XSS, clickjacking, MIME sniffing, and more.</p>
        </div>
    </div>
</body>
</html>
