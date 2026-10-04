import { Router } from "express";
import multer from "multer";
import { protect } from "../../common/middleware/auth.middleware.js";
import { HttpError } from "../../common/utils/httpError.js";
import { ALLOWED_IMAGE_MIME_TYPES } from "../problems/problems.constants.js";
import * as service from "./profiles.service.js";

const router = Router();

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_AVATAR_BYTES, files: 1 },
  fileFilter: (req, file, cb) =>
    ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype)
      ? cb(null, true)
      : cb(new HttpError(400, "Sunt acceptate doar imagini JPEG, PNG sau WebP.")),
});

const uploadAvatar = (req, res, next) =>
  upload.single("avatar")(req, res, (error) => {
    if (!error) return next();
    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      return next(new HttpError(400, "Poza de profil poate avea cel mult 2 MB."));
    }
    return next(error);
  });

const handle = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (error) {
    if (error instanceof HttpError) return res.status(error.status).json({ message: error.message });
    console.error("Profiles error:", error);
    return res.status(500).json({ message: "Eroare internă de server." });
  }
};

// Ordinea contează: /me trebuie înaintea /:id
router.get("/me", protect, handle(async (req, res) => {
  res.json({ profile: await service.getMyProfile(req.user.id) });
}));

router.put("/me/avatar", protect, uploadAvatar, handle(async (req, res) => {
  res.json({ message: "Poza de profil a fost actualizată.", ...(await service.setAvatar(req.user.id, req.file)) });
}));

router.delete("/me/avatar", protect, handle(async (req, res) => {
  await service.removeAvatar(req.user.id);
  res.json({ message: "Poza de profil a fost ștearsă." });
}));

router.get("/:id", handle(async (req, res) => {
  res.json({ profile: await service.getPublicProfile(req.params.id) });
}));

export default router;
