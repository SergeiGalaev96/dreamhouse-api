const { Op } = require("sequelize");
const Contractor = require('../models/Contractor');
const updateWithAudit = require('../utils/updateWithAudit');

const getAllContractors = async (req, res) => {
  try {
    const whereClause = {deleted: false};
    const { count, rows } = await Contractor.findAndCountAll({
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
      message: 'Ошибка сервера при получении контракторов',
      error: error.message
    });
  }
};

const searchContractors = async (req, res) => {
  try {
    let {
      number,
      page = 1,
      size = 10
    } = req.body;

    page = Number(page);
    size = Number(size);
    const offset = (page - 1) * size;

    const whereClause = {};

    if (number)
      whereClause.name = { [Op.iLike]: `%${number}%` };

    const { count, rows } = await Contractor.findAndCountAll({
      where: whereClause,
      limit: size,
      offset: offset,
      order: [["created_at", "DESC"]],
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page,
        size,
        pages: Math.ceil(count / size),
        hasNext: page * size < count,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Ошибка сервера при поиске Контракторов",
      error: error.message
    });
  }
};


const getContractorById = async (req, res) => {
  try {
    const { id } = req.params;
    const contractor = await Contractor.findByPk(id);

    if (!contractor) {
      return res.status(404).json({
        success: false,
        message: 'Контрактор не найден'
      });
    }

    res.json({
      success: true,
      data: contractor
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при получении Контрактора',
      error: error.message
    });
  }
};

const createContractor = async (req, res) => {
  try {
    const contractorData = {
      ...req.body,
      uploaded_by: req.user.id
    };
    
    const contractor = await Contractor.create(contractorData);
    
    res.status(201).json({
      success: true,
      message: 'Контрактор успешно создан',
      data: contractor
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при создании Контрактора',
      error: error.message
    });
  }
};

const updateContractor = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment, ...data } = req.body;

    const result = await updateWithAudit({
      model: Contractor,
      id,
      data,
      entityType: 'contractor',
      action: 'contractor_updated',
      userId: req.user.id,
      comment
    });

    if (result.notFound) {
      return res.status(404).json({
        success: false,
        message: 'Контрактор не найден'
      });
    }

    return res.json({
      success: true,
      message: result.changed
        ? 'Контрактор успешно обновлён'
        : 'Изменений не обнаружено',
      data: result.instance
    });

  } catch (error) {
    console.error('updateContractor error:', error);

    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при обновлении контрактора',
      error: error.message
    });
  }
};


const deleteContractor = async (req, res) => {
  try {
    const { id } = req.params;

    const contractorId = Number(id);

    // Обновляем поле deleted вместо удаления записи
    const [updated] = await Contractor.update(
      { deleted: true },
      { where: { id: contractorId } }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Контрактор не найден'
      });
    }

    res.json({
      success: true,
      message: 'Контрактор успешно удален'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при удалении Контрактора',
      error: error.message
    });
  }
};

module.exports = {
  getAllContractors,
  searchContractors,
  getContractorById,
  createContractor,
  updateContractor,
  deleteContractor
};