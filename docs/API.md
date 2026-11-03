# FRIENDMAP – REST API Documentation

Base URL: `http://localhost:5000/api`

---

## 1. Authentication (`/api/auth`)

### Register
`POST /api/auth/register`
- **Request Body:**
  ```json
  {
    "username": "alice",
    "email": "alice@friendmap.local",
    "displayName": "Alice Chen",
    "password": "Password123!"
  }
  ```
- **Response (201):**
  ```json
  {
    "success": true,
    "message": "Account created successfully",
    "data": {
      "user": { "id": "...", "username": "alice", "displayName": "Alice Chen", ... },
      "accessToken": "ey...",
      "refreshToken": "ey..."
    }
  }
  ```

### Login
`POST /api/auth/login`
- **Request Body:**
  ```json
  {
    "login": "alice@friendmap.local",
    "password": "Password123!"
  }
  ```
- **Response (200):**
  ```json
  {
    "success": true,
    "data": {
      "user": { ... },
      "accessToken": "ey...",
      "refreshToken": "ey..."
    }
  }
  ```

### Current User Profile
`GET /api/auth/me` (Bearer Token required)

### Update Profile
`PATCH /api/auth/profile`
- **Request Body:** `{ "displayName": "...", "bio": "..." }`

### Upload Avatar
`POST /api/auth/avatar` (multipart/form-data, field `avatar`)

---

## 2. Friends System (`/api/friends`)

### List Approved Friends
`GET /api/friends`
- Returns all mutual friends with online status, last active, and location sharing status.

### Search Users
`GET /api/friends/search?q={query}&page=1&limit=20`

### Send Friend Request
`POST /api/friends/request`
- **Request Body:** `{ "receiverId": "user_id_here", "message": "Hey let's connect!" }`

### Accept Friend Request
`PATCH /api/friends/request/:requestId/accept`

### Reject Friend Request
`PATCH /api/friends/request/:requestId/reject`

### Cancel Sent Request
`DELETE /api/friends/request/:requestId`

### Remove Friend
`DELETE /api/friends/:friendId`

### Block / Unblock User
- `POST /api/friends/:userId/block`
- `DELETE /api/friends/:userId/block`

---

## 3. Real-Time Location & Privacy (`/api/location`)

### Update Current Location
`POST /api/location/update`
- **Request Body:**
  ```json
  {
    "latitude": 11.5564,
    "longitude": 104.9282,
    "accuracy": 8.5,
    "heading": 90.0,
    "speed": 1.2
  }
  ```
- Checks history setting, broadcasts via Socket.IO to authorized viewers.

### Get Approved Friends Locations
`GET /api/location/friends`
- Strictly checks:
  1. Requester is authenticated.
  2. Owner has enabled sharing (`isActive = true`).
  3. Requester is an approved friend.
  4. Permission has not expired.
  5. Requester is not blocked.
  6. The location is fresh.

### Update Sharing Permissions
`POST /api/location/sharing`
- **Body:** `{ "shareLocation": true, "shareMode": "all_friends" }`
- Or per friend with duration: `{ "friendId": "...", "durationMinutes": 60 }`

### Location History
- `GET /api/location/history?limit=100`
- `DELETE /api/location/history`

---

## 4. Navigation & Road Routing (`/api/navigation`)

### Get OSRM Road Route
`POST /api/navigation/route`
- **Request Body:**
  ```json
  {
    "targetUserId": "usr_bob_001",
    "originLat": 11.5564,
    "originLng": 104.9282,
    "destLat": 11.5684,
    "destLng": 104.9312,
    "mode": "driving" // "driving" | "walking" | "cycling"
  }
  ```
- **Response:**
  ```json
  {
    "route": {
      "distance": 2266,
      "duration": 144,
      "steps": [ ... ],
      "geometry": { "type": "LineString", "coordinates": [ ... ] }
    }
  }
  ```

### Start Navigation Session
`POST /api/navigation/start`
- **Body:** `{ "targetUserId": "...", "originLat": ..., "originLng": ..., "destLat": ..., "destLng": ... }`

### Update Navigation & Arrival Check
`POST /api/navigation/update/:sessionId`
- Evaluates distance to destination. If `<= 50m`, triggers arrival event and ends session.

### End Navigation
`POST /api/navigation/end/:sessionId`

---

## 5. Chat System (`/api/chat`)

- `GET /api/chat/conversations` – List active conversations with unread indicators.
- `POST /api/chat/direct` – Open/create DM with friend `{ "friendId": "..." }`.
- `GET /api/chat/:conversationId/messages` – Paginated messages.
- `POST /api/chat/:conversationId/messages` – Send message `{ "content": "..." }`.

---

## 6. Notifications & Settings

- `GET /api/notifications`
- `PATCH /api/notifications/:id/read`
- `PATCH /api/notifications/read-all`
- `GET /api/settings`
- `PATCH /api/settings`

---

## 7. Admin Dashboard (`/api/admin`) (Role: `admin` | `moderator`)

- `GET /api/admin/stats` – Total users, active accounts, online sockets, active navigations.
- `GET /api/admin/users?page=1&search=...` – Paginated user management list.
- `PATCH /api/admin/users/:id/status` – Activate/Suspend account.
- `PATCH /api/admin/users/:id/role` – Update role (`user`, `moderator`, `admin`).
