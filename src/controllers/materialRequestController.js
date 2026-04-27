const { Op, Sequelize } = require("sequelize");
const {
  sequelize,
  MaterialRequest,
  MaterialRequestItem,
  Material,
  UnitOfMeasure
} = require("../models");
const User = require("../models/User");
const Project = require("../models/Project");
const ProjectBlock = require("../models/ProjectBlock");
const { sendMaterialRequestEmail } = require("../utils/mailer");
const updateWithAudit = require("../utils/updateWithAudit");
const { notifyUsers } = require("../utils/notifications");
const { sendPushToUser } = require("../utils/pushNotifications");

const CREATE_MATERIAL_REQUEST_ROLE_IDS = [1, 4, 10, 11];
const SIGNATURE_ROLE_IDS = [7, 9, 10, 11];
const PURCHASE_AGENT_ROLE_ID = 7;

const buildLocationLabel = (projectName, blockName) =>
  [projectName, blockName].filter(Boolean).join(", ");

const buildSignatureRequestMessage = ({ materialRequestId, projectName, blockName }) => {
  const requestLabel = `Заявка на материалы №${materialRequestId}`;
  const locationLabel = buildLocationLabel(projectName, blockName);

  return locationLabel
    ? `${requestLabel} (${locationLabel}) ожидает вашей подписи`
    : `${requestLabel} ожидает вашей подписи`;
};

const buildReadyForPurchaseMessage = ({ materialRequestId, projectName, blockName }) => {
  const requestLabel = `Заявка на материалы №${materialRequestId}`;
  const locationLabel = buildLocationLabel(projectName, blockName);

  return locationLabel
    ? `${requestLabel} (${locationLabel}) полностью подписана и готова к закупу`
    : `${requestLabel} полностью подписана и готова к закупу`;
};

const loadRequestLocation = async ({ projectId, blockId, transaction = null }) => {
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

const loadSignatureRecipientIds = async ({ projectId, transaction = null }) => {
  const { project } = await loadRequestLocation({ projectId, transaction });

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
          [Op.in]: SIGNATURE_ROLE_IDS
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

const sendMaterialRequestSignaturePush = async ({ materialRequestId, projectId, blockId }) => {
  const { project, block } = await loadRequestLocation({ projectId, blockId });
  const recipientIds = await loadSignatureRecipientIds({ projectId });

  if (!recipientIds.length) {
    return;
  }

  const title = "Требуется подпись заявки";
  const body = buildSignatureRequestMessage({
    materialRequestId,
    projectName: project?.name,
    blockName: block?.name
  });

  await Promise.allSettled(
    recipientIds.map((userId) =>
      sendPushToUser({
        userId,
        title,
        body,
        data: {
          type: "material_request_signature_required",
          entityType: "material_request",
          materialRequestId: String(materialRequestId)
        }
      })
    )
  );
};

const notifyPurchaseAgentsAboutApprovedRequest = async ({
  materialRequestId,
  projectId,
  blockId
}) => {
  const { project, block } = await loadRequestLocation({ projectId, blockId });

  const purchaseAgents = await User.findAll({
    where: {
      deleted: false,
      supplier_id: {
        [Op.is]: null
      },
      role_id: PURCHASE_AGENT_ROLE_ID
    },
    attributes: ["id", "email", "first_name", "last_name"]
  });

  if (!purchaseAgents.length) {
    return;
  }

  const materialRequestItems = await MaterialRequestItem.findAll({
    where: {
      material_request_id: materialRequestId,
      deleted: false
    },
    include: [
      {
        model: Material,
        as: "material",
        attributes: ["name"]
      },
      {
        model: UnitOfMeasure,
        as: "unit",
        attributes: ["name"]
      }
    ],
    attributes: ["quantity", "comment"]
  });

  const preparedItems = materialRequestItems.map((item) => ({
    material_name: item.material?.name,
    quantity: item.quantity,
    unit_name: item.unit?.name,
    comment: item.comment
  }));

  const title = "Заявка согласована";
  const message = buildReadyForPurchaseMessage({
    materialRequestId,
    projectName: project?.name,
    blockName: block?.name
  });

  await notifyUsers(
    purchaseAgents.map((user) => user.id),
    {
      type: "material_request_ready_for_purchase",
      title,
      message,
      entityType: "material_request",
      entityId: materialRequestId
    }
  );

  await Promise.allSettled(
    purchaseAgents.map((user) =>
      sendPushToUser({
        userId: user.id,
        title,
        body: message,
        data: {
          type: "material_request_ready_for_purchase",
          entityType: "material_request",
          materialRequestId: String(materialRequestId)
        }
      })
    )
  );

  await Promise.allSettled(
    purchaseAgents
      .filter((user) => user.email)
      .map((user) =>
        sendMaterialRequestEmail({
          to: user.email,
          project_name: project?.name,
          materialRequest: {
            id: materialRequestId
          },
          materialRequestItems: preparedItems
        })
      )
  );
};

const getAllMaterialRequests = async (req, res) => {
  try {
    const whereClause = { deleted: false };
    const { count, rows } = await MaterialRequest.findAndCountAll({
      where: whereClause,
      distinct: true,
      col: "id",
      order: [["project_id", "ASC"]],
      include: [
        {
          model: MaterialRequestItem,
          as: "items",
          required: false,
          where: { deleted: false }
        }
      ]
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
      message: "Ошибка сервера при получении заявок на материалы",
      error: error.message
    });
  }
};

const searchMaterialRequests = async (req, res) => {
  try {
    const {
      project_id,
      block_id,
      statuses,
      item_statuses,
      search,
      page = 1,
      size = 10
    } = req.body;

    const offset = (page - 1) * size;
    const whereClause = { deleted: false };

    if (project_id) whereClause.project_id = project_id;
    if (block_id) whereClause.block_id = block_id;

    const statusFilter = Array.isArray(statuses)
      ? statuses
      : statuses != null
        ? [statuses]
        : null;

    if (statusFilter) {
      whereClause.status = {
        [Op.in]: statusFilter
      };
    }

    const itemStatusFilter = Array.isArray(item_statuses)
      ? item_statuses
      : item_statuses != null
        ? [item_statuses]
        : null;

    const searchValue = search?.trim();

    if (searchValue) {
      const searchPattern = `%${searchValue}%`;

      whereClause[Op.or] = [
        Sequelize.where(
          Sequelize.cast(Sequelize.col("MaterialRequest.id"), "TEXT"),
          { [Op.iLike]: searchPattern }
        ),
        Sequelize.where(
          Sequelize.col("items->material.name"),
          { [Op.iLike]: searchPattern }
        )
      ];
    }

    const include = [
      {
        model: MaterialRequestItem,
        as: "items",
        required: Boolean(searchValue) || Boolean(itemStatusFilter),
        where: {
          deleted: false,
          ...(itemStatusFilter && (
            itemStatusFilter.includes(1)
              ? {
                  [Op.or]: [
                    { status: { [Op.in]: itemStatusFilter } },
                    { status: { [Op.is]: null } }
                  ]
                }
              : {
                  status: { [Op.in]: itemStatusFilter }
                }
          ))
        },
        include: [
          {
            model: Material,
            as: "material",
            attributes: ["id", "name"],
            required: false
          }
        ]
      }
    ];

    const { count, rows } = await MaterialRequest.findAndCountAll({
      where: whereClause,
      distinct: true,
      subQuery: false,
      limit: Number(size),
      offset: Number(offset),
      order: [["created_at", "DESC"]],
      include
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
    console.error("Ошибка поиска заявок на материалы:", error);

    res.status(500).json({
      success: false,
      message: "Ошибка сервера при поиске заявок на материалы",
      error: error.message
    });
  }
};

const getMaterialRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    const materialRequest = await MaterialRequest.findOne({
      where: {
        id,
        deleted: false
      },
      include: [
        {
          model: MaterialRequestItem,
          as: "items",
          required: false
        }
      ]
    });

    if (!materialRequest) {
      return res.status(404).json({
        success: false,
        message: "Заявка на материалы не найдена"
      });
    }

    res.json({
      success: true,
      data: materialRequest
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Ошибка сервера при получении заявки на материалы",
      error: error.message
    });
  }
};

const createMaterialRequest = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const currentUserRoleId = Number(req.user?.role_id);

    if (!CREATE_MATERIAL_REQUEST_ROLE_IDS.includes(currentUserRoleId)) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: "Создание заявок на материалы доступно только админу, ПТО, гл. инженеру и прорабу"
      });
    }

    const { items, ...requestData } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Список материалов (items) обязателен"
      });
    }

    const materialRequest = await MaterialRequest.create(requestData, { transaction });

    const requestItems = items.map((item) => ({
      ...item,
      status: item.status ?? 1,
      material_request_id: materialRequest.id
    }));

    await MaterialRequestItem.bulkCreate(requestItems, { transaction });

    await transaction.commit();

    try {
      await sendMaterialRequestSignaturePush({
        materialRequestId: materialRequest.id,
        projectId: requestData.project_id,
        blockId: requestData.block_id
      });
    } catch (notificationError) {
      console.error("material request signature push error:", notificationError);
    }

    return res.status(201).json({
      success: true,
      message: "Заявка на материалы успешно создана",
      data: materialRequest
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }

    console.error("createMaterialRequest error:", error);

    res.status(500).json({
      success: false,
      message: "Ошибка сервера при создании заявки на материалы",
      error: error.message
    });
  }
};

const updateMaterialRequest = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const {
      approved_by_foreman,
      approved_by_site_manager,
      approved_by_purchasing_agent,
      approved_by_planning_engineer,
      approved_by_main_engineer,
      comment,
      ...restBody
    } = req.body;

    const materialRequest = await MaterialRequest.findByPk(id, { transaction });

    if (!materialRequest) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Заявка на материалы не найдена"
      });
    }

    const finalApprovals = {
      approved_by_foreman:
        approved_by_foreman ?? materialRequest.approved_by_foreman,
      approved_by_site_manager:
        approved_by_site_manager ?? materialRequest.approved_by_site_manager,
      approved_by_purchasing_agent:
        approved_by_purchasing_agent ?? materialRequest.approved_by_purchasing_agent,
      approved_by_planning_engineer:
        approved_by_planning_engineer ?? materialRequest.approved_by_planning_engineer,
      approved_by_main_engineer:
        approved_by_main_engineer ?? materialRequest.approved_by_main_engineer
    };

    const wasFullyApproved =
      materialRequest.approved_by_foreman === true &&
      materialRequest.approved_by_site_manager === true &&
      materialRequest.approved_by_purchasing_agent === true &&
      materialRequest.approved_by_planning_engineer === true &&
      materialRequest.approved_by_main_engineer === true;

    const isFullyApproved =
      finalApprovals.approved_by_foreman === true &&
      finalApprovals.approved_by_site_manager === true &&
      finalApprovals.approved_by_purchasing_agent === true &&
      finalApprovals.approved_by_planning_engineer === true &&
      finalApprovals.approved_by_main_engineer === true;

    const now = new Date();

    const approvalTimes = {
      ...(approved_by_foreman === true && !materialRequest.approved_by_foreman_time
        ? { approved_by_foreman_time: now }
        : {}),
      ...(approved_by_site_manager === true && !materialRequest.approved_by_site_manager_time
        ? { approved_by_site_manager_time: now }
        : {}),
      ...(approved_by_purchasing_agent === true && !materialRequest.approved_by_purchasing_agent_time
        ? { approved_by_purchasing_agent_time: now }
        : {}),
      ...(approved_by_planning_engineer === true && !materialRequest.approved_by_planning_engineer_time
        ? { approved_by_planning_engineer_time: now }
        : {}),
      ...(approved_by_main_engineer === true && !materialRequest.approved_by_main_engineer_time
        ? { approved_by_main_engineer_time: now }
        : {})
    };

    const result = await updateWithAudit({
      model: MaterialRequest,
      id,
      data: {
        ...restBody,
        ...finalApprovals,
        ...approvalTimes,
        ...(isFullyApproved ? { status: 2 } : {})
      },
      entityType: "material_request",
      action: "material_request_updated",
      userId: req.user.id,
      comment,
      transaction
    });

    if (result.notFound) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Заявка на материалы не найдена"
      });
    }

    const becameFullyApproved = !wasFullyApproved && isFullyApproved;

    if (becameFullyApproved) {
      await MaterialRequestItem.update(
        { status: 2 },
        {
          where: { material_request_id: id },
          transaction
        }
      );
    }

    await transaction.commit();

    if (becameFullyApproved) {
      try {
        await notifyPurchaseAgentsAboutApprovedRequest({
          materialRequestId: Number(id),
          projectId: materialRequest.project_id,
          blockId: materialRequest.block_id
        });
      } catch (notificationError) {
        console.error("material request purchase notifications error:", notificationError);
      }
    }

    return res.json({
      success: true,
      message: "Заявка на материалы успешно обновлена",
      data: result.instance
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }

    console.error("updateMaterialRequest error:", error);

    res.status(500).json({
      success: false,
      message: "Ошибка сервера при обновлении заявки на материалы",
      error: error.message
    });
  }
};

const deleteMaterialRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const materialRequestId = Number(id);

    const [updated] = await MaterialRequest.update(
      { deleted: true },
      { where: { id: materialRequestId } }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Заявка на материалы не найдена"
      });
    }

    return res.json({
      success: true,
      message: "Заявка на материалы успешно удалена"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Ошибка сервера при удалении заявки на материалы",
      error: error.message
    });
  }
};

module.exports = {
  getAllMaterialRequests,
  searchMaterialRequests,
  getMaterialRequestById,
  createMaterialRequest,
  updateMaterialRequest,
  deleteMaterialRequest
};
