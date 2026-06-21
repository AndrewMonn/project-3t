# Aplicación Web Comunal

**Comuna Una Sola Fuerza — Consejo Comunal Reina La Cruz**

Plataforma web para la gestión administrativa de la comunidad. Permite el registro de familias, control de censo, gestión de solicitudes de beneficios (CLAP, Gas, Proteína, Medicamentos), seguimiento de pagos, publicación de noticias y generación de reportes.

Proyecto académico — UNETI PNFII S6A Equipo 9.

---

## Tecnologías

- **Framework:** Next.js 16 (App Router)
- **Lenguaje:** TypeScript estricto
- **Frontend:** React 19, Tailwind CSS 4
- **Backend:** API Routes (Next.js), Mongoose 9
- **Base de datos:** MongoDB (Atlas + local)
- **Autenticación:** JWT + bcrypt + reCAPTCHA v2
- **Estilo:** Glassmorphism (dark theme, backdrop-blur)
- **Tipografía:** Manrope
- **PDF:** @libpdf/core
- **Icons:** SVG inline / Lucide-React

---

## Estructura del Proyecto

```
├── app/
│   ├── (purpose)/                # Rutas públicas agrupadas
│   │   ├── consultas/            # Consulta de estatus de solicitudes
│   │   └── solicitudes/          # Registro de solicitudes
│   ├── (sesion-dashboard)/       # Rutas protegidas
│   │   ├── dashboard/            # Panel de administración (SPA)
│   │   │   └── components/       # Paneles modulares del dashboard
│   │   └── login/                # Inicio de sesión
│   ├── acerca-de/                # Página informativa
│   ├── api/                      # API Routes (18 namespaces)
│   │   ├── auth/                 # login, register
│   │   ├── audit/                # logins (historial de accesos)
│   │   ├── blog/                 # CRUD de posts
│   │   ├── comprobantes/         # Comprobantes de pago
│   │   ├── entregas/             # Solicitudes/entregas
│   │   ├── familias/             # CRUD de familias
│   │   ├── jornadas/             # Jornadas de beneficios
│   │   ├── public/               # Endpoints públicos
│   │   ├── reportes/             # Reportes y estadísticas
│   │   ├── sectores/             # Sectores de la comunidad
│   │   └── users/                # Usuarios del sistema
│   ├── blog/                     # Blog público
│   └── components/               # Componentes compartidos
│       ├── NavBasic.tsx
│       └── NavBurger.tsx
├── lib/
│   ├── auth.ts                   # JWT, bcrypt, middlewares
│   ├── captcha.ts                # reCAPTCHA + getClientIp
│   └── mongodb.ts                # Conexión MongoDB (singleton)
├── models/
│   ├── User.ts                   # Usuarios del sistema
│   ├── Familia.ts                # Familias beneficiarias
│   ├── Sector.ts                 # Sectores geográficos
│   ├── Jornada.ts                # Jornadas de beneficios
│   ├── Entrega.ts                # Solicitudes y entregas
│   ├── ComprobantePago.ts        # Comprobantes de pago
│   ├── Post.ts                   # Posts del blog
│   └── LoginAudit.ts             # Auditoría de inicios de sesión
├── public/                       # Archivos estáticos
├── postman/                      # Colección Postman para testing
└── stch_p/                       # Documentación de diseño (PRD + Design System)
```

---

## Modelos de Datos

### Usuario (`User`)
| Campo | Tipo | Detalle |
|-------|------|---------|
| name | string | Obligatorio |
| email | string | Único, minúsculas |
| password | string | Hasheado con bcrypt, no se devuelve por defecto |
| role | enum | `administrador` o `vocero` |

### Familia (`Familia`)
| Campo | Tipo | Detalle |
|-------|------|---------|
| jefeDeHogar | objeto | nombre, cédula (única), teléfono |
| integrantes | array[] | nombre, edad, parentesco |
| direccion | objeto | calle, nroCasa, referencia |
| sector | ObjectId | Referencia a Sector |
| esVulnerable | boolean | Indica si la familia es vulnerable |
| condicionesEspeciales | string | Descripción opcional |

### Sector (`Sector`)
| Campo | Tipo | Detalle |
|-------|------|---------|
| name | string | Único |
| calles | string[] | Calles del sector |

### Jornada (`Jornada`)
| Campo | Tipo | Detalle |
|-------|------|---------|
| tipo | enum | CLAP, Gas, Proteína, Medicamentos, Otro |
| fechaJornada | Date | Fecha del beneficio |
| costo | number | Costo del beneficio |
| estado | enum | activo, cerrado |

### Entrega / Solicitud (`Entrega`)
| Campo | Tipo | Detalle |
|-------|------|---------|
| familiaId | ObjectId | Referencia a Familia |
| jornadaId | ObjectId | Opcional (para tipo beneficio) |
| tipoSolicitud | enum | beneficio, otra |
| asunto | string | Para solicitudes de tipo "otra" |
| estadoPago | enum | pendiente, pagado, verificado |
| montoPagado | number | Monto registrado |
| confirmacionEntrega | boolean | Confirmación de entrega física |
| historial | array[] | Línea de tiempo con cambios de estado y comentarios |

### Comprobante de Pago (`ComprobantePago`)
| Campo | Tipo | Detalle |
|-------|------|---------|
| familiaId | ObjectId | Referencia a Familia |
| jornadaId | ObjectId | Referencia a Jornada |
| fechaPago | Date | Fecha del pago |
| referencia | string | Referencia del pago |
| imagen | string | Imagen en Base64 del comprobante |
| estadoVerificacion | enum | pendiente, aprobado, rechazado |

### Post (`Post`)
| Campo | Tipo | Detalle |
|-------|------|---------|
| titulo | string | Máximo 200 caracteres |
| contenido | string | Contenido del post |
| autor | ObjectId | Referencia a Usuario |
| imagenPortada | string | URL de imagen |
| tags | string[] | Etiquetas del post |
| slug | string | Único, auto-generado |

### LoginAudit (`LoginAudit`)
| Campo | Tipo | Detalle |
|-------|------|---------|
| userId | ObjectId | Null si el login falló |
| email | string | Email del intento |
| ip | string | IP del cliente |
| userAgent | string | Navegador/dispositivo |
| exitoso | boolean | True si el login fue exitoso |
| motivoFallo | string | credenciales, captcha, cuenta_bloqueada |
| esPrimeraIpParaUsuario | boolean | True si es nueva IP para el usuario |
| createdAt | Date | Auto TTL a 1 año |

---

## API Routes

### Públicas (sin autenticación)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/public/jornadas` | Lista de jornadas activas |
| GET | `/api/public/familias` | Búsqueda de familias por cédula |
| GET | `/api/public/entregas` | Consulta de entregas por familia |
| POST | `/api/public/entregas` | Registrar nueva solicitud |
| GET | `/api/blog` | Lista de posts del blog |
| GET | `/api/blog/[id]` | Detalle de un post |

### Autenticación

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/auth/login` | — | Inicio de sesión (con reCAPTCHA) |
| POST | `/api/auth/register` | admin | Registrar nuevo usuario |

### Protegidas (requieren token JWT)

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| GET | `/api/users` | admin | Lista de usuarios |
| GET | `/api/familias` | auth | Lista de familias |
| POST | `/api/familias` | auth | Crear familia |
| GET/PUT/DELETE | `/api/familias/[id]` | auth | CRUD de familia |
| GET | `/api/sectores` | auth | Lista de sectores |
| GET/POST | `/api/jornadas` | auth/vocero | Listar/crear jornadas |
| GET/PUT/DELETE | `/api/jornadas/[id]` | auth | CRUD de jornada |
| GET/POST | `/api/entregas` | auth/vocero | Listar/crear entregas |
| PATCH | `/api/entregas/[id]` | auth | Actualizar estado + comentario |
| PUT | `/api/entregas/[id]/confirmar` | auth | Confirmar entrega física |
| POST | `/api/comprobantes` | auth/vocero | Subir comprobante |
| GET | `/api/comprobantes` | auth/vocero | Listar comprobantes |
| PUT | `/api/comprobantes/[id]/verificar` | admin | Verificar/rechazar comprobante |
| GET | `/api/comprobantes/[id]/imagen` | auth/vocero | Ver imagen del comprobante |
| GET/POST | `/api/blog` | auth/vocero | CRUD de posts |
| GET/PUT/DELETE | `/api/blog/[id]` | auth/vocero | CRUD de posts |
| GET | `/api/reportes/cobertura` | auth/vocero | Reporte de cobertura |
| GET | `/api/reportes/listado-pdf` | auth/vocero | Datos para PDF |
| GET | `/api/audit/logins` | admin | Auditoría de accesos |

---

## Panel de Administración (Dashboard)

El dashboard es una SPA accesible en `/dashboard` con los siguientes módulos:

| Módulo | Visibilidad | Descripción |
|--------|-------------|-------------|
| Usuarios | Admin | Tabla de usuarios + registro de nuevos |
| Censo | Admin, Vocero | CRUD de familias, agrupado por sector |
| Blog | Admin, Vocero | Editor de blog con vista previa en vivo |
| Solicitudes | Admin, Vocero | Gestión de solicitudes, cambio de estado, línea de tiempo |
| Reportes | Admin | KPIs, tabla histórica, generación de PDF |
| Auditoría de Accesos | Admin | Historial de inicios de sesión con IP y filtros |

---

## Variables de Entorno

Crear un archivo `.env` en la raíz del proyecto:

```env
PORT=5000
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/comuna_una_sola_fuerza
JWT_SECRET=tu_clave_secreta_jwt
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=tu_site_key_de_google_recaptcha
RECAPTCHA_SECRET_KEY=tu_secret_key_de_google_recaptcha
```

---

## Instalación y Ejecución

```bash
# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Compilar para producción
npm run build

# Iniciar servidor de producción
npm start
```

El servidor se inicia en `http://localhost:5000` (o el puerto configurado en `PORT`).

---

## Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo con recarga en caliente |
| `npm run build` | Compilación optimizada para producción |
| `npm start` | Iniciar servidor de producción |
| `npm run lint` | Análisis estático de código (ESLint) |

---

## Autenticación y Seguridad

- **JWT** con expiración de 7 días almacenado en localStorage/sessionStorage
- **Contraseñas** hasheadas con bcrypt (salt rounds: 12)
- **reCAPTCHA v2** en el formulario de inicio de sesión
- **Roles**: `administrador` (acceso completo) y `vocero` (acceso limitado)
- **Auditoría**: cada intento de inicio de sesión se registra con IP, user-agent y resultado
- **Middleware** de autenticación por ruta via `withAuth()` y `withRole()`

---

## Diseño

Basado en el sistema de diseño **Aetheric Community** (glassmorphism):

- **Esquema de colores:** Fondo oscuro (`#0f1418`), acento azul cielo (`#0ea5e9`)
- **Efectos:** Semitransparencia con `backdrop-blur`, bordes sutiles (`1px white/10`)
- **Tipografía:** Manrope (700 headlines, 400 body, 600 labels)
- **Tarjetas:** `bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl`
- **Responsive:** Mobile-first con sidebar adaptable

Documentación completa de diseño en `stch_p/aetheric_community/DESIGN.md`.

---

## Testing con Postman

Se incluye una colección de Postman en `postman/comuna-api.postman_collection.json` con:

- Variables de entorno preconfiguradas
- Script de autenticación automática (almacena y reusa el token JWT)
- Tests para todos los endpoints

Ver `postman/README.md` para instrucciones detalladas.

---

## Licencia

Proyecto académico — UNETI PNFII S6A Equipo 9.
