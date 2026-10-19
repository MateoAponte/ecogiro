# Backend en Render

Configura el servicio web en la misma cuenta y región que Postgres (Oregon), para
usar el hostname interno incluido en `.env.production`. La URL externa es para
clientes fuera de Render y requiere TLS.

Desde la raíz del repositorio:

- Build command: `npm ci --include=dev && npm run build --workspace=apps/back`
- Start command: `npm run start:prod --workspace=apps/back`

Para estos comandos, deja **Root Directory** vacío en Render. No uses
`node commitlint.config.js` ni `node .` como Start Command: commitlint valida
mensajes de commits y no inicia la API. `npm start` también delega al backend.
Si usas Root Directory `apps/back`, el Start Command es `npm run start:prod`,
sin `--workspace=apps/back`.

En Environment, usa **Add from .env** para importar el archivo local
`apps/back/.env.production`. Está excluido de Git: Render no lo recibirá al clonar
el repositorio. Las variables del servicio tienen prioridad sobre el archivo.
Render puede asignar `PORT`; el backend escucha ese puerto en `0.0.0.0`.

`CORS_ORIGINS` contiene orígenes separados por comas. Para el frontend actual:
`https://ecogiro-1.onrender.com,http://localhost:8080,https://localhost,capacitor://localhost`.
Usa el dominio del frontend (sin rutas), no la URL de la API.
Login es `POST /api/v1/auth/login`, con email/password en JSON.

`NODE_ENV=production` (o el alias `prod`) solo carga `.env.production`, nunca
`.env.local` ni `.env.dev`. No subas credenciales al repositorio ni al frontend.

La clave Gemini se copió desde la configuración local. El entorno contiene los
campos DB_HOST, DB_PORT, DB_USER, DB_PASSWORD y DB_NAME que consume TypeORM; no
necesita DATABASE_URL.

Este cambio prepara configuración y arranque; no conecta ni modifica la base
remota. Se conserva el comportamiento existente de `synchronize: true`, que
actualiza las tablas a partir de las entidades cuando arranca el backend.
