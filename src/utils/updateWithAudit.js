const AuditLog = require('../models/AuditLog');

/**
 * Универсальное обновление сущности с аудитом
 */
const updateWithAudit = async ({
  model,            // Sequelize model (Project, Material, ...)
  id,               // id записи
  data,             // req.body
  entityType,       // 'project', 'material', ...
  action,           // 'project_updated'
  userId,           // req.user.id
  comment = null,   // комментарий для аудита
  transaction = null
}) => {
  // 1️⃣ Получаем инстанс
  const instance = await model.findByPk(id, { transaction });

  if (!instance) {
    return { notFound: true };
  }

  // 2️⃣ helper очистки
  const sanitize = (obj) => {
    const {
      created_at,
      updated_at,
      deleted,
      ...rest
    } = obj;
    return rest;
  };

  // 3️⃣ СНАПШОТ ДО
  const oldSnapshot = sanitize(
    instance.get({ plain: true })
  );

  // 4️⃣ Апдейт
  await instance.update(data, { transaction });

  // 5️⃣ СНАПШОТ ПОСЛЕ
  const newSnapshot = sanitize(
    instance.get({ plain: true })
  );

  // 6️⃣ Если реально ничего не изменилось — аудит не пишем
  if (JSON.stringify(oldSnapshot) === JSON.stringify(newSnapshot)) {
    return {
      instance,
      changed: false
    };
  }

  // 7️⃣ Пишем аудит (в той же транзакции)
  await AuditLog.create(
    {
      entity_type: entityType,
      entity_id: instance.id,
      action,
      old_values: oldSnapshot,
      new_values: newSnapshot,
      user_id: userId,
      comment
    },
    { transaction }
  );

  return {
    instance,
    changed: true
  };
};

module.exports = updateWithAudit;
