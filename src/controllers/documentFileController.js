const fs = require('fs');
const path = require('path');
const { Document, DocumentFile } = require('../models');

const UPLOAD_ROOT = path.resolve(__dirname, '..', '..', 'documents');


const getDocumentFiles = async (req, res) => {
  try {
    const documentId = Number(req.params.document_id);

    const files = await DocumentFile.findAll({
      where: {
        document_id: documentId,
        deleted: false
      },
      order: [['id', 'ASC']]
    });

    res.json({
      success: true,
      data: files
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении файлов',
      error: error.message
    });
  }
};

function fixEncoding(str) {
  return Buffer.from(str, 'latin1').toString('utf8');
}
function sanitizeFileName(name) {
  return name
    .replace(/[\/\\]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/[^\p{L}\p{N}._-]/gu, '')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}
const uploadDocumentFiles = async (req, res) => {
  try {

    console.log(req.files);

    const documentId = Number(req.params.document_id);

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'Файлы не переданы' });
    }

    const safeUnlinkTmp = (file) => {
      if (file && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    };

    // 1️⃣ Проверяем документ
    const document = await Document.findByPk(documentId);

    if (!document || document.deleted) {
      req.files.forEach(safeUnlinkTmp);
      return res.status(404).json({ message: 'Документ не найден' });
    }

    // 2️⃣ Проверяем статус
    // if (![1, 2].includes(document.status)) {
    //   req.files.forEach(safeUnlinkTmp);
    //   return res.status(403).json({
    //     message: 'Нельзя добавлять файлы в этом статусе документа'
    //   });
    // }

    // 3️⃣ MIME allow list
    const ALLOWED_MIME = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',

      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',

      'image/jpeg',
      'image/png',
      'image/webp'
    ];

    // 4️⃣ Папка документа
    const documentDir = path.join(UPLOAD_ROOT, String(documentId));

    if (!fs.existsSync(documentDir)) {
      fs.mkdirSync(documentDir, { recursive: true });
    }

    const savedFiles = [];

    for (const file of req.files) {

      if (!ALLOWED_MIME.includes(file.mimetype)) {
        safeUnlinkTmp(file);
        continue;
      }

      const originalName = fixEncoding(file.originalname);
      const safeName = sanitizeFileName(originalName);

      // проверка дубликата
      const exists = await DocumentFile.findOne({
        where: {
          document_id: documentId,
          name: safeName,
          deleted: false
        }
      });

      if (exists) {
        safeUnlinkTmp(file);
        continue;
      }

      const physicalPath = path.join(documentDir, safeName);

      const relativePath = path
        .join(String(documentId), safeName)
        .replace(/\\/g, '/');

      fs.renameSync(file.path, physicalPath);

      const saved = await DocumentFile.create({
        document_id: documentId,
        name: safeName,
        file_path: relativePath,
        mime_type: file.mimetype,
        file_size: file.size,
        uploaded_user_id: req.user.id,
        deleted: false
      });

      savedFiles.push(saved);
    }

    return res.status(201).json({
      success: true,
      uploaded: savedFiles.length,
      data: savedFiles
    });

  } catch (error) {

    console.error(error);

    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Ошибка при загрузке файлов',
      error: error.message
    });

  }
};

const downloadDocumentFile = async (req, res) => {
  try {
    const file_id = Number(req.params.file_id);

    const file = await DocumentFile.findByPk(file_id);
    if (!file || file.deleted) {
      return res.status(404).json({ message: 'Файл не найден' });
    }

    const absolutePath = path.join(UPLOAD_ROOT, file.file_path);

    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({
        message: 'Файл отсутствует на диске'
      });
    }

    // 🔥 CORS + отображение
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    res.setHeader("Cache-Control", "no-store");

    // 🔥 ВАЖНО: тип файла
    res.setHeader("Content-Type", file.mime_type || "application/octet-stream");

    // 🔥 ЕСЛИ картинка — показываем, не скачиваем
    if (file.mime_type?.startsWith("image")) {
      res.setHeader(
        "Content-Disposition",
        `inline; filename*=UTF-8''${encodeURIComponent(file.name)}`
      );
    } else {
      res.setHeader(
        "Content-Disposition",
        `attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`
      );
    }

    res.sendFile(absolutePath);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при скачивании файла',
      error: error.message
    });
  }
};

const deleteDocumentFile = async (req, res) => {
  try {
    const file_id = Number(req.params.file_id);

    const file = await DocumentFile.findByPk(file_id);
    if (!file || file.deleted) {
      return res.status(404).json({ message: 'Файл не найден' });
    }

    await file.update({ deleted: true });

    // 💡 Физически можно не удалять сразу
    if (fs.existsSync(file.file_path)) {
      fs.unlinkSync(file.file_path);
    }

    res.json({
      success: true,
      message: 'Файл удалён'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка при удалении файла',
      error: error.message
    });
  }
};

module.exports = {
  uploadDocumentFiles,
  getDocumentFiles,
  downloadDocumentFile,
  deleteDocumentFile
};