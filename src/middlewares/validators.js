const { body, param, validationResult } = require('express-validator');

// Revisa si alguna regla anterior falló y, si es así, responde 400
function validate(req, res, next) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const errores = result.array().map((e) => e.msg);
    return res.status(400).json({ message: 'Datos inválidos', errores });
  }
  next();
}

const idRule = param('id').isMongoId().withMessage('El ID proporcionado no es válido');

const registerRules = [
  body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio'),
  body('email').trim().isEmail().withMessage('El correo no es válido'),
  body('password')
    .isString()
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres')
];

const loginRules = [
  body('email').trim().isEmail().withMessage('El correo no es válido'),
  body('password').notEmpty().withMessage('La contraseña es obligatoria')
];

// Al crear, nombre y precio son obligatorios
const createProductRules = [
  body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio'),
  body('precio').isFloat({ min: 0 }).withMessage('El precio debe ser un número mayor o igual a 0'),
  body('stock').optional().isInt({ min: 0 }).withMessage('El stock debe ser un entero mayor o igual a 0'),
  body('descripcion').optional().isString().withMessage('La descripción debe ser texto'),
  body('categoria').optional().isString().withMessage('La categoría debe ser texto')
];

// Al actualizar, todos los campos son opcionales pero si vienen se validan
const updateProductRules = [
  idRule,
  body('nombre').optional().trim().notEmpty().withMessage('El nombre no puede estar vacío'),
  body('precio').optional().isFloat({ min: 0 }).withMessage('El precio debe ser un número mayor o igual a 0'),
  body('stock').optional().isInt({ min: 0 }).withMessage('El stock debe ser un entero mayor o igual a 0'),
  body('descripcion').optional().isString().withMessage('La descripción debe ser texto'),
  body('categoria').optional().isString().withMessage('La categoría debe ser texto')
];

module.exports = {
  validate,
  idRule,
  registerRules,
  loginRules,
  createProductRules,
  updateProductRules
};
