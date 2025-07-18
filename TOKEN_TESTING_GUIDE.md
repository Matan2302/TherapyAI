# Token Handling Testing Guide

## Quick Testing Steps

### 🚀 **Start the Application**

1. **Backend**: 
   ```bash
   cd src/Backend
   python -m uvicorn main:app --reload --port 8000
   ```

2. **Frontend**:
   ```bash
   npm start
   ```

### 🔍 **Testing Methods**

## Method 1: Visual Token Debugger (Easiest)

1. **Login** to your application
2. **Navigate** to the Debug page by clicking the "🔐 Debug" link in the header
3. **View** comprehensive token information including:
   - Authentication status
   - Token contents (decoded payload)
   - Expiration times
   - User data

4. **Test actions** using the buttons:
   - **🔄 Refresh Info**: Updates the display
   - **🔄 Test Token Refresh**: Manually triggers token refresh
   - **✅ Validate Token**: Checks if token is valid with server
   - **🌐 Test Auth Fetch**: Tests authenticated API call
   - **🗑️ Clear Tokens**: Clears all tokens (will redirect to login)

## Method 2: Browser Developer Tools

### **Check LocalStorage**:
1. Open **F12 Developer Tools**
2. Go to **Application** tab → **Local Storage**
3. Look for these keys:
   ```
   access_token     - Your JWT access token
   refresh_token    - Your JWT refresh token  
   therapist_id     - User ID
   therapist_name   - User full name
   therapist_email  - User email
   ```

### **Monitor Network Requests**:
1. Open **F12 Developer Tools**
2. Go to **Network** tab
3. Make API calls and check:
   - **Authorization header**: Should contain `Bearer <token>`
   - **Response codes**: 200 = success, 401 = unauthorized
   - **Token refresh calls**: Look for calls to `/auth/refresh`

### **Console Logging**:
Check browser console for debug messages like:
```
[TokenService] Storing tokens {therapistId: "123", ...}
[TokenService] Attempting to refresh token
[TokenService] Token refreshed successfully
```

## Method 3: Backend API Testing

### **Direct API Calls** (using curl or Postman):

1. **Login and get tokens**:
   ```bash
   curl -X POST http://localhost:8000/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"your@email.com","password":"yourpassword"}'
   ```

2. **Test protected endpoint**:
   ```bash
   curl -X GET http://localhost:8000/auth/test-auth \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
   ```

3. **Test token refresh**:
   ```bash
   curl -X POST http://localhost:8000/auth/refresh \
     -H "Content-Type: application/json" \
     -d '{"refresh_token":"YOUR_REFRESH_TOKEN"}'
   ```

4. **Test token validation**:
   ```bash
   curl -X POST http://localhost:8000/auth/validate-token \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
   ```

## Method 4: Manual Testing Scenarios

### **Scenario 1: Normal Login Flow**
1. Go to `/login`
2. Enter credentials
3. Check that you're redirected to `/home`
4. Verify tokens are stored in localStorage
5. Navigate around - should stay logged in

### **Scenario 2: Token Expiration Testing**
1. Login normally
2. **Manually expire the token** by editing it in localStorage (change a character)
3. Make an API call (go to dashboard, etc.)
4. Should automatically redirect to login

### **Scenario 3: Refresh Token Flow**
1. Login normally
2. Go to Token Debug page
3. Click "Test Token Refresh"
4. Verify new tokens are issued
5. Old token should be replaced

### **Scenario 4: Logout Flow**
1. Login normally
2. Click logout (or go to Token Debug and click "Clear Tokens")
3. Verify all tokens are removed from localStorage
4. Verify redirect to login page
5. Try accessing protected routes - should redirect to login

## 🔧 **Troubleshooting Common Issues**

### **Issue: Tokens not being stored**
- Check browser console for errors
- Verify login API response includes `access_token` and `refresh_token`
- Check localStorage in dev tools

### **Issue: Automatic refresh not working**
- Check console for error messages
- Verify refresh token is valid
- Check network tab for refresh API calls
- Verify backend `/auth/refresh` endpoint is working

### **Issue: Authentication loops**
- Clear localStorage completely
- Check for conflicting token keys
- Verify backend SECRET_KEY is set
- Restart both frontend and backend

### **Issue: 401 Unauthorized errors**
- Check token expiration in Token Debug page
- Verify Authorization header format: `Bearer <token>`
- Check backend logs for token validation errors

## 📊 **What to Look For**

### **✅ Good Signs:**
- Tokens are stored after login
- API calls include Authorization headers
- Token refresh happens automatically
- No authentication errors in console
- Smooth navigation without re-login prompts

### **❌ Warning Signs:**
- Missing Authorization headers
- 401 errors in network tab
- Empty localStorage
- Frequent redirects to login
- Console errors about tokens

## 🎯 **Performance Testing**

### **Test Token Refresh Timing**:
1. Login and note token expiration time
2. Wait until near expiration
3. Make an API call
4. Verify automatic refresh happens
5. New token should have extended expiration

### **Test Concurrent Requests**:
1. Open multiple tabs
2. Make API calls from different tabs
3. Verify token sharing works correctly
4. No conflicts between tabs

## 📝 **Logging and Monitoring**

### **Enable Debug Mode**:
The token service automatically enables debug logging in development mode. You'll see:
```
[TokenService] Storing tokens {therapistId: "123", therapistName: "John Doe", email: "john@doe.com"}
[TokenService] Attempting to refresh token
[TokenService] Token refreshed successfully
[TokenService] Clearing all tokens
```

### **Check Backend Logs**:
Look for authentication-related logs in your FastAPI server console.

## 🧪 **Automated Testing Ideas**

You can create automated tests for:
1. Token storage and retrieval
2. Automatic refresh functionality
3. Authentication state management
4. API call authentication
5. Logout cleanup

This testing guide should help you verify that your token handling is working correctly!
