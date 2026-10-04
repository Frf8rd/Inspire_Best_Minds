import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "../../config/database.js";
import {
  issueSession,
  clearTokenCookies,
  verifyRefreshToken,
  hashToken,
  generatePasswordResetToken,
  verifyPasswordResetToken,
  decodeUnverified,
} from "../../common/utils/jwt.js";
import { sendEmail, sendPasswordResetEmail } from "../../common/utils/email.js";

const clientUrlOf = () => process.env.CLIENT_URL || "http://localhost:5173";
const SERVER_ERROR = { message: "Eroare internă de server." };

export const toPublicJSON = (user, extra = {}) => {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    username: user.name, // alias pentru compatibilitate cu clientul existent
    email: user.email,
    role: user.role, // CITIZEN | STAFF | ADMIN
    phone: user.phone ?? null,
    bio: user.bio ?? null,
    avatarUrl: user.avatarPath ? `/${user.avatarPath}` : null,
    isActive: user.isActive,
    createdAt: user.createdAt,
    ...extra,
  };
};

const normalizeEmail = (email) => String(email).toLowerCase().trim();

export const register = async (req, res) => {
  try {
    // acceptăm `name` (nou) sau `username` (vechi)
    const name = (req.body.name || req.body.username || "").trim();
    const { email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Toate câmpurile sunt obligatorii." });
    }

    const normalizedEmail = normalizeEmail(email);
    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      return res.status(409).json({
        message: "Un cont asociat cu această adresă de email există deja.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Rolul NU se primește din request: orice cont nou este CITIZEN (default din schemă).
    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        passwordHash,
        phone: phone ? String(phone).trim() : null,
      },
    });

    await issueSession(prisma, res, user);

    return res.status(201).json({
      message: "Contul a fost creat cu succes.",
      user: toPublicJSON(user),
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json(SERVER_ERROR);
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Emailul și parola sunt obligatorii." });
    }

    const user = await prisma.user.findUnique({ where: { email: normalizeEmail(email) } });

    // același mesaj pentru "nu există" și "parolă greșită"
    const isMatch = user ? await bcrypt.compare(password, user.passwordHash) : false;
    if (!user || !isMatch) {
      return res.status(401).json({ message: "Email sau parolă incorectă." });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "Acest cont a fost dezactivat." });
    }

    await issueSession(prisma, res, user);

    return res.status(200).json({
      message: "Autentificare reușită.",
      user: toPublicJSON(user),
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json(SERVER_ERROR);
  }
};

export const googleCallback = async (req, res) => {
  const clientUrl = clientUrlOf();
  try {
    const user = req.user;
    if (!user) {
      return res.redirect(`${clientUrl}/login?error=google_auth_failed`);
    }
    if (!user.isActive) {
      return res.redirect(`${clientUrl}/login?error=account_disabled`);
    }

    await issueSession(prisma, res, user);

    const userData = encodeURIComponent(JSON.stringify(toPublicJSON(user)));
    return res.redirect(`${clientUrl}/auth/google/success?user=${userData}`);
  } catch (error) {
    console.error("Google callback error:", error);
    return res.redirect(`${clientUrl}/login?error=server_error`);
  }
};

export const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
      await prisma.refreshToken.updateMany({
        where: { tokenHash: hashToken(refreshToken), revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    clearTokenCookies(res);
    return res.status(200).json({ message: "Te-ai deconectat cu succes." });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json(SERVER_ERROR);
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        memberships: {
          include: {
            institution: { select: { id: true, name: true, slug: true, type: true } },
            department: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ message: "Utilizatorul nu a fost găsit." });
    }

    const memberships = user.memberships.map((m) => ({
      id: m.id,
      role: m.role, // HANDLER | MANAGER
      institution: m.institution,
      department: m.department,
    }));

    return res.status(200).json({ user: toPublicJSON(user, { memberships }) });
  } catch (error) {
    console.error("GetMe error:", error);
    return res.status(500).json(SERVER_ERROR);
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
      clearTokenCookies(res);
      return res.status(401).json({ message: "Refresh token invalid sau expirat." });
    }

    const stored = await prisma.refreshToken.findUnique({
      where: { tokenHash: hashToken(refreshToken) },
      include: { user: true },
    });

    if (!stored || stored.userId !== decoded.id) {
      clearTokenCookies(res);
      return res.status(401).json({ message: "Sesiune invalidă." });
    }

    // Token deja folosit/revocat prezentat din nou => posibil furat: închidem toate sesiunile.
    if (stored.revokedAt) {
      await prisma.refreshToken.updateMany({
        where: { userId: stored.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      clearTokenCookies(res);
      return res.status(401).json({
        message: "Detectată reutilizare de token. Te rugăm să te autentifici din nou.",
      });
    }

    if (stored.expiresAt <= new Date() || !stored.user.isActive) {
      clearTokenCookies(res);
      return res.status(401).json({ message: "Sesiune invalidă." });
    }

    // Rotație: revocăm tokenul vechi și emitem unul nou, atomic.
    const ok = await prisma.$transaction(async (tx) => {
      const { count } = await tx.refreshToken.updateMany({
        where: { id: stored.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      if (count !== 1) return false;
      await issueSession(tx, res, stored.user);
      return true;
    });

    if (!ok) {
      return res.status(401).json({ message: "Sesiune invalidă." });
    }

    return res.status(200).json({ message: "Tokenuri actualizate cu succes." });
  } catch (error) {
    console.error("Refresh error:", error);
    return res.status(500).json(SERVER_ERROR);
  }
};

export const forgotPassword = async (req, res) => {
  const successMsg =
    "Dacă există un cont asociat acestui email, a fost trimis un link de resetare.";
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Emailul este obligatoriu." });
    }

    const user = await prisma.user.findUnique({ where: { email: normalizeEmail(email) } });
    if (!user || !user.isActive) {
      return res.status(200).json({ message: successMsg });
    }

    const resetToken = generatePasswordResetToken(user);
    try {
      await sendPasswordResetEmail(user, resetToken);
    } catch (emailErr) {
      console.error("Eroare trimitere email resetare parolă:", emailErr.message);
    }

    return res.status(200).json({ message: successMsg });
  } catch (error) {
    console.error("ForgotPassword error:", error);
    return res.status(500).json(SERVER_ERROR);
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ message: "Tokenul și noua parolă sunt obligatorii." });
    }

    const invalid = () =>
      res.status(400).json({ message: "Linkul de resetare este invalid sau a expirat." });

    const claims = decodeUnverified(token);
    if (!claims || typeof claims.id !== "string") return invalid();

    const user = await prisma.user.findUnique({ where: { id: claims.id } });
    if (!user || !user.isActive) return invalid();

    try {
      verifyPasswordResetToken(token, user);
    } catch {
      return invalid();
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Schimbăm parola și revocăm toate sesiunile existente; apoi autentificăm userul.
    const updatedUser = await prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: user.id },
        data: { passwordHash },
      });
      await tx.refreshToken.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await issueSession(tx, res, updated);
      return updated;
    });

    return res.status(200).json({
      message: "Parola a fost resetată cu succes. Ești acum autentificat.",
      user: toPublicJSON(updatedUser),
    });
  } catch (error) {
    console.error("ResetPassword error:", error);
    return res.status(500).json(SERVER_ERROR);
  }
};

// Folosit de passport.js pentru conturi create prin Google (nu au parolă locală).
export const randomPasswordHash = () =>
  bcrypt.hash(crypto.randomBytes(32).toString("hex"), 10);

export const updateMe = async (req, res) => {
  try {
    const updateData = {};
    if (req.body.name !== undefined || req.body.username !== undefined) {
      const name = String(req.body.name || req.body.username || "").trim();
      if (name.length < 2 || name.length > 50) {
        return res.status(400).json({ message: "Numele trebuie să aibă între 2 și 50 caractere." });
      }
      updateData.name = name;
    }
    if (req.body.phone !== undefined) {
      updateData.phone = req.body.phone ? String(req.body.phone).trim() : null;
    }

    if (req.body.bio !== undefined) {
      const bio = req.body.bio ? String(req.body.bio).trim() : "";
      if (bio.length > 300) {
        return res.status(400).json({ message: "Bio poate avea cel mult 300 de caractere." });
      }
      updateData.bio = bio || null;
    }

    if (!Object.keys(updateData).length) {
      return res.status(400).json({ message: "Nu ai furnizat câmpuri de actualizat." });
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
    });

    return res.json({
      message: "Profilul a fost actualizat cu succes.",
      user: toPublicJSON(updatedUser),
    });
  } catch (error) {
    console.error("UpdateMe error:", error);
    return res.status(500).json(SERVER_ERROR);
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Parola curentă și noua parolă sunt obligatorii." });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ message: "Utilizatorul nu a fost găsit." });

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: "Parola curentă este incorectă." });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({ message: "Noua parolă nu poate fi identică cu cea curentă." });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { passwordHash },
      });
      // Revocăm toate refresh token-urile vechi
      await tx.refreshToken.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await issueSession(tx, res, user);
    });

    return res.json({ message: "Parola a fost modificată cu succes." });
  } catch (error) {
    console.error("ChangePassword error:", error);
    return res.status(500).json(SERVER_ERROR);
  }
};
