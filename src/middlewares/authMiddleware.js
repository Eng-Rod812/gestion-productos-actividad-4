const jwt = require('jsonwebtoken');

// Protege rutas: solo deja pasar si llega un token JWT válido en el header
//   Authorization: Bearer <token>
function authMiddleware(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Acceso denegado: falta el token de autenticación' });
  }

  const token = header.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id };
    next();
  } catch (error) {
    const message =
      error.name === 'TokenExpiredError' ? 'El token ha expirado, inicia sesión de nuevo' : 'Token inválido';
    return res.status(401).json({ message });
  }
}

module.exports = authMiddleware;
