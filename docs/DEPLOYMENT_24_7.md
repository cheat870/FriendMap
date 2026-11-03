# Running FriendMap 24/7 (Production & Continuous Uptime)

FriendMap is structured as a full-stack platform consisting of:
1. **Frontend**: Next.js App Router (Port 3000)
2. **Backend**: Express + Socket.IO (Port 5000)

Here are the best ways to run FriendMap 24/7 with auto-recovery on crashes and automatic startup on server reboot.

---

## Option 1: PM2 (Process Manager) — Easiest for VPS & Local Machines

PM2 keeps your processes alive continuously and restarts them automatically if they ever crash or if the machine restarts.

### 1. Install PM2 Globally
```bash
npm install -g pm2
```

### 2. Build Both Projects
```bash
# Build backend
cd backend
npm install
npx prisma generate
npm run build

# Build frontend
cd ../frontend
npm install
npm run build
cd ..
```

### 3. Start With PM2
Use the included `ecosystem.config.js`:
```bash
pm2 start ecosystem.config.js
```

### 4. Enable Auto-Start on System Boot
```bash
pm2 startup
pm2 save
```

### Handy PM2 Commands:
- Check status: `pm2 status`
- View live logs: `pm2 logs`
- Restart all: `pm2 restart all`
- Stop all: `pm2 stop all`

---

## Option 2: Docker Compose — Recommended for VPS (DigitalOcean, AWS, Linode)

The project includes a ready-to-run `docker-compose.yml` that isolates both frontend and backend and restarts them indefinitely (`restart: always`).

### 1. Start Containers in Background
```bash
docker compose up -d --build
```

### 2. Check Container Status
```bash
docker compose ps
```

### 3. View Logs
```bash
docker compose logs -f
```

### 4. Stop Containers
```bash
docker compose down
```

---

## Option 3: Free / Low-Cost Cloud Deployment (Zero Maintenance 24/7)

### 1. Backend on Railway or Render
- Fork or push this repository to GitHub.
- Connect your GitHub repo to [Railway.app](https://railway.app) or [Render.com](https://render.com).
- Root directory: `backend`
- Build command: `npm install && npx prisma generate && npm run build`
- Start command: `node dist/server.js`
- Set Environment Variables:
  - `PORT=5000`
  - `NODE_ENV=production`
  - `JWT_ACCESS_SECRET=your_secret_key`
  - `JWT_REFRESH_SECRET=your_refresh_secret_key`
  - `CORS_ORIGIN=https://your-frontend-domain.vercel.app`

### 2. Frontend on Vercel
- Connect the same repository to [Vercel](https://vercel.com).
- Root directory: `frontend`
- Framework Preset: `Next.js`
- Set Environment Variables:
  - `NEXT_PUBLIC_API_URL=https://your-backend-railway-url.up.railway.app`
  - `NEXT_PUBLIC_SOCKET_URL=https://your-backend-railway-url.up.railway.app`
- Deploy! Vercel runs globally with high availability and 100% uptime.

---

## Option 4: Linux Systemd Service (For Ubuntu / Debian VPS)

Create `/etc/systemd/system/friendmap-backend.service`:
```ini
[Unit]
Description=FriendMap Backend
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/FriendMap/backend
ExecStart=/usr/bin/node dist/server.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production PORT=5000

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable friendmap-backend
sudo systemctl start friendmap-backend
```
