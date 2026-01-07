import multer from "multer";
import path from "path";
import __dirname from "../rootDir.mjs";

// const uploadDir = path.join(__dirname, "uploads", "tmp");

// const storage = multer.diskStorage({
//   destination(req, file, cb) {
//     cb(null, uploadDir);
//   },
//   filename(req, file, cb) {
//     const ext = path.extname(file.originalname);
//     cb(null, `${Date.now()}${ext}`);
//   },
// });

// const types = ["image/png", "image/jpg", "image/jpeg"];

// const fileFilter = (req, file, cb) => {
//   if (types.includes(file.mimetype)) {
//     cb(null, true);
//   } else {
//     cb(null, false);
//   }
// };

// export const upload = multer({
//   storage,
//   limits: { fileSize: 5 * 1024 * 1024 },
//   fileFilter,
// });

const storage = multer.memoryStorage();

const imgAllowedTypes = ["image/png", "image/jpg", "image/jpeg"];

const fileFilter = (req, file, cb) => {
  imgAllowedTypes.includes(file.mimetype)
    ? cb(null, true)
    : cb(new Error("Недопустимый тип файла"), false);
};

export const upload = multer({
  storage,
  limits: {fileSize: 5 * 1024 * 1024},
  fileFilter
})