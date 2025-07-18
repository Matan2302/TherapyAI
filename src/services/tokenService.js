/**
 * Token management utilities for the frontend
 */

import { API_CONFIG, buildApiUrl } from '../config/api';

class TokenService {
  constructor() {
    this.debug = process.env.NODE_ENV === 'development';
    this.setupTokenRefresh();
  }

  /**
   * Log debug information if in development mode
   */
  log(message, data = null) {
    if (this.debug) {
      console.log(`[TokenService] ${message}`, data || '');
    }
  }

  /**
   * Store tokens in localStorage
   */
  setTokens(accessToken, refreshToken, therapistId, therapistName, email) {
    this.log('Storing tokens', { therapistId, therapistName, email });
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    localStorage.setItem('therapist_id', therapistId);
    localStorage.setItem('therapist_name', therapistName);
    localStorage.setItem('therapist_email', email);
  }

  /**
   * Get access token from localStorage
   */
  getAccessToken() {
    return localStorage.getItem('access_token');
  }

  /**
   * Get refresh token from localStorage
   */
  getRefreshToken() {
    return localStorage.getItem('refresh_token');
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!this.getAccessToken();
  }

  /**
   * Clear all tokens and user data
   */
  clearTokens() {
    this.log('Clearing all tokens');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('therapist_id');
    localStorage.removeItem('therapist_name');
    localStorage.removeItem('therapist_email');
  }

  /**
   * Decode JWT token (client-side only for basic info)
   */
  decodeToken(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if token is expired (client-side check)
   */
  isTokenExpired(token) {
    if (!token) return true;
    
    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) return false; // No expiration set
    
    const currentTime = Date.now() / 1000;
    return decoded.exp < currentTime;
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken() {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    this.log('Attempting to refresh token');

    try {
      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.AUTH.REFRESH), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();
      
      // Update tokens in localStorage
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      
      this.log('Token refreshed successfully');
      return data.access_token;
    } catch (error) {
      this.log('Token refresh failed', error.message);
      // If refresh fails, clear tokens and redirect to login
      this.clearTokens();
      window.location.href = '/login';
      throw error;
    }
  }

  /**
   * Make authenticated API request with automatic token refresh
   */
  async authenticatedFetch(url, options = {}) {
    let accessToken = this.getAccessToken();

    // Check if token is expired and try to refresh
    if (this.isTokenExpired(accessToken)) {
      try {
        accessToken = await this.refreshToken();
      } catch (error) {
        throw new Error('Authentication failed');
      }
    }

    // Add Authorization header
    const authHeaders = {
      ...options.headers,
      Authorization: `Bearer ${accessToken}`,
    };

    const response = await fetch(url, {
      ...options,
      headers: authHeaders,
    });

    // If we get 401, try refreshing token once
    if (response.status === 401) {
      try {
        accessToken = await this.refreshToken();
        const retryResponse = await fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            Authorization: `Bearer ${accessToken}`,
          },
        });
        return retryResponse;
      } catch (error) {
        // If refresh fails, clear tokens and redirect
        this.clearTokens();
        window.location.href = '/login';
        throw error;
      }
    }

    return response;
  }

  /**
   * Setup automatic token refresh
   */
  setupTokenRefresh() {
    // Check token every 5 minutes
    setInterval(() => {
      const accessToken = this.getAccessToken();
      if (accessToken && this.isTokenExpired(accessToken)) {
        this.refreshToken().catch(() => {
          // Silent fail - user will be redirected to login when they make a request
        });
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  /**
   * Validate current token with server
   */
  async validateToken() {
    try {
      const accessToken = this.getAccessToken();
      if (!accessToken) {
        this.log('No access token available for validation');
        return false;
      }

      // Direct fetch to avoid circular dependency with authenticatedFetch
      // Use POST method as defined in backend
      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.AUTH.VALIDATE), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      this.log('Token validation response', { status: response.status, ok: response.ok });
      return response.ok;
    } catch (error) {
      this.log('Token validation error', error.message);
      return false;
    }
  }

  /**
   * Logout user
   */
  async logout() {
    try {
      // Call logout endpoint (optional since JWT is stateless)
      await this.authenticatedFetch(buildApiUrl(API_CONFIG.ENDPOINTS.AUTH.LOGOUT), {
        method: 'POST',
      });
    } catch (error) {
      // Continue with logout even if server call fails
    } finally {
      this.clearTokens();
      window.location.href = '/login';
    }
  }
}

// Export singleton instance
const tokenService = new TokenService();
export default tokenService;
