// 🔒 Server Logs Display
// Fetches logs from the server and displays them in the browser console
// Only works when running locally with Node.js server

(function initServerLogs() {
  // Check if logs should be displayed
  const urlParams = new URLSearchParams(window.location.search);
  const showLogs = urlParams.get('logs') === 'true';

  if (!showLogs) return;

  // Fetch logs from server
  async function fetchLogs() {
    try {
      const response = await fetch('./php/api/logs.php');
      
      // If API doesn't exist (Vercel, static hosting), silently return
      if (!response.ok) {
        console.log('%c📋 Server logs only available when running locally', 'color: #999; font-style: italic;');
        return;
      }
      
      const data = await response.json();
      
      if (data.logs && data.logs.length > 0) {
        console.clear();
        console.log('%c📋 SERVER LOGS', 'font-size: 16px; font-weight: bold; color: #0066cc;');
        console.log('%c' + '='.repeat(50), 'color: #0066cc;');
        
        data.logs.forEach(log => {
          // Style different log types
          if (log.includes('🔒')) {
            console.log('%c' + log, 'color: #00cc00; font-weight: bold;');
          } else if (log.includes('✓')) {
            console.log('%c' + log, 'color: #00cc00;');
          } else if (log.includes('⚠️')) {
            console.log('%c' + log, 'color: #ff9900;');
          } else {
            console.log(log);
          }
        });
        
        console.log('%c' + '='.repeat(50), 'color: #0066cc;');
      }
    } catch (error) {
      // Silently fail on Vercel or static hosting
      console.log('%c💡 Server logs: Local development only (running on serverless platform)', 'color: #999; font-size: 11px;');
    }
  }

  // Fetch logs when page loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fetchLogs);
  } else {
    fetchLogs();
  }

  // Also provide a function to manually refresh logs
  window.refreshServerLogs = fetchLogs;
})();
