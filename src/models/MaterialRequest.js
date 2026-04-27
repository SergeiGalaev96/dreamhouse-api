const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Notification = require('./Notification');

class MaterialRequest extends Model {}

MaterialRequest.init({
  project_id: DataTypes.INTEGER,
  block_id: DataTypes.INTEGER,
  status: DataTypes.INTEGER,

  approved_by_foreman: DataTypes.BOOLEAN,
  approved_by_foreman_time: DataTypes.DATE,
  foreman_user_id: DataTypes.INTEGER,

  approved_by_site_manager: DataTypes.BOOLEAN,
  approved_by_site_manager_time: DataTypes.DATE,
  site_manager_user_id: DataTypes.INTEGER,

  approved_by_purchasing_agent: DataTypes.BOOLEAN,
  approved_by_purchasing_agent_time: DataTypes.DATE,
  purchasing_agent_user_id: DataTypes.INTEGER,

  approved_by_planning_engineer: DataTypes.BOOLEAN,
  approved_by_planning_engineer_time: DataTypes.DATE,
  planning_engineer_user_id: DataTypes.INTEGER,

  approved_by_main_engineer: DataTypes.BOOLEAN,
  approved_by_main_engineer_time: DataTypes.DATE,
  main_engineer_user_id: DataTypes.INTEGER,

  created_at: DataTypes.DATE,
  updated_at: DataTypes.DATE,
  deleted: DataTypes.BOOLEAN
}, {
  sequelize,
  schema: 'construction',
  tableName: 'material_requests',
  timestamps: false,
  hooks: {
    afterCreate: async (materialRequest, options) => {
      const transaction = options?.transaction;

      const [projectRow] = materialRequest.project_id
        ? await sequelize.query(
            `
              SELECT name, foreman_id
              FROM construction.projects
              WHERE id = :projectId
                AND deleted = false
              LIMIT 1
            `,
            {
              replacements: { projectId: materialRequest.project_id },
              type: sequelize.QueryTypes.SELECT,
              transaction
            }
          )
        : [null];

      const [blockRow] = materialRequest.block_id
        ? await sequelize.query(
            `
              SELECT name
              FROM construction.project_blocks
              WHERE id = :blockId
                AND deleted = false
              LIMIT 1
            `,
            {
              replacements: { blockId: materialRequest.block_id },
              type: sequelize.QueryTypes.SELECT,
              transaction
            }
          )
        : [null];

      const roleUsers = await sequelize.query(
        `
          SELECT id
          FROM construction.users
          WHERE deleted = false
            AND supplier_id IS NULL
            AND role_id IN (7, 9, 10, 11)
        `,
        {
          type: sequelize.QueryTypes.SELECT,
          transaction
        }
      );

      const [eligibleForemanRow] = projectRow?.foreman_id
        ? await sequelize.query(
            `
              SELECT id
              FROM construction.users
              WHERE id = :userId
                AND deleted = false
                AND supplier_id IS NULL
                AND role_id <> 13
              LIMIT 1
            `,
            {
              replacements: { userId: projectRow.foreman_id },
              type: sequelize.QueryTypes.SELECT,
              transaction
            }
          )
        : [null];

      const recipientIds = [...new Set(
        [
          eligibleForemanRow?.id,
          ...roleUsers.map((user) => user.id)
        ]
          .map((userId) => Number(userId))
          .filter((userId) => Number.isFinite(userId) && userId > 0)
      )];

      if (!recipientIds.length) {
        return;
      }

      const title = '\u0422\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044f \u043f\u043e\u0434\u043f\u0438\u0441\u044c \u0437\u0430\u044f\u0432\u043a\u0438';
      const requestLabel = `\u0417\u0430\u044f\u0432\u043a\u0430 \u043d\u0430 \u043c\u0430\u0442\u0435\u0440\u0438\u0430\u043b\u044b \u2116${materialRequest.id}`;
      const locationLabel = [projectRow?.name, blockRow?.name].filter(Boolean).join(', ');
      const message = locationLabel
        ? `${requestLabel} (${locationLabel}) \u043e\u0436\u0438\u0434\u0430\u0435\u0442 \u0432\u0430\u0448\u0435\u0439 \u043f\u043e\u0434\u043f\u0438\u0441\u0438`
        : `${requestLabel} \u043e\u0436\u0438\u0434\u0430\u0435\u0442 \u0432\u0430\u0448\u0435\u0439 \u043f\u043e\u0434\u043f\u0438\u0441\u0438`;

      const existingNotifications = await Notification.findAll({
        where: {
          deleted: false,
          type: 'material_request_signature_required',
          entity_type: 'material_request',
          entity_id: materialRequest.id,
          user_id: recipientIds
        },
        attributes: ['user_id'],
        transaction
      });

      const existingUserIds = new Set(
        existingNotifications.map((notification) => Number(notification.user_id))
      );

      const missingUserIds = recipientIds.filter((userId) => !existingUserIds.has(userId));

      if (!missingUserIds.length) {
        return;
      }

      await Notification.bulkCreate(
        missingUserIds.map((userId) => ({
          user_id: userId,
          type: 'material_request_signature_required',
          title,
          message,
          entity_type: 'material_request',
          entity_id: materialRequest.id,
          is_read: false,
          deleted: false
        })),
        {
          transaction
        }
      );
    }
  }
});

module.exports = MaterialRequest;
