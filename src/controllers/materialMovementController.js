const { Op } = require("sequelize");
const MaterialMovement = require('../models/MaterialMovement');
const updateWithAudit = require('../utils/updateWithAudit');

const getAllMaterialMovements = async (req, res) => {
  try {
    const whereClause = {deleted: false};

    const { count, rows } = await MaterialMovement.findAndCountAll({
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
      message: 'Ошибка сервера при получении транзакций',
      error: error.message
    });
  }
};

const searchMaterialMovements = async (req, res) => {
  try {
    const {
      project_id,
      material_id,
      // name,
      page = 1,
      size = 10
    } = req.body;

    const offset = (page - 1) * size;
    const whereClause = {deleted: false};


    // if (name)
    //   whereClause.name = { [Op.iLike]: `%${name}%` };
    
    if (project_id)
      whereClause.project_id = project_id

    if (material_id)
      whereClause.material_id = material_id

    const { count, rows } = await MaterialMovement.findAndCountAll({
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
    console.error("Ошибка при поиске транзакций:", error);
    res.status(500).json({
      success: false,
      message: "Ошибка сервера при поиске транзакций",
      error: error.message,
    });
  }
};

const getMaterialMovementById = async (req, res) => {
  try {
    const { id } = req.params;
    const materialMovement = await MaterialMovement.findByPk(id);

    if (!materialMovement) {
      return res.status(404).json({
        success: false,
        message: 'Транзакция не найдена'
      });
    }

    res.json({
      success: true,
      data: materialMovement
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при получении транзакции',
      error: error.message
    });
  }
};

const createMaterialMovement = async (req, res) => {
  try {
    const materialMovement = await MaterialMovement.create(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Транзакция успешно создана',
      data: materialMovement
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при создании транзакции',
      error: error.message
    });
  }
};

const updateMaterialMovement = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment, ...data } = req.body;

    const result = await updateWithAudit({
      model: MaterialMovement,
      id,
      data,
      entityType: 'material_movement',
      action: 'material_movement_updated',
      userId: req.user.id,
      comment
    });

    if (result.notFound) {
      return res.status(404).json({
        success: false,
        message: 'Транзакция не найдена'
      });
    }

    return res.json({
      success: true,
      message: result.changed
        ? 'Транзакция успешно обновлена'
        : 'Изменений не обнаружено',
      data: result.instance
    });

  } catch (error) {
    console.error('updateMaterialMovement error:', error);

    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при обновлении транзакции',
      error: error.message
    });
  }
};


const deleteMaterialMovement = async (req, res) => {
  try {
    const { id } = req.params;
    const materialMovementId = Number(id);

    // Обновляем поле deleted вместо удаления записи
    const [updated] = await MaterialMovement.update(
      { deleted: true },
      { where: { id: materialMovementId } }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Транзакция не найдена'
      });
    }

    res.json({
      success: true,
      message: 'Транзакция успешно удалена'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при удалении транзакции',
      error: error.message
    });
  }
};

module.exports = {
  getAllMaterialMovements,
  searchMaterialMovements,
  getMaterialMovementById,
  createMaterialMovement,
  updateMaterialMovement,
  deleteMaterialMovement
};