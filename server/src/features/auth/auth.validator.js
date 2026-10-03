import { body, validationResult } from "express-validator";
import rateLimit from "express-rate-limit";

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }
  next();
};

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    message: "Prea multe încercări de autentificare. Încearcă din nou în 15 minute.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: {
    message: "Prea multe cereri de resetare parolă. Încearcă din nou mai târziu.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const registerRules = [
  // `name` (nou) sau `username` (vechi) — cel puțin unul, 2–50 caractere
  body().custom((_, { req }) => {
    const name = String(req.body.name ?? req.body.username ?? "").trim();
    if (name.length < 2 || name.length > 50) {
      throw new Error("Numele trebuie să conțină între 2 și 50 caractere");
    }
    return true;
  }),
  body("email")
    .trim()
    .isEmail()
    .withMessage("Te rugăm să introduci o adresă de email validă")
    .normalizeEmail(),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Parola trebuie să aibă cel puțin 6 caractere")
    .matches(/\d/)
    .withMessage("Parola trebuie să conțină cel puțin o cifră"),
];

export const loginRules = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Te rugăm să introduci o adresă de email validă")
    .normalizeEmail(),
  body("password").notEmpty().withMessage("Parola este obligatorie"),
];

export const forgotPasswordRules = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Te rugăm să introduci o adresă de email validă")
    .normalizeEmail(),
];

export const resetPasswordRules = [
  body("token").notEmpty().withMessage("Tokenul de resetare este obligatoriu"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Parola trebuie să aibă cel puțin 6 caractere")
    .matches(/\d/)
    .withMessage("Parola trebuie să conțină cel puțin o cifră"),
];

export const updateMeRules = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Numele trebuie să conțină între 2 și 50 caractere"),
  body("phone")
    .optional({ nullable: true })
    .trim(),
];

export const changePasswordRules = [
  body("currentPassword").notEmpty().withMessage("Parola curentă este obligatorie"),
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("Noua parolă trebuie să aibă cel puțin 6 caractere")
    .matches(/\d/)
    .withMessage("Noua parolă trebuie să conțină cel puțin o cifră"),
];

