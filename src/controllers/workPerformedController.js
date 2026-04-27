const { Op } = require("sequelize");
const {
  sequelize,
  WorkPerformed,
  WorkPerformedItem,
  Project,
  ProjectBlock
} = require('../models');
const Document = require('../models/Document');
const User = require('../models/User');
const updateWithAudit = require('../utils/updateWithAudit');
const { notifyUsers } = require('../utils/notifications');
const { sendPushToUser } = require('../utils/pushNotifications');

const WORK_PERFORMED_CREATE_ROLE_IDS = [1, 4, 10, 11, 15];
const WORK_PERFORMED_SIGNATURE_ROLE_IDS = [10, 11];
const WORK_PERFORMED_SIGNATURE_NOTIFICATION_TYPE = 'work_performed_signature_required';

const normalizeNullableNumber = (value) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const buildLocationLabel = (projectName, blockName) =>
  [projectName, blockName].filter(Boolean).join(", ");

const buildWorkPerformedSignatureMessage = ({ workPerformedId, projectName, blockName }) => {
  const actLabel = `АВР №${workPerformedId}`;
  const locationLabel = buildLocationLabel(projectName, blockName);

  return locationLabel
    ? `${actLabel} (${locationLabel}) ожидает вашей подписи`
    : `${actLabel} ожидает вашей подписи`;
};

const loadWorkPerformedLocation = async ({ projectId, blockId, transaction = null }) => {
  const [project, block] = await Promise.all([
    projectId
      ? Project.findOne({
          where: {
            id: projectId,
            deleted: false
          },
          attributes: ["id", "name", "foreman_id"],
          transaction
        })
      : null,
    blockId
      ? ProjectBlock.findOne({
          where: {
            id: blockId,
            deleted: false
          },
          attributes: ["id", "name"],
          transaction
        })
      : null
  ]);

  return { project, block };
};

const loadWorkPerformedSignatureRecipientIds = async ({ projectId, transaction = null }) => {
  const { project } = await loadWorkPerformedLocation({ projectId, transaction });

  const [eligibleForeman, roleUsers] = await Promise.all([
    project?.foreman_id
      ? User.findOne({
          where: {
            id: project.foreman_id,
            deleted: false,
            supplier_id: {
              [Op.is]: null
            },
            role_id: {
              [Op.ne]: 13
            }
          },
          attributes: ["id"],
          transaction
        })
      : null,
    User.findAll({
      where: {
        deleted: false,
        supplier_id: {
          [Op.is]: null
        },
        role_id: {
          [Op.in]: WORK_PERFORMED_SIGNATURE_ROLE_IDS
        }
      },
      attributes: ["id"],
      transaction
    })
  ]);

  return [...new Set(
    [
      eligibleForeman?.id,
      ...roleUsers.map((user) => user.id)
    ]
      .map((userId) => Number(userId))
      .filter((userId) => Number.isFinite(userId) && userId > 0)
  )];
};

const notifyAboutWorkPerformedSignature = async ({
  workPerformedId,
  projectId,
  blockId
}) => {
  const { project, block } = await loadWorkPerformedLocation({ projectId, blockId });
  const recipientIds = await loadWorkPerformedSignatureRecipientIds({ projectId });

  if (!recipientIds.length) {
    return;
  }

  const title = 'Требуется подпись АВР';
  const message = buildWorkPerformedSignatureMessage({
    workPerformedId,
    projectName: project?.name,
    blockName: block?.name
  });

  await notifyUsers(recipientIds, {
    type: WORK_PERFORMED_SIGNATURE_NOTIFICATION_TYPE,
    title,
    message,
    entityType: 'work_performed',
    entityId: workPerformedId
  });

  await Promise.allSettled(
    recipientIds.map((userId) =>
      sendPushToUser({
        userId,
        title,
        body: message,
        data: {
          type: WORK_PERFORMED_SIGNATURE_NOTIFICATION_TYPE,
          entityType: 'work_performed',
          workPerformedId: String(workPerformedId)
        }
      })
    )
  );
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
    const currentUserRoleId = Number(req.user?.role_id);

    if (!WORK_PERFORMED_CREATE_ROLE_IDS.includes(currentUserRoleId)) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message:
          '\u0421\u043e\u0437\u0434\u0430\u043d\u0438\u0435 \u0410\u0412\u0420 \u0434\u043e\u0441\u0442\u0443\u043f\u043d\u043e \u0442\u043e\u043b\u044c\u043a\u043e \u0430\u0434\u043c\u0438\u043d\u0443, \u041f\u0422\u041e, \u0433\u043b. \u0438\u043d\u0436\u0435\u043d\u0435\u0440\u0443, \u043f\u0440\u043e\u0440\u0430\u0431\u0443 \u0438 \u043c\u0430\u0441\u0442\u0435\u0440\u0443'
      });
    }

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

    const existingDocument = await Document.findOne({
      where: {
        entity_type: "workPerformed",
        entity_id: work.id,
        deleted: false
      },
      transaction
    });

    if (existingDocument) {
      throw new Error("Документ для этого АВР уже существует");
    }

    await Document.create({
      entity_type: "workPerformed",
      entity_id: work.id,
      name: `Файлы Акта №${work.id}`,
      status: 3,
      uploaded_by: req.user.id,
      deleted: false
    }, { transaction });

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

    try {
      await notifyAboutWorkPerformedSignature({
        workPerformedId: work.id,
        projectId: workData.project_id,
        blockId: workData.block_id
      });
    } catch (notificationError) {
      console.error('notifyAboutWorkPerformedSignature error:', notificationError);
    }

    res.status(201).json({
      success: true,
      message: 'Акт выполненных работ успешно создан',
      data: work
    });

  } catch (error) {

    if (!transaction.finished) {
      await transaction.rollback();
    }

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
