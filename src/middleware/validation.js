const Joi = require('joi');

const validateProject = (req, res, next) => {
  const schema = Joi.object({
    project_name: Joi.string().max(200).required(),
    project_code: Joi.string().max(50).optional(),
    project_type: Joi.string().max(50).optional(),
    address: Joi.string().optional(),
    customer_id: Joi.number().integer().optional(),
    start_date: Joi.date().iso().optional(),
    end_date: Joi.date().iso().optional(),
    planned_budget: Joi.number().precision(2).optional(),
    actual_budget: Joi.number().precision(2).optional(),
    status: Joi.string().max(30).optional(),
    manager_id: Joi.number().integer().optional(),
    description: Joi.string().optional()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Ошибка валидации данных',
      details: error.details.map(detail => detail.message)
    });
  }
  next();
};

// const validateProjectType = (req, res, next) => {
//   const schema = Joi.object({
//     name: Joi.string().max(500).required(),
//   });

//   const { error } = schema.validate(req.body);
//   if (error) {
//     return res.status(400).json({
//       success: false,
//       message: 'Ошибка валидации данных',
//       details: error.details.map(detail => detail.message)
//     });
//   }
//   next();
// };

const validateMaterial = (req, res, next) => {
  const schema = Joi.object({
    code: Joi.string().max(50).optional(),
    name: Joi.string().max(200).required(),
    type: Joi.number().integer().required(),
    unit_of_measure: Joi.number().integer().optional(),
    description: Joi.string().optional()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Ошибка валидации данных',
      details: error.details.map(detail => detail.message)
    });
  }
  next();
};

const validateWarehouse = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().max(100).required(),
    code: Joi.string().max(20).optional(),
    address: Joi.string().optional(),
    manager_id: Joi.number().integer().optional(),
    phone: Joi.string().max(20).optional()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Ошибка валидации данных',
      details: error.details.map(detail => detail.message)
    });
  }
  next();
};

module.exports = {
  validateProject,
  validateMaterial,
  validateWarehouse
};