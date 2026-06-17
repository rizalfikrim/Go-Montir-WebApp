# Google OAuth 2.0 Integration - GoMontir

Dokumentasi lengkap untuk implementasi Google OAuth 2.0 dalam GoMontir.

## 📋 Daftar Isi
1. [Setup Google OAuth](#setup-google-oauth)
2. [Backend Configuration](#backend-configuration)
3. [API Endpoints](#api-endpoints)
4. [Frontend Integration](#frontend-integration)
5. [Database Schema](#database-schema)
6. [Troubleshooting](#troubleshooting)

---

## Setup Google OAuth

### Step 1: Buat Google Cloud Project

1. Kunjungi [Google Cloud Console](https://console.cloud.google.com/)
2. Buat project baru atau pilih existing project
3. Enable **Google+ API**:
   - Cari "Google+ API" di search bar
   - Klik "Enable"

### Step 2: Buat OAuth 2.0 Credentials

1. Ke **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
2. Pilih "Web application"
3. Tambahkan **Authorized redirect URIs**:
   ```
   http://localhost:8080/api/auth/google/callback
   https://yourdomain.com/api/auth/google/callback
   ```
4. Copy **Client ID** dan **Client Secret**

### Step 3: Update Environment Variables

Di file `.env`:

```env
GOOGLE_OAUTH_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=your_client_secret
GOOGLE_OAUTH_CALLBACK_URL=http://localhost:8080/api/auth/google/callback
SESSION_SECRET=your_super_secret_key
```

---

## Backend Configuration

### Installed Packages

```json
{
  "passport": "^0.7.0",
  "passport-google-oauth20": "^2.0.0",
  "express-session": "^1.17.3"
}
```

### Files Created

```
backend/src/
├── config/
│   └── passport.ts                 // Passport configuration
├── modules/auth/
│   ├── google.service.ts           // Google OAuth logic
│   ├── google.controller.ts        // Route handlers
│   └── google.routes.ts            // Google routes
└── app.ts                          // Updated with Passport middleware
```

### Key Changes to Existing Files

- **`env.ts`**: Added Google OAuth environment variables
- **`auth.routes.ts`**: Imported Google routes
- **`app.ts`**: Added Passport initialization middleware
- **`prisma/schema.prisma`**: Added `googleId` dan `oauthProvider` fields

---

## API Endpoints

### 1. Web-based OAuth (Redirect Flow)

#### GET `/api/auth/google`

Redirect ke Google login page.

**Usage (Frontend)**:
```html
<a href="http://localhost:8080/api/auth/google">
  Login dengan Google
</a>
```

**Response**: Redirect ke Google login

#### GET `/api/auth/google/callback`

Callback dari Google setelah user approve. Otomatis redirect ke frontend dengan tokens.

**Redirect URL**:
```
http://localhost:5173/auth/success?access_token=...&refresh_token=...&userId=...
```

---

### 2. Mobile-friendly Endpoints (No Redirect)

#### POST `/api/auth/google/register`

Login/Register via Google untuk mobile apps atau frontend yang tidak bisa handle redirect.

**Request Body**:
```json
{
  "googleId": "google_user_id",
  "displayName": "User Name",
  "email": "user@gmail.com",
  "photoUrl": "https://...",
  "role": "USER"
}
```

**Success Response** (201):
```json
{
  "success": true,
  "message": "Login/Registrasi Google berhasil!",
  "data": {
    "user": {
      "id": "user_id",
      "name": "User Name",
      "email": "user@gmail.com",
      "phone": "+62xxx",
      "role": "USER",
      "isActive": true,
      "avatarUrl": "https://..."
    },
    "accessToken": "jwt_token"
  }
}
```

**Cookies Set**:
- `access_token` (15 minutes)
- `refresh_token` (7 days)

---

#### GET `/api/auth/google/user/:googleId`

Ambil user info berdasarkan Google ID.

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "name": "User Name",
    "email": "user@gmail.com",
    "role": "USER"
  }
}
```

---

## Frontend Integration

### Option 1: Web-based OAuth (Browser)

```tsx
// LoginPage.tsx
export const GoogleLoginButton = () => {
  return (
    <a href={`${API_URL}/api/auth/google`}>
      <button>Login dengan Google</button>
    </a>
  );
};

// Redirect handler
export const AuthSuccessPage = () => {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const userId = params.get('userId');

    if (accessToken && refreshToken) {
      // Store tokens (HttpOnly cookie sudah diset)
      localStorage.setItem('userId', userId);
      localStorage.setItem('user', userId); // atau ambil dari /me endpoint

      // Redirect ke dashboard
      navigate('/');
    }
  }, []);

  return <div>Authenticating...</div>;
};
```

### Option 2: Mobile-friendly (React Native / Flutter)

```tsx
// Untuk React Native dengan expo-google-signin
import * as Google from 'expo-google-signin';

export const handleGoogleLogin = async () => {
  try {
    // 1. Login dengan Google
    const result = await Google.logInAsync({
      iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
      androidClientId: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com',
      scopes: ['profile', 'email'],
    });

    if (result.type === 'success') {
      // 2. Kirim ke backend
      const response = await fetch(`${API_URL}/api/auth/google/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          googleId: result.user.id,
          displayName: result.user.name,
          email: result.user.email,
          photoUrl: result.user.photoUrl,
          role: 'USER',
        }),
      });

      const data = await response.json();

      if (data.success) {
        // 3. Store tokens
        await AsyncStorage.setItem('accessToken', data.data.accessToken);
        // Refresh token dalam cookie

        // 4. Navigate to home
        navigation.reset({
          index: 0,
          routes: [{ name: 'Home' }],
        });
      }
    }
  } catch (error) {
    console.error('Google login error:', error);
  }
};
```

### Option 3: Web dengan Google Sign-In Button

```tsx
import { GoogleLogin } from '@react-oauth/google';

export const LoginPage = () => {
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/google/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Include cookies
        body: JSON.stringify({
          googleId: credentialResponse.credential, // JWT token
          displayName: credentialResponse.credential?.name,
          email: credentialResponse.credential?.email,
          photoUrl: credentialResponse.credential?.picture,
        }),
      });

      const data = await response.json();
      // Handle success...
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <GoogleLogin
      onSuccess={handleGoogleSuccess}
      onError={() => console.log('Login Failed')}
    />
  );
};
```

---

## Database Schema

### Updated User Model

```prisma
model User {
  id           String   @id @default(cuid())
  email        String   @unique
  password     String?  // Optional untuk OAuth users
  name         String
  phone        String   @unique
  role         Role     @default(USER)
  avatarUrl    String?
  isVerified   Boolean  @default(false)
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  // Google OAuth
  googleId     String?  @unique
  oauthProvider String?  // "google"

  // Relations...
  mechanic        MechanicProfile?
  vehicles        VehicleInfo[]
  ordersAsUser    Order[]           @relation("UserOrders")
  notifications   Notification[]
  reviewsGiven    Review[]          @relation("ReviewerRelation")
  refreshTokens   RefreshToken[]
  auditLogs       AuditLog[]
  chatMessages    ChatMessage[]

  @@index([email])
  @@index([phone])
  @@index([googleId])
  @@map("users")
}
```

### Migration

```bash
# Generate migration
npm run prisma:migrate

# Atau langsung push (untuk dev)
npx prisma db push
```

---

## Troubleshooting

### Issue 1: "redirect_uri_mismatch"

**Solusi**: Pastikan `GOOGLE_OAUTH_CALLBACK_URL` di `.env` sesuai dengan yang terdaftar di Google Cloud Console.

### Issue 2: Cookies tidak tersimpan di mobile

**Solusi**: Gunakan endpoint `POST /api/auth/google/register` dan handle tokens secara manual.

### Issue 3: CORS error saat access Google API

**Solusi**: 
- Google OAuth berjalan di backend (server-to-server), bukan browser
- Frontend hanya trigger redirect atau kirim user data
- Tidak ada CORS issue

### Issue 4: User bisa login dengan email biasa juga Google

**Solusi**: Dua cara:

**Option A**: Allow dual auth
```typescript
// User bisa login dengan password atau Google
// Password bersifat optional
```

**Option B**: Force OAuth
```typescript
if (!user.oauthProvider) {
  throw new AppError('Akun ini hanya bisa login dengan Google', 401);
}
```

### Issue 5: Phone number tidak lengkap saat register Google

**Solusi**: 
- Google tidak provide phone number
- Generate temporary phone untuk Google users
- User bisa update phone di profile page nanti

```typescript
const tempPhone = `+62${Date.now().toString().slice(-10)}`;
```

---

## Security Best Practices

1. ✅ **HTTPS in Production**: Pastikan callback URL menggunakan HTTPS
2. ✅ **Secure Cookies**: `secure: true` di production
3. ✅ **CSRF Protection**: Session CSRF token jika diperlukan
4. ✅ **Rate Limiting**: Sudah diimplementasikan di `/api/auth`
5. ✅ **Validate Google Token**: Backend verify token dari Google
6. ✅ **Environment Variables**: Jangan commit `.env` dengan real credentials

---

## Testing

### Test dengan cURL

```bash
# Test Google Register (Ganti dengan real Google data)
curl -X POST http://localhost:8080/api/auth/google/register \
  -H "Content-Type: application/json" \
  -d '{
    "googleId": "test-google-id",
    "displayName": "Test User",
    "email": "testuser@gmail.com",
    "photoUrl": "https://...",
    "role": "USER"
  }'

# Test Get User
curl http://localhost:8080/api/auth/google/user/test-google-id
```

---

## Next Steps

1. ✅ Setup Google Cloud Project
2. ✅ Configure environment variables
3. ✅ Run Prisma migration
4. ✅ Integrate Google Sign-In di frontend
5. ✅ Test flow end-to-end
6. ✅ Deploy dengan HTTPS

Untuk bantuan lebih lanjut, lihat dokumentasi:
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [Passport.js Google Strategy](http://www.passportjs.org/packages/passport-google-oauth20/)
- [Express Session](https://github.com/expressjs/session)
