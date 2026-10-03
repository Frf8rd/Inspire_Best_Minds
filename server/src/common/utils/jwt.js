import jwt from "jsonwebtoken";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

if (!ACCESS_SECRET || !REFRESH_SECRET) {
  console.warn(
    "Missing JWT secrets in .env! Defaulting to fallback dev secrets. Please set JWT_ACCESS_SECRET and JWT_REFRESH_SECRET."
  );
}

const EFFECTIVE_ACCESS_SECRET = ACCESS_SECRET || "dev_jwt_access_secret_inspire_best_minds";
const EFFECTIVE_REFRESH_SECRET = REFRESH_SECRET || "dev_jwt_refresh_secret_inspire_best_minds";

export const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role || user.rol },
    EFFECTIVE_ACCESS_SECRET,
    { expiresIn: "15m" }
  );
};

export const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id },
    EFFECTIVE_REFRESH_SECRET,
    { expiresIn: "7d" }
  );
};

export const verifyAccessToken = (token) => {
  return jwt.verify(token, EFFECTIVE_ACCESS_SECRET);
};

export const verifyRefreshToken = (token) => {
  return jwt.verify(token, EFFECTIVE_REFRESH_SECRET);
};

const isProduction = process.env.NODE_ENV === "production";
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

const ACCESS_COOKIE_OPTIONS = {
  ...COOKIE_BASE,
  maxAge: 15 * 60 * 1000, // 15 min
};

const REFRESH_COOKIE_OPTIONS = {
  ...COOKIE_BASE,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export const attachTokenCookies = (res, user) => {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  res.cookie("accessToken", accessToken, ACCESS_COOKIE_OPTIONS);
  res.cookie("refreshToken", refreshToken, REFRESH_COOKIE_OPTIONS);

  return { accessToken, refreshToken };
};

export const clearTokenCookies = (res) => {
  const clearOptions = { ...COOKIE_BASE, maxAge: 0 };
  res.cookie("accessToken", "", clearOptions);
  res.cookie("refreshToken", "", clearOptions);
};
