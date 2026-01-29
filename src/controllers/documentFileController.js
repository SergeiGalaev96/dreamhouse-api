const fs = require('fs');
const path = require('path');
const { Document, DocumentFile } = require('../models');

const UPLOAD_ROOT = path.resolve(__dirname, '..', '..', 'documents');

function sanitizeFileName(name) {
  return name
    .replace(/[\/\\]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9а-яА-Я._-]/g, '');
};

const uploadDocumentFile = async (req, res) => {
  try {
    const documentId = Number(req.params.document_id);

    if (!req.file) {
      return res.status(400).json({ message: 'Файл не передан' });
    }

    const safeUnlinkTmp = () => {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    };

    // 1️⃣ Документ
    const document = await Document.findByPk(documentId);
    if (!document || document.deleted) {
      safeUnlinkTmp();
      return res.status(404).json({ message: 'Документ не найден' });
    }

    // 2️⃣ Статус документа
    if (![1, 2].includes(document.status)) {
      safeUnlinkTmp();
      return res.status(403).json({
        message: 'Нельзя добавлять файлы в этом статусе документа'
      });
    }

    // 3️⃣ MIME-type allow list
    const ALLOWED_MIME = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/webp'
    ];

    if (!ALLOWED_MIME.includes(req.file.mimetype)) {
      safeUnlinkTmp();
      return res.status(400).json({
        message: 'Недопустимый тип файла'
      });
    }

    // 4️⃣ Имя файла
    const originalName = sanitizeFileName(req.file.originalname);

    // 5️⃣ Проверка дубликата
    const exists = await DocumentFile.findOne({
      where: {
        document_id: documentId,
        name: originalName,
        deleted: false
      }
    });

    if (exists) {
      safeUnlinkTmp();
      return res.status(409).json({
        message: 'Файл с таким именем уже существует. Переименуйте файл.'
      });
    }

    // 6️⃣ Папка документа
    const documentDir = path.join(UPLOAD_ROOT, String(documentId));
    if (!fs.existsSync(documentDir)) {
      fs.mkdirSync(documentDir, { recursive: true });
    }

    // 7️⃣ ФИЗИЧЕСКИЙ путь (ТОЛЬКО для fs)
    const physicalPath = path.join(documentDir, originalName);

    // 8️⃣ ОТНОСИТЕЛЬНЫЙ путь (ТОЛЬКО в БД)
    const relativePath = path
      .join(String(documentId), originalName)
      .replace(/\\/g, '/');

    // 9️⃣ Перемещаем файл
    fs.renameSync(req.file.path, physicalPath);

    // 🔟 Запись в БД
    const file = await DocumentFile.create({
      document_id: documentId,
      name: originalName,
      file_path: relativePath,
      mime_type: req.file.mimetype,
      file_size: req.file.size,
      uploaded_user_id: req.user.id,
      deleted: false
    });

    return res.status(201).json({
      success: true,
      data: file
    });

  } catch (error) {
    console.error(error);

    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    return res.status(500).json({
      success: false,
      message: 'Ошибка при загрузке файла',
      error: error.message
    });
  }
};


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

const downloadDocumentFile = async (req, res) => {
  try {
    const fileId = Number(req.params.id);

    const file = await DocumentFile.findByPk(fileId);
    if (!file || file.deleted) {
      return res.status(404).json({ message: 'Файл не найден' });
    }

    // ✅ собираем АБСОЛЮТНЫЙ путь
    const absolutePath = path.join(
      UPLOAD_ROOT,
      file.file_path
    );

    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({
        message: 'Файл отсутствует на диске'
      });
    }

    res.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`
    );

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
    const fileId = Number(req.params.id);

    const file = await DocumentFile.findByPk(fileId);
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
  uploadDocumentFile,
  getDocumentFiles,
  downloadDocumentFile,
  deleteDocumentFile
};