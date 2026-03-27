const { Op } = require("sequelize");
const DocumentStage = require("../models/DocumentStage");
const updateWithAudit = require("../utils/updateWithAudit");


/**
 * 🔹 Получить все этапы юр. документов
 */
const getAllDocumentStages = async (req, res) => {
  try {

    const whereClause = { deleted: false };

    const { count, rows } = await DocumentStage.findAndCountAll({
      where: whereClause,
      order: [["id", "ASC"]]
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count
      }
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Ошибка сервера при получении этапов Юр отдела",
      error: error.message
    });

  }
};


/**
 * 🔹 Поиск этапов
 */
const searchDocumentStages = async (req, res) => {
  try {

    const {
      search,
      page = 1,
      size = 10
    } = req.body;

    const offset = (page - 1) * size;

    const whereClause = {
      deleted: false
    };

    if (search && search.trim() !== "") {
      const s = `%${search.trim()}%`;

      whereClause[Op.or] = [
        { name: { [Op.iLike]: s } }
      ];
    }

    const { count, rows } = await DocumentStage.findAndCountAll({
      where: whereClause,
      limit: Number(size),
      offset: Number(offset),
      order: [["created_at", "DESC"]]
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        page: Number(page),
        size: Number(size),
        total: count,
        pages: Math.ceil(count / size),
        hasNext: page * size < count,
        hasPrev: page > 1
      }
    });

  } catch (error) {

    console.error("Ошибка при поиске этапов Юр отдела:", error);

    res.status(500).json({
      success: false,
      message: "Ошибка сервера при поиске этапов Юр отдела",
      error: error.message
    });

  }
};


/**
 * 🔹 Получить этап по ID
 */
const getDocumentStageById = async (req, res) => {
  try {

    const { id } = req.params;

    const stage = await DocumentStage.findOne({
      where: {
        id,
        deleted: false
      }
    });

    if (!stage) {
      return res.status(404).json({
        success: false,
        message: "Этап Юр отдела не найден"
      });
    }

    res.json({
      success: true,
      data: stage
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Ошибка сервера при получении этапа Юр отдела",
      error: error.message
    });

  }
};


/**
 * 🔹 Создание этапа
 */
const createDocumentStage = async (req, res) => {
  try {

    const stage = await DocumentStage.create(req.body);

    res.status(201).json({
      success: true,
      message: "Этап Юр отдела успешно создан",
      data: stage
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Ошибка сервера при создании этапа Юр отдела",
      error: error.message
    });

  }
};


/**
 * 🔹 Обновление этапа
 */
const updateDocumentStage = async (req, res) => {
  try {

    const result = await updateWithAudit({
      model: DocumentStage,
      id: req.params.id,
      data: req.body,
      entityType: "document_stage",
      action: "document_stage_updated",
      userId: req.user.id,
      comment: req.body.comment
    });

    if (result.notFound) {
      return res.status(404).json({
        success: false,
        message: "Этап Юр отдела не найден"
      });
    }

    return res.json({
      success: true,
      message: result.changed
        ? "Этап Юр отдела успешно обновлен"
        : "Изменений не обнаружено",
      data: result.instance
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Ошибка сервера при обновлении этапа Юр отдела",
      error: error.message
    });

  }
};


/**
 * 🔹 Soft delete
 */
const deleteDocumentStage = async (req, res) => {
  try {

    const { id } = req.params;

    const [updated] = await DocumentStage.update(
      { deleted: true },
      { where: { id } }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Этап Юр отдела не найден"
      });
    }

    res.json({
      success: true,
      message: "Этап Юр отдела успешно удален"
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Ошибка сервера при удалении этапа Юр отдела",
      error: error.message
    });

  }
};


module.exports = {
  getAllDocumentStages,
  searchDocumentStages,
  getDocumentStageById,
  createDocumentStage,
  updateDocumentStage,
  deleteDocumentStage
};