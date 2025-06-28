import React, { useState, useEffect } from 'react';
import creditService from '../services/creditService';

const CreditSystemTest = () => {
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setLoading(true);
    setTestResults([]);
    
    const results = [];

    try {
      // Test 1: Get balance
      results.push({ test: 'Get Balance', status: 'running' });
      const balanceResponse = await creditService.getBalance();
      results.push({ 
        test: 'Get Balance', 
        status: 'passed', 
        data: `Balance: ${balanceResponse.balance} credits` 
      });

      // Test 2: Get packages
      results.push({ test: 'Get Packages', status: 'running' });
      const packagesResponse = await creditService.getPackages();
      results.push({ 
        test: 'Get Packages', 
        status: 'passed', 
        data: `Found ${packagesResponse.packages.length} packages` 
      });

      // Test 3: Get stats
      results.push({ test: 'Get Stats', status: 'running' });
      const statsResponse = await creditService.getStats();
      results.push({ 
        test: 'Get Stats', 
        status: 'passed', 
        data: `Stats loaded successfully` 
      });

      // Test 4: Get transactions
      results.push({ test: 'Get Transactions', status: 'running' });
      const transactionsResponse = await creditService.getTransactions({ limit: 5 });
      results.push({ 
        test: 'Get Transactions', 
        status: 'passed', 
        data: `Found ${transactionsResponse.transactions.length} transactions` 
      });

      // Test 5: Get Stripe key
      results.push({ test: 'Get Stripe Key', status: 'running' });
      const stripeResponse = await creditService.getStripeKey();
      results.push({ 
        test: 'Get Stripe Key', 
        status: 'passed', 
        data: `Stripe key loaded: ${stripeResponse.publishableKey ? 'Yes' : 'No'}` 
      });

    } catch (error) {
      results.push({ 
        test: 'Error', 
        status: 'failed', 
        data: error.message 
      });
    }

    setTestResults(results);
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h2>🧪 Credit System Frontend Test</h2>
      
      <button
        onClick={runTests}
        disabled={loading}
        style={{
          padding: '12px 24px',
          backgroundColor: loading ? '#ccc' : '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: '16px',
          marginBottom: '20px'
        }}
      >
        {loading ? 'Running Tests...' : 'Run Tests'}
      </button>

      <div>
        {testResults.map((result, index) => (
          <div
            key={index}
            style={{
              padding: '10px',
              marginBottom: '8px',
              borderRadius: '4px',
              backgroundColor: 
                result.status === 'passed' ? '#e8f5e8' :
                result.status === 'failed' ? '#ffebee' :
                result.status === 'running' ? '#fff3e0' : '#f5f5f5',
              border: `1px solid ${
                result.status === 'passed' ? '#4CAF50' :
                result.status === 'failed' ? '#f44336' :
                result.status === 'running' ? '#FF9800' : '#ddd'
              }`
            }}
          >
            <div style={{ fontWeight: 'bold', color: '#333' }}>
              {result.status === 'passed' ? '✅' : 
               result.status === 'failed' ? '❌' : 
               result.status === 'running' ? '🔄' : '⏳'} {result.test}
            </div>
            {result.data && (
              <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
                {result.data}
              </div>
            )}
          </div>
        ))}
      </div>

      {testResults.length > 0 && !loading && (
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '6px' }}>
          <h3>Test Summary</h3>
          <p>✅ Passed: {testResults.filter(r => r.status === 'passed').length}</p>
          <p>❌ Failed: {testResults.filter(r => r.status === 'failed').length}</p>
          <p>🔄 Running: {testResults.filter(r => r.status === 'running').length}</p>
        </div>
      )}
    </div>
  );
};

export default CreditSystemTest; 