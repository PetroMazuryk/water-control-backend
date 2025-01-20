import multer from "multer";
import path from "path";

export const TEMP_UPLOAD_DIR = path.join(process.cwd(), "temp");

const storage = multer.diskStorage({
  destination: function (_, file, cb) {
    cb(null, TEMP_UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = `${Date.now()}_${Math.round(Math.random() * 1e5)}`;
    cb(null, `${uniqueSuffix}_${file.originalname}`);
  },
});

export const upload = multer({ storage });
