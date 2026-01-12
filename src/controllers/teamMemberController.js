const { Op } = require("sequelize");
const TeamMember = require('../models/TeamMember');

const getAllTeamMembers = async (req, res) => {
  try {
    const whereClause = { deleted: false };
    const { count, rows } = await TeamMember.findAndCountAll({
      where: whereClause,
      order: [['created_at', 'DESC']]
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
      message: 'Ошибка сервера при получении специалистов бригады',
      error: error.message
    });
  }
};

const searchTeamMembers = async (req, res) => {
  try {
    const {
      user_id,
      team_id,
      page = 1,
      size = 10
    } = req.body;

    const offset = (page - 1) * size;

    const whereClause = {
      deleted: false
    };

    if (user_id) whereClause.user_id = user_id;
    if (team_id) whereClause.team_id = team_id;

    const { count, rows } = await TeamMember.findAndCountAll({
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
    console.error('Ошибка поиска специалистов бригады:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при поиске специалистов бригады',
      error: error.message
    });
  }
};

const getTeamMemberById = async (req, res) => {
  try {
    const { id } = req.params;
    const teamMember = await TeamMember.findByPk(id);

    if (!teamMember) {
      return res.status(404).json({
        success: false,
        message: 'Специалист бригады не найден'
      });
    }

    res.json({
      success: true,
      data: teamMember
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при получении специалиста бригады',
      error: error.message
    });
  }
};

const createTeamMember = async (req, res) => {
  try {
    const teamMember = await TeamMember.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Специалист бригады успешно создан',
      data: teamMember
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при создании специалиста бригады',
      error: error.message
    });
  }
};

const updateTeamMember = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await TeamMember.update(req.body, {
      where: { id: id }
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Специалист бригады не найден'
      });
    }

    const updatedTeamMember = await TeamMember.findByPk(id);

    res.json({
      success: true,
      message: 'Специалист бригады успешно обновлен',
      data: updatedTeamMember
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при обновлении специалиста бригады',
      error: error.message
    });
  }
};

const deleteTeamMember = async (req, res) => {
  try {
    const { id } = req.params;
    const materiaId = Number(id);

    // Обновляем поле deleted вместо удаления записи
    const [updated] = await TeamMember.update(
      { deleted: true },
      { where: { id: materiaId } }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Специалист бригады не найден'
      });
    }

    return res.json({
      success: true,
      message: 'Специалист бригады успешно удален'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при удалении специалиста бригады',
      error: error.message
    });
  }
};

module.exports = {
  getAllTeamMembers,
  searchTeamMembers,
  getTeamMemberById,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember
};