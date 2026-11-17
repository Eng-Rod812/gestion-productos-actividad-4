const mongoose = require('mongoose');

// Guardamos la conexión en "global" para reutilizarla.
// En plataformas serverless (como Vercel) el servidor se "despierta" en cada
// petición, y sin este caché abriríamos una conexión nueva cada vez.
const cache = global._mongooseCache || (global._mongooseCache = { conn: null, promise: null });

async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('La variable de entorno MONGODB_URI no está definida');
  }

  if (cache.conn) {
    return cache.conn;
  }

  if (!cache.promise) {
    cache.promise = mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  }

  try {
    cache.conn = await cache.promise;
  } catch (error) {
    // Si falló, limpiamos el intento para poder reintentar en la siguiente petición
    cache.promise = null;
    throw error;
  }

  return cache.conn;
}

module.exports = connectDB;
