const jwt = require('jsonwebtoken');
const authMiddleware = require('../../src/middlewares/authMiddleware');
const { mockRes, tokenValido } = require('../helpers');

describe('authMiddleware', () => {
  test('responde 401 si no llega el header Authorization', () => {
    const res = mockRes();
    const next = jest.fn();

    authMiddleware({ headers: {} }, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('responde 401 si el header no usa el formato Bearer', () => {
    const res = mockRes();
    const next = jest.fn();

    authMiddleware({ headers: { authorization: 'Token abc' } }, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('responde 401 con un token inválido', () => {
    const res = mockRes();
    const next = jest.fn();

    authMiddleware({ headers: { authorization: 'Bearer token.falso.123' } }, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Token inválido' });
    expect(next).not.toHaveBeenCalled();
  });

  test('responde 401 con un token firmado con otra clave', () => {
    const res = mockRes();
    const next = jest.fn();
    const tokenAjeno = jwt.sign({ id: '1' }, 'otra_clave');

    authMiddleware({ headers: { authorization: `Bearer ${tokenAjeno}` } }, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('responde 401 con mensaje específico si el token expiró', () => {
    const res = mockRes();
    const next = jest.fn();
    const expirado = jwt.sign({ id: '1' }, process.env.JWT_SECRET, { expiresIn: -10 });

    authMiddleware({ headers: { authorization: `Bearer ${expirado}` } }, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'El token ha expirado, inicia sesión de nuevo' });
  });

  test('con token válido guarda req.user y llama a next()', () => {
    const res = mockRes();
    const next = jest.fn();
    const req = { headers: { authorization: `Bearer ${tokenValido('abc123')}` } };

    authMiddleware(req, res, next);

    expect(req.user).toEqual({ id: 'abc123' });
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});
