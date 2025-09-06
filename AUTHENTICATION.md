# Authentication System

This project implements a comprehensive multi-user authentication system with secure password handling, JWT tokens, and support for both SQLite (local) and PostgreSQL (production) databases.

## Features

- ✅ **User Registration** - Create new user accounts with username/password
- ✅ **User Login** - Authenticate existing users 
- ✅ **Password Change** - Allow users to update their passwords
- ✅ **JWT Authentication** - Secure token-based authentication
- ✅ **Password Hashing** - Secure bcrypt password hashing (12 rounds)
- ✅ **Input Validation** - Username and password validation
- ✅ **Protected Routes** - Middleware for protecting authenticated endpoints
- ✅ **React Components** - Ready-to-use authentication forms
- ✅ **Database Agnostic** - Works with both SQLite and PostgreSQL

## API Endpoints

### Authentication Routes

#### Register User
```
POST /api/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "password": "secretpassword"
}

Response:
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid",
    "username": "johndoe",
    "createdAt": "2025-01-01T00:00:00.000Z"
  },
  "token": "jwt-token"
}
```

#### Login User
```
POST /api/auth/login
Content-Type: application/json

{
  "username": "johndoe",
  "password": "secretpassword"
}

Response:
{
  "message": "Login successful",
  "user": {
    "id": "uuid",
    "username": "johndoe",
    "createdAt": "2025-01-01T00:00:00.000Z"
  },
  "token": "jwt-token"
}
```

#### Change Password
```
PUT /api/auth/change-password
Authorization: Bearer jwt-token
Content-Type: application/json

{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword"
}

Response:
{
  "message": "Password changed successfully"
}
```

#### Get User Profile
```
GET /api/auth/profile
Authorization: Bearer jwt-token

Response:
{
  "user": {
    "id": "uuid",
    "username": "johndoe",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  },
  "settings": {
    // User settings object
  }
}
```

## Client-Side Usage

### Authentication API
```typescript
import { authApi } from '@/lib/auth-client';

// Register new user
try {
  const response = await authApi.register('username', 'password');
  console.log('User registered:', response.user);
} catch (error) {
  console.error('Registration failed:', error.message);
}

// Login user
try {
  const response = await authApi.login('username', 'password');
  console.log('User logged in:', response.user);
} catch (error) {
  console.error('Login failed:', error.message);
}

// Change password
try {
  await authApi.changePassword('currentPassword', 'newPassword');
  console.log('Password changed successfully');
} catch (error) {
  console.error('Password change failed:', error.message);
}

// Get user profile
try {
  const profile = await authApi.getProfile();
  console.log('User profile:', profile.user);
} catch (error) {
  console.error('Failed to get profile:', error.message);
}

// Check authentication status
const isAuthenticated = authApi.isAuthenticated();
const token = authApi.getToken();

// Logout
authApi.logout();
```

### React Components

#### Login Form
```tsx
import { LoginForm } from '@/components/auth/LoginForm';

<LoginForm
  onSuccess={() => console.log('Login successful')}
  onSwitchToRegister={() => setShowRegister(true)}
/>
```

#### Register Form
```tsx
import { RegisterForm } from '@/components/auth/RegisterForm';

<RegisterForm
  onSuccess={() => console.log('Registration successful')}
  onSwitchToLogin={() => setShowLogin(true)}
/>
```

#### Change Password Form
```tsx
import { ChangePasswordForm } from '@/components/auth/ChangePasswordForm';

<ChangePasswordForm
  onSuccess={() => console.log('Password changed')}
/>
```

#### Auth Wrapper (Login/Register Toggle)
```tsx
import { AuthWrapper } from '@/components/auth/AuthWrapper';

<AuthWrapper
  onSuccess={() => window.location.reload()}
/>
```

## Server-Side Protection

### Protecting API Routes
```typescript
import { withAuth } from '@/lib/middleware';

async function handler(request: AuthenticatedRequest) {
  const user = request.user; // { userId: string, username: string }
  
  // Your protected route logic here
  return NextResponse.json({ message: 'Protected data', user });
}

export const GET = withAuth(handler);
export const POST = withAuth(handler);
```

## Security Features

### Password Security
- **Bcrypt Hashing**: Passwords are hashed using bcrypt with 12 salt rounds
- **No Plain Text Storage**: Passwords are never stored in plain text
- **Secure Comparison**: Uses bcrypt.compare for password verification

### JWT Security
- **Signed Tokens**: JWTs are signed with a secret key
- **Expiration**: Tokens expire after 7 days
- **Secure Headers**: Tokens are sent via Authorization header

### Input Validation
- **Username Rules**: 3-50 characters, alphanumeric + underscores only
- **Password Rules**: 6-100 characters minimum
- **Duplicate Prevention**: Usernames must be unique

## Database Schema

The authentication system uses the existing `users` table:

```sql
users:
- id (UUID, Primary Key)
- username (VARCHAR, Unique, Not Null)
- password (VARCHAR, Not Null) -- bcrypt hashed
- createdAt (TIMESTAMP)
- updatedAt (TIMESTAMP)
```

User settings are automatically created in the `user_settings` table when a user registers.

## Testing

Visit `/auth` to test the authentication system:
- Register new users
- Login/logout
- Change passwords
- View user profiles

## Environment Variables

Required environment variables:
```bash
NEXTAUTH_SECRET="your-secret-key-here"  # Used for JWT signing
NODE_ENV="development"                   # For database selection
DATABASE_URL="..."                       # For PostgreSQL (production)
```

## Error Handling

The API returns appropriate HTTP status codes:
- `200` - Success
- `201` - Created (registration)
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid credentials/token)
- `404` - Not Found (user not found)
- `409` - Conflict (username already exists)
- `500` - Internal Server Error
- `503` - Service Unavailable (database not available)

## Future Enhancements

Potential improvements:
- Email verification
- Password reset functionality
- Session management
- Role-based access control (RBAC)
- Multi-factor authentication (MFA)
- OAuth integration
- Rate limiting
- Account lockout after failed attempts
