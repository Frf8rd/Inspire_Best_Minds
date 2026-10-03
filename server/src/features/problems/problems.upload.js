import multer from "multer";
import {
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_PHOTOS_PER_REPORT,
  MAX_PHOTO_SIZE_BYTES,
} from "./problems.constants.js";
import { HttpError } from "../../common/utils/httpError.js";

// Fișierul rămâne doar în memorie până când îi verificăm semnătura binară.
// Nu ne bazăm pe extensie sau pe Content-Type, ambele fiind controlate de client.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_PHOTO_SIZE_BYTES,
    files: MAX_PHOTOS_PER_REPORT,
  },
  fileFilter: (req, file, callback) => {
    if (!ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype)) {
      return callback(new HttpError(400, "Sunt acceptate doar imagini JPEG, PNG sau WebP."));
    }
    callback(null, true);
  },
});

export const uploadProblemPhotos = (req, res, next) => {
  upload.array("photos", MAX_PHOTOS_PER_REPORT)(req, res, (error) => {
    if (!error) return next();
    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return next(new HttpError(400, "O fotografie poate avea cel mult 5 MB."));
      }
      if (error.code === "LIMIT_FILE_COUNT") {
        return next(new HttpError(400, `Poți încărca cel mult ${MAX_PHOTOS_PER_REPORT} fotografii.`));
      }
    }
    return next(error);
  });
};
