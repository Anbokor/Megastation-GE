# ⚡ Megastation GE - Gaming Enterprise E-Commerce Platform

Plataforma integral de comercio electrónico y gestión omnicanal de inventario para retail de gaming y computación de alto rendimiento (**Megastation Gaming Enterprise**).

---

## 🚀 Características Principales

- **Arquitectura Fullstack Moderna**:
  - **Frontend**: React 19, TypeScript, Tailwind CSS v4, Motion, Lucide Icons, Vite 8.
  - **Backend API**: Express RESTful API, Node.js, JWT, bcrypt.
  - **Base de Datos**: SQLite con modo WAL (Write-Ahead Logging) gestionado mediante **Drizzle ORM** (con esquema preparado para migración transparente a PostgreSQL).
  - **Pasarela de Pagos**: Integración con **Mercado Pago Sandbox** (generación de preferencias de pago y webhooks con idempotencia).
- **Inventario Omnicanal Multi-Sucursal**:
  - Stock independiente por sucursal física (**Belgrano**, **Colegiales**) y Depósito Central (**Central Warehouse**).
  - Movimientos atómicos de stock: Remitos de ingreso de mercadería, transferencias entre sucursales y ajustes de inventario.
  - Prevención estricta en servidor de sobreventa (verificación y reserva atómica de stock en transacción).
- **Seguridad y Control de Acceso (RBAC)**:
  - Roles jerárquicos: `admin`, `seller` (asociado a sucursal), `customer`.
  - Autenticación mediante **JWT** y almacenamiento seguro de contraseñas con **bcryptjs** (salt rounds = 10).
  - Validación de precios en el servidor (el cliente no puede alterar montos en el checkout).
  - Seguimiento de pedidos seguro mediante tokens de rastreo aleatorios (protección total de datos sensibles PII).
- **Rendimiento y Optimización**:
  - Code-splitting con `React.lazy` y `<React.Suspense>`: Los módulos pesados (*Dashboard Administrativo*, *Brandbook*, *Escáner de Códigos de Barra*, *Mapa de Tiendas*) se cargan bajo demanda, reduciendo el bundle inicial en más de un 45%.

---

## 👥 Cuentas de Demostración

El sistema incluye semillas iniciales automáticas (`npm run db:seed`) con las siguientes cuentas preconfiguradas:

| Rol | Correo Electrónico | Contraseña | Sucursal Asignada |
| :--- | :--- | :--- | :--- |
| **Administrador General** | `admin@megastation.com` | `admin123` | Acceso global a todas las sucursales |
| **Vendedor (Belgrano)** | `belgrano@megastation.com` | `belgrano123` | Sucursal Belgrano (Av. Cabildo 2040) |
| **Vendedor (Colegiales)** | `colegiales@megastation.com` | `colegiales123` | Sucursal Colegiales (Av. Federico Lacroze 2850) |
| **Cliente Registrado** | `martin.gomez@gmail.com` | `customer123` | Comprador final |

---

## 🛠️ Requisitos Previos

- **Node.js**: v18.0.0 o superior (recomendado v20 LTS o v22 LTS).
- **npm**: v9.0.0 o superior.
- (Opcional) **Docker** y **Docker Compose** para despliegue en contenedores.

---

## 💻 Instalación y Desarrollo Local

1. **Clonar el repositorio**:
   ```bash
   git clone https://github.com/Anbokor/Megastation-GE.git
   cd Megastation-GE
   ```

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**:
   Copia el archivo de ejemplo o edita `.env`:
   ```ini
   PORT=5000
   JWT_SECRET=tu_clave_secreta_jwt_para_firmar_tokens
   MERCADOPAGO_ACCESS_TOKEN=TEST-tu-access-token-sandbox
   FRONTEND_URL=http://localhost:3000
   ```

4. **Iniciar en modo desarrollo (Frontend + Backend concurrente)**:
   ```bash
   npm run dev:all
   ```
   - Frontend Vite: [http://localhost:3000](http://localhost:3000)
   - Backend API: [http://localhost:5000](http://localhost:5000)

---

## 🧪 Pruebas Automatizadas

El proyecto incluye un runner de pruebas de integración para validar la API REST, autenticación, stock atómico y creación de órdenes:

```bash
npm test
```

Suite de verificaciones ejecutadas:
1. Health check del servidor (`GET /api/health`).
2. Listado y consolidación de productos con stock por sucursal (`GET /api/products`).
3. Rechazo de credenciales inválidas con error 401.
4. Generación de JWT y login exitoso con bcrypt (`POST /api/auth/login`).
5. Rechazo inmediato de pedidos con stock insuficiente (`POST /api/orders`).
6. Creación atómica de órdenes con cálculo seguro de precios en backend.
7. Generación de Checkout Sandbox de Mercado Pago (`POST /api/payments/create-preference`).
8. Seguimiento seguro de pedidos por código único de tracking (`GET /api/orders/track/:code`).
9. Verificación de decremento real de stock en la base de datos SQLite.

---

## 📦 Construcción y Despliegue en Producción

### Opción 1: Despliegue con Node.js / Proceso Nativo

1. Construir la aplicación cliente optimizada:
   ```bash
   npm run build
   ```

2. Iniciar el servidor unificado (Express sirve la API y los estáticos compilados en `dist/`):
   ```bash
   npm run start
   ```
   La aplicación completa estará accesible en `http://localhost:5000`.

---

### Opción 2: Despliegue con Docker Compose

Ejecuta el contenedor listo para producción con un solo comando:

```bash
docker compose up -d --build
```

El servicio iniciará en el puerto `5000` con volumen persistente en `./data` para la base de datos SQLite. Para monitorear la salud del servicio:
```bash
docker compose ps
docker compose logs -f
```

---

## 📁 Estructura del Proyecto

```text
├── data/                    # Base de datos persistente SQLite (megastation.db)
├── server/                  # Código fuente del Backend Express
│   ├── db/
│   │   ├── index.ts         # Conexión better-sqlite3 y Drizzle ORM
│   │   ├── schema.ts        # Esquema relacional Drizzle
│   │   └── seed.ts          # Datos iniciales y hash bcrypt
│   ├── middleware/
│   │   └── auth.ts          # Middleware de verificación JWT y roles
│   ├── routes/
│   │   ├── auth.ts          # Endpoints de login y perfil
│   │   ├── branches.ts      # Endpoints de sucursales
│   │   ├── inventory.ts     # Remitos, transferencias y ajustes de stock
│   │   ├── orders.ts        # Creación atómica y tracking de órdenes
│   │   ├── payments.ts      # Mercado Pago Sandbox & Webhooks
│   │   └── products.ts      # Catálogo con stock por sucursal
│   ├── index.ts             # Servidor Express principal
│   └── test-api.ts          # Suite de pruebas automatizadas
├── src/                     # Código fuente del Frontend React
│   ├── api/
│   │   └── client.ts        # Cliente API fuertemente tipado
│   ├── components/          # Componentes de UI (Catálogo, Checkout, Admin, Modales)
│   ├── data/                # Datos de fallback y utilidades
│   ├── types.ts             # Tipos e interfaces TypeScript del dominio
│   ├── App.tsx              # Componente raíz con control de estado y banners
│   └── main.tsx             # Punto de entrada Vite/React
├── Dockerfile               # Configuración multi-stage Docker
├── docker-compose.yml       # Orquestación de contenedores
├── vite.config.ts           # Configuración de Vite y plugins
└── package.json             # Scripts y dependencias del proyecto
```

---

## 🗺️ Hoja de Ruta Futura (Post-Lanzamiento)

- [ ] **Migración a PostgreSQL**: Reemplazar el driver `better-sqlite3` por `pg`/`node-postgres` en `server/db/index.ts` una vez desplegado en infraestructura de nube con base de datos administrada.
- [ ] **Asistente Virtual con IA**: Integración opcional de agente conversacional para asesoramiento técnico y compatibilidad de componentes PC.
- [ ] **Mercado Pago Producción**: Migración de credenciales de prueba Sandbox a credenciales productivas con validación de firma HMAC de webhooks.

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.
