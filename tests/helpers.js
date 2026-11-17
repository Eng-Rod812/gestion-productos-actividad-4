// Utilidades compartidas por las pruebas
const jwt = require('jsonwebtoken');

// Simula los objetos req y res de Express
function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

function tokenValido(id = '64b7f0c2a1b2c3d4e5f60718') {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

module.exports = { mockRes, tokenValido };
