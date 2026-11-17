jest.mock('../../src/models/User', () => ({
  findOne: jest.fn(),
  create: jest.fn()
}));

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../../src/models/User');
const { register, login } = require('../../src/controllers/authController');
const { mockRes } = require('../helpers');

describe('authController.register', () => {
  test('crea el usuario con la contraseña encriptada y responde 201', async () => {
    User.findOne.mockResolvedValue(null);
    User.create.mockImplementation(async (datos) => ({ _id: 'id1', ...datos }));
    const req = { body: { nombre: 'Rodri', email: 'rodri@correo.com', password: 'secreto123' } };
    const res = mockRes();

    await register(req, res, jest.fn());

    const datosGuardados = User.create.mock.calls[0][0];
    expect(datosGuardados.password).not.toBe('secreto123'); // no se guarda en texto plano
    expect(await bcrypt.compare('secreto123', datosGuardados.password)).toBe(true);
    expect(res.status).toHaveBeenCalledWith(201);
    // la respuesta nunca debe incluir la contraseña
    expect(res.json.mock.calls[0][0].user).toEqual({ id: 'id1', nombre: 'Rodri', email: 'rodri@correo.com' });
  });

  test('responde 409 si el correo ya está registrado', async () => {
    User.findOne.mockResolvedValue({ _id: 'existente' });
    const req = { body: { nombre: 'Rodri', email: 'rodri@correo.com', password: 'secreto123' } };
    const res = mockRes();

    await register(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(409);
    expect(User.create).not.toHaveBeenCalled();
  });

  test('pasa el error a next() si la base de datos falla', async () => {
    const error = new Error('fallo de BD');
    User.findOne.mockRejectedValue(error);
    const next = jest.fn();

    await register({ body: { nombre: 'a', email: 'a@a.com', password: '123456' } }, mockRes(), next);

    expect(next).toHaveBeenCalledWith(error);
  });
});

describe('authController.login', () => {
  // Devuelve un "usuario" cuyo select('+password') entrega el documento
  function usuarioEncontrado(doc) {
    User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(doc) });
  }

  test('con credenciales correctas devuelve un token JWT válido', async () => {
    const hash = await bcrypt.hash('secreto123', 10);
    usuarioEncontrado({ _id: 'id1', nombre: 'Rodri', email: 'rodri@correo.com', password: hash });
    const res = mockRes();

    await login({ body: { email: 'rodri@correo.com', password: 'secreto123' } }, res, jest.fn());

    const respuesta = res.json.mock.calls[0][0];
    expect(respuesta.token).toBeDefined();
    expect(jwt.verify(respuesta.token, process.env.JWT_SECRET).id).toBe('id1');
    expect(respuesta.user).toEqual({ id: 'id1', nombre: 'Rodri', email: 'rodri@correo.com' });
  });

  test('responde 401 si el usuario no existe', async () => {
    usuarioEncontrado(null);
    const res = mockRes();

    await login({ body: { email: 'nadie@correo.com', password: 'x' } }, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Credenciales inválidas' });
  });

  test('responde 401 si la contraseña es incorrecta (mismo mensaje que usuario inexistente)', async () => {
    const hash = await bcrypt.hash('secreto123', 10);
    usuarioEncontrado({ _id: 'id1', nombre: 'Rodri', email: 'rodri@correo.com', password: hash });
    const res = mockRes();

    await login({ body: { email: 'rodri@correo.com', password: 'incorrecta' } }, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Credenciales inválidas' });
  });

  test('pasa el error a next() si la base de datos falla', async () => {
    const error = new Error('fallo de BD');
    User.findOne.mockReturnValue({ select: jest.fn().mockRejectedValue(error) });
    const next = jest.fn();

    await login({ body: { email: 'a@a.com', password: '123456' } }, mockRes(), next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
