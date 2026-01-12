const { Op } = require("sequelize");
const Contract = require('../models/Contract');

const getAllContracts = async (req, res) => {
  try {
    const whereClause = {deleted: false};
    const { count, rows } = await Contract.findAndCountAll({
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
      message: 'Ошибка сервера при получении контрактов',
      error: error.message
    });
  }
};

const searchContracts = async (req, res) => {
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

    const { count, rows } = await Contract.findAndCountAll({
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
      message: "Ошибка сервера при поиске контрактов",
      error: error.message
    });
  }
};


const getContractById = async (req, res) => {
  try {
    const { id } = req.params;
    const contract = await Contract.findByPk(id);

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Контракт не найден'
      });
    }

    res.json({
      success: true,
      data: contract
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при получении контракта',
      error: error.message
    });
  }
};

const createContract = async (req, res) => {
  try {
    const contractData = {
      ...req.body,
      uploaded_by: req.user.id
    };
    
    const contract = await Contract.create(contractData);
    
    res.status(201).json({
      success: true,
      message: 'Контракт успешно создан',
      data: contract
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при создании контракта',
      error: error.message
    });
  }
};

const updateContract = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await Contract.update(req.body, {
      where: { id: id }
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Контракт не найден'
      });
    }

    const updatedContract = await Contract.findByPk(id);
    
    res.json({
      success: true,
      message: 'Контракт успешно обновлен',
      data: updatedContract
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при обновлении контракта',
      error: error.message
    });
  }
};

const deleteContract = async (req, res) => {
  try {
    const { id } = req.params;

    const contractId = Number(id);

    // Обновляем поле deleted вместо удаления записи
    const [updated] = await Contract.update(
      { deleted: true },
      { where: { id: contractId } }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Контракт не найден'
      });
    }

    res.json({
      success: true,
      message: 'Контракт успешно удален'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при удалении контракта',
      error: error.message
    });
  }
};

module.exports = {
  getAllContracts,
  searchContracts,
  getContractById,
  createContract,
  updateContract,
  deleteContract
};