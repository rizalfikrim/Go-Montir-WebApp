import passport from 'passport';
import { Strategy as GoogleStrategy, VerifyCallback } from 'passport-google-oauth20';
import { env } from '@/config/env';

// Konfigurasi Google OAuth Strategy
if (env.GOOGLE_OAUTH_CLIENT_ID && env.GOOGLE_OAUTH_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_OAUTH_CLIENT_ID,
        clientSecret: env.GOOGLE_OAUTH_CLIENT_SECRET,
        callbackURL: env.GOOGLE_OAUTH_CALLBACK_URL || 'http://localhost:8080/api/auth/google/callback',
        scope: ['profile', 'email'],
      },
      (accessToken: string, refreshToken: string, profile: any, done: VerifyCallback) => {
        // Profile object dari Google akan di-pass ke controller
        // Tidak perlu simpan di session karena kita pakai JWT
        return done(null, profile);
      }
    )
  );
} else {
  console.warn('⚠️  Google OAuth credentials not configured. Google login will be disabled.');
}

// Serialize dan deserialize (untuk session, tapi kita pakai JWT jadi sederhana)
passport.serializeUser((user: any, done: (err: any, id?: any) => void) => {
  done(null, user);
});

passport.deserializeUser((user: any, done: (err: any, user?: any) => void) => {
  done(null, user);
});

export default passport;
