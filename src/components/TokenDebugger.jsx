import React, { useState, useEffect } from 'react';
import tokenService from '../services/tokenService';
import { API_CONFIG } from '../config/api';

const TokenDebugger = () => {
  const [tokenInfo, setTokenInfo] = useState(null);
  const [refreshResult, setRefreshResult] = useState(null);
  const [validationResult, setValidationResult] = useState(null);

  useEffect(() => {
    updateTokenInfo();
  }, []);

  const updateTokenInfo = () => {
    const accessToken = tokenService.getAccessToken();
    const refreshToken = tokenService.getRefreshToken();
    
    if (accessToken) {
      const decoded = tokenService.decodeToken(accessToken);
      const isExpired = tokenService.isTokenExpired(accessToken);
      
      setTokenInfo({
        accessToken: accessToken.substring(0, 50) + '...',
        refreshToken: refreshToken ? refreshToken.substring(0, 50) + '...' : 'None',
        decoded,
        isExpired,
        isAuthenticated: tokenService.isAuthenticated(),
        therapistId: localStorage.getItem('therapist_id'),
        therapistName: localStorage.getItem('therapist_name'),
        therapistEmail: localStorage.getItem('therapist_email')
      });
    } else {
      setTokenInfo({
        accessToken: 'None',
        refreshToken: 'None',
        decoded: null,
        isExpired: true,
        isAuthenticated: false,
        therapistId: 'None',
        therapistName: 'None',
        therapistEmail: 'None'
      });
    }
  };

  const testTokenRefresh = async () => {
    try {
      setRefreshResult('Testing...');
      const newToken = await tokenService.refreshToken();
      setRefreshResult('✅ Success! Token refreshed');
      updateTokenInfo();
    } catch (error) {
      setRefreshResult(`❌ Error: ${error.message}`);
    }
  };

  const testTokenValidation = async () => {
    try {
      setValidationResult('Validating...');
      
      // First check if we have a token
      const accessToken = tokenService.getAccessToken();
      if (!accessToken) {
        setValidationResult('❌ No access token found');
        return;
      }

      // Check if token is expired locally
      const isExpired = tokenService.isTokenExpired(accessToken);
      if (isExpired) {
        setValidationResult('❌ Token is expired (local check)');
        return;
      }

      // Test server validation
      const isValid = await tokenService.validateToken();
      setValidationResult(isValid ? '✅ Token is valid' : '❌ Token is invalid (server check failed)');
    } catch (error) {
      setValidationResult(`❌ Error: ${error.message}`);
    }
  };

  const testAuthenticatedFetch = async () => {
    try {
      // Use the full URL from buildApiUrl to ensure it's correct
      const fullUrl = `http://localhost:8000${API_CONFIG.ENDPOINTS.AUTH.VALIDATE}`;
      console.log('Testing URL:', fullUrl);
      
      const response = await tokenService.authenticatedFetch(fullUrl, {
        method: 'POST'
      });
      if (response.ok) {
        const data = await response.json();
        alert(`✅ Authenticated fetch successful! Response: ${JSON.stringify(data)}`);
      } else {
        const errorText = await response.text();
        alert(`❌ Authenticated fetch failed: ${response.status} ${response.statusText}\nResponse: ${errorText}`);
      }
    } catch (error) {
      alert(`❌ Error: ${error.message}`);
    }
  };

  const testDirectAPI = async () => {
    try {
      const accessToken = tokenService.getAccessToken();
      if (!accessToken) {
        alert('❌ No access token found');
        return;
      }

      // Test direct API call to validate endpoint
      const response = await fetch('http://localhost:8000/auth/validate-token', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      const responseText = await response.text();
      
      if (response.ok) {
        alert(`✅ Direct API test successful! Status: ${response.status}, Response: ${responseText}`);
      } else {
        alert(`❌ Direct API test failed! Status: ${response.status}, Response: ${responseText}`);
      }
    } catch (error) {
      alert(`❌ Direct API Error: ${error.message}`);
    }
  };

  const clearTokens = () => {
    tokenService.clearTokens();
    updateTokenInfo();
    setRefreshResult(null);
    setValidationResult(null);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp * 1000).toLocaleString();
  };

  if (!tokenInfo) return <div>Loading token info...</div>;

  return (
    <div style={{ 
      padding: '20px', 
      border: '1px solid #ccc', 
      borderRadius: '8px', 
      margin: '20px',
      backgroundColor: '#f9f9f9',
      fontFamily: 'monospace'
    }}>
      <h3>🔐 Token Debug Information</h3>
      <p style={{ color: '#666', fontSize: '0.9em', marginBottom: '15px' }}>
        🛠️ <strong>Development Tool:</strong> This page is for debugging authentication issues. 
        Access directly via <code>/token-debug</code> URL when needed.
      </p>
      
      <div style={{ marginBottom: '15px' }}>
        <h4>Authentication Status:</h4>
        <p><strong>Is Authenticated:</strong> {tokenInfo.isAuthenticated ? '✅ Yes' : '❌ No'}</p>
        <p><strong>Access Token:</strong> {tokenInfo.accessToken}</p>
        <p><strong>Refresh Token:</strong> {tokenInfo.refreshToken}</p>
        <p><strong>Token Expired:</strong> {tokenInfo.isExpired ? '❌ Yes' : '✅ No'}</p>
      </div>

      {tokenInfo.decoded && (
        <div style={{ marginBottom: '15px' }}>
          <h4>Token Payload:</h4>
          <p><strong>User ID:</strong> {tokenInfo.decoded.sub}</p>
          <p><strong>Role:</strong> {tokenInfo.decoded.role}</p>
          <p><strong>Issued At:</strong> {formatDate(tokenInfo.decoded.iat)}</p>
          <p><strong>Expires At:</strong> {formatDate(tokenInfo.decoded.exp)}</p>
        </div>
      )}

      <div style={{ marginBottom: '15px' }}>
        <h4>Stored User Data:</h4>
        <p><strong>Therapist ID:</strong> {tokenInfo.therapistId}</p>
        <p><strong>Therapist Name:</strong> {tokenInfo.therapistName}</p>
        <p><strong>Therapist Email:</strong> {tokenInfo.therapistEmail}</p>
      </div>

      <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
        <h4>Debug Info:</h4>
        <p><strong>API Base URL:</strong> {API_CONFIG.BASE_URL}</p>
        <p><strong>Validate Endpoint:</strong> {API_CONFIG.ENDPOINTS.AUTH.VALIDATE}</p>
        <p><strong>Full Validate URL:</strong> {API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.AUTH.VALIDATE}</p>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <h4>Test Actions:</h4>
        <button 
          onClick={updateTokenInfo}
          style={{ margin: '5px', padding: '8px 12px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          🔄 Refresh Info
        </button>
        
        <button 
          onClick={testTokenRefresh}
          style={{ margin: '5px', padding: '8px 12px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          🔄 Test Token Refresh
        </button>
        
        <button 
          onClick={testTokenValidation}
          style={{ margin: '5px', padding: '8px 12px', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          ✅ Validate Token
        </button>
        
        <button 
          onClick={testAuthenticatedFetch}
          style={{ margin: '5px', padding: '8px 12px', backgroundColor: '#6f42c1', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          🌐 Test Auth Fetch
        </button>
        
        <button 
          onClick={testDirectAPI}
          style={{ margin: '5px', padding: '8px 12px', backgroundColor: '#fd7e14', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          🔗 Test Direct API
        </button>
        
        <button 
          onClick={clearTokens}
          style={{ margin: '5px', padding: '8px 12px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          🗑️ Clear Tokens
        </button>
      </div>

      {refreshResult && (
        <div style={{ marginBottom: '10px', padding: '10px', backgroundColor: '#e9ecef', borderRadius: '4px' }}>
          <strong>Refresh Test Result:</strong> {refreshResult}
        </div>
      )}

      {validationResult && (
        <div style={{ marginBottom: '10px', padding: '10px', backgroundColor: '#e9ecef', borderRadius: '4px' }}>
          <strong>Validation Test Result:</strong> {validationResult}
        </div>
      )}
    </div>
  );
};

export default TokenDebugger;
