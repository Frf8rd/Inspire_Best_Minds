import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { prisma } from "./database.js";

const clientID = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const callbackURL = process.env.GOOGLE_CALLBACK_URL || "http://localhost:5000/api/auth/google/callback";

if (clientID && clientSecret) {
  passport.use(
    new GoogleStrategy(
      {
        clientID,
        clientSecret,
        callbackURL,
        scope: ["profile", "email"],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          const avatar = profile.photos?.[0]?.value;

          if (!email) {
            return done(new Error("No email returned from Google"), null);
          }

          let user = await prisma.user.findFirst({
            where: { googleId: profile.id },
          });

          if (user) {
            user = await prisma.user.update({
              where: { id: user.id },
              data: {
                avatar: avatar || user.avatar,
                lastLoginAt: new Date(),
              },
            });
            return done(null, user);
          }

          user = await prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() },
          });

          if (user) {
            user = await prisma.user.update({
              where: { id: user.id },
              data: {
                googleId: profile.id,
                provider: "google",
                avatar: user.avatar || avatar,
                isEmailVerified: true,
                lastLoginAt: new Date(),
              },
            });
            return done(null, user);
          }

          const newUser = await prisma.user.create({
            data: {
              username: profile.displayName || email.split("@")[0],
              nume: profile.displayName || email.split("@")[0],
              email: email.toLowerCase().trim(),
              googleId: profile.id,
              avatar: avatar || null,
              provider: "google",
              password: null,
              parola: "",
              isEmailVerified: true,
              lastLoginAt: new Date(),
            },
          });

          return done(null, newUser);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );
} else {
  console.log(
    "[Passport] Google OAuth skipped (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET not configured in .env)"
  );
}

export default passport;
