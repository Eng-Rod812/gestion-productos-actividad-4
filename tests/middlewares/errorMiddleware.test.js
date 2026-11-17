const { notFound, errorHandler } = require('../../src/middlewares/errorMiddleware');
const { mockRes } = require('../helpers');

describe('errorMiddleware', () => {
  let consoleSpy;

  beforeEach(() => {
    // Evita que el console.error del manejador ensucie la salida de las pruebas
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  test('notFound responde 404 con el método y la ruta', () => {
    const res = mockRes();
    notFound({ method: 'GET', originalUrl: '/nada' }, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Ruta no encontrada: GET /nada' });
  });

  test('JSON mal formado -> 400', () => {
    const res = mockRes();
    errorHandler({ type: 'entity.parse.failed' }, {}, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('ValidationError de Mongoose -> 400 con la lista de errores', () => {
    const res = mockRes();
    const error = { name: 'ValidationError', errors: { precio: { message: 'El precio es obligatorio' } } };

    errorHandler(error, {}, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Datos inválidos', errores: ['El precio es obligatorio'] });
  });

  test('CastError (ID mal formado) -> 400', () => {
    const res = mockRes();
    errorHandler({ name: 'CastError' }, {}, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('clave duplicada (código 11000) -> 409', () => {
    const res = mockRes();
    errorHandler({ code: 11000 }, {}, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(409);
  });

  test('error desconocido -> 500 sin filtrar detalles internos', () => {
    const res = mockRes();
    errorHandler(new Error('detalle secreto de la BD'), {}, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'Error interno del servidor' });
  });
});
