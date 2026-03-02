const { Op } = require("sequelize");
const StageSubsection = require("../models/StageSubsection");
const updateWithAudit = require("../utils/updateWithAudit");


// 🔹 Получить все подэтапы
const getAllStageSubsections = async (req, res) => {
  try {
    const whereClause = { deleted: false };

    const { count, rows } = await StageSubsection.findAndCountAll({
      where: whereClause,
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: rows,
      pagination: { total: count }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Ошибка сервера при получении подэтапов",
      error: error.message
    });
  }
};


// 🔹 Поиск подэтапов
const searchStageSubsections = async (req, res) => {
  try {
    const {
      search,
      stage_id,
      page = 1,
      size = 10
    } = req.body;

    const offset = (page - 1) * size;
    const whereClause = { deleted: false };

    if (search && search.trim() !== "") {
      const s = `%${search.trim()}%`;
      whereClause[Op.or] = [
        { name: { [Op.iLike]: s } }
      ];
    }

    if (stage_id) {
      whereClause.stage_id = stage_id;
    }

    const { count, rows } = await StageSubsection.findAndCountAll({
      where: whereClause,
      limit: Number(size),
      offset: Number(offset),
      order: [['created_at', 'DESC']]
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
    console.error("Ошибка при поиске подэтапов:", error);
    res.status(500).json({
      success: false,
      message: "Ошибка сервера при поиске подэтапов",
      error: error.message
    });
  }
};


// 🔹 Получить по ID
const getStageSubsectionById = async (req, res) => {
  try {
    const { id } = req.params;

    const subsection = await StageSubsection.findOne({
      where: { id, deleted: false }
    });

    if (!subsection) {
      return res.status(404).json({
        success: false,
        message: "Подэтап не найден"
      });
    }

    res.json({
      success: true,
      data: subsection
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Ошибка сервера при получении подэтапа",
      error: error.message
    });
  }
};


// 🔹 Создание
const createStageSubsection = async (req, res) => {
  try {
    const subsection = await StageSubsection.create(req.body);

    res.status(201).json({
      success: true,
      message: "Подэтап успешно создан",
      data: subsection
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Ошибка сервера при создании подэтапа",
      error: error.message
    });
  }
};


// 🔹 Обновление
const updateStageSubsection = async (req, res) => {
  try {
    const result = await updateWithAudit({
      model: StageSubsection,
      id: req.params.id,
      data: req.body,
      entityType: "section_subsection",
      action: "section_subsection_updated",
      userId: req.user.id,
      comment: req.body.comment
    });

    if (result.notFound) {
      return res.status(404).json({
        success: false,
        message: "Подэтап не найден"
      });
    }

    return res.json({
      success: true,
      message: result.changed
        ? "Подэтап успешно обновлен"
        : "Изменений не обнаружено",
      data: result.instance
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Ошибка сервера при обновлении подэтапа",
      error: error.message
    });
  }
};


// 🔹 Soft delete
const deleteStageSubsection = async (req, res) => {
  try {
    const { id } = req.params;

    const [updated] = await StageSubsection.update(
      { deleted: true },
      { where: { id } }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Подэтап не найден"
      });
    }

    res.json({
      success: true,
      message: "Подэтап успешно удалён"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Ошибка сервера при удалении подэтапа",
      error: error.message
    });
  }
};


module.exports = {
  getAllStageSubsections,
  searchStageSubsections,
  getStageSubsectionById,
  createStageSubsection,
  updateStageSubsection,
  deleteStageSubsection
};
