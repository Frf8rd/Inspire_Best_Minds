import bcrypt from "bcryptjs";
import { prisma } from "../../config/database.js";
import {
  verifyAccessToken,
  verifyRefreshToken,
  attachTokenCookies,
} from "../utils/jwt.js";

export const protect = async (req, res, next) => {
  try {
    const accessToken = req.cookies?.accessToken;
    const refreshToken = req.cookies?.refreshToken;

    if (accessToken) {
      try {
        const decoded = verifyAccessToken(accessToken);
        req.user = { id: decoded.id, role: decoded.role };
        return next();
      } catch (err) {
        if (err.name !== "TokenExpiredError") {
          return res.status(401).json({ message: "Invalid token. Please log in again." });
        }
      }
    }

    if (!refreshToken) {
      return res.status(401).json({ message: "Not authenticated. Please log in." });
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      return res.status(401).json({ message: "Session expired. Please log in again." });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ message: "User not found or account disabled." });
    }

    if (!user.refreshToken) {
      return res.status(401).json({ message: "Session expired. Please log in again." });
    }

    let tokenValid = false;
    try {
      tokenValid = await bcrypt.compare(refreshToken, user.refreshToken);
    } catch {
      return res.status(401).json({ message: "Invalid session. Please log in again." });
    }

    if (!tokenValid) {
      return res.status(401).json({ message: "Invalid session. Please log in again." });
    }

    const { refreshToken: newRefreshToken } = attachTokenCookies(res, user);
    const salt = await bcrypt.genSalt(10);
    const hashedRefreshToken = await bcrypt.hash(newRefreshToken, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: hashedRefreshToken },
    });

    req.user = { id: user.id, role: user.role || user.rol };
    return next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({ message: "Authentication error.", detail: error.message });
  }
};

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    const userRole = (req.user?.role || "").toLowerCase();
    const normalizedRoles = roles.map((r) => r.toLowerCase());

    if (!normalizedRoles.includes(userRole)) {
      return res.status(403).json({
        message: "You do not have permission to perform this action.",
      });
    }
    next();
  };
};
