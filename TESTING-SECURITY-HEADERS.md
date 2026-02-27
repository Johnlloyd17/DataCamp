# 🚀 Security Headers - Testing & Deployment Guide

## Implementation Summary

Your DataCamp application now implements **enterprise-grade HTTP Secure Headers** protecting against major web vulnerabilities.

### Files Created/Modified:

✅ **api/headers.php** - Central security headers configuration  
✅ **.htaccess** - Apache-level header directives  
✅ **api/config.php** - Updated to include headers.php  
✅ **api/debug.php** - Updated to include headers.php  
✅ **test-headers.php** - Local testing page  
✅ **SECURITY-HEADERS.md** - Detailed documentation

---

## 🧪 Local Testing (XAMPP)

### Step 1: Start XAMPP Services
```bash
# Start Apache and MySQL in XAMPP Control Panel
# Or command line:
# httpd.exe  (Apache)
# mysqld.exe (MySQL)
```

### Step 2: Test Headers Locally

**Option A: Using Test Page**
1. Navigate to: `http://localhost/DataCamp/test-headers.php`
2. View all detected security headers
3. Check if headers are properly configured

**Option B: Using Browser DevTools**
1. Open `http://localhost/DataCamp/`
2. Press `F12` to open Developer Tools
3. Go to **Network** tab
4. Reload the page
5. Click on any request (e.g., index.html)
6. View **Response Headers** tab
7. Look for security headers like:
   - `Content-Security-Policy`
   - `X-Content-Type-Options: nosniff`
   - `X-Frame-Options: DENY`

**Option C: Using curl Command**
```powershell
# Open PowerShell and run:
curl -i http://localhost/DataCamp/

# Or for a specific endpoint:
curl -i http://localhost/DataCamp/api/debug.php
```

### Step 3: Verify Expected Headers

You should see headers like:

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; ...
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Permissions-Policy: geolocation=(), microphone=(), camera=(), payment=(), ...
Cache-Control: no-store, no-cache, must-revalidate, max-age=0
```

---

## 🌐 Online Testing (Production/Staging)

### Testing on securityheaders.com

**Steps:**

1. **Deploy your application** to a publicly accessible server/domain
   - Cloud hosting (AWS, Azure, DigitalOcean, etc.)
   - Shared hosting with Apache
   - Your own server with HTTPS enabled

2. **Visit**: https://securityheaders.com/

3. **Enter your domain** in the input field
   ```
   Example: https://yourdomain.com
   ```

4. **Click "Scan"** and wait for the analysis

5. **Review the Report** showing:
   - ✅ Implemented headers with green checkmarks
   - ⚠️ Missing headers with yellow flags
   - Security grade: **A+**, A, B, C, D, E, F

6. **Expected Result**: You should achieve **A or A+ grade**

### What Each Grade Means

| Grade | Status | Headers |
|-------|--------|---------|
| ✅ A+ | Excellent | All critical headers present and properly configured |
| ✅ A | Good | Most headers present, minor improvements possible |
| ⚠️ B | Moderate | Some important headers missing |
| ⚠️ C | Poor | Several critical headers missing |
| ❌ D | Bad | Major security gaps |
| ❌ E | Very Bad | Multiple vulnerabilities |
| ❌ F | Failing | Critical security issues |

---

## 📋 Header Checklist

When testing, verify these headers are present:

### ✅ Essential Headers
- [ ] **Content-Security-Policy** - Prevents XSS attacks
- [ ] **X-Content-Type-Options: nosniff** - Prevents MIME sniffing
- [ ] **X-Frame-Options: DENY** - Prevents clickjacking
- [ ] **Referrer-Policy** - Controls referrer leakage

### ⭐ Recommended Headers
- [ ] **Strict-Transport-Security** - Forces HTTPS (production only)
- [ ] **Permissions-Policy** - Controls browser features
- [ ] **Cache-Control** - Prevents sensitive data caching
- [ ] **X-XSS-Protection** - Legacy XSS protection

### 🔍 Hidden Headers (Removed)
- [ ] **X-Powered-By** - Should NOT be present
- [ ] **Server** - Should NOT be present

---

## 🔧 Configuration Tips

### If Some Headers Are Missing

**1. Check Apache mod_headers**
```bash
# Verify mod_headers is enabled
# SSH into server and run:
apache2ctl -M | grep headers
# Should output: headers_module (shared)
```

**2. Check .htaccess is enabled**
```apache
# Add to .htaccess if not already present:
<IfModule mod_headers.c>
    Header set X-Content-Type-Options "nosniff"
</IfModule>
```

**3. Restart Apache**
```bash
# Linux/Mac:
sudo systemctl restart apache2
# Or:
sudo apachectl restart

# Windows (XAMPP):
# Use XAMPP Control Panel → Stop Apache → Start Apache
```

### If CSP is Too Strict

If you see CSP violation errors in browser console:

1. Open **Developer Tools** (F12)
2. Check **Console** tab for CSP errors
3. Note the blocked resource URL
4. Update `api/headers.php` to allow that domain:

```php
// Example: Allow Google Fonts
"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
"font-src 'self' https://fonts.gstatic.com; "
```

### If HSTS Causes HTTPS Issues

HSTS requires HTTPS. For local testing:

1. Comment out HSTS in `api/headers.php`:
```php
// Temporarily disabled for local testing
// if (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') {
//     header("Strict-Transport-Security: max-age=31536000; includeSubDomains; preload", true);
// }
```

---

## 📊 Testing Results Examples

### ✅ Perfect A+ Grade
```
Content-Security-Policy ✓
Strict-Transport-Security ✓
X-Content-Type-Options ✓
Referrer-Policy ✓
X-Frame-Options ✓
Permissions-Policy ✓
Cache-Control ✓
X-XSS-Protection ✓

Grade: A+
Score: Excellent - All security headers properly configured
```

### ⚠️ Good A Grade
```
Content-Security-Policy ✓
X-Content-Type-Options ✓
X-Frame-Options ✓
Referrer-Policy ✓

Grade: A
Score: Good - Most headers present
Recommendations: Add Strict-Transport-Security, Permissions-Policy
```

---

## 🚀 Deployment Checklist

Before going live:

- [ ] Enable HTTPS on your server (Let's Encrypt for free)
- [ ] Test on securityheaders.com (target A+ grade)
- [ ] Update CSP if using external resources (CDN, fonts, etc.)
- [ ] Remove any `'unsafe-inline'` from CSP if possible
- [ ] Submit domain to HSTS preload list: https://hstspreload.org/
- [ ] Monitor for CSP violations in production
- [ ] Set up security monitoring/alerts

---

## 📚 Testing Tools

### Primary Tools
- **securityheaders.com** - Comprehensive header analysis
- **HSTS Preload** - https://hstspreload.org/
- **CSP Evaluator** - https://csp-evaluator.withgoogle.com/

### Additional Tools
- **Mozilla Observatory** - https://observatory.mozilla.org/
- **Qualys SSL Labs** - https://www.ssllabs.com/ssltest/
- **OWASP ZAP** - Open-source security scanner

---

## 🔐 Security Best Practices

✅ **DO:**
- Test headers regularly
- Update CSP as needed for new resources
- Enable HTTPS in production
- Use HSTS preload for critical apps
- Monitor CSP violations

❌ **DON'T:**
- Use `'unsafe-eval'` in CSP
- Allow `*` in any CSP directive
- Disable HSTS without good reason
- Cache sensitive user data
- Expose server information

---

## 📞 Troubleshooting

### Headers Not Appearing?

1. **Check browser cache**
   ```
   Clear browser cache (Ctrl+Shift+Delete)
   Hard refresh (Ctrl+Shift+R)
   ```

2. **Verify PHP execution**
   ```
   Visit: http://localhost/DataCamp/test-headers.php
   Should show all detected headers
   ```

3. **Check error logs**
   ```
   Apache: C:\xampp\apache\logs\error.log
   PHP: Check XAMPP console
   ```

4. **Verify .htaccess syntax**
   ```
   Use Apache Syntax Checker online
   or check XAMPP Apache error log
   ```

### CSP Blocking Content?

1. Check browser console for CSP errors
2. Note the blocked resource URL
3. Add to CSP in `api/headers.php`
4. Reload and test

### HSTS Not Working?

1. Ensure HTTPS is active
2. Clear browser HSTS cache
3. Or test on fresh browser/incognito

---

## 📞 Support Resources

- **OWASP**: https://owasp.org/
- **MDN Web Docs**: https://developer.mozilla.org/
- **PHP Manual**: https://www.php.net/manual/
- **Apache Docs**: https://httpd.apache.org/docs/

---

## Summary

You've successfully implemented:
- ✅ **Content-Security-Policy** for XSS protection
- ✅ **HSTS** for HTTPS enforcement
- ✅ **X-Content-Type-Options** for MIME sniffing prevention
- ✅ **Referrer-Policy** for privacy control
- ✅ **X-Frame-Options** for clickjacking prevention
- ✅ **Permissions-Policy** for feature control
- ✅ **Cache-Control** for sensitive data protection

**Next**: Test on https://securityheaders.com/ for your final security grade!
