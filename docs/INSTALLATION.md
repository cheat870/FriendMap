# FRIENDMAP – Installation & Setup Guide

This guide covers running and deploying FriendMap on Windows, macOS, or Linux, as well as setting up Visual Studio Code.

---

## Prerequisites
- **Node.js**: >= 18.0.0 (Tested on Node.js v25)
- **npm**: >= 9.0.0
- **MySQL 8.0** (Production) or SQLite (Included for instant local development)

---

## 1. Quick Start (Instant Local Running)

The repository comes pre-configured with SQLite for instant local development and testing.

### Backend Setup
1. Open PowerShell / Terminal in the `backend` folder:
   ```bash
   cd backend
   npm install
   npx prisma generate
   npx prisma db push
   npm run db:seed
   ```
2. Start the backend server:
   ```bash
   npm run build
   npm run start
   ```
   *The backend will be running at `http://localhost:5000`.*

### Frontend Setup
1. In another terminal, navigate to `frontend`:
   ```bash
   cd frontend
   npm install
   npm run build
   npm run start
   ```
   *Or for development hot-reloading:*
   ```bash
   npm run dev
   ```
2. Open your browser at `http://localhost:3000`.

---

## 2. Default Seed Accounts

The database comes pre-seeded with 4 test accounts:

| Role | Username | Email | Password |
|---|---|---|---|
| **Admin** | `admin` | `admin@friendmap.local` | `Password123!` |
| **User A** | `alice` | `alice@friendmap.local` | `Password123!` |
| **User B** | `bob` | `bob@friendmap.local` | `Password123!` |
| **User C** | `charlie` | `charlie@friendmap.local` | `Password123!` |

- **Alice and Bob** are approved mutual friends and actively sharing locations.
- Navigating between Alice and Bob generates a real road route in Phnom Penh.

---

## 3. Switching to MySQL 8.0 for Production

1. Import the production database schema:
   ```bash
   mysql -u root -p < database/schema.sql
   mysql -u root -p friendmap < database/seeds/seed.sql
   ```
2. In `backend/.env`, set:
   ```env
   DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:3306/friendmap"
   ```
3. Update `backend/prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "mysql"
     url      = env("DATABASE_URL")
   }
   ```
4. Regenerate Prisma Client:
   ```bash
   cd backend
   npx prisma generate
   ```

---

## 4. Visual Studio Code Setup

Recommended extensions:
- **Tailwind CSS IntelliSense**
- **Prisma** (Official Prisma syntax highlighting)
- **ESLint**
- **Prettier - Code formatter**

Launch configuration (`.vscode/launch.json`):
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Backend Dev",
      "type": "node",
      "request": "launch",
      "cwd": "${workspaceFolder}/backend",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"]
    },
    {
      "name": "Frontend Dev",
      "type": "node",
      "request": "launch",
      "cwd": "${workspaceFolder}/frontend",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"]
    }
  ]
}
```

---

## 5. End-to-End Testing with Two Accounts

To test the complete user journey across two devices or two browser profiles (e.g. Standard Chrome & Incognito):

1. **Browser 1 (Alice)**:
   - Go to `http://localhost:3000/login`
   - Sign in with `alice@friendmap.local` / `Password123!`
   - Allow Browser Location permission.
   - Look at the interactive map: Alice's avatar will show a blue pulsing ring with GPS accuracy.
   - Bob's marker (`Bob Martinez`) appears live with a green indicator.

2. **Browser 2 (Bob)**:
   - Open Incognito / second browser at `http://localhost:3000/login`
   - Sign in with `bob@friendmap.local` / `Password123!`
   - Allow Location permission.

3. **Find Friend & Directions**:
   - In Alice's browser, click on Bob's circular marker.
   - The Friend Detail Sheet slides up with distance, freshness, and action buttons.
   - Click **"រកផ្លូវ (Directions)"**.

4. **Turn-by-Turn Navigation**:
   - The navigation view opens with Google Maps style green instruction banner at the top.
   - It shows turn maneuvers (e.g., *Head left onto Preah Norodom Blvd*), remaining distance, and ETA.
   - When distance becomes `<= 50 meters`, the arrival modal pops up: *"អ្នកបានមកដល់ហើយ! (You have arrived!)*.
