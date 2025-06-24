// Mobile Debugging Utility
// This file helps identify and resolve mobile connectivity issues

export const mobileDebug = {
  // Test basic connectivity
  testBasicConnectivity: async () => {
    const results = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      onLine: navigator.onLine,
      connection: navigator.connection ? {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt
      } : 'Not available',
      tests: {}
    };

    // Test 1: Basic fetch to a reliable endpoint
    try {
      const response = await fetch('https://httpbin.org/get', {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      results.tests.basicFetch = {
        success: true,
        status: response.status,
        statusText: response.statusText
      };
    } catch (error) {
      results.tests.basicFetch = {
        success: false,
        error: error.message
      };
    }

    // Test 2: Test our API endpoint
    try {
      const config = await import('../config/environments').then(m => m.getEnvironmentConfig());
      const response = await fetch(`${config.API_URL}/api/health`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        results.tests.apiHealth = {
          success: true,
          status: response.status,
          data: data
        };
      } else {
        results.tests.apiHealth = {
          success: false,
          status: response.status,
          statusText: response.statusText
        };
      }
    } catch (error) {
      results.tests.apiHealth = {
        success: false,
        error: error.message
      };
    }

    // Test 3: CORS test
    try {
      const config = await import('../config/environments').then(m => m.getEnvironmentConfig());
      const response = await fetch(`${config.API_URL}/api/cors-test`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        results.tests.corsTest = {
          success: true,
          status: response.status,
          data: data
        };
      } else {
        results.tests.corsTest = {
          success: false,
          status: response.status,
          statusText: response.statusText
        };
      }
    } catch (error) {
      results.tests.corsTest = {
        success: false,
        error: error.message
      };
    }

    console.log('🔍 Mobile Debug Results:', results);
    return results;
  },

  // Generate diagnostic report
  generateDiagnosticReport: async () => {
    const results = await mobileDebug.testBasicConnectivity();
    
    let report = `📱 Mobile Diagnostic Report\n`;
    report += `Generated: ${results.timestamp}\n\n`;
    
    report += `📋 Device Info:\n`;
    report += `- User Agent: ${results.userAgent}\n`;
    report += `- Platform: ${results.platform}\n`;
    report += `- Online: ${results.onLine}\n`;
    report += `- Connection: ${JSON.stringify(results.connection)}\n\n`;
    
    report += `🧪 Test Results:\n`;
    
    Object.entries(results.tests).forEach(([testName, testResult]) => {
      report += `- ${testName}: ${testResult.success ? '✅ PASS' : '❌ FAIL'}\n`;
      if (!testResult.success) {
        report += `  Error: ${testResult.error || testResult.statusText}\n`;
      }
    });
    
    report += `\n💡 Recommendations:\n`;
    
    if (!results.tests.basicFetch.success) {
      report += `- Check internet connection\n`;
    }
    
    if (!results.tests.apiHealth.success) {
      report += `- API server may be down or unreachable\n`;
    }
    
    if (!results.tests.corsTest.success) {
      report += `- CORS configuration issue detected\n`;
    }
    
    if (results.onLine && results.tests.basicFetch.success && !results.tests.apiHealth.success) {
      report += `- Network connectivity is fine, but API is unreachable\n`;
      report += `- Check if API URL is correct and server is running\n`;
    }
    
    console.log(report);
    return report;
  },

  // Show diagnostic modal
  showDiagnosticModal: async () => {
    try {
      const report = await mobileDebug.generateDiagnosticReport();
      alert(report);
    } catch (error) {
      console.error('Error generating diagnostic report:', error);
      alert('Error generating diagnostic report. Check console for details.');
    }
  },

  // Test specific API endpoints
  testApiEndpoints: async () => {
    const config = await import('../config/environments').then(m => m.getEnvironmentConfig());
    const baseUrl = config.API_URL;
    
    const endpoints = [
      '/',
      '/api/health',
      '/api/cors-test'
    ];
    
    const results = {};
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${baseUrl}${endpoint}`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        });
        
        results[endpoint] = {
          success: response.ok,
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        };
        
        if (response.ok) {
          try {
            const data = await response.json();
            results[endpoint].data = data;
          } catch (parseError) {
            results[endpoint].parseError = parseError.message;
          }
        }
      } catch (error) {
        results[endpoint] = {
          success: false,
          error: error.message
        };
      }
    }
    
    console.log('🔍 API Endpoint Test Results:', results);
    return results;
  }
};

export default mobileDebug; 