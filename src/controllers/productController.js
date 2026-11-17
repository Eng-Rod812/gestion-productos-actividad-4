const Product = require('../models/Product');

// Solo estos campos se aceptan del body (evita que el cliente mande campos extra)
const CAMPOS_PERMITIDOS = ['nombre', 'descripcion', 'precio', 'stock', 'categoria'];

function filtrarCampos(body) {
  const datos = {};
  CAMPOS_PERMITIDOS.forEach((campo) => {
    if (body[campo] !== undefined) {
      datos[campo] = body[campo];
    }
  });
  return datos;
}

// POST /api/productos  -> Create
async function crearProducto(req, res, next) {
  try {
    const producto = await Product.create({
      ...filtrarCampos(req.body),
      creadoPor: req.user.id
    });
    res.status(201).json(producto);
  } catch (error) {
    next(error);
  }
}

// GET /api/productos  -> Read (todos)
async function obtenerProductos(req, res, next) {
  try {
    const productos = await Product.find().sort({ createdAt: -1 });
    res.json(productos);
  } catch (error) {
    next(error);
  }
}

// GET /api/productos/:id  -> Read (uno)
async function obtenerProductoPorId(req, res, next) {
  try {
    const producto = await Product.findById(req.params.id);
    if (!producto) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    res.json(producto);
  } catch (error) {
    next(error);
  }
}

// PUT /api/productos/:id  -> Update
async function actualizarProducto(req, res, next) {
  try {
    const producto = await Product.findByIdAndUpdate(req.params.id, filtrarCampos(req.body), {
      new: true, // devuelve el documento ya actualizado
      runValidators: true // aplica las validaciones del esquema también al actualizar
    });
    if (!producto) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    res.json(producto);
  } catch (error) {
    next(error);
  }
}

// DELETE /api/productos/:id  -> Delete
async function eliminarProducto(req, res, next) {
  try {
    const producto = await Product.findByIdAndDelete(req.params.id);
    if (!producto) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    res.json({ message: 'Producto eliminado correctamente', producto });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  crearProducto,
  obtenerProductos,
  obtenerProductoPorId,
  actualizarProducto,
  eliminarProducto
};
