// middlewar/uploadDocumentFile.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const TEMP_DIR = path.join(__dirname, '../uploads/tmp');

if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, TEMP_DIR);
  },
  filename: (req, file, cb) => {
    // временное имя, потом переименуем
    cb(null, Date.now() + '_' + file.originalname);
  }
});

module.exports = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50 MB
  }
});
