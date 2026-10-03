import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "../../config/database.js";
import {
  attachTokenCookies,
  clearTokenCookies,
  verifyRefreshToken,
} from "../../common/utils/jwt.js";
import {
  sendEmail,
  sendPasswordResetEmail,
  sendEmailVerificationEmail,
} from "../../common/utils/email.js";

export const toPublicJSON = (user) => {
  if (!user) return null;
  return {
    id: user.id,
    username: user.username || user.nume || "",
    email: user.email,
    role: (user.role || user.rol || "user").toLowerCase(),
    phone: user.phone || null,
    avatar: user.avatar || null,
    dateOfBirth: user.dateOfBirth || null,
    gender: user.gender || null,
    provider: user.provider || "local",
    isEmailVerified: user.isEmailVerified ?? false,
    lastLoginAt: user.lastLoginAt || null,
    createdAt: user.createdAt,
  };
};

const createCryptoToken = (expiryMinutes) => {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);
  return { rawToken, hashedToken, expiresAt };
};

export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "Toate câmpurile sunt obligatorii." });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Un cont asociat cu această adresă de email există deja.",
      });
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const { rawToken: verificationRawToken, hashedToken: verificationHashedToken, expiresAt: verificationExpires } =
      createCryptoToken(24 * 60); // 24 hours

    const user = await prisma.user.create({
      data: {
        username: username.trim(),
        nume: username.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        parola: hashedPassword,
        emailVerificationToken: verificationHashedToken,
        emailVerificationExpires: verificationExpires,
        isEmailVerified: false,
      },
    });

    try {
      await sendEmailVerificationEmail(user, verificationRawToken);
    } catch (emailErr) {
      console.error("Trimitere email confirmare eșuată:", emailErr.message);
    }

    const { refreshToken } = attachTokenCookies(res, user);
    const refreshSalt = await bcrypt.genSalt(10);
    const hashedRefreshToken = await bcrypt.hash(refreshToken, refreshSalt);

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken: hashedRefreshToken,
        lastLoginAt: new Date(),
      },
    });

    return res.status(201).json({
      message: "Contul a fost creat cu succes. Te rugăm să îți verifici emailul.",
      user: toPublicJSON(updatedUser),
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ message: "Eroare internă de server." });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Emailul și parola sunt obligatorii." });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    const userPassword = user?.password || user?.parola;

    if (!user || !userPassword) {
      return res.status(401).json({ message: "Email sau parolă incorectă." });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "Acest cont a fost dezactivat." });
    }

    const isMatch = await bcrypt.compare(password, userPassword);
    if (!isMatch) {
      return res.status(401).json({ message: "Email sau parolă incorectă." });
    }

    const { refreshToken } = attachTokenCookies(res, user);
    const salt = await bcrypt.genSalt(10);
    const hashedRefreshToken = await bcrypt.hash(refreshToken, salt);

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken: hashedRefreshToken,
        lastLoginAt: new Date(),
      },
    });

    return res.status(200).json({
      message: "Autentificare reușită.",
      user: toPublicJSON(updatedUser),
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Eroare internă de server." });
  }
};

export const googleCallback = async (req, res) => {
  try {
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const user = req.user;

    if (!user) {
      return res.redirect(`${clientUrl}/login?error=google_auth_failed`);
    }

    const { refreshToken } = attachTokenCookies(res, user);
    const salt = await bcrypt.genSalt(10);
    const hashedRefreshToken = await bcrypt.hash(refreshToken, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: hashedRefreshToken },
    });

    const userData = encodeURIComponent(JSON.stringify(toPublicJSON(user)));
    return res.redirect(`${clientUrl}/auth/google/success?user=${userData}`);
  } catch (error) {
    console.error("Google callback error:", error);
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    return res.redirect(`${clientUrl}/login?error=server_error`);
  }
};

export const logout = async (req, res) => {
  try {
    if (req.user?.id) {
      await prisma.user.update({
        where: { id: req.user.id },
        data: { refreshToken: null },
      }).catch(() => null);
    }

    clearTokenCookies(res);
    return res.status(200).json({ message: "Te-ai deconectat cu succes." });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({ message: "Eroare internă de server." });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      return res.status(404).json({ message: "Utilizatorul nu a fost găsit." });
    }

    return res.status(200).json({ user: toPublicJSON(user) });
  } catch (error) {
    console.error("GetMe error:", error);
    return res.status(500).json({ message: "Eroare internă de server." });
  }
};

export const refreshTokens = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: "Nu a fost furnizat niciun refresh token." });
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      return res.status(401).json({ message: "Refresh token invalid sau expirat." });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user || !user.isActive || !user.refreshToken) {
      return res.status(401).json({ message: "Sesiune invalidă." });
    }

    const tokenValid = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!tokenValid) {
      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: null },
      });
      return res.status(401).json({
        message: "Detectată reutilizare de token. Te rugăm să te autentifici din nou.",
      });
    }

    const { refreshToken: newRefreshToken } = attachTokenCookies(res, user);
    const salt = await bcrypt.genSalt(10);
    const hashedNewRefreshToken = await bcrypt.hash(newRefreshToken, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: hashedNewRefreshToken },
    });

    return res.status(200).json({ message: "Tokenuri actualizate cu succes." });
  } catch (error) {
    console.error("Refresh error:", error);
    return res.status(500).json({ message: "Eroare internă de server." });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Emailul este obligatoriu." });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    const successMsg = "Dacă există un cont asociat acestui email, a fost trimis un link de resetare.";

    if (!user) {
      return res.status(200).json({ message: successMsg });
    }

    const userPassword = user.password || user.parola;
    if (!userPassword) {
      // User registered with Google
      const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
      try {
        await sendEmail({
          to: user.email,
          subject: "Inspire Best Minds — Contul folosește Google Sign-In",
          html: `
            <div style="font-family:sans-serif;max-width:520px;margin:30px auto;padding:24px;background:#fff;border-radius:12px;border:1px solid #e5e7eb">
              <h2>Inspire Best Minds</h2>
              <p>Salut <strong>${user.username || user.nume}</strong>,</p>
              <p>Am primit o cerere de resetare a parolei, însă contul tău a fost creat folosind <strong>Google Sign-In</strong>.</p>
              <p>Te poți autentifica direct folosind butonul <strong>"Conectează-te cu Google"</strong>.</p>
              <a href="${clientUrl}/login" style="display:inline-block;background:#2563eb;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;margin-top:10px">Mergi la Login</a>
            </div>
          `,
        });
      } catch (err) {
        console.error("Eroare notificare Google account:", err.message);
      }
      return res.status(200).json({ message: successMsg });
    }

    const { rawToken, hashedToken, expiresAt } = createCryptoToken(10); // 10 minutes

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: hashedToken,
        passwordResetExpires: expiresAt,
      },
    });

    try {
      await sendPasswordResetEmail(user, rawToken);
    } catch (emailErr) {
      console.error("Eroare trimitere email resetare parolă:", emailErr.message);
    }

    return res.status(200).json({ message: successMsg });
  } catch (error) {
    console.error("ForgotPassword error:", error);
    return res.status(500).json({ message: "Eroare internă de server." });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ message: "Tokenul și noua parolă sunt obligatorii." });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Parola trebuie să aibă cel puțin 6 caractere." });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return res.status(400).json({ message: "Linkul de resetare este invalid sau a expirat." });
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const { refreshToken } = attachTokenCookies(res, user);
    const refreshSalt = await bcrypt.genSalt(10);
    const hashedRefreshToken = await bcrypt.hash(refreshToken, refreshSalt);

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        parola: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
        refreshToken: hashedRefreshToken,
        lastLoginAt: new Date(),
      },
    });

    return res.status(200).json({
      message: "Parola a fost resetată cu succes. Ești acum autentificat.",
      user: toPublicJSON(updatedUser),
    });
  } catch (error) {
    console.error("ResetPassword error:", error);
    return res.status(500).json({ message: "Eroare internă de server." });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

    if (!token) {
      return res.status(400).json({ message: "Tokenul de verificare este obligatoriu." });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: hashedToken,
        emailVerificationExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return res.status(400).json({ message: "Linkul de verificare este invalid sau a expirat." });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
    });

    return res.redirect(`${clientUrl}/login?verified=true`);
  } catch (error) {
    console.error("VerifyEmail error:", error);
    return res.status(500).json({ message: "Eroare internă de server." });
  }
};

export const resendVerification = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      return res.status(404).json({ message: "Utilizatorul nu a fost găsit." });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: "Adresa de email este deja confirmată." });
    }

    const { rawToken, hashedToken, expiresAt } = createCryptoToken(24 * 60);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: hashedToken,
        emailVerificationExpires: expiresAt,
      },
    });

    await sendEmailVerificationEmail(user, rawToken);

    return res.status(200).json({
      message: "Emailul de confirmare a fost retrimis. Verifică-ți căsuța poștală.",
    });
  } catch (error) {
    console.error("ResendVerification error:", error);
    return res.status(500).json({ message: "Eroare internă de server." });
  }
};
