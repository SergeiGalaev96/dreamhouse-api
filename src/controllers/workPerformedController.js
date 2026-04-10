const { Op } = require("sequelize");
const { sequelize, WorkPerformed, WorkPerformedItem } = require('../models');
const updateWithAudit = require('../utils/updateWithAudit');

const normalizeNullableNumber = (value) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};


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
      block_id,
      code,
      status,
      page = 1,
      size = 10
    } = req.body;

    const offset = (page - 1) * size;
    const whereClause = { deleted: false };

    if (code) whereClause.code = { [Op.iLike]: `%${code}%` };
    if (block_id) whereClause.block_id = block_id;
    if (status) whereClause.status = status;



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

    const work = await WorkPerformed.findByPk(id, {
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
    console.error("Ошибка получения акта:", error);

    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при получении акта выполненных работ',
      error: error.message
    });
  }
};


const createWorkPerformed = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const {
      items = [],
      ...workData
    } = req.body;

    if (Object.prototype.hasOwnProperty.call(workData, "advance_payment")) {
      workData.advance_payment = normalizeNullableNumber(workData.advance_payment);
    }

    /* ============================================================
       1. СОЗДАЁМ АКТ
    ============================================================ */

    const work = await WorkPerformed.create(workData, { transaction });

    /* ============================================================
       2. СОЗДАЁМ ITEMS
    ============================================================ */

    if (items.length > 0) {

      const preparedItems = items.map(item => ({
        ...item,
        work_performed_id: work.id
      }));

      await WorkPerformedItem.bulkCreate(preparedItems, {
        transaction
      });

    }

    await transaction.commit();

    res.status(201).json({
      success: true,
      message: 'Акт выполненных работ успешно создан',
      data: work
    });

  } catch (error) {

    await transaction.rollback();

    console.error('Ошибка создания АВР:', error);

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

    const {
      signed_by_foreman,
      signed_by_planning_engineer,
      signed_by_main_engineer,
      comment,
      ...restBody
    } = req.body;

    if (Object.prototype.hasOwnProperty.call(restBody, "advance_payment")) {
      restBody.advance_payment = normalizeNullableNumber(restBody.advance_payment);
    }

    /* ============================================================
       Проверяем наличие акта
    ============================================================ */

    const workPerformed = await WorkPerformed.findByPk(id);

    if (!workPerformed) {
      return res.status(404).json({
        success: false,
        message: 'Акт выполненных работ не найден'
      });
    }

    /* ============================================================
       Итоговые значения подписей
    ============================================================ */

    const finalSigns = {

      signed_by_foreman:
        signed_by_foreman ?? workPerformed.signed_by_foreman,

      signed_by_planning_engineer:
        signed_by_planning_engineer ?? workPerformed.signed_by_planning_engineer,

      signed_by_main_engineer:
        signed_by_main_engineer ?? workPerformed.signed_by_main_engineer

    };

    /* ============================================================
       Проверяем — все ли подписали
    ============================================================ */

    const isFullySigned =
      finalSigns.signed_by_foreman === true &&
      finalSigns.signed_by_planning_engineer === true &&
      finalSigns.signed_by_main_engineer === true;

    /* ============================================================
       Автоматическое время подписания
    ============================================================ */

    const now = new Date();

    const signTimes = {

      ...(signed_by_foreman === true &&
        !workPerformed.signed_by_foreman_time
        ? { signed_by_foreman_time: now }
        : {}),

      ...(signed_by_planning_engineer === true &&
        !workPerformed.signed_by_planning_engineer_time
        ? { signed_by_planning_engineer_time: now }
        : {}),

      ...(signed_by_main_engineer === true &&
        !workPerformed.signed_by_main_engineer_time
        ? { signed_by_main_engineer_time: now }
        : {})

    };

    /* ============================================================
       Апдейт + аудит
    ============================================================ */

    const result = await updateWithAudit({
      model: WorkPerformed,
      id,
      data: {
        ...restBody,
        ...finalSigns,
        ...signTimes,
        ...(isFullySigned ? { status: 2 } : {})
      },
      entityType: 'work_performed',
      action: isFullySigned
        ? 'work_performed_signed'
        : 'work_performed_updated',
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
