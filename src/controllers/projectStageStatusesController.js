const ProjectStageStatus = require('../models/ProjectStageStatus');
const { Op } = require("sequelize");

const getAllProjectStageStatuses = async (req, res) => {
  try {
    const whereClause = {deleted: false};

    const { count, rows } = await ProjectStageStatus.findAndCountAll({
      where: whereClause,
      order: [['id', 'ASC']]
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
      message: 'Ошибка сервера при получении статуса этапа проектов',
      error: error.message
    });
  }
};

// const searchProjectStageStatuses = async (req, res) => {
//   try {
//     const {
//       name,
//       page = 1,
//       size = 10
//     } = req.body;

//     const offset = (page - 1) * size;
//     const whereClause = {deleted: false};


//     if (name)
//       whereClause.name = { [Op.iLike]: `%${name}%` };

//     const { count, rows } = await ProjectStageStatus.findAndCountAll({
//       where: whereClause,
//       limit: Number(size),
//       offset: Number(offset),
//       order: [['created_at', 'DESC']]
//     });

//     res.json({
//       success: true,
//       data: rows,
//       pagination: {
//         page: Number(page),
//         size: Number(size),
//         total: count,
//         pages: Math.ceil(count / size),
//         hasNext: page * size < count,
//         hasPrev: page > 1
//       }
//     });

//   } catch (error) {
//     console.error("Ошибка при поиске проектов:", error);
//     res.status(500).json({
//       success: false,
//       message: "Ошибка сервера при поиске проектов",
//       error: error.message,
//     });
//   }
// };

// const getProjectStageStatusById = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const projectStageStatus = await ProjectStageStatus.findByPk(id);

//     if (!projectStageStatus) {
//       return res.status(404).json({
//         success: false,
//         message: 'Статус этапа проекта не найден'
//       });
//     }

//     res.json({
//       success: true,
//       data: projectStageStatus
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Ошибка сервера при получении статуса этапа проекта',
//       error: error.message
//     });
//   }
// };

// const createProjectStageStatus = async (req, res) => {
//   try {
//     const projectStageStatus = await ProjectStageStatus.create(req.body);
    
//     res.status(201).json({
//       success: true,
//       message: 'Статус этапа проекта успешно создан',
//       data: projectStageStatus
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Ошибка сервера при создании статуса этапа проекта',
//       error: error.message
//     });
//   }
// };

// const updateProjectStageStatus = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const [updated] = await ProjectStageStatus.update(req.body, {
//       where: { id: id }
//     });

//     if (!updated) {
//       return res.status(404).json({
//         success: false,
//         message: 'Статус этапа проекта не найден'
//       });
//     }

//     const updatedProject = await ProjectStageStatus.findByPk(id);
    
//     res.json({
//       success: true,
//       message: 'Статус этапа проекта успешно обновлен',
//       data: updatedProject
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Ошибка сервера при обновлении статуса этапа проекта',
//       error: error.message
//     });
//   }
// };

// const deleteProjectStageStatus = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const projectStageStatusId = Number(id);

//     // Обновляем поле deleted вместо удаления записи
//     const [updated] = await ProjectStageStatus.update(
//       { deleted: true },
//       { where: { id: projectStageStatusId } }
//     );

//     if (!updated) {
//       return res.status(404).json({
//         success: false,
//         message: 'Статус этапа проекта не найден'
//       });
//     }

//     res.json({
//       success: true,
//       message: 'Статус этапа проекта успешно удален'
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Ошибка сервера при удалении статуса этапа проекта',
//       error: error.message
//     });
//   }
// };

module.exports = {
  getAllProjectStageStatuses,
  // searchProjectStageStatuses,
  // getProjectStageStatusById,
  // createProjectStageStatus,
  // updateProjectStageStatus,
  // deleteProjectStageStatus
};