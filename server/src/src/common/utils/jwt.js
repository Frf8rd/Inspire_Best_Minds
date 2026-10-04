import "dotenv/config";
import crypto from "crypto";
import jwt from "jsonwebtoken";

const isProduction = process.env.NODE_ENV === "production";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

if ((!ACCESS_SECRET || !REFRESH_SECRET) && isProduction) {
  throw new Error("JWT_ACCESS_SECRET și JWT_REFRESH_SECRET trebuie setate în producție.");
}
if (!ACCESS_SECRET || !REFRESH_SECRET) {
  console.warn(
    "Lipsesc JWT_ACCESS_SECRET / JWT_REFRESH_SECRET din .env — se folosesc secrete de dezvoltare."
  );
}

const EFFECTIVE_ACCESS_SECRET = ACCESS_SECRET || "dev_jwt_access_secret_inspire_best_minds";
const EFFECTIVE_REFRESH_SECRET = REFRESH_SECRET || "dev_jwt_refresh_secret_inspire_best_minds";

export const ACCESS_TTL_MS = 15 * 60 * 1000;
export const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export const generateAccessToken = (user) =>
  jwt.sign({ id: user.id, role: user.role }, EFFECTIVE_ACCESS_SECRET, {
    expiresIn: Math.floor(ACCESS_TTL_MS / 1000),
  });

// jwtid aleatoriu: două refresh token-uri emise în aceeași secundă pentru același
// user trebuie să fie diferite (tokenHash este @unique în tabelul RefreshToken).
export const generateRefreshToken = (user) =>
  jwt.sign({ id: user.id }, EFFECTIVE_REFRESH_SECRET, {
    expiresIn: Math.floor(REFRESH_TTL_MS / 1000),
    jwtid: crypto.randomUUID(),
  });

export const verifyAccessToken = (token) => jwt.verify(token, EFFECTIVE_ACCESS_SECRET);
export const verifyRefreshToken = (token) => jwt.verify(token, EFFECTIVE_REFRESH_SECRET);

// În DB se păstrează doar hash-ul token-ului (RefreshToken.tokenHash).
export const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

// --- Cookie-uri ---
const cookieSameSite = (process.env.AUTH_COOKIE_SAMESITE || (isProduction ? "None" : "Lax")).trim();
const cookieSecure = process.env.AUTH_COOKIE_SECURE
  ? process.env.AUTH_COOKIE_SECURE === "true"
  : isProduction;

const COOKIE_BASE = {
  httpOnly: true,
  secure: cookieSecure,
  sameSite: cookieSameSite,
  path: "/",
};

/**
 * Emite o pereche access/refresh, salvează hash-ul refresh token-ului în DB
 * (tabelul RefreshToken) și setează cookie-urile.
 * `db` poate fi `prisma` sau un client de tranzacție.
 */
export const issueSession = async (db, res, user) => {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  await db.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
    },
  });

  res.cookie("accessToken", accessToken, { ...COOKIE_BASE, maxAge: ACCESS_TTL_MS });
  res.cookie("refreshToken", refreshToken, { ...COOKIE_BASE, maxAge: REFRESH_TTL_MS });

  return { accessToken, refreshToken };
};

export const clearTokenCookies = (res) => {
  const clearOptions = { ...COOKIE_BASE, maxAge: 0 };
  res.cookie("accessToken", "", clearOptions);
  res.cookie("refreshToken", "", clearOptions);
};

// --- Token-uri stateless pentru resetarea parolei ---
// Semnate cu un secret care include passwordHash-ul curent: după schimbarea parolei
// token-ul devine automat invalid (single-use), fără coloane în plus în schemă.
const resetSecret = (user) => `${EFFECTIVE_REFRESH_SECRET}:reset:${user.passwordHash}`;

export const generatePasswordResetToken = (user) =>
  jwt.sign({ id: user.id, purpose: "password-reset" }, resetSecret(user), { expiresIn: "10m" });

export const decodeUnverified = (token) => jwt.decode(token);

export const verifyPasswordResetToken = (token, user) => {
  const payload = jwt.verify(token, resetSecret(user));
  if (payload.purpose !== "password-reset" || payload.id !== user.id) {
    throw new Error("Token invalid.");
  }
  return payload;
};
