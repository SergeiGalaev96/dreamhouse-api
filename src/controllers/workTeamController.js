const { Op } = require("sequelize");
const WorkTeam = require('../models/WorkTeam');

const getAllWorkTeams = async (req, res) => {
  try {
    const whereClause = { deleted: false };
    const { count, rows } = await WorkTeam.findAndCountAll({
      where: whereClause,
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при получении материалов',
      error: error.message
    });
  }
};

const searchWorkTeams = async (req, res) => {
  try {
    const {
      name,
      leader_id,
      project_id,
      page = 1,
      size = 10
    } = req.body;

    const offset = (page - 1) * size;

    const whereClause = {
      deleted: false
    };

    if (name)
      whereClause.name = { [Op.iLike]: `%${name}%` };
    if (leader_id) whereClause.leader_id = leader_id;
    if (project_id) whereClause.project_id = project_id;

    const { count, rows } = await WorkTeam.findAndCountAll({
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
    console.error('Ошибка поиска материалов:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при поиске материалов',
      error: error.message
    });
  }
};

const getWorkTeamById = async (req, res) => {
  try {
    const { id } = req.params;
    const workTeam = await WorkTeam.findByPk(id);

    if (!workTeam) {
      return res.status(404).json({
        success: false,
        message: 'Бригада не найдена'
      });
    }

    res.json({
      success: true,
      data: workTeam
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при получении бригады',
      error: error.message
    });
  }
};

const createWorkTeam = async (req, res) => {
  try {
    const workTeam = await WorkTeam.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Бригада успешно создана',
      data: workTeam
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при создании бригады',
      error: error.message
    });
  }
};

const updateWorkTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await WorkTeam.update(req.body, {
      where: { id: id }
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Бригада не найдена'
      });
    }

    const updatedWorkTeam = await WorkTeam.findByPk(id);

    res.json({
      success: true,
      message: 'Бригада успешно обновлена',
      data: updatedWorkTeam
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при обновлении бригады',
      error: error.message
    });
  }
};

const deleteWorkTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const materiaId = Number(id);

    // Обновляем поле deleted вместо удаления записи
    const [updated] = await WorkTeam.update(
      { deleted: true },
      { where: { id: materiaId } }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Бригада не найден'
      });
    }

    return res.json({
      success: true,
      message: 'Бригада успешно удалена'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при удалении бригады',
      error: error.message
    });
  }
};

module.exports = {
  getAllWorkTeams,
  searchWorkTeams,
  getWorkTeamById,
  createWorkTeam,
  updateWorkTeam,
  deleteWorkTeam
};