const express = require('express');
const {
  crearProducto,
  obtenerProductos,
  obtenerProductoPorId,
  actualizarProducto,
  eliminarProducto
} = require('../controllers/productController');
const {
  idRule,
  createProductRules,
  updateProductRules,
  validate
} = require('../middlewares/validators');

// Este router se monta en app.js detrás de authMiddleware,
// por eso aquí no hace falta repetirlo en cada ruta.
const router = express.Router();

router.post('/', createProductRules, validate, crearProducto);
router.get('/', obtenerProductos);
router.get('/:id', idRule, validate, obtenerProductoPorId);
router.put('/:id', updateProductRules, validate, actualizarProducto);
router.delete('/:id', idRule, validate, eliminarProducto);

module.exports = router;
