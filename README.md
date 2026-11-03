# FriendMap 🗺️
### Professional Real-Time Friends Location Sharing & Navigation Platform

FriendMap is a modern, social location-sharing application inspired by **Whoo**, **Google Maps**, and modern real-time navigation platforms. It allows users to share live GPS coordinates with approved friends, view friend locations on an interactive map with circular avatar markers, get turn-by-turn road directions, chat in real time, and manage granular privacy permissions.

---

## 🌟 Key Features

1. **Interactive Leaflet Map**:
   - OpenStreetMap tiles with custom DivIcon circular markers.
   - Blue animated radar pulse ring for current user with GPS accuracy circle.
   - Green online glow for active friends, offline indicators, and freshness timestamps.
   - Recenter button, search overlay, and custom zoom controls.

2. **Real Road Routing & Directions**:
   - Integrated with OSRM (Open Source Routing Machine).
   - Real road network geometry (no straight-line approximations).
   - Multi-modal: Driving 🚗, Walking 🚶, Cycling 🚴.
   - Estimated arrival duration, total distance, and arrival time calculation.

3. **Turn-by-Turn GPS Navigation**:
   - Google Maps-style navigation interface with next-instruction banner.
   - Turn maneuver icons (Left, Right, Slight Left, U-turn, Straight, Arrived).
   - Live location updates via Browser Geolocation API (`watchPosition`).
   - Route recalculation when leaving the route or when a friend moves significantly.
   - **Arrival Detection**: 50-meter threshold with arrival confirmation notification.
   - "Open in Google Maps" external link button.

4. **Friends & Privacy System**:
   - User search by username and display name.
   - Friend requests (Send, Accept, Reject, Cancel).
   - Block and unblock capabilities.
   - Privacy controls: Share with all friends, selected friends, pause sharing, or temporary duration (15m, 1h, 8h).
   - **Zero Unauthorized Access**: coordinates are strictly filtered by mutual friendship and active permissions.

5. **Real-Time Chat & Notifications**:
   - Socket.IO messaging with typing indicators, delivery timestamps, and unread badges.
   - Instant notifications for friend requests, message arrivals, location sharing events, and navigation alerts.

6. **Location History**:
   - Optional, owner-only private location logging.
   - Can be enabled/disabled at any time, with single item or bulk delete.

7. **Admin Dashboard**:
   - Statistics: registered users, active accounts, online sockets, active navigations.
   - User management with search, suspend/activate actions, and role modification.
   - Strict privacy safeguards: admins have zero access to private live coordinates or conversations.

8. **Localization**:
   - Native bilingual support for **Khmer (ភាសាខ្មែរ)** and **English**. Default language is Khmer.

---

## 🛠️ Technology Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, React Leaflet, Leaflet.js, Lucide Icons, Axios, Zustand, React Hot Toast.
- **Backend**: Node.js, Express.js, TypeScript, Socket.IO, Prisma ORM, JWT authentication, bcrypt, Helmet, Morgan, Express Rate Limit, Multer.
- **Routing**: OSRM API (road network geometry, steps, and duration).
- **Database**: MySQL 8.0 (Schema in `database/schema.sql`) / SQLite (Local testing).

---

## 🚀 Quick Start

### 1. Start the Backend
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run db:seed
npm run build
npm run start
```
*Backend runs on `http://localhost:5000`.*

### 2. Start the Frontend
```bash
cd frontend
npm install
npm run build
npm run start
```
*Frontend runs on `http://localhost:3000`.*

---

## 👤 Test Accounts (Pre-Seeded)

All passwords are: `Password123!`

- **Admin**: `admin@friendmap.local` (Username: `admin`)
- **User A**: `alice@friendmap.local` (Username: `alice`)
- **User B**: `bob@friendmap.local` (Username: `bob`)
- **User C**: `charlie@friendmap.local` (Username: `charlie`)

---

## 📚 Documentation
- [API Documentation](docs/API.md)
- [Socket.IO Events](docs/SOCKET_EVENTS.md)
- [Installation & Deployment Guide](docs/INSTALLATION.md)
- [Database Schema (MySQL 8)](database/schema.sql)
