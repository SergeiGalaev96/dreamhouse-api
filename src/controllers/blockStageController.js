const { Op } = require("sequelize");
const BlockStage = require("../models/BlockStage");
const updateWithAudit = require("../utils/updateWithAudit");


// 🔹 Получить все секции
const getAllBlockStages = async (req, res) => {
  try {
    const whereClause = { deleted: false };

    const { count, rows } = await BlockStage.findAndCountAll({
      where: whereClause,
      order: [['created_at', 'DESC']]
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
      message: "Ошибка сервера при получении этапов блоков",
      error: error.message
    });
  }
};


// 🔹 Поиск этапов
const searchBlockStages = async (req, res) => {
  try {
    const {
      search,
      block_id,
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

    if (block_id) {
      whereClause.block_id = block_id;
    }

    const { count, rows } = await BlockStage.findAndCountAll({
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
    console.error("Ошибка при поиске этапов блоков:", error);
    res.status(500).json({
      success: false,
      message: "Ошибка сервера при поиске этапов блоков",
      error: error.message
    });
  }
};


// 🔹 Получить секцию по ID
const getBlockStageById = async (req, res) => {
  try {
    const { id } = req.params;

    const section = await BlockStage.findOne({
      where: {
        id,
        deleted: false
      }
    });

    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Этап блока не найден"
      });
    }

    res.json({
      success: true,
      data: section
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Ошибка сервера при получении этапа блока",
      error: error.message
    });
  }
};


// 🔹 Создание секции
const createBlockStage = async (req, res) => {
  try {
    const section = await BlockStage.create(req.body);

    res.status(201).json({
      success: true,
      message: "Этап блока успешно создан",
      data: section
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Ошибка сервера при создании этапа блока",
      error: error.message
    });
  }
};


// 🔹 Обновление секции
const updateBlockStage = async (req, res) => {
  try {
    const result = await updateWithAudit({
      model: BlockStage,
      id: req.params.id,
      data: req.body,
      entityType: "block_section",
      action: "block_section_updated",
      userId: req.user.id,
      comment: req.body.comment
    });

    if (result.notFound) {
      return res.status(404).json({
        success: false,
        message: "Этап блока не найден"
      });
    }

    return res.json({
      success: true,
      message: result.changed
        ? "Этап блока успешно обновлен"
        : "Изменений не обнаружено",
      data: result.instance
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Ошибка сервера при обновлении этап блока",
      error: error.message
    });
  }
};


// 🔹 Soft delete секции
const deleteBlockStage = async (req, res) => {
  try {
    const { id } = req.params;

    const [updated] = await BlockStage.update(
      { deleted: true },
      { where: { id } }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Этап блока не найден"
      });
    }

    res.json({
      success: true,
      message: "Этап блока успешно удален"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Ошибка сервера при удалении этапа блока",
      error: error.message
    });
  }
};


module.exports = {
  getAllBlockStages,
  searchBlockStages,
  getBlockStageById,
  createBlockStage,
  updateBlockStage,
  deleteBlockStage
};