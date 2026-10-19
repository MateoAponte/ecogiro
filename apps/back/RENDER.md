# Backend en Render

Configura el servicio web en la misma cuenta y región que Postgres (Oregon), para
usar el hostname interno incluido en `.env.production`. La URL externa es para
clientes fuera de Render y requiere TLS.

Desde la raíz del repositorio:

- Build command: `npm ci --include=dev && npm run build --workspace=apps/back`
- Start command: `npm run start:prod --workspace=apps/back`

En Environment, usa **Add from .env** para importar el archivo local
`apps/back/.env.production`. Está excluido de Git: Render no lo recibirá al clonar
el repositorio. Las variables del servicio tienen prioridad sobre el archivo.
Render puede asignar `PORT`; el backend escucha ese puerto en `0.0.0.0`.

`NODE_ENV=production` (o el alias `prod`) solo carga `.env.production`, nunca
`.env.local` ni `.env.dev`. No subas credenciales al repositorio ni al frontend.

La clave Gemini se copió desde la configuración local. El entorno contiene los
campos DB_HOST, DB_PORT, DB_USER, DB_PASSWORD y DB_NAME que consume TypeORM; no
necesita DATABASE_URL.

Este cambio prepara configuración y arranque; no conecta ni modifica la base
remota. Se conserva el comportamiento existente de `synchronize: true`, que
actualiza las tablas a partir de las entidades cuando arranca el backend.
