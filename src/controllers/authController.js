const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// POST /api/auth/register
async function register(req, res, next) {
  try {
    const { nombre, email, password } = req.body;

    const existente = await User.findOne({ email });
    if (existente) {
      return res.status(409).json({ message: 'Ya existe un usuario con ese correo' });
    }

    // Nunca se guarda la contraseña tal cual: se guarda su hash
    const hashedPassword = await bcrypt.hash(password, 10);

    const usuario = await User.create({ nombre, email, password: hashedPassword });

    res.status(201).json({
      message: 'Usuario registrado correctamente',
      user: { id: usuario._id, nombre: usuario.nombre, email: usuario.email }
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/auth/login
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    // password tiene select:false, así que hay que pedirla explícitamente
    const usuario = await User.findOne({ email }).select('+password');

    // Mismo mensaje para "no existe" y "contraseña incorrecta":
    // así no revelamos qué correos están registrados
    if (!usuario) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const coincide = await bcrypt.compare(password, usuario.password);
    if (!coincide) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const token = jwt.sign({ id: usuario._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '1h'
    });

    res.json({
      message: 'Inicio de sesión exitoso',
      token,
      user: { id: usuario._id, nombre: usuario.nombre, email: usuario.email }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { register, login };
