# Token Handling System Documentation

## Overview

This document describes the enhanced token handling system for the TherapyAI application. The system provides secure JWT-based authentication with automatic token refresh, improved security, and centralized token management.

## Features

### 1. JWT Token System
- **Access Tokens**: Short-lived tokens (24 hours for therapists, 4 hours for admins)
- **Refresh Tokens**: Long-lived tokens (7 days) for automatic token renewal
- **Token Expiration**: Automatic expiration handling with client-side checks
- **Role-based Tokens**: Support for different user roles (admin, therapist)

### 2. Security Improvements
- **Automatic Token Refresh**: Seamless token renewal without user intervention
- **Token Validation**: Server-side and client-side token validation
- **Secure Logout**: Proper token cleanup on logout
- **Expired Token Handling**: Automatic redirect to login when tokens expire

### 3. Centralized Management
- **TokenService**: Singleton service for all token operations
- **API Configuration**: Centralized API endpoint management
- **Consistent Implementation**: Uniform token handling across all components

## Backend Implementation

### Token Service (`src/Backend/services/token_service.py`)

#### Key Functions:
- `create_access_token()`: Creates JWT access tokens with expiration
- `create_refresh_token()`: Creates refresh tokens for token renewal
- `decode_access_token()`: Validates and decodes JWT tokens
- `refresh_access_token()`: Generates new tokens using refresh token
- `get_current_user()`: FastAPI dependency for route protection

#### Configuration:
```python
# Token expiration settings
DEFAULT_ACCESS_TOKEN_EXPIRE = {
    "admin": 4 hours,
    "therapist": 24 hours
}
REFRESH_TOKEN_EXPIRE = 7 days
```

### Auth Routes (`src/Backend/routes/auth.py`)

#### New Endpoints:
- `POST /auth/refresh`: Refresh access tokens
- `POST /auth/logout`: Logout (token cleanup)
- `POST /auth/validate-token`: Validate current token

#### Updated Login Response:
```json
{
    "therapist_id": 123,
    "access_token": "eyJ...",
    "refresh_token": "eyJ...",
    "full_name": "John Doe",
    "token_type": "bearer"
}
```

## Frontend Implementation

### Token Service (`src/services/tokenService.js`)

#### Key Methods:
- `setTokens()`: Store tokens securely
- `getAccessToken()`: Retrieve current access token
- `isAuthenticated()`: Check authentication status
- `authenticatedFetch()`: Make API calls with automatic token refresh
- `logout()`: Secure logout with token cleanup

#### Automatic Features:
- **Token Refresh**: Automatic renewal before expiration
- **API Integration**: Built-in authentication for all API calls
- **Error Handling**: Graceful handling of token errors

### API Configuration (`src/config/api.js`)

Centralized configuration for all API endpoints:
```javascript
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/auth/login',
      REFRESH: '/auth/refresh',
      // ...
    },
    // ...
  }
};
```

## Usage Examples

### Making Authenticated API Calls

#### Old Way (Manual Token Handling):
```javascript
const token = localStorage.getItem("access_token");
const response = await fetch(url, {
  headers: { Authorization: `Bearer ${token}` }
});
```

#### New Way (Automatic Token Management):
```javascript
import tokenService from '../services/tokenService';

const response = await tokenService.authenticatedFetch(url, {
  method: 'GET'
});
```

### Token Storage and Retrieval

#### Storing Tokens (Login):
```javascript
tokenService.setTokens(
  access_token,
  refresh_token,
  therapist_id,
  full_name,
  email
);
```

#### Checking Authentication:
```javascript
if (tokenService.isAuthenticated()) {
  // User is logged in
}
```

### Logout:
```javascript
tokenService.logout(); // Automatic cleanup and redirect
```

## Security Benefits

### 1. Token Expiration
- **Access Tokens**: Short-lived to minimize security risk
- **Refresh Tokens**: Longer-lived but can be revoked
- **Automatic Renewal**: Seamless user experience

### 2. Improved Error Handling
- **Expired Token Detection**: Automatic detection and refresh
- **Invalid Token Handling**: Graceful degradation to login
- **Network Error Recovery**: Retry mechanisms for API calls

### 3. Centralized Security
- **Single Point of Control**: All token logic in one service
- **Consistent Implementation**: Same security across all components
- **Easy Updates**: Single location for security improvements

## Migration Guide

### Components Updated:
1. **LoginPage.jsx**: Updated to use new token service
2. **Header.js**: Uses tokenService for authentication checks
3. **ProtectedRoute.jsx**: Centralized authentication check
4. **PatientDashboard.jsx**: Example of authenticatedFetch usage
5. **App.js**: Fixed token key inconsistency

### Breaking Changes:
1. **localStorage Key**: Now consistently uses "access_token"
2. **API Responses**: Include refresh_token in login response
3. **Import Changes**: Components now import tokenService

### Migration Steps:
1. Update imports to include tokenService
2. Replace manual localStorage calls with tokenService methods
3. Replace manual fetch calls with authenticatedFetch
4. Update token key references from "token" to "access_token"

## Environment Variables

### Backend (.env):
```
SECRET_KEY=your-secret-key-here
```

### Frontend (.env):
```
REACT_APP_API_URL=http://localhost:8000
```

## Testing

### Backend Tests:
- Token creation and validation
- Refresh token functionality
- Authentication middleware
- Role-based access control

### Frontend Tests:
- Token service functionality
- Automatic refresh behavior
- Authentication state management
- API call authentication

## Troubleshooting

### Common Issues:

1. **Token Refresh Fails**
   - Check refresh token validity
   - Verify server connectivity
   - Check SECRET_KEY configuration

2. **Authentication Loops**
   - Clear localStorage and restart
   - Check token expiration settings
   - Verify API endpoints

3. **CORS Issues**
   - Update FRONTEND_ORIGINS in backend config
   - Check API_BASE_URL in frontend

### Debug Information:
- Check browser console for token service logs
- Verify token payload using JWT debugger
- Monitor network requests for authentication headers

## Future Enhancements

1. **Token Blacklisting**: Server-side token revocation
2. **Multi-device Support**: Device-specific tokens
3. **Advanced Security**: Token fingerprinting, rate limiting
4. **Audit Logging**: Track token usage and security events
