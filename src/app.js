require('dotenv').config({ quiet: true });

const path = require('path');
const express = require('express');
const connectDB = require('./config/db');
const authMiddleware = require('./middlewares/authMiddleware');
const { notFound, errorHandler } = require('./middlewares/errorMiddleware');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');

const app = express();

// Middlewares generales
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Página de inicio: manda al login estático
app.get('/', (req, res) => res.redirect('/login.html'));

// Ruta pública para comprobar que el servidor está vivo
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Asegura la conexión a MongoDB antes de atender cualquier ruta de la API
app.use('/api', async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    next(error);
  }
});

// Rutas
app.use('/api/auth', authRoutes); // públicas: registro y login
app.use('/api/productos', authMiddleware, productRoutes); // protegidas con JWT

// 404 y manejo de errores (siempre al final)
app.use(notFound);
app.use(errorHandler);

module.exports = app;
