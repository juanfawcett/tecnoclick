
# TecnoClick

Marketplace **sencillo** con checkout como invitado o usuario registrado, cupones, descuentos por cantidad, reseñas, favoritos, comparador, **Plan Separe**, módulo administrador y más.

> Este proyecto está pensado como base de referencia educativa y demo funcional. No es para producción sin antes auditar seguridad, rendimiento y cumplimiento normativo (PCI, facturación, protección de datos, etc.).

## Requisitos
- Node.js 18+
- npm

## Inicio rápido
```bash
cp .env.example .env
npm install
npm run migrate
npm run seed
npm start
# Abre http://localhost:3000
```

### Usuarios de prueba
- Admin: **admin@tecnoclick.com** / **Admin123!**
- Usuario: **user@tecnoclick.com** / **User123!**

## Estructura
- `server.js` – servidor Express que sirve API + SPA.
- `src/db` – esquema SQLite + migraciones y datos de ejemplo.
- `src/routes` – endpoints REST (auth, productos, carrito, pedidos, pagos, admin, etc.).
- `src/services` – lógica de negocio (precios, cupones, notificaciones, PDF, etc.).
- `public/` – SPA vanilla JS (sin build), estilos, assets y **MockPay** (pasarela simulada).

## Características clave incluidas
- Registro, login (JWT en cookie httpOnly), perfil editable.
- Catálogo, búsqueda, comparador, favoritos, reseñas.
- Carrito con **descuentos por cantidad** y **cupones**.
- Checkout invitado o usuario; validación de stock.
- Cotizaciones (PDF), órdenes, estados y notificaciones (archivos).
- Facturación electrónica **simulada** (PDF).
- Pagos simulados: PSE, tarjetas débito/crédito y billeteras (MockPay).
- **Plan Separe** (solo usuarios): abono + cuotas; se envía al 100% pago.
- Estrategia antifraude básica (score) y límites de tasa.
- Reportes contables/ventas simples (JSON + CSV).
- Admin: crear/editar/desactivar productos, gestionar cupones y descuentos.
- Integraciones **stub** con ERP/WMS/transportadoras.
- Tracking de comportamiento y **Conversion Rate** (funnel simple).

> La facturación y las integraciones son simuladas/stub para fines de demo. Ajusta según tus requisitos reales.

## Notas de seguridad y cumplimiento
- No almacena tarjetas. **MockPay** solo simula flujos de pago.
- Agrega HTTPS, CSP estricta, validación de entradas y auditoría antes de producción.

¡Disfruta! — *TecnoClick*


## Frontend React (Vite + Bootstrap)

Este proyecto ahora incluye un **frontend moderno en React** (Vite + Bootstrap) guiado por componentes.

### Desarrollo (dos servidores)
- Backend (API + MockPay):

  ```bash
  npm start
  ```
  Sirve la API en http://localhost:3000
- Frontend (React):

  ```bash
  cd client
  npm install
  npm run dev
  ```
  Se abrirá en http://localhost:5173 con **proxy** a `/api` y `/mockpay` hacia el puerto 3000.

### Producción (build y servir desde Express)
```bash
cd client
npm install
npm run build
cd ..
npm start
```
Si existe `client/dist`, Express lo servirá como frontend por defecto (fallback a `/public` si no existe).

> Nota: Se eliminó la necesidad de `node-fetch` en `src/routes/integrations.js`. Ahora usa `fetch` nativo de Node.js 18+ (no requiere instalación).
