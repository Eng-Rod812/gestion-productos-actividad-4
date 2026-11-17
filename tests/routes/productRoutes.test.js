// Pruebas de integración de las rutas: se usa la app real de Express (con su JWT,
// validaciones y manejo de errores) pero con los modelos y la conexión a BD simulados.
jest.mock('../../src/config/db', () => jest.fn().mockResolvedValue());
jest.mock('../../src/models/Product', () => ({
  create: jest.fn(),
  find: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn()
}));
jest.mock('../../src/models/User', () => ({ findOne: jest.fn(), create: jest.fn() }));

const request = require('supertest');
const app = require('../../src/app');
const Product = require('../../src/models/Product');
const { tokenValido } = require('../helpers');

const ID = '64b7f0c2a1b2c3d4e5f60718';
const auth = () => ({ Authorization: `Bearer ${tokenValido()}` });

describe('Protección con JWT en /api/productos', () => {
  test.each([
    ['GET', '/api/productos'],
    ['POST', '/api/productos'],
    ['GET', `/api/productos/${ID}`],
    ['PUT', `/api/productos/${ID}`],
    ['DELETE', `/api/productos/${ID}`]
  ])('%s %s sin token -> 401', async (metodo, url) => {
    const res = await request(app)[metodo.toLowerCase()](url);
    expect(res.status).toBe(401);
  });

  test('con token inválido -> 401', async () => {
    const res = await request(app).get('/api/productos').set('Authorization', 'Bearer abc.def.ghi');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/productos', () => {
  test('devuelve 200 y la lista', async () => {
    Product.find.mockReturnValue({ sort: jest.fn().mockResolvedValue([{ nombre: 'Teclado' }]) });

    const res = await request(app).get('/api/productos').set(auth());

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ nombre: 'Teclado' }]);
  });

  test('devuelve 500 con mensaje genérico si falla la BD', async () => {
    const consola = jest.spyOn(console, 'error').mockImplementation(() => {});
    Product.find.mockReturnValue({ sort: jest.fn().mockRejectedValue(new Error('boom')) });

    const res = await request(app).get('/api/productos').set(auth());

    expect(res.status).toBe(500);
    expect(res.body.message).toBe('Error interno del servidor');
    consola.mockRestore();
  });
});

describe('GET /api/productos/:id', () => {
  test('devuelve 200 con el producto', async () => {
    Product.findById.mockResolvedValue({ _id: ID, nombre: 'Teclado' });

    const res = await request(app).get(`/api/productos/${ID}`).set(auth());

    expect(res.status).toBe(200);
    expect(res.body.nombre).toBe('Teclado');
  });

  test('devuelve 404 si no existe', async () => {
    Product.findById.mockResolvedValue(null);

    const res = await request(app).get(`/api/productos/${ID}`).set(auth());

    expect(res.status).toBe(404);
  });

  test('devuelve 400 si el ID no tiene formato válido (sin llegar a la BD)', async () => {
    const res = await request(app).get('/api/productos/123').set(auth());

    expect(res.status).toBe(400);
    expect(Product.findById).not.toHaveBeenCalled();
  });
});

describe('POST /api/productos', () => {
  test('crea el producto y devuelve 201', async () => {
    Product.create.mockResolvedValue({ _id: ID, nombre: 'Teclado', precio: 450 });

    const res = await request(app)
      .post('/api/productos')
      .set(auth())
      .send({ nombre: 'Teclado', precio: 450, stock: 5 });

    expect(res.status).toBe(201);
    expect(Product.create).toHaveBeenCalledWith(
      expect.objectContaining({ nombre: 'Teclado', precio: 450, creadoPor: '64b7f0c2a1b2c3d4e5f60718' })
    );
  });

  test('devuelve 400 si falta el nombre', async () => {
    const res = await request(app).post('/api/productos').set(auth()).send({ precio: 100 });

    expect(res.status).toBe(400);
    expect(res.body.errores).toContain('El nombre es obligatorio');
    expect(Product.create).not.toHaveBeenCalled();
  });

  test('devuelve 400 si el precio es negativo', async () => {
    const res = await request(app).post('/api/productos').set(auth()).send({ nombre: 'X', precio: -5 });

    expect(res.status).toBe(400);
  });

  test('devuelve 400 si el precio no es numérico', async () => {
    const res = await request(app).post('/api/productos').set(auth()).send({ nombre: 'X', precio: 'caro' });

    expect(res.status).toBe(400);
  });

  test('devuelve 400 si el stock no es entero', async () => {
    const res = await request(app)
      .post('/api/productos')
      .set(auth())
      .send({ nombre: 'X', precio: 10, stock: 2.5 });

    expect(res.status).toBe(400);
  });

  test('devuelve 400 si el JSON está mal formado', async () => {
    const consola = jest.spyOn(console, 'error').mockImplementation(() => {});
    const res = await request(app)
      .post('/api/productos')
      .set(auth())
      .set('Content-Type', 'application/json')
      .send('{"nombre": ');

    expect(res.status).toBe(400);
    consola.mockRestore();
  });
});

describe('PUT /api/productos/:id', () => {
  test('actualiza y devuelve 200', async () => {
    Product.findByIdAndUpdate.mockResolvedValue({ _id: ID, precio: 999 });

    const res = await request(app).put(`/api/productos/${ID}`).set(auth()).send({ precio: 999 });

    expect(res.status).toBe(200);
    expect(res.body.precio).toBe(999);
  });

  test('devuelve 404 si no existe', async () => {
    Product.findByIdAndUpdate.mockResolvedValue(null);

    const res = await request(app).put(`/api/productos/${ID}`).set(auth()).send({ precio: 1 });

    expect(res.status).toBe(404);
  });

  test('devuelve 400 si el precio enviado es inválido', async () => {
    const res = await request(app).put(`/api/productos/${ID}`).set(auth()).send({ precio: -1 });

    expect(res.status).toBe(400);
    expect(Product.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  test('devuelve 400 si el ID es inválido', async () => {
    const res = await request(app).put('/api/productos/abc').set(auth()).send({ precio: 1 });

    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/productos/:id', () => {
  test('elimina y devuelve 200', async () => {
    Product.findByIdAndDelete.mockResolvedValue({ _id: ID });

    const res = await request(app).delete(`/api/productos/${ID}`).set(auth());

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Producto eliminado correctamente');
  });

  test('devuelve 404 si no existe', async () => {
    Product.findByIdAndDelete.mockResolvedValue(null);

    const res = await request(app).delete(`/api/productos/${ID}`).set(auth());

    expect(res.status).toBe(404);
  });

  test('devuelve 400 si el ID es inválido', async () => {
    const res = await request(app).delete('/api/productos/abc').set(auth());

    expect(res.status).toBe(400);
  });
});
