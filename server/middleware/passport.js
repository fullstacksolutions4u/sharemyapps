const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.warn('Google OAuth credentials not set — Google login disabled');
} else {
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL,
}, async (_accessToken, _refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ googleId: profile.id });

    if (!user) {
      user = await User.findOne({ email: profile.emails[0].value });
      if (user) {
        user.googleId = profile.id;
        if (!user.avatar) user.avatar = profile.photos[0]?.value || '';
        await user.save();
      } else {
        user = await User.create({
          name: profile.displayName,
          email: profile.emails[0].value,
          googleId: profile.id,
          avatar: profile.photos[0]?.value || '',
        });
      }
    }

    done(null, user);
  } catch (err) {
    done(err, null);
  }
}));
}
