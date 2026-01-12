#!/bin/bash

set -e

DOMAIN="i-want-procedure.online"
EMAIL="your-email@example.com"  # Change this to your email

echo "=== Procedure Deployment Script ==="

# Create docker network if not exists
echo "Creating docker network..."
docker network create procedure_network 2>/dev/null || echo "Network already exists"

# Create certbot directory in project root
echo "Creating certbot directory..."
mkdir -p certbot/letsencrypt

# Step 1: Start with HTTP-only config for certbot
echo "Step 1: Starting services with HTTP config for SSL generation..."
cp deploy/nginx.certbot.conf deploy/nginx.conf.bak

# Build and start all services
echo "Building and starting services..."
docker-compose -f docker-compose.prod.yml -f docker-compose.frontend.yml -f docker-compose.nginx.yml up -d --build

# Wait for nginx to start
echo "Waiting for nginx to start..."
sleep 5

# Step 2: Generate SSL certificate
echo "Step 2: Generating SSL certificate..."
docker run --rm \
  -v $(pwd)/certbot/letsencrypt:/etc/letsencrypt \
  -v $(pwd)/certbot:/var/www/certbot \
  certbot/certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email $EMAIL \
  --agree-tos \
  --no-eff-email \
  -d $DOMAIN \
  -d www.$DOMAIN

# Step 3: Restore nginx config and restart
echo "Step 3: Restoring HTTPS config..."
mv deploy/nginx.conf.bak deploy/nginx.certbot.conf 2>/dev/null || true

# Restart nginx with HTTPS config
echo "Restarting nginx with HTTPS..."
docker-compose -f docker-compose.nginx.yml restart nginx

echo ""
echo "=== Deployment Complete ==="
echo "Site: https://$DOMAIN"
echo "Admin: https://$DOMAIN/admin"
echo "Public sites: https://$DOMAIN/site/{slug}"
echo ""
echo "Don't forget to:"
echo "1. Update EMAIL variable in this script"
echo "2. Configure Telegram bot domain in BotFather"
echo "3. Run database migrations: docker-compose -f docker-compose.prod.yml exec api alembic upgrade head"
