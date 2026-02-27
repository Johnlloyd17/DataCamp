# 🔒 DataCamp - Secure HTTP Headers Implementation

This project implements comprehensive HTTP Secure Headers to protect against common web vulnerabilities without modifying frontend code.

## 🚀 Quick Setup for XAMPP

### Step 1: Enable `mod_headers` in XAMPP

1. Open XAMPP Control Panel
2. Click **Config** button next to Apache
3. Select **Apache (httpd.conf)**
4. Find the line: `#LoadModule headers_module modules/mod_headers.so`
5. **Remove the `#`** to uncomment it:
   ```
   LoadModule headers_module modules/mod_headers.so
   ```
6. Save and restart Apache

### Step 2: Place Your Project in XAMPP

Move your DataCamp folder to:
```
C:\xampp\htdocs\DataCamp\
```

### Step 3: Access Your App

Open your browser and visit:
```
http://localhost/DataCamp/
```

The `.htaccess` file automatically applies all security headers!

---

## Security Headers Implemented

### 1. **Content-Security-Policy (CSP)**
- **What it does:** Prevents XSS (Cross-Site Scripting) attacks by controlling which resources can be loaded
- **Protection:** Only allows scripts, styles, and images from trusted sources
- **Benefit:** Mitigates inline script injections

### 2. **HSTS (Strict-Transport-Security)**
- **What it does:** Forces browsers to communicate only over HTTPS
- **Protection:** Prevents man-in-the-middle attacks and protocol downgrade attacks
- **Benefit:** Automatic HTTPS enforcement for 1 year (with preload)

### 3. **X-Content-Type-Options**
- **What it does:** Prevents MIME type sniffing attacks
- **Protection:** Forces browsers to respect declared content types
- **Benefit:** Blocks execution of misidentified files

### 4. **Referrer-Policy**
- **What it does:** Controls how much referrer information is shared
- **Policy Used:** `strict-origin-when-cross-origin`
- **Benefit:** Protects user privacy and avoids leaking sensitive URLs

### 5. **X-Frame-Options**
- **What it does:** Prevents clickjacking attacks
- **Protection:** Blocks embedding your site in iframes
- **Benefit:** Prevents UI redressing attacks

### 6. **Permissions-Policy**
- **What it does:** Controls browser features and APIs
- **Disabled:** Geolocation, Microphone, Camera, Payment APIs
- **Benefit:** Restricts unauthorized access to sensitive browser features

### 7. **CORS (Cross-Origin Resource Sharing)**
- **What it does:** Controls which origins can access your resources
- **Configuration:** Restrict to your actual domain in production
- **Benefit:** Prevents unauthorized cross-origin requests

### 8. **Additional Security Headers**
- `X-XSS-Protection`: Legacy XSS protection for older browsers
- `X-Powered-By`: Removed to hide technology stack

## ⚙️ Configuration for XAMPP

### Enable PHP Support (Optional)

If you're using PHP with MySQL, the `.htaccess` file works alongside your PHP files:

```php
<?php
// In your PHP files, you can add additional headers:
header('X-Custom-Header: value');
?>
```

### Enable SSL/HTTPS

Uncomment in `.htaccess` to redirect all traffic to HTTPS:
```apache
# RewriteCond %{HTTPS} off
# RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

## 📋 Project Structure

```
C:\xampp\htdocs\DataCamp\
├── .htaccess                # Apache security headers configuration
├── index.html               # Main page
├── activity.html
├── dashboard.html
├── find.html
├── lineup.html
├── my-stuff.html
├── pings.html
├── real-world-results.html
├── signin.html
├── signup.html
├── css/
│   └── styles.css
├── js/
│   ├── auth.js
│   ├── dashboard.js
│   └── script.js
└── images/
    └── hero-image.avif
```

## ⚙️ Configuration

### Customizing Security Headers

Edit `server.js` to adjust security policies:

- **CSP Directives:** Modify the `contentSecurityPolicy` section
- **HSTS:** Change `maxAge` value (in seconds)
- **CORS Origin:** Update `Access-Control-Allow-Origin` with your actual domain
- **Permissions:** Adjust `Permissions-Policy` for your needs

### Example: Adding a CDN to CSP

```javascript
scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.example.com"],
```

## 🔐 Security Checklist

- [x] CSP prevents XSS attacks
- [x] HSTS enforces HTTPS
- [x] X-Content-Type-Options prevents MIME sniffing
- [x] Referrer-Policy protects privacy
- [x] X-Frame-Options prevents clickjacking
- [x] Permissions-Policy restricts browser APIs
- [x] CORS controls cross-origin access
- [x] X-Powered-By header removed

## 🧪 Testing Headers

### Verify Headers in Browser

1. Open `http://localhost/DataCamp/` in your browser
2. Press **F12** to open Developer Tools
3. Go to **Network** tab
4. Refresh the page
5. Click on the first request (index.html)
6. Look for **Response Headers** section
7. You should see:
   - `Content-Security-Policy`
   - `Strict-Transport-Security`
   - `X-Content-Type-Options`
   - `Referrer-Policy`
   - `X-Frame-Options`
   - `Permissions-Policy`

### Online Tools

Use these services to analyze your headers:
- [SecurityHeaders.com](https://securityheaders.com) - Upload your domain
- [Mozilla Observatory](https://observatory.mozilla.org) - Security scanner

For localhost testing, use:
```bash
curl -i http://localhost/DataCamp/
```

## 📚 References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [MDN Security Headers](https://developer.mozilla.org/en-US/docs/Glossary/Security_header)
- [PHP Security Guide](https://www.php.net/manual/en/security.php)

## 🛠️ Production Deployment

### For Shared Hosting with Apache

1. **Enable mod_headers:**
   - Contact hosting provider to enable `mod_headers` on Apache
   - Or add `.htaccess` if you have permissions

2. **Update CORS (if needed):**
   ```apache
   Header set Access-Control-Allow-Origin "https://yourdomain.com"
   ```

3. **Enable HTTPS:**
   ```apache
   # Uncomment these lines in .htaccess:
   RewriteCond %{HTTPS} off
   RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
   ```

4. **Test Your Headers:**
   - Visit [SecurityHeaders.com](https://securityheaders.com)
   - Enter your domain
   - Should get **A+ grade**

### For PHP Backend Integration

If you're using PHP with MySQL, the headers work automatically:
- Place `.htaccess` in your project root
- You can also add headers in PHP code
- No conflicts with existing PHP/MySQL setup

---

**Your app is now protected by enterprise-grade HTTP security headers! 🔒**
