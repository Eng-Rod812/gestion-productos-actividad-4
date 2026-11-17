jest.mock('../../src/models/Product', () => ({
  create: jest.fn(),
  find: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn()
}));

const Product = require('../../src/models/Product');
const {
  crearProducto,
  obtenerProductos,
  obtenerProductoPorId,
  actualizarProducto,
  eliminarProducto
} = require('../../src/controllers/productController');
const { mockRes } = require('../helpers');

const ID = '64b7f0c2a1b2c3d4e5f60718';

describe('productController.crearProducto', () => {
  test('crea el producto con el usuario autenticado y responde 201', async () => {
    const req = { body: { nombre: 'Teclado', precio: 450, stock: 10 }, user: { id: 'u1' } };
    const res = mockRes();
    Product.create.mockResolvedValue({ _id: ID, nombre: 'Teclado' });

    await crearProducto(req, res, jest.fn());

    expect(Product.create).toHaveBeenCalledWith({ nombre: 'Teclado', precio: 450, stock: 10, creadoPor: 'u1' });
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('ignora campos que no están permitidos en el body', async () => {
    const req = { body: { nombre: 'Mouse', precio: 200, creadoPor: 'otro', _id: 'hack' }, user: { id: 'u1' } };
    Product.create.mockResolvedValue({});

    await crearProducto(req, mockRes(), jest.fn());

    const datos = Product.create.mock.calls[0][0];
    expect(datos.creadoPor).toBe('u1'); // siempre el del token, no el del body
    expect(datos._id).toBeUndefined();
  });

  test('pasa el error a next() si falla la creación', async () => {
    const error = new Error('fallo');
    Product.create.mockRejectedValue(error);
    const next = jest.fn();

    await crearProducto({ body: {}, user: { id: 'u1' } }, mockRes(), next);

    expect(next).toHaveBeenCalledWith(error);
  });
});

describe('productController.obtenerProductos', () => {
  test('devuelve la lista de productos', async () => {
    const lista = [{ nombre: 'A' }, { nombre: 'B' }];
    Product.find.mockReturnValue({ sort: jest.fn().mockResolvedValue(lista) });
    const res = mockRes();

    await obtenerProductos({}, res, jest.fn());

    expect(res.json).toHaveBeenCalledWith(lista);
  });

  test('devuelve un arreglo vacío si no hay productos', async () => {
    Product.find.mockReturnValue({ sort: jest.fn().mockResolvedValue([]) });
    const res = mockRes();

    await obtenerProductos({}, res, jest.fn());

    expect(res.json).toHaveBeenCalledWith([]);
  });

  test('pasa el error a next() si falla la consulta', async () => {
    const error = new Error('fallo');
    Product.find.mockReturnValue({ sort: jest.fn().mockRejectedValue(error) });
    const next = jest.fn();

    await obtenerProductos({}, mockRes(), next);

    expect(next).toHaveBeenCalledWith(error);
  });
});

describe('productController.obtenerProductoPorId', () => {
  test('devuelve el producto encontrado', async () => {
    Product.findById.mockResolvedValue({ _id: ID, nombre: 'Teclado' });
    const res = mockRes();

    await obtenerProductoPorId({ params: { id: ID } }, res, jest.fn());

    expect(Product.findById).toHaveBeenCalledWith(ID);
    expect(res.json).toHaveBeenCalledWith({ _id: ID, nombre: 'Teclado' });
  });

  test('responde 404 si no existe', async () => {
    Product.findById.mockResolvedValue(null);
    const res = mockRes();

    await obtenerProductoPorId({ params: { id: ID } }, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('pasa el error a next() si falla la consulta', async () => {
    const error = new Error('fallo');
    Product.findById.mockRejectedValue(error);
    const next = jest.fn();

    await obtenerProductoPorId({ params: { id: ID } }, mockRes(), next);

    expect(next).toHaveBeenCalledWith(error);
  });
});

describe('productController.actualizarProducto', () => {
  test('actualiza usando new:true y runValidators:true', async () => {
    Product.findByIdAndUpdate.mockResolvedValue({ _id: ID, precio: 500 });
    const res = mockRes();

    await actualizarProducto({ params: { id: ID }, body: { precio: 500 } }, res, jest.fn());

    expect(Product.findByIdAndUpdate).toHaveBeenCalledWith(ID, { precio: 500 }, { new: true, runValidators: true });
    expect(res.json).toHaveBeenCalledWith({ _id: ID, precio: 500 });
  });

  test('solo envía los campos permitidos', async () => {
    Product.findByIdAndUpdate.mockResolvedValue({});

    await actualizarProducto({ params: { id: ID }, body: { stock: 3, creadoPor: 'hack' } }, mockRes(), jest.fn());

    expect(Product.findByIdAndUpdate.mock.calls[0][1]).toEqual({ stock: 3 });
  });

  test('responde 404 si el producto no existe', async () => {
    Product.findByIdAndUpdate.mockResolvedValue(null);
    const res = mockRes();

    await actualizarProducto({ params: { id: ID }, body: { precio: 1 } }, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('pasa el error a next() si falla la actualización', async () => {
    const error = new Error('fallo');
    Product.findByIdAndUpdate.mockRejectedValue(error);
    const next = jest.fn();

    await actualizarProducto({ params: { id: ID }, body: {} }, mockRes(), next);

    expect(next).toHaveBeenCalledWith(error);
  });
});

describe('productController.eliminarProducto', () => {
  test('elimina y confirma con un mensaje', async () => {
    Product.findByIdAndDelete.mockResolvedValue({ _id: ID });
    const res = mockRes();

    await eliminarProducto({ params: { id: ID } }, res, jest.fn());

    expect(Product.findByIdAndDelete).toHaveBeenCalledWith(ID);
    expect(res.json.mock.calls[0][0].message).toBe('Producto eliminado correctamente');
  });

  test('responde 404 si el producto no existe', async () => {
    Product.findByIdAndDelete.mockResolvedValue(null);
    const res = mockRes();

    await eliminarProducto({ params: { id: ID } }, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('pasa el error a next() si falla el borrado', async () => {
    const error = new Error('fallo');
    Product.findByIdAndDelete.mockRejectedValue(error);
    const next = jest.fn();

    await eliminarProducto({ params: { id: ID } }, mockRes(), next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
