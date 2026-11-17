// Lógica de la vista estática de login.
// Se comunica con la API usando fetch y guarda el token JWT en localStorage.

const vistaAcceso = document.getElementById('vista-acceso');
const vistaSesion = document.getElementById('vista-sesion');
const formLogin = document.getElementById('form-login');
const formRegistro = document.getElementById('form-registro');
const tabLogin = document.getElementById('tab-login');
const tabRegistro = document.getElementById('tab-registro');
const mensaje = document.getElementById('mensaje');
const mensajeProductos = document.getElementById('mensaje-productos');
const tablaProductos = document.getElementById('tabla-productos');
const nombreUsuario = document.getElementById('nombre-usuario');

// ---------- Utilidades ----------

function mostrarMensaje(elemento, texto, tipo) {
  elemento.textContent = texto;
  elemento.className = 'mensaje' + (tipo ? ' ' + tipo : '');
}

function guardarSesion(token, usuario) {
  localStorage.setItem('token', token);
  localStorage.setItem('usuario', JSON.stringify(usuario));
}

function borrarSesion() {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
}

function leerUsuario() {
  try {
    return JSON.parse(localStorage.getItem('usuario'));
  } catch (error) {
    return null;
  }
}

// Llama a la API y devuelve { ok, data }
async function llamarApi(url, opciones) {
  const respuesta = await fetch(url, opciones);
  let data = {};
  try {
    data = await respuesta.json();
  } catch (error) {
    // la respuesta no traía JSON; dejamos data vacío
  }
  return { ok: respuesta.ok, status: respuesta.status, data };
}

// ---------- Cambio de vista según el estado de autenticación ----------

function actualizarVista() {
  const token = localStorage.getItem('token');

  if (token) {
    const usuario = leerUsuario();
    nombreUsuario.textContent = usuario ? usuario.nombre : '';
    vistaAcceso.classList.add('oculto');
    vistaSesion.classList.remove('oculto');
    cargarProductos();
  } else {
    vistaSesion.classList.add('oculto');
    vistaAcceso.classList.remove('oculto');
  }
}

// ---------- Pestañas login / registro ----------

function mostrarFormulario(modo) {
  const esLogin = modo === 'login';
  formLogin.classList.toggle('oculto', !esLogin);
  formRegistro.classList.toggle('oculto', esLogin);
  tabLogin.classList.toggle('activa', esLogin);
  tabRegistro.classList.toggle('activa', !esLogin);
  mostrarMensaje(mensaje, '', '');
}

tabLogin.addEventListener('click', () => mostrarFormulario('login'));
tabRegistro.addEventListener('click', () => mostrarFormulario('registro'));

// ---------- Login ----------

formLogin.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  const boton = formLogin.querySelector('button[type="submit"]');
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  if (!email || !password) {
    mostrarMensaje(mensaje, 'Escribe tu correo y tu contraseña', 'error');
    return;
  }

  boton.disabled = true;
  try {
    const { ok, data } = await llamarApi('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!ok) {
      const detalle = data.errores ? ' ' + data.errores.join('. ') : '';
      mostrarMensaje(mensaje, (data.message || 'No se pudo iniciar sesión') + detalle, 'error');
      return;
    }

    guardarSesion(data.token, data.user);
    formLogin.reset();
    mostrarMensaje(mensaje, '', '');
    actualizarVista();
  } catch (error) {
    mostrarMensaje(mensaje, 'No se pudo conectar con el servidor', 'error');
  } finally {
    boton.disabled = false;
  }
});

// ---------- Registro ----------

formRegistro.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  const boton = formRegistro.querySelector('button[type="submit"]');
  const nombre = document.getElementById('reg-nombre').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;

  boton.disabled = true;
  try {
    const { ok, data } = await llamarApi('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, email, password })
    });

    if (!ok) {
      const detalle = data.errores ? ' ' + data.errores.join('. ') : '';
      mostrarMensaje(mensaje, (data.message || 'No se pudo registrar') + detalle, 'error');
      return;
    }

    formRegistro.reset();
    mostrarFormulario('login');
    document.getElementById('login-email').value = email;
    mostrarMensaje(mensaje, 'Cuenta creada. Ahora inicia sesión.', 'exito');
  } catch (error) {
    mostrarMensaje(mensaje, 'No se pudo conectar con el servidor', 'error');
  } finally {
    boton.disabled = false;
  }
});

// ---------- Productos (ruta protegida: se envía el token en el header) ----------

async function cargarProductos() {
  tablaProductos.innerHTML = '';
  mostrarMensaje(mensajeProductos, 'Cargando productos...', '');

  try {
    const { ok, status, data } = await llamarApi('/api/productos', {
      headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
    });

    // Token vencido o inválido: se cierra la sesión y se vuelve al login
    if (status === 401) {
      borrarSesion();
      actualizarVista();
      mostrarMensaje(mensaje, 'Tu sesión expiró. Inicia sesión de nuevo.', 'error');
      return;
    }

    if (!ok) {
      mostrarMensaje(mensajeProductos, data.message || 'No se pudieron cargar los productos', 'error');
      return;
    }

    if (data.length === 0) {
      mostrarMensaje(mensajeProductos, 'Todavía no hay productos registrados.', '');
      return;
    }

    mostrarMensaje(mensajeProductos, '', '');
    data.forEach((producto) => {
      const fila = document.createElement('tr');
      // textContent (y no innerHTML) para evitar inyectar HTML con datos del usuario
      [producto.nombre, producto.categoria, '$' + Number(producto.precio).toFixed(2), producto.stock].forEach(
        (valor) => {
          const celda = document.createElement('td');
          celda.textContent = valor;
          fila.appendChild(celda);
        }
      );
      tablaProductos.appendChild(fila);
    });
  } catch (error) {
    mostrarMensaje(mensajeProductos, 'No se pudo conectar con el servidor', 'error');
  }
}

// ---------- Cerrar sesión ----------
// Con JWT no hay sesión guardada en el servidor: cerrar sesión = descartar el token.

document.getElementById('btn-logout').addEventListener('click', () => {
  borrarSesion();
  actualizarVista();
  mostrarMensaje(mensaje, 'Sesión cerrada correctamente.', 'exito');
});

// Al cargar la página, decidimos qué vista mostrar
actualizarVista();
