const { Op } = require("sequelize");
const ProjectBlock = require("../models/ProjectBlock");
const updateWithAudit = require("../utils/updateWithAudit");


// 🔹 Получить все блоки
const getAllProjectBlocks = async (req, res) => {
  try {
    const whereClause = { deleted: false };

    const { count, rows } = await ProjectBlock.findAndCountAll({
      where: whereClause,
      order: [['created_at', 'ASC']]
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
      message: "Ошибка сервера при получении блоков",
      error: error.message
    });
  }
};


// 🔹 Поиск блоков
const searchProjectBlocks = async (req, res) => {
  try {
    const {
      search,
      project_id,
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

    if (project_id) {
      whereClause.project_id = project_id;
    }

    const { count, rows } = await ProjectBlock.findAndCountAll({
      where: whereClause,
      limit: Number(size),
      offset: Number(offset),
      order: [['created_at', 'ASC']]
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
    console.error("Ошибка при поиске блоков:", error);
    res.status(500).json({
      success: false,
      message: "Ошибка сервера при поиске блоков",
      error: error.message
    });
  }
};


// 🔹 Получить блок по ID
const getProjectBlockById = async (req, res) => {
  try {
    const { id } = req.params;

    const block = await ProjectBlock.findOne({
      where: {
        id,
        deleted: false
      }
    });

    if (!block) {
      return res.status(404).json({
        success: false,
        message: "Блок не найден"
      });
    }

    res.json({
      success: true,
      data: block
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Ошибка сервера при получении блока",
      error: error.message
    });
  }
};


// 🔹 Создание блока
const createProjectBlock = async (req, res) => {
  try {
    const block = await ProjectBlock.create(req.body);

    res.status(201).json({
      success: true,
      message: "Блок успешно создан",
      data: block
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Ошибка сервера при создании блока",
      error: error.message
    });
  }
};


// 🔹 Обновление блока
const updateProjectBlock = async (req, res) => {
  try {
    const result = await updateWithAudit({
      model: ProjectBlock,
      id: req.params.id,
      data: req.body,
      entityType: "project_block",
      action: "project_block_updated",
      userId: req.user.id,
      comment: req.body.comment
    });

    if (result.notFound) {
      return res.status(404).json({
        success: false,
        message: "Блок не найден"
      });
    }

    return res.json({
      success: true,
      message: result.changed
        ? "Блок успешно обновлён"
        : "Изменений не обнаружено",
      data: result.instance
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Ошибка сервера при обновлении блока",
      error: error.message
    });
  }
};


// 🔹 Удаление блока (soft delete)
const deleteProjectBlock = async (req, res) => {
  try {
    const { id } = req.params;

    const [updated] = await ProjectBlock.update(
      { deleted: true },
      { where: { id } }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Блок не найден"
      });
    }

    res.json({
      success: true,
      message: "Блок успешно удалён"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Ошибка сервера при удалении блока",
      error: error.message
    });
  }
};


module.exports = {
  getAllProjectBlocks,
  searchProjectBlocks,
  getProjectBlockById,
  createProjectBlock,
  updateProjectBlock,
  deleteProjectBlock
};