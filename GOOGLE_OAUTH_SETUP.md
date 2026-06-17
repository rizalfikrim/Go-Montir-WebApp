# Google OAuth 2.0 - Setup Checklist untuk GoMontir

## ✅ Implementation Status

Google OAuth 2.0 integration has been successfully implemented! Berikut adalah summary dari apa yang sudah dikerjakan:

### Backend Files Created/Updated:

1. ✅ **`src/config/passport.ts`** - Passport configuration untuk Google OAuth
2. ✅ **`src/modules/auth/google.service.ts`** - Core logic untuk Google login/register
3. ✅ **`src/modules/auth/google.controller.ts`** - API endpoints handler
4. ✅ **`src/modules/auth/google.routes.ts`** - Route definitions
5. ✅ **`src/types/express.d.ts`** - Express User type extensions
6. ✅ **`prisma/schema.prisma`** - Database schema update (googleId, oauthProvider)
7. ✅ **`src/app.ts`** - Passport middleware integration
8. ✅ **`src/config/env.ts`** - Environment variable configuration
9. ✅ **`src/modules/auth/auth.routes.ts`** - Google routes included
10. ✅ **`src/modules/auth/auth.service.ts`** - Password null check untuk OAuth users

### Database:
✅ **Schema synced** dengan googleId dan oauthProvider fields

---

## 🚀 Next Steps untuk Production

### 1. Google Cloud Setup

```bash
# Kunjungi Google Cloud Console
https://console.cloud.google.com/

# Langkah:
1. Create or select existing project
2. Enable "Google+ API"
3. Buat OAuth 2.0 credentials:
   - Type: Web Application
   - Authorized redirect URIs:
     - http://localhost:8080/api/auth/google/callback (development)
     - https://yourdomain.com/api/auth/google/callback (production)
4. Copy Client ID dan Client Secret
```

### 2. Update .env File

```env
# Google OAuth
GOOGLE_OAUTH_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=xxxx
GOOGLE_OAUTH_CALLBACK_URL=https://yourdomain.com/api/auth/google/callback
SESSION_SECRET=your-super-secret-session-key
```

### 3. API Endpoints tersedia

**Web-based (redirect):**
- `GET /api/auth/google` - Trigger Google login
- `GET /api/auth/google/callback` - OAuth callback (automatic redirect to frontend)

**Mobile-friendly (no redirect):**
- `POST /api/auth/google/register` - Login/Register via Google (untuk mobile apps)
- `GET /api/auth/google/user/:googleId` - Get user info by Google ID

### 4. Frontend Integration

**Option A: Web (React)**
```tsx
// Simple button click
<a href={`${API_URL}/api/auth/google`}>Login dengan Google</a>

// Handle redirect di /auth/success page:
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  // Use tokens or rely on HttpOnly cookies
}, []);
```

**Option B: Mobile (React Native)**
```tsx
// Menggunakan expo-google-signin atau react-native-google-signin
const response = await handleGoogleLogin(); // Get Google tokens
await fetch(`${API_URL}/api/auth/google/register`, {
  method: 'POST',
  body: JSON.stringify({
    googleId: response.user.id,
    displayName: response.user.name,
    email: response.user.email,
    photoUrl: response.user.photoUrl,
    role: 'USER'
  })
});
```

### 5. Database Migration (Already Done!)

✅ Prisma schema updated
✅ Database synced dengan `npx prisma db push`

Untuk development di depan:
```bash
# Jika perlu reset database
npx prisma migrate reset

# Atau untuk production safe migration
npx prisma migrate deploy
```

### 6. Security Checklist

- [ ] Gunakan HTTPS di production
- [ ] Update `GOOGLE_OAUTH_CALLBACK_URL` ke domain production
- [ ] Use strong `SESSION_SECRET` di production
- [ ] Set `secure: true` di cookie options (already done)
- [ ] Enable CSRF protection jika diperlukan
- [ ] Test rate limiting di `/api/auth` endpoints
- [ ] Validate JWT tokens di backend (sudah implement)

### 7. Testing di Local

```bash
# 1. Development mode
npm run dev

# 2. Test web-based flow
curl -X GET http://localhost:8080/api/auth/google

# 3. Test mobile-friendly flow (dari Postman atau client code)
curl -X POST http://localhost:8080/api/auth/google/register \
  -H "Content-Type: application/json" \
  -d '{
    "googleId": "test-id",
    "displayName": "Test User",
    "email": "test@gmail.com",
    "photoUrl": "https://...",
    "role": "USER"
  }'
```

### 8. Frontend Features untuk Implement

- [ ] Google Login Button (web)
- [ ] Handle OAuth redirect callback
- [ ] Mobile app Google Sign-In
- [ ] Link existing email/password account dengan Google
- [ ] Logout flow (clear tokens)
- [ ] Error handling untuk OAuth failures
- [ ] Remember me / persistent login

---

##  Key Features

✅ **Seamless Registration**: User baru auto-created saat first Google login
✅ **Account Linking**: User dengan email yang sama bisa connect Google account
✅ **Phone Auto-fill**: Temporary phone generated (user bisa update nanti)
✅ **Auto Verification**: Google users automatically marked as verified
✅ **Role Support**: Bisa register sebagai USER atau MECHANIC
✅ **Mechanic Profile**: Auto-created untuk MECHANIC users
✅ **Audit Logging**: Semua Google OAuth actions logged
✅ **JWT Tokens**: Secure token generation dan management
✅ **HttpOnly Cookies**: Tokens disimpan secure di cookies
✅ **Session Support**: Optional session management via Passport

---

## Troubleshooting

**Error: "Google profile tidak memiliki email"**
- Google account harus punya email yang public
- Check Google account privacy settings

**Error: "Akun Anda telah dinonaktifkan"**
- User account sudah di-deactivate di database
- Admin perlu activate kembali

**Error: "CORS error"**
- OAuth flow di backend, bukan browser
- CORS hanya untuk API endpoints
- Check `CLIENT_URL` di .env file

**Token tidak tersimpan**
- Check cookie settings di browser
- Ensure `secure: false` untuk development
- Ensure `secure: true` untuk production HTTPS

---

## File Locations

```
backend/
├── src/
│   ├── config/
│   │   ├── passport.ts          ← Google OAuth config
│   │   ├── env.ts                ← Env variables
│   │   └── database.ts
│   ├── modules/auth/
│   │   ├── google.service.ts     ← Core logic
│   │   ├── google.controller.ts  ← Route handlers
│   │   ├── google.routes.ts      ← Route definitions
│   │   ├── auth.routes.ts        ← Modified (imports google routes)
│   │   └── auth.service.ts       ← Modified (password null check)
│   ├── types/
│   │   └── express.d.ts          ← Express types
│   └── app.ts                    ← Modified (Passport middleware)
├── prisma/
│   └── schema.prisma             ← Modified (googleId, oauthProvider)
├── .env.example                  ← Updated with Google OAuth config
└── GOOGLE_OAUTH_GUIDE.md         ← Detailed implementation guide
```

---

## Git Commit Message

```
feat: Implement Google OAuth 2.0 authentication

- Add Passport.js Google OAuth 2.0 strategy
- Create google.service.ts with login/register logic
- Create google.controller.ts with API endpoints
- Add google.routes.ts with web and mobile endpoints
- Update User schema with googleId and oauthProvider
- Integrate Passport middleware in app.ts
- Add type definitions for Express.User
- Support account linking for existing email users
- Auto-generate phone number for new Google users
- Add audit logging for OAuth actions
- Update environment variables configuration

Endpoints:
- GET /api/auth/google - Redirect to Google login
- GET /api/auth/google/callback - OAuth callback handler  
- POST /api/auth/google/register - Mobile-friendly registration
- GET /api/auth/google/user/:googleId - Get user info by ID
```

---

## Ready untuk next step!

Semua backend implementation sudah selesai. Selanjutnya:

1. **Setup Google Cloud Console** (dapatkan credentials)
2. **Update .env** dengan Google credentials
3. **Test API endpoints** (sudah bisa di-hit)
4. **Integrate di frontend** (React login page, React Native app, etc.)
5. **Deploy ke production** (HTTPS required!)

Dokumentasi lengkap ada di `GOOGLE_OAUTH_GUIDE.md` untuk implementation di frontend.

Good luck! 🚀
