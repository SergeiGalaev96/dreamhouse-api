const { Op } = require("sequelize");
const Document = require('../models/Document');
const updateWithAudit = require('../utils/updateWithAudit');

const getAllDocuments = async (req, res) => {
  try {
    const whereClause = { deleted: false };
    const { count, rows } = await Document.findAndCountAll({
      where: whereClause,
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        // page: parseInt(page),
        // size: parseInt(size),
        total: count,
        // pages: Math.ceil(count / size)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при получении документов',
      error: error.message
    });
  }
};

const searchDocuments = async (req, res) => {
  try {
    let {
      project_id,
      stage_id,
      name,
      description,
      // search,
      status,
      page = 1,
      size = 10
    } = req.body;

    page = Number(page);
    size = Number(size);
    const offset = (page - 1) * size;

    const whereClause = {};

    // Поиск по name / number / description
    // if (search) {
    //   whereClause[Op.or] = [
    //     { name: { [Op.iLike]: `%${search}%` } },
    //     { number: { [Op.iLike]: `%${search}%` } },
    //     { description: { [Op.iLike]: `%${search}%` } }
    //   ];
    // }
    if (project_id) whereClause.project_id = Number(project_id);
    if (stage_id) whereClause.stage_id = Number(stage_id);
    if (name) whereClause.name = { [Op.iLike]: `%${name}%` };
    if (description) whereClause.name = { [Op.iLike]: `%${description}%` };
    if (status) whereClause.status = status;


    const { count, rows } = await Document.findAndCountAll({
      where: whereClause,
      limit: size,
      offset: offset,
      order: [["created_at", "DESC"]],
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page,
        size,
        pages: Math.ceil(count / size),
        hasNext: page * size < count,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Ошибка сервера при поиске документов",
      error: error.message
    });
  }
};

const getDocumentById = async (req, res) => {
  try {
    const { id } = req.params;
    const document = await Document.findByPk(id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Документ не найден'
      });
    }

    res.json({
      success: true,
      data: document
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при получении документа',
      error: error.message
    });
  }
};

const createDocument = async (req, res) => {
  try {
    const documentData = {
      ...req.body,
      uploaded_by: req.user.id
    };

    const document = await Document.create(documentData);

    res.status(201).json({
      success: true,
      message: 'Документ успешно создан',
      data: document
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при создании документа',
      error: error.message
    });
  }
};

const updateDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment, ...data } = req.body;

    const result = await updateWithAudit({
      model: Document,
      id,
      data,
      entityType: 'document',
      action: 'document_updated',
      userId: req.user.id,
      comment
    });

    if (result.notFound) {
      return res.status(404).json({
        success: false,
        message: 'Документ не найден'
      });
    }

    return res.json({
      success: true,
      message: result.changed
        ? 'Документ успешно обновлён'
        : 'Изменений не обнаружено',
      data: result.instance
    });

  } catch (error) {
    console.error('updateDocument error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при обновлении документа',
      error: error.message
    });
  }
};

const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Document.destroy({
      where: { id: id }
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Документ не найден'
      });
    }

    res.json({
      success: true,
      message: 'Документ успешно удален'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при удалении документа',
      error: error.message
    });
  }
};



module.exports = {
  getAllDocuments,
  searchDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument
};