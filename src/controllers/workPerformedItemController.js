const { Op } = require("sequelize");
const WorkPerformedItem = require("../models/WorkPerformedItem");
const updateWithAudit = require("../utils/updateWithAudit");


const getAllWorkPerformedItems = async (req, res) => {
  try {
    const whereClause = { deleted: false };

    const { count, rows } = await WorkPerformedItem.findAndCountAll({
      where: whereClause,
      order: [["created_at", "ASC"]]
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
      message: "Ошибка сервера при получении позиций актов",
      error: error.message
    });
  }
};


const searchWorkPerformedItems = async (req, res) => {
  try {
    const {
      work_performed_id,
      material_estimate_item_id,
      name,
      page = 1,
      size = 10
    } = req.body;

    const offset = (page - 1) * size;
    const whereClause = { deleted: false };

    if (name)
      whereClause.name = { [Op.iLike]: `%${name}%` };

    if (work_performed_id)
      whereClause.work_performed_id = work_performed_id;

    if (material_estimate_item_id)
      whereClause.material_estimate_item_id = material_estimate_item_id;

    const { count, rows } = await WorkPerformedItem.findAndCountAll({
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
    console.error("Ошибка при поиске позиций актов:", error);

    res.status(500).json({
      success: false,
      message: "Ошибка сервера при поиске позиций актов",
      error: error.message
    });
  }
};


const getWorkPerformedItemById = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await WorkPerformedItem.findByPk(id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Позиция акта не найдена"
      });
    }

    res.json({
      success: true,
      data: item
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Ошибка сервера при получении позиции акта",
      error: error.message
    });
  }
};


const createWorkPerformedItem = async (req, res) => {
  try {

    const item = await WorkPerformedItem.create(req.body);
    res.status(201).json({
      success: true,
      message: "Позиция акта успешно создана",
      data: item
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Ошибка сервера при создании позиции акта",
      error: error.message
    });

  }
};


const updateWorkPerformedItem = async (req, res) => {
  try {

    const { id } = req.params;
    const { comment, ...data } = req.body;

    const result = await updateWithAudit({
      model: WorkPerformedItem,
      id,
      data,
      entityType: "work_performed_item",
      action: "work_performed_item_updated",
      userId: req.user.id,
      comment
    });

    if (result.notFound) {
      return res.status(404).json({
        success: false,
        message: "Позиция акта не найдена"
      });
    }

    return res.json({
      success: true,
      message: result.changed
        ? "Позиция акта успешно обновлена"
        : "Изменений не обнаружено",
      data: result.instance
    });

  } catch (error) {

    console.error("updateWorkPerformedItem error:", error);

    res.status(500).json({
      success: false,
      message: "Ошибка сервера при обновлении позиции акта",
      error: error.message
    });

  }
};


const deleteWorkPerformedItem = async (req, res) => {
  try {

    const { id } = req.params;
    const itemId = Number(id);

    const [updated] = await WorkPerformedItem.update(
      { deleted: true },
      { where: { id: itemId } }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Позиция акта не найдена"
      });
    }

    res.json({
      success: true,
      message: "Позиция акта успешно удалена"
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Ошибка сервера при удалении позиции акта",
      error: error.message
    });

  }
};


module.exports = {
  getAllWorkPerformedItems,
  searchWorkPerformedItems,
  getWorkPerformedItemById,
  createWorkPerformedItem,
  updateWorkPerformedItem,
  deleteWorkPerformedItem
};