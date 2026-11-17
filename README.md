# Gestión de productos – Actividad 4 (Desarrollo Full Stack)

Aplicación web con Node.js, Express, MongoDB (Mongoose), autenticación JWT y pruebas con Jest.
Los usuarios se registran, inician sesión y, autenticados, hacen CRUD de productos.

La documentación del proyecto se adjunta en el archivo Word de la entrega.

## Estructura

```
api/index.js            Entrada para Vercel (serverless)
server.js               Entrada para ejecutar en local
src/app.js              App de Express (middlewares y rutas)
src/config/db.js        Conexión a MongoDB
src/models/             User.js, Product.js (Mongoose)
src/controllers/        authController.js, productController.js
src/routes/             authRoutes.js, productRoutes.js
src/middlewares/        authMiddleware (JWT), validators, errorMiddleware
public/                 Vista estática de login (HTML, CSS, JS)
tests/                  Pruebas con Jest
.github/workflows/ci.yml  Pipeline CI/CD (GitHub Actions)
```

## Cómo ejecutarla en local

Requisitos: Node.js 18 o superior y una base de datos en MongoDB Atlas.

1. Instalar dependencias: `npm install`
2. Copiar `.env.example` como `.env` y llenar `MONGODB_URI` y `JWT_SECRET`.
3. En Atlas, permitir tu IP en *Network Access*.
4. Iniciar: `npm start` (o `npm run dev` para reinicio automático).
5. Abrir `http://localhost:3000` (redirige a la vista de login).

## Endpoints

| Método | Ruta | Token | Descripción |
|---|---|---|---|
| POST | `/api/auth/register` | No | Registrar usuario `{nombre, email, password}` |
| POST | `/api/auth/login` | No | Iniciar sesión `{email, password}` → devuelve `token` |
| POST | `/api/productos` | Sí | Crear producto `{nombre, precio, descripcion?, stock?, categoria?}` |
| GET | `/api/productos` | Sí | Listar productos |
| GET | `/api/productos/:id` | Sí | Obtener un producto |
| PUT | `/api/productos/:id` | Sí | Actualizar un producto |
| DELETE | `/api/productos/:id` | Sí | Eliminar un producto |

El token se envía en el header `Authorization: Bearer <token>`.
Códigos usados: 200, 201, 400 (datos inválidos), 401 (sin token / credenciales inválidas), 404, 409 (correo repetido), 500.

## Pruebas unitarias

`npm test` ejecuta Jest; `npm run test:coverage` muestra la cobertura.
Los modelos de Mongoose y la conexión se simulan (mocks), por lo que las pruebas no necesitan base de datos.
Las pruebas iniciales se generaron con apoyo de una herramienta de IA a partir del código y después se revisaron y ajustaron manualmente para cubrir los casos del proyecto (validaciones, errores 400/401/404/409/500, campos no permitidos, token vencido, etc.).

## Despliegue (Vercel + GitHub Actions)

1. En MongoDB Atlas, *Network Access* → permitir `0.0.0.0/0` (Vercel usa IPs dinámicas).
2. Importar el repositorio en Vercel (o `vercel link` en local).
3. En Vercel → *Settings → Environment Variables*: agregar `MONGODB_URI` y `JWT_SECRET`.
4. En GitHub → *Settings → Secrets and variables → Actions*: agregar `VERCEL_TOKEN`, `VERCEL_ORG_ID` y `VERCEL_PROJECT_ID`.
5. Cada push a `main` ejecuta `.github/workflows/ci.yml`: primero las pruebas y, si pasan, el despliegue a producción.
