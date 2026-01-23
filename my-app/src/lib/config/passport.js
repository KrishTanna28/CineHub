import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/auth/google/callback',
      scope: ['profile', 'email']
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists with this Google ID
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          // User exists, return user
          return done(null, user);
        }

        // Check if user exists with this email (from regular registration)
        user = await User.findOne({ email: profile.emails[0].value });

        if (user) {
          // Link Google account to existing user
          user.googleId = profile.id;
          user.authProvider = 'google';
          user.emailVerified = true;
          
          // Update avatar if not set
          if (!user.avatar || user.avatar === 'https://via.placeholder.com/150') {
            user.avatar = profile.photos[0]?.value || user.avatar;
          }
          
          await user.save();
          return done(null, user);
        }

        // Create new user
        const username = profile.emails[0].value.split('@')[0] + Math.floor(Math.random() * 1000);
        
        user = await User.create({
          googleId: profile.id,
          email: profile.emails[0].value,
          username: username,
          fullName: profile.displayName,
          avatar: profile.photos[0]?.value || 'https://via.placeholder.com/150',
          authProvider: 'google',
          emailVerified: true // Google emails are verified
        });

        done(null, user);
      } catch (error) {
        console.error('Google OAuth Error:', error);
        done(error, null);
      }
    }
  )
);

export default passport;
