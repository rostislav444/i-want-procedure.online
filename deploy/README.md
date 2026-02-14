# Deployment Guide

This document describes the deployment process for the Procedure application.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Initial Server Setup](#initial-server-setup)
- [Deployment Process](#deployment-process)
- [Troubleshooting](#troubleshooting)
- [Rollback Procedure](#rollback-procedure)

## Overview

The application uses a single-threaded deployment system with Docker Compose. All deployments happen in `/var/www/procedure` and are managed through the `deploy/deploy.sh` script.

**Production Stack:**
- Backend API (FastAPI + Gunicorn)
- PostgreSQL 15 database
- Redis cache
- Frontend (Next.js)
- Nginx reverse proxy with SSL
- Two Telegram bots (client & doctor)
- Dozzle log viewer

## Prerequisites

### Server Requirements

- Ubuntu 20.04+ or Debian 11+
- Docker 20.10+
- Docker Compose v2+
- Git
- At least 10GB free disk space
- Domain pointing to server IP

### Required Files

1. **Backend Environment File** (`backend/.env`)
   - Must be created manually on the server
   - NOT tracked in git for security
   - Copy from `backend/.env.example` and update values

2. **SSL Certificates**
   - Located in `certbot/letsencrypt/live/`
   - Generated during initial setup with `./deploy/deploy.sh setup`

3. **Nginx Configuration**
   - `deploy/nginx.conf` - Main production config
   - `deploy/nginx.certbot.conf` - Initial setup config (HTTP only)

## Initial Server Setup

### 1. Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Verify installation
docker --version
docker compose version
```

### 2. Clone Repository

```bash
# Create directory
sudo mkdir -p /var/www
cd /var/www

# Clone repository
sudo git clone https://github.com/rostislav444/i-want-procedure.online.git procedure
cd procedure
```

### 3. Create Environment File

```bash
# Copy example
sudo cp backend/.env.example backend/.env

# Edit with production values
sudo nano backend/.env
```

**Required environment variables:**

```bash
# Database
DATABASE_URL=postgresql+asyncpg://postgres:postgres@db:5432/procedure
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<strong-password>
POSTGRES_DB=procedure

# JWT
SECRET_KEY=<generate-strong-secret>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# Telegram Bots
CLIENT_BOT_TOKEN=<your-client-bot-token>
CLIENT_BOT_NAME=i_want_procedure_bot
DOCTOR_BOT_TOKEN=<your-doctor-bot-token>
DOCTOR_BOT_NAME=doctor_i_want_procedure_bot

# Google OAuth
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
GOOGLE_REDIRECT_URI=https://i-want-procedure.online/api/v1/auth/google/callback

# API & Frontend
API_URL=https://i-want-procedure.online
FRONTEND_URL=https://i-want-procedure.online

# CORS
CORS_ORIGINS=["https://i-want-procedure.online"]

# Redis
REDIS_URL=redis://redis:6379/0

# Debug
DEBUG=False
```

### 4. Run Initial Setup

```bash
# Make deploy script executable
chmod +x deploy/deploy.sh

# Run setup (generates SSL certificates)
sudo ./deploy/deploy.sh setup i-want-procedure.online admin@i-want-procedure.online
```

This will:
1. Create Docker network and volumes
2. Build all images
3. Start services with HTTP-only nginx
4. Generate SSL certificates via Let's Encrypt
5. Switch to HTTPS configuration
6. Run database migrations
7. Start all services

### 5. Verify Deployment

```bash
# Check container status
docker ps

# Should show 8 running containers:
# - procedure_db
# - procedure_redis
# - procedure_api
# - procedure_client_bot
# - procedure_doctor_bot
# - procedure_dozzle
# - procedure_frontend
# - procedure_nginx

# Check site is accessible
curl -I https://i-want-procedure.online

# View logs
sudo ./deploy/deploy.sh logs
```

## Deployment Process

### Automated Deployment (GitHub Actions)

Every push to `main` branch triggers automatic deployment:

1. GitHub Actions connects to server via SSH
2. Runs `./deploy/deploy.sh deploy`
3. Deployment completes in ~5-10 minutes

**Required GitHub Secrets:**

- `SERVER_HOST` - Server IP address (e.g., 46.62.170.230)
- `SERVER_USER` - SSH user (e.g., root)
- `SERVER_SSH_KEY` - Private SSH key for authentication
- `SERVER_PORT` - SSH port (optional, defaults to 22)

### Manual Deployment

Connect to server and run:

```bash
cd /var/www/procedure
sudo ./deploy/deploy.sh deploy
```

**Deployment Steps:**

1. **Health Check** - Verify Docker is running, check disk space
2. **Environment Validation** - Verify required files exist
3. **Network & Volumes** - Create if missing
4. **Pull Code** - `git fetch && git reset --hard origin/main`
5. **Build Images** - Build all Docker images from scratch
6. **Stop Containers** - Stop and remove old containers
7. **Cleanup** - Remove unused Docker images
8. **Migrations** - Run database migrations
9. **Start Services** - Start all containers

### Other Commands

```bash
# Quick restart (no rebuild)
./deploy/deploy.sh restart

# Rebuild and restart (with migrations)
./deploy/deploy.sh rebuild

# Run migrations only
./deploy/deploy.sh migrate

# View logs (all services)
./deploy/deploy.sh logs

# View logs (specific service)
./deploy/deploy.sh logs api
./deploy/deploy.sh logs frontend
./deploy/deploy.sh logs nginx

# Show container status
./deploy/deploy.sh status

# Stop all containers
./deploy/deploy.sh stop
```

## Troubleshooting

### Container Name Conflicts

**Error:**
```
Error: The container name "/procedure_api" is already in use
```

**Solution:**
```bash
# Force remove all procedure containers
docker ps -a | grep procedure | awk '{print $1}' | xargs -r docker rm -f

# Re-run deployment
./deploy/deploy.sh deploy
```

### Missing External Volumes

**Error:**
```
Error: volume procedure_static_data declared as external, but could not be found
```

**Solution:**
```bash
# Create missing volumes
docker volume create procedure_postgres_data
docker volume create procedure_redis_data
docker volume create procedure_static_data

# Re-run deployment
./deploy/deploy.sh deploy
```

### Missing .env File

**Error:**
```
[ERROR] Missing backend/.env file!
```

**Solution:**
```bash
# Create .env from example
cp backend/.env.example backend/.env

# Edit with production values
nano backend/.env

# Re-run deployment
./deploy/deploy.sh deploy
```

### SSL Certificate Issues

**Error:**
```
nginx: [emerg] cannot load certificate
```

**Solution:**
```bash
# Check if certificates exist
ls -la certbot/letsencrypt/live/i-want-procedure.online/

# If missing, run initial setup
./deploy/deploy.sh setup i-want-procedure.online admin@i-want-procedure.online
```

### Build Failures

**Error:**
```
ERROR: failed to solve: process did not complete successfully
```

**Solution:**
```bash
# Check disk space
df -h

# Clean up Docker
docker system prune -a

# Re-run deployment
./deploy/deploy.sh deploy
```

### Container Keeps Restarting

**Check logs:**
```bash
docker logs procedure_api
docker logs procedure_frontend
```

**Common issues:**
- Database connection failed (check DATABASE_URL in .env)
- Missing environment variables
- Port conflicts
- Health check failures

### Database Migration Errors

**Solution:**
```bash
# Connect to database container
docker exec -it procedure_db psql -U postgres -d procedure

# Check migrations table
SELECT * FROM alembic_version;

# If corrupted, manually fix or restore from backup
```

## Rollback Procedure

### Method 1: Revert to Previous Git Commit

```bash
cd /var/www/procedure

# View recent commits
git log --oneline -10

# Reset to specific commit
git reset --hard <commit-hash>

# Deploy
./deploy/deploy.sh deploy
```

### Method 2: Use Previous Docker Images

```bash
# List recent images
docker images | grep procedure

# Tag previous working image
docker tag procedure-api:<previous-tag> procedure-api:latest

# Force recreate containers
docker compose -f docker-compose.prod.yml \
  -f docker-compose.frontend.yml \
  -f docker-compose.nginx.yml \
  up -d --force-recreate
```

### Method 3: Restore from Backup

```bash
# Stop all containers
./deploy/deploy.sh stop

# Restore database backup
docker run --rm \
  -v procedure_postgres_data:/var/lib/postgresql/data \
  -v /path/to/backup:/backup \
  postgres:15-alpine \
  bash -c "cd /var/lib/postgresql/data && tar -xzvf /backup/postgres-backup.tar.gz"

# Restore media files
tar -xzvf /path/to/backup/media-backup.tar.gz -C backend/media/

# Start services
./deploy/deploy.sh deploy
```

## Cleanup Old Deployments

If you have leftover containers/directories from parallel deployment attempts:

```bash
# Stop all procedure containers (any directory)
docker ps -a | grep procedure | awk '{print $1}' | xargs -r docker rm -f

# Remove old deployment directory (if exists)
sudo rm -rf /root/procedure_temp

# Remove unused volumes (CAREFUL - this deletes data)
docker volume ls | grep procedure
# Only remove if you're sure they're not needed

# Remove unused images
docker image prune -a
```

## Monitoring

### View Logs

**Dozzle Web UI:**
https://i-want-procedure.online/dozzle/

**Command Line:**
```bash
# All services
./deploy/deploy.sh logs

# Specific service
./deploy/deploy.sh logs api

# Follow logs (real-time)
docker logs -f procedure_api
```

### Container Status

```bash
# Quick status
./deploy/deploy.sh status

# Detailed status
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Resource usage
docker stats
```

### Health Checks

```bash
# Check site is up
curl -I https://i-want-procedure.online

# Check API health
curl https://i-want-procedure.online/api/v1/health

# Check database connection
docker exec procedure_db pg_isready -U postgres
```

## Security Notes

1. **Never commit .env files** to git
2. **Use strong passwords** for database and secrets
3. **Keep SSL certificates** secure and renewed
4. **Regularly update** Docker images and system packages
5. **Monitor logs** for suspicious activity
6. **Backup database** regularly
7. **Restrict SSH access** to known IPs if possible

## Support

For deployment issues:
1. Check this README
2. Review deployment logs: `./deploy/deploy.sh logs`
3. Check GitHub Actions logs
4. Report issues: https://github.com/rostislav444/i-want-procedure.online/issues
