const { Op } = require("sequelize");
const { WorkPerformed, WorkPerformedItem } = require('../models');
const updateWithAudit = require('../utils/updateWithAudit');


const getAllWorkPerformed = async (req, res) => {
  try {
    const whereClause = { deleted: false };

    const { count, rows } = await WorkPerformed.findAndCountAll({
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
      message: 'Ошибка сервера при получении актов выполненных работ',
      error: error.message
    });
  }
};


const searchWorkPerformed = async (req, res) => {
  try {
    const {
      code,
      page = 1,
      size = 10
    } = req.body;

    const offset = (page - 1) * size;
    const whereClause = { deleted: false };

    if (code)
      whereClause.code = { [Op.iLike]: `%${code}%` };

    const { count, rows } = await WorkPerformed.findAndCountAll({
      where: whereClause,
      limit: Number(size),
      offset: Number(offset),
      order: [['created_at', 'DESC']],
      include: [
        {
          model: WorkPerformedItem,
          as: 'items',
          where: { deleted: false },
          required: false,
          separate: true,
          order: [['created_at', 'ASC']]
        }
      ]
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
    console.error("Ошибка при поиске актов:", error);

    res.status(500).json({
      success: false,
      message: "Ошибка сервера при поиске актов выполненных работ",
      error: error.message
    });
  }
};


const getWorkPerformedById = async (req, res) => {
  try {
    const { id } = req.params;

    const work = await WorkPerformed.findByPk(id);

    if (!work) {
      return res.status(404).json({
        success: false,
        message: 'Акт выполненных работ не найден'
      });
    }

    res.json({
      success: true,
      data: work
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при получении акта выполненных работ',
      error: error.message
    });
  }
};


const createWorkPerformed = async (req, res) => {
  try {

    const work = await WorkPerformed.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Акт выполненных работ успешно создан',
      data: work
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при создании акта выполненных работ',
      error: error.message
    });

  }
};


const updateWorkPerformed = async (req, res) => {
  try {

    const { id } = req.params;
    const { comment, ...data } = req.body;

    const result = await updateWithAudit({
      model: WorkPerformed,
      id,
      data,
      entityType: 'work_performed',
      action: 'work_performed_updated',
      userId: req.user.id,
      comment
    });

    if (result.notFound) {
      return res.status(404).json({
        success: false,
        message: 'Акт выполненных работ не найден'
      });
    }

    return res.json({
      success: true,
      message: result.changed
        ? 'Акт выполненных работ успешно обновлён'
        : 'Изменений не обнаружено',
      data: result.instance
    });

  } catch (error) {

    console.error('updateWorkPerformed error:', error);

    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при обновлении акта выполненных работ',
      error: error.message
    });

  }
};


const deleteWorkPerformed = async (req, res) => {
  try {

    const { id } = req.params;
    const workId = Number(id);

    const [updated] = await WorkPerformed.update(
      { deleted: true },
      { where: { id: workId } }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Акт выполненных работ не найден'
      });
    }

    res.json({
      success: true,
      message: 'Акт выполненных работ успешно удалён'
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при удалении акта выполненных работ',
      error: error.message
    });

  }
};


module.exports = {
  getAllWorkPerformed,
  searchWorkPerformed,
  getWorkPerformedById,
  createWorkPerformed,
  updateWorkPerformed,
  deleteWorkPerformed
};