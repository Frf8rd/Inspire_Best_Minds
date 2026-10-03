import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import "dotenv/config";
import { prisma } from "./database.js";
import { randomPasswordHash } from "../features/auth/auth.controller.js";

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

          if (!email) {
            return done(new Error("No email returned from Google"), null);
          }

          if (profile._json?.email_verified === false) {
            return done(new Error("Emailul Google nu este verificat"), null);
          }

          // Schema nu mai are googleId: identificăm contul după email (Google îl verifică).
          const normalizedEmail = email.toLowerCase().trim();
          let user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

          if (user) {
            return done(null, user);
          }

          // Cont nou: CITIZEN, cu o parolă aleatoare pe care nimeni n-o cunoaște
          // (passwordHash este obligatoriu în schemă).
          user = await prisma.user.create({
            data: {
              name: profile.displayName || normalizedEmail.split("@")[0],
              email: normalizedEmail,
              passwordHash: await randomPasswordHash(),
            },
          });

          return done(null, user);
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
