# Production Deployment Guide

This guide covers deploying the OP17 Next.js application on a production server with a local PostgreSQL database.

## Prerequisites

- Ubuntu 22.04 LTS (or similar Linux distribution)
- Root or sudo access
- Domain name pointing to your server (optional but recommended)

## Step 1: Install System Dependencies

### 1.1 Update System Packages

```bash
sudo apt update && sudo apt upgrade -y
```

### 1.2 Install Node.js 20.x

```bash
# Install NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Install Node.js
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version
```

### 1.3 Install PostgreSQL 15

```bash
# Add PostgreSQL repository
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget -qO- https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo tee /etc/apt/trusted.gpg.d/pgdg.asc >/dev/null

# Update and install PostgreSQL
sudo apt update
sudo apt install -y postgresql-15 postgresql-contrib

# Verify installation
psql --version

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 1.4 Install PM2 (Process Manager)

```bash
sudo npm install -g pm2
```

### 1.5 Install Git (if not already installed)

```bash
sudo apt install -y git
```

## Step 2: Create PostgreSQL Database and User

### 2.1 Switch to PostgreSQL User

```bash
sudo -u postgres psql
```

### 2.2 Create Database and User

```sql
-- Create database
CREATE DATABASE op17;

-- Create user with secure password
CREATE USER op17user WITH ENCRYPTED PASSWORD 'your_secure_password_here';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE op17 TO op17user;

-- Connect to the database
\c op17

-- Grant privileges on schema
GRANT ALL ON SCHEMA public TO op17user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO op17user;

-- Exit
\q
```

### 2.3 Configure PostgreSQL Authentication (Optional but Recommended)

Edit the PostgreSQL authentication configuration:

```bash
sudo nano /etc/postgresql/15/main/pg_hba.conf
```

Ensure the following line exists for local connections:

```
# IPv4 local connections:
host    all             all             127.0.0.1/32            scram-sha-256
```

Restart PostgreSQL:

```bash
sudo systemctl restart postgresql
```

### 2.4 Test Database Connection

```bash
psql -h localhost -U op17user -d op17 -W
```

Enter your password when prompted. Type `\q` to exit.

## Step 3: Set Up Application Directory

### 3.1 Create Application User (Optional but Recommended)

```bash
# Create a dedicated user for running the app
sudo useradd -r -s /bin/false -m -d /var/www/op17 op17
```

### 3.2 Clone the Repository

```bash
# If using the dedicated user
sudo -u op17 mkdir -p /var/www/op17
cd /var/www/op17

# Clone your repository (adjust URL as needed)
sudo -u op17 git clone https://github.com/yourusername/op17.git .

# Or if copying files directly, ensure proper ownership:
# sudo chown -R op17:op17 /var/www/op17
```

### 3.3 Install Dependencies

```bash
cd /var/www/op17
sudo -u op17 npm ci
```

## Step 4: Configure Environment Variables

### 4.1 Create Environment File

```bash
cd /var/www/op17
sudo -u op17 cp .env.example .env
sudo -u op17 nano .env
```

### 4.2 Configure Environment Variables

Edit the `.env` file with your production values:

```env
# Database - Use the credentials from Step 2.2
DATABASE_URL="postgresql://op17user:your_secure_password_here@localhost:5432/op17"

# Payments (configure with your actual payment provider credentials)
LIQPAY_PUBLIC_KEY=""
LIQPAY_PRIVATE_KEY=""
LIQPAY_WEBHOOK_URL="https://yourdomain.com/api/payments/liqpay/webhook"
LIQPAY_RETURN_URL="https://yourdomain.com/shop/payment-status"
MONOBANK_TOKEN=""
MONOBANK_WEBHOOK_SECRET=""
MONOBANK_WEBHOOK_PUBLIC_KEY=""
MONOBANK_WEBHOOK_URL="https://yourdomain.com/api/payments/monobank/webhook"
MONOBANK_RETURN_URL="https://yourdomain.com/shop/payment-status"

# S3 / MinIO (configure with your object storage)
S3_ENDPOINT=""
S3_REGION="eu-central-1"
S3_BUCKET="op17"
S3_ACCESS_KEY=""
S3_SECRET_KEY=""
S3_PUBLIC_URL=""
S3_FORCE_PATH_STYLE="true"
NEXT_PUBLIC_S3_PUBLIC_URL=""

# FX updater secret (generate a random string)
FX_UPDATE_SECRET="your_random_secret_here"

# Admin seed credentials (for initial admin user)
ADMIN_EMAIL="admin@yourdomain.com"
ADMIN_PASSWORD="your_admin_password_here"
ADMIN_NAME="Admin"
```

**Important:** Replace all placeholder values with your actual credentials.

### 4.3 Set Proper Permissions

```bash
sudo chmod 600 /var/www/op17/.env
sudo chown op17:op17 /var/www/op17/.env
```

## Step 5: Database Migration and Seeding

### 5.1 Run Database Migrations

```bash
cd /var/www/op17
sudo -u op17 npx prisma migrate deploy
```

### 5.2 Generate Prisma Client

```bash
sudo -u op17 npx prisma generate
```

### 5.3 Seed the Database

This creates the required roles and initial admin user:

```bash
sudo -u op17 npm run seed
```

You should see output confirming roles and admin user creation.

### 5.4 Verify Database Setup

```bash
sudo -u postgres psql -d op17 -c "\dt"
```

You should see all the tables listed (User, Product, Order, etc.).

## Step 6: Build the Application

```bash
cd /var/www/op17
sudo -u op17 npm run build
```

This creates an optimized production build in the `.next` directory.

## Step 7: Configure PM2

### 7.1 Create PM2 Configuration

```bash
sudo -u op17 nano /var/www/op17/ecosystem.config.cjs
```

Add the following content:

```javascript
module.exports = {
  apps: [
    {
      name: 'op17',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/op17',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: '/var/www/op17/logs/err.log',
      out_file: '/var/www/op17/logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
```

### 7.2 Create Logs Directory

```bash
sudo -u op17 mkdir -p /var/www/op17/logs
```

### 7.3 Start the Application with PM2

```bash
cd /var/www/op17
sudo -u op17 pm2 start ecosystem.config.cjs
```

### 7.4 Save PM2 Configuration

```bash
sudo -u op17 pm2 save
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u op17 --hp /var/www/op17
```

The last command outputs a command to run with sudo. Copy and execute it to enable PM2 startup on boot.

### 7.5 PM2 Management Commands

```bash
# Check status
sudo -u op17 pm2 status

# View logs
sudo -u op17 pm2 logs op17

# Restart app
sudo -u op17 pm2 restart op17

# Stop app
sudo -u op17 pm2 stop op17

# Reload (zero-downtime)
sudo -u op17 pm2 reload op17
```

## Step 8: Configure Nginx (Recommended)

### 8.1 Install Nginx

```bash
sudo apt install -y nginx
```

### 8.2 Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/op17
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Optional: Increase max body size for file uploads
    client_max_body_size 10M;
}
```

### 8.3 Enable Site

```bash
sudo ln -s /etc/nginx/sites-available/op17 /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 8.4 Configure SSL with Let's Encrypt (Recommended)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Follow the prompts. Certbot will automatically configure HTTPS and redirect HTTP to HTTPS.

## Step 9: Configure Firewall

```bash
# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable
```

## Step 10: Verify Deployment

### 10.1 Check Application is Running

```bash
# Check PM2 status
sudo -u op17 pm2 status

# Check logs
sudo -u op17 pm2 logs op17 --lines 50
```

### 10.2 Test in Browser

Visit your domain or server IP:
- http://yourdomain.com - Should show the storefront
- http://yourdomain.com/admin - Should show admin login

### 10.3 Test Admin Login

Log in with the admin credentials you set in the `.env` file:
- Email: `ADMIN_EMAIL` from `.env`
- Password: `ADMIN_PASSWORD` from `.env`

## Step 11: Post-Deployment Tasks

### 11.1 Set Up Automated Backups (Recommended)

Create a backup script:

```bash
sudo nano /usr/local/bin/backup-op17.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/op17"
mkdir -p $BACKUP_DIR

# Backup database
sudo -u postgres pg_dump op17 > $BACKUP_DIR/op17_$DATE.sql

# Keep only last 7 backups
ls -t $BACKUP_DIR/op17_*.sql | tail -n +8 | xargs -r rm
```

Make it executable and schedule:

```bash
sudo chmod +x /usr/local/bin/backup-op17.sh
sudo crontab -e
```

Add line for daily backup at 2 AM:

```
0 2 * * * /usr/local/bin/backup-op17.sh
```

### 11.2 Set Up Log Rotation

```bash
sudo nano /etc/logrotate.d/op17
```

```
/var/www/op17/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0644 op17 op17
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

## Updating the Application

To deploy updates:

```bash
cd /var/www/op17

# Pull latest changes
sudo -u op17 git pull

# Install any new dependencies
sudo -u op17 npm ci

# Run migrations if needed
sudo -u op17 npx prisma migrate deploy

# Rebuild
sudo -u op17 npm run build

# Restart app
sudo -u op17 pm2 reload op17
```

## Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test connection manually
psql -h localhost -U op17user -d op17 -W

# Check connection string in .env file
cat /var/www/op17/.env | grep DATABASE_URL
```

### Application Won't Start

```bash
# Check logs
sudo -u op17 pm2 logs op17

# Check Node.js version
node --version  # Should be 20.x

# Verify build exists
ls -la /var/www/op17/.next/
```

### Permission Issues

```bash
# Fix ownership
sudo chown -R op17:op17 /var/www/op17

# Fix permissions on .env
sudo chmod 600 /var/www/op17/.env
```

### Port Already in Use

```bash
# Check what's using port 3000
sudo lsof -i :3000

# Kill process if needed
sudo kill -9 <PID>
```

Or change the port in `ecosystem.config.cjs`:

```javascript
env: {
  NODE_ENV: 'production',
  PORT: 3001,  // Change to available port
},
```

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `LIQPAY_PUBLIC_KEY` | No* | LiqPay payment provider public key |
| `LIQPAY_PRIVATE_KEY` | No* | LiqPay payment provider private key |
| `MONOBANK_TOKEN` | No* | Monobank API token |
| `S3_ENDPOINT` | No** | S3-compatible storage endpoint |
| `S3_ACCESS_KEY` | No** | S3 access key |
| `S3_SECRET_KEY` | No** | S3 secret key |
| `ADMIN_EMAIL` | Yes | Initial admin user email |
| `ADMIN_PASSWORD` | Yes | Initial admin user password |
| `FX_UPDATE_SECRET` | Yes | Secret for FX rate update API |

*Required only if using LiqPay/Monobank payments
**Required only if using S3/MinIO for file storage

## Security Checklist

- [ ] Changed all default passwords
- [ ] Set strong PostgreSQL password
- [ ] Set strong admin password
- [ ] Configured firewall (UFW)
- [ ] Enabled SSL/HTTPS
- [ ] Set secure `FX_UPDATE_SECRET`
- [ ] Restricted `.env` file permissions (600)
- [ ] Disabled root SSH login (optional but recommended)
- [ ] Set up automated backups
- [ ] Configured log rotation
