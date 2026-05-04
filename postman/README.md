Comuna API — Documentación para integración frontend
===================================================

Propósito
--------

Este repositorio contiene el backend de la "Comuna": una API REST/HTTP (implementada con Next.js App Router) y una base de datos MongoDB para gestionar jornadas (CLAP, Gas, Proteína, etc.), familias beneficiarias, comprobantes de pago, entregas físicas, publicaciones de blog y reportes agregados.

Arquitectura y stack
--------------------

- Framework: Next.js (App Router) — endpoints bajo `app/api/...`.
- Base de datos: MongoDB (conexión en `lib/mongodb.ts`).
- Autenticación: JWT con roles (`administrador`, `vocero`) — ver `lib/auth.ts`.
- ORM: Mongoose — modelos en `models/`.

Archivos clave
-------------

- **Conexión DB**: [lib/mongodb.ts](lib/mongodb.ts)
- **Autenticación**: [lib/auth.ts](lib/auth.ts)
- **Modelos**: [models/User.ts](models/User.ts), [models/Familia.ts](models/Familia.ts), [models/Jornada.ts](models/Jornada.ts), [models/Entrega.ts](models/Entrega.ts), [models/ComprobantePago.ts](models/ComprobantePago.ts), [models/Post.ts](models/Post.ts), [models/Sector.ts](models/Sector.ts)
- **Rutas**: todos los endpoints están bajo `app/api/` (ej.: `app/api/familias`, `app/api/jornadas`, etc.).

Variables de entorno
---------------------

Configura al menos estas variables antes de ejecutar el backend:

```
MONGODB_URI=mongodb://localhost:27017/comuna_una_sola_fuerza
JWT_SECRET=andrés-cambia-esto
# (opcional) PORT=3000
```

Cómo arrancar (local)
---------------------

Los comandos dependen del gestor de paquetes que uses. Comandos típicos:

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo (Next.js)
npm run dev

# Construir y ejecutar (producción)
npm run build
npm start
```
Resumen de funcionalidad
------------------------

- Gestión de usuarios con roles (`administrador`, `vocero`).
- CRUD de `Jornadas` (tipo, fecha, costo, estado).
- Registro y búsqueda de `Familias` (jefe de hogar, integrantes, dirección, sector).
- Subida y verificación de `ComprobantePago` (archivo + metadatos).
- Registro y confirmación de `Entrega` (estadoPago, confirmación física).
- Publicaciones de blog (crear, listar, editar, borrar).
- Reportes de cobertura y listado para PDF.

Endpoints principales (resumen)
-----------------------------

- **Auth**: POST `/api/auth/login` — Login y obtención de token JWT.
- **Auth**: POST `/api/auth/register` — Crear usuario (requiere rol `administrador`).
- **Blog**: GET `/api/blog`, POST `/api/blog`, GET/PUT/DELETE `/api/blog/:id`.
- **Comprobantes**: POST `/api/comprobantes` (form-data + archivo), GET `/api/comprobantes`, PUT `/api/comprobantes/:id/verificar`.
- **Entregas**: GET `/api/entregas`, POST `/api/entregas`, PUT `/api/entregas/:id/confirmar`.
- **Familias**: GET `/api/familias`, POST `/api/familias`, GET/PUT/DELETE `/api/familias/:id`.
- **Jornadas**: GET `/api/jornadas`, POST `/api/jornadas`, GET/PUT/DELETE `/api/jornadas/:id`.
- **Reportes**: GET `/api/reportes/cobertura`, GET `/api/reportes/listado-pdf`.
- **Usuarios (admin)**: GET `/api/users`.

Autenticación y autorización
----------------------------

- Los endpoints protegidos esperan el header `Authorization: Bearer <token>`.
- El token se obtiene con `POST /api/auth/login` y contiene `userId`, `email` y `role`.

Colección Postman incluida y cómo usarla
---------------------------------------

He añadido una colección para Postman con requests y ejemplos mock:

- Archivo: [postman/comuna-api.postman_collection.json](postman/comuna-api.postman_collection.json)

Pasos recomendados al integrar desde el frontend:

1. Importa la colección en Postman.
2. Ajusta la variable de colección `baseUrl` si el servidor no corre en `http://localhost:3000`.
3. Ejecuta `Auth -> Login` con un usuario válido; el test guarda `jwtToken` en variables de colección.
4. Crea datos de soporte en el siguiente orden (la colección contiene requests para estos pasos):
   - `Jornadas -> Create jornada` → guarda `jornadaId`.
   - `Familias -> Create familia` → guarda `familiaId` (necesitas `sectorId` válido, ver nota).
   - `Comprobantes -> Upload comprobante (form-data)` → sube el archivo y guarda `comprobanteId`.
   - `Comprobantes -> Verify comprobante` → aprueba/rechaza el comprobante.
   - `Entregas -> Create entrega` y luego `Entregas -> Confirm entrega`.

Notas sobre la colección
-----------------------

- `POST /api/comprobantes` requiere `form-data` y un campo `comprobante` tipo `file`. En Postman selecciona un archivo local para ese campo (permitidos: JPG, PNG, WEBP; máximo 5MB).
- La colección incluye scripts de `test` que guardan IDs (p. ej. `jornadaId`, `familiaId`) en variables de colección. Si prefieres control manual, borra esas acciones desde Postman.
- No hay endpoints públicos para `Sector` en la colección: si tu `Create familia` falla por falta de `sectorId`, crea un `Sector` directamente en la DB o dime y lo añado a la colección.

Crear un usuario administrador (si hace falta)
-------------------------------------------

1) Si ya existe un admin: usa `POST /api/auth/register` autenticado.

2) Si no existe admin y necesitas crear uno manualmente (método rápido):

   - En Node repl, genera un hash bcrypt:

   ```js
   const bcrypt = require('bcryptjs');
   bcrypt.hash('password123', 12).then(hash => console.log(hash));
   ```

   - Inserta en la colección `users` un documento con `role: 'administrador'` y `password` con el hash generado.

Si quieres, puedo añadir un pequeño script `scripts/seedAdmin.js` que conecta a la DB y crea un admin inicial.

Ejemplos rápidos (cURL)
----------------------

# Login
```bash
curl -X POST {{baseUrl}}/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.com","password":"password123"}'
```

# Crear jornada (con token)
```bash
curl -X POST {{baseUrl}}/api/jornadas \
  -H "Authorization: Bearer <TOKEN>" \
  -H 'Content-Type: application/json' \
  -d '{"tipo":"CLAP","fechaJornada":"2026-06-01","costo":1000}'
```

Puntos de atención y debugging
-------------------------------

- Errores 401/403: revisa `JWT_SECRET` y que el token sea válido. Asegúrate de enviar el header `Authorization` correctamente.
- Errores de subida de archivos: revisa tamaño (<=5MB) y formato; verifica que `public/uploads/comprobantes` exista y tenga permisos de escritura.
- Si alguna request devuelve `409` (duplicado), revisa los campos `unique` (email, cédula, slug de post).

¿Quieres que prepare algo más?
---------------------------

- Puedo generar un `Environment` de Postman con variables iniciales (`baseUrl`, `sectorId` mock, etc.) y añadirlo en `postman/`.
- Puedo añadir un `README.md` en la raíz del repo con un resumen breve y pasos de despliegue.

Archivo de la colección: [postman/comuna-api.postman_collection.json](postman/comuna-api.postman_collection.json)
