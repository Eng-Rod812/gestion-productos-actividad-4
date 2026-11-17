jest.mock('../../src/config/db', () => jest.fn().mockResolvedValue());
jest.mock('../../src/models/Product', () => ({}));
jest.mock('../../src/models/User', () => ({ findOne: jest.fn(), create: jest.fn() }));

const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../../src/app');
const User = require('../../src/models/User');
const connectDB = require('../../src/config/db');

describe('POST /api/auth/register', () => {
  test('registra un usuario nuevo -> 201', async () => {
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue({ _id: 'id1', nombre: 'Rodri', email: 'rodri@correo.com' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ nombre: 'Rodri', email: 'rodri@correo.com', password: 'secreto123' });

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe('rodri@correo.com');
    expect(res.body.user.password).toBeUndefined();
  });

  test('correo repetido -> 409', async () => {
    User.findOne.mockResolvedValue({ _id: 'existente' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ nombre: 'Rodri', email: 'rodri@correo.com', password: 'secreto123' });

    expect(res.status).toBe(409);
  });

  test('correo con formato inválido -> 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ nombre: 'Rodri', email: 'no-es-correo', password: 'secreto123' });

    expect(res.status).toBe(400);
  });

  test('contraseña de menos de 6 caracteres -> 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ nombre: 'Rodri', email: 'rodri@correo.com', password: '123' });

    expect(res.status).toBe(400);
    expect(User.create).not.toHaveBeenCalled();
  });

  test('sin nombre -> 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'rodri@correo.com', password: 'secreto123' });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  test('credenciales correctas -> 200 y token', async () => {
    const hash = await bcrypt.hash('secreto123', 10);
    User.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue({ _id: 'id1', nombre: 'Rodri', email: 'rodri@correo.com', password: hash })
    });

    const res = await request(app).post('/api/auth/login').send({ email: 'rodri@correo.com', password: 'secreto123' });

    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe('string');
  });

  test('contraseña incorrecta -> 401', async () => {
    const hash = await bcrypt.hash('secreto123', 10);
    User.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue({ _id: 'id1', nombre: 'Rodri', email: 'rodri@correo.com', password: hash })
    });

    const res = await request(app).post('/api/auth/login').send({ email: 'rodri@correo.com', password: 'mala' });

    expect(res.status).toBe(401);
  });

  test('sin contraseña -> 400', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'rodri@correo.com' });

    expect(res.status).toBe(400);
  });
});

describe('Conexión a la base de datos', () => {
  test('si MongoDB no responde, la API contesta 500 y no se cae', async () => {
    const consola = jest.spyOn(console, 'error').mockImplementation(() => {});
    connectDB.mockRejectedValueOnce(new Error('no se pudo conectar'));

    const res = await request(app).post('/api/auth/login').send({ email: 'a@a.com', password: '123456' });

    expect(res.status).toBe(500);
    expect(res.body.message).toBe('Error interno del servidor');
    consola.mockRestore();
  });
});

describe('Rutas generales', () => {
  test('GET /api/health responde 200', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  test('ruta inexistente -> 404', async () => {
    const res = await request(app).get('/api/no-existe');
    expect(res.status).toBe(404);
  });

  test('GET / redirige a la vista de login', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/login.html');
  });

  test('la vista estática de login se sirve correctamente', async () => {
    const res = await request(app).get('/login.html');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Iniciar sesión');
  });
});
