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
  body("username")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Username-ul trebuie să conțină între 2 și 50 caractere"),
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
