// Si ninguna ruta respondió, llegamos aquí
function notFound(req, res) {
  res.status(404).json({ message: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
}

// Manejador central de errores: todos los controladores llaman next(error)
// y aquí se decide el código HTTP y el mensaje que ve el cliente.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // JSON mal formado en el body
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'El cuerpo de la petición no es un JSON válido' });
  }

  // Validaciones del esquema de Mongoose
  if (err.name === 'ValidationError') {
    const errores = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: 'Datos inválidos', errores });
  }

  // ID con formato incorrecto
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'El ID proporcionado no es válido' });
  }

  // Valor duplicado en un campo único (por ejemplo, el correo)
  if (err.code === 11000) {
    return res.status(409).json({ message: 'Ya existe un registro con esos datos' });
  }

  console.error(err);
  res.status(500).json({ message: 'Error interno del servidor' });
}

module.exports = { notFound, errorHandler };
