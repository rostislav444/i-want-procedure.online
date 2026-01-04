#!/bin/bash

set -e

DOMAIN="i-want-procedure.online"
EMAIL="your-email@example.com"  # Change this to your email

echo "=== Procedure Deployment Script ==="

# Create docker network if not exists
echo "Creating docker network..."
docker network create procedure_network 2>/dev/null || echo "Network already exists"

# Create certbot directory
echo "Creating certbot directory..."
sudo mkdir -p /var/www/certbot

# Step 1: Start with HTTP-only config for certbot
echo "Step 1: Starting services with HTTP config for SSL generation..."
cp deploy/nginx.certbot.conf deploy/nginx.conf.bak
cp deploy/nginx.certbot.conf deploy/nginx.conf

# Build and start all services
echo "Building and starting services..."
docker-compose -f docker-compose.prod.yml -f docker-compose.frontend.yml -f docker-compose.nginx.yml up -d --build

# Wait for nginx to start
echo "Waiting for nginx to start..."
sleep 5

# Step 2: Generate SSL certificate
echo "Step 2: Generating SSL certificate..."
docker run --rm \
  -v /etc/letsencrypt:/etc/letsencrypt \
  -v /var/www/certbot:/var/www/certbot \
  certbot/certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email $EMAIL \
  --agree-tos \
  --no-eff-email \
  -d $DOMAIN \
  -d www.$DOMAIN

# Step 3: Switch to HTTPS config
echo "Step 3: Switching to HTTPS config..."
mv deploy/nginx.conf.bak deploy/nginx.certbot.conf
cat > deploy/nginx.conf << 'NGINX_CONF'
# HTTP - redirect to HTTPS
server {
    listen 80;
    server_name i-want-procedure.online www.i-want-procedure.online;

    # Certbot challenge
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Redirect all HTTP to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS
server {
    listen 443 ssl http2;
    server_name i-want-procedure.online www.i-want-procedure.online;

    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/i-want-procedure.online/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/i-want-procedure.online/privkey.pem;

    # SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;

    # Docker DNS resolver
    resolver 127.0.0.11 valid=30s;

    # Proxy settings
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";

    # API backend
    location /api/ {
        proxy_pass http://api:8000/api/;
    }

    # Admin panel (frontend)
    location /admin {
        proxy_pass http://frontend-admin:3000;
    }

    location /admin/ {
        proxy_pass http://frontend-admin:3000/admin/;
    }

    # Admin static files
    location /_next/ {
        # Check if request came from /admin
        if ($http_referer ~* "/admin") {
            proxy_pass http://frontend-admin:3000;
        }
        # Otherwise serve from site
        proxy_pass http://frontend-site:3001;
    }

    # Landing site (root)
    location / {
        proxy_pass http://frontend-site:3001;
    }

    # Error pages
    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
NGINX_CONF

# Restart nginx with HTTPS config
echo "Restarting nginx with HTTPS..."
docker-compose -f docker-compose.nginx.yml restart nginx

echo ""
echo "=== Deployment Complete ==="
echo "Site: https://$DOMAIN"
echo "Admin: https://$DOMAIN/admin"
echo ""
echo "Don't forget to:"
echo "1. Update EMAIL variable in this script"
echo "2. Configure Telegram bot domain in BotFather"
echo "3. Run database migrations: docker-compose -f docker-compose.prod.yml exec api alembic upgrade head"
