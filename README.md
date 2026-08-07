# PetCare Frontend

Frontend responsive de PetCare Home Services construido con Next.js App Router.

## Requisitos

- Node.js 20 o superior.
- El backend NestJS levantado y con sus migraciones ejecutadas.

## Configuración

Por defecto el cliente usa `http://localhost:3005/api`, que es el puerto
predeterminado del backend. Para cambiarlo, crea `.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3005/api
```

## Desarrollo

```bash
npm install
npm run dev
```

Abre `http://localhost:3000`. Puedes crear una cuenta o iniciar sesión desde
`/login`. El backend verifica la contraseña con scrypt y devuelve un JWT; el
frontend lo usa como Bearer token para las solicitudes protegidas. También
puedes registrar una cuenta de proveedor; su panel permite consultar reservas
de clientes y avanzar los estados `confirmed` → `in-progress` → `completed` o
rechazar una reserva.
Para producción conviene reemplazar el almacenamiento local por una cookie
`httpOnly` gestionada por el backend.

## Rutas principales

- `/dashboard`: resumen, servicios y proveedores destacados.
- `/pets`: mascotas y registros de vacunación mediante URL de documento.
- `/providers`: filtros por ciudad y servicio.
- `/providers/:providerId`: perfil y disponibilidad.
- `/bookings/new`: pago simulado y creación de reserva.
- `/bookings`: historial y estados de reservas.
- `/notifications`: confirmaciones y recordatorios del backend.

## Validación

```bash
npm run lint
npm run typecheck
npm run build
```
