# Docker & Docker Compose Guide

## Quick Start

### Build and run all services:

```bash
docker-compose up --build
```

### Run in detached mode (background):

```bash
docker-compose up -d --build
```

### Stop all services:

```bash
docker-compose down
```

### Stop and remove all data:

```bash
docker-compose down -v
```

---

## Services

### 1. **Database (PostgreSQL)**

- **Container**: `mtt-pokeapi-db`
- **Port**: `5432`
- **Access**:
  - From backend: `db:5432` (Docker network)
  - From host machine: `localhost:5432`
- **Default Credentials**:
  - User: `postgres`
  - Password: `postgres`
  - Database: `template_db`

### 2. **Backend (NestJS API)**

- **Container**: `mtt-pokeapi-back`
- **Port**: `3000` (exposed to host)
- **URL**: `http://localhost:3000`
- **Features**:
  - Auto-connects to PostgreSQL via `db` hostname
  - Waits for database to be ready (healthcheck)
  - Hot reload in dev mode (if configured)

### 3. **Frontend (Nginx)**

- **Container**: `mtt-pokeapi-front`
- **Port**: `80` (exposed to host)
- **URL**: `http://localhost`
- **Features**:
  - Serves static files from `/usr/share/nginx/html`
  - Proxies `/api/` requests to backend
  - Redirects to index.html for SPA routing

---

## Environment Variables

### Customize via `.env.docker` file:

```bash
NODE_ENV=dev
DB_USER=postgres
DB_PASSWORD=mysecurepassword
DB_NAME=my_database
JWT_SECRET=your-jwt-secret-here
```

Then run:

```bash
docker-compose --env-file .env.docker up -d
```

---

## Common Commands

### View logs:

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f back
docker-compose logs -f db
docker-compose logs -f front
```

### Execute commands inside container:

```bash
# Backend (NestJS CLI)
docker-compose exec back npm run build

# Database (PostgreSQL CLI)
docker-compose exec db psql -U postgres -d template_db
```

### Rebuild a single service:

```bash
docker-compose up -d --build back
```

---

## Troubleshooting

### Database won't start:

```bash
# Check logs
docker-compose logs db

# Reset volume
docker-compose down -v
docker-compose up -d
```

### Backend connection fails:

- Ensure `db` service is healthy: `docker-compose ps`
- Check backend logs: `docker-compose logs back`
- Verify env vars are set correctly

### Frontend doesn't proxy to API:

- Check Nginx config: `apps/front/nginx.conf`
- Ensure backend port is correct in docker-compose.yml
- Check Nginx logs: `docker-compose logs front`

---

## Development Notes

- **Database persistence**: Data is stored in the `postgres_data` volume
- **Network**: All services communicate via the `template-network` bridge
- **Health checks**: Backend waits for DB to be ready before starting
- **Auto-restart**: Services restart on failure (unless stopped manually)
