import { prisma } from "../../config/database.js";
import { verifyAccessToken } from "../utils/jwt.js";

/**
 * Verifică access token-ul din cookie și încarcă userul curent din DB, ca rolul
 * și `isActive` să fie mereu cele reale (nu cele din token).
 * Când access token-ul a expirat răspunde 401 cu code "TOKEN_EXPIRED" —
 * clientul apelează POST /api/auth/refresh și reia cererea.
 */
export const protect = async (req, res, next) => {
  try {
    const accessToken = req.cookies?.accessToken;
    if (!accessToken) {
      return res.status(401).json({ message: "Nu ești autentificat.", code: "NO_TOKEN" });
    }

    let decoded;
    try {
      decoded = verifyAccessToken(accessToken);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Sesiunea a expirat.", code: "TOKEN_EXPIRED" });
      }
      return res.status(401).json({ message: "Token invalid.", code: "INVALID_TOKEN" });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ message: "Utilizator inexistent sau cont dezactivat." });
    }

    req.user = { id: user.id, role: user.role };
    return next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({ message: "Eroare de autentificare." });
  }
};

// Ex.: restrictTo("ADMIN", "STAFF")
export const restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return res.status(403).json({ message: "Nu ai permisiunea de a efectua această acțiune." });
  }
  next();
};
