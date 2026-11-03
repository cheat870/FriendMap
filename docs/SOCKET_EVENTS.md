# FRIENDMAP – Socket.IO Events Documentation

Connection URL: `ws://localhost:5000` or `http://localhost:5000`

### Authentication
Authenticate on handshake by passing JWT token:
```ts
const socket = io('http://localhost:5000', {
  auth: { token: 'YOUR_JWT_ACCESS_TOKEN' }
});
```

On connection, the user automatically joins their personal private room: `user:{userId}`.

---

## 1. Location Events

### Client -> Server
- `location:update`
  - **Payload:** `{ latitude: number, longitude: number, accuracy?: number, heading?: number, speed?: number }`
  - Broadcasts location update to authorized friends.

- `location:sharing_stopped`
  - **Payload:** `{}`
  - Notifies friends that location sharing has paused or stopped.

### Server -> Client
- `location:friend_updated`
  - **Payload:** `{ userId: string, latitude: number, longitude: number, accuracy?: number, heading?: number, speed?: number, recordedAt: string }`

- `location:sharing_stopped`
  - **Payload:** `{ userId: string }`
  - Instantly removes the user's pin from the map.

---

## 2. Navigation Events

### Client -> Server
- `navigation:progress`
  - **Payload:** `{ sessionId: string, userLat: number, userLng: number, destLat: number, destLng: number, remainingM: number, remainingS: number }`

- `navigation:cancel`
  - **Payload:** `{ sessionId: string }`

### Server -> Client
- `navigation:started`
  - Emitted to target friend: `{ sessionId: string, navigator: User, transportMode: string, etaSeconds: number }`

- `navigation:route_updated`
  - Emitted when route recalculation occurs due to deviation or target movement: `{ sessionId: string, route: RouteResult }`

- `navigation:arrived`
  - Emitted when distance <= 50 meters: `{ sessionId: string, userId: string, targetUserId: string }`

- `navigation:ended`
  - Emitted when session finishes or gets cancelled: `{ sessionId: string, userId: string }`

---

## 3. Chat Events

### Client -> Server
- `conversation:join`
  - **Payload:** `conversationId`

- `conversation:leave`
  - **Payload:** `conversationId`

- `typing:start`
  - **Payload:** `{ conversationId: string }`

- `typing:stop`
  - **Payload:** `{ conversationId: string }`

- `message:send`
  - **Payload:** `{ conversationId: string, content: string, type?: 'text' | 'image' | 'location' }`

### Server -> Client
- `message:received`
  - Emitted to room `conversation:{conversationId}`: `{ id: string, senderId: string, content: string, createdAt: string, sender: User }`

- `message:notification`
  - Emitted to user's private room `user:{userId}` for unread indicators when conversation room is not active.

- `typing:user`
  - **Payload:** `{ conversationId: string, userId: string, isTyping: boolean }`

---

## 4. Notification Events

### Server -> Client
- `notification:new`
  - Emitted to `user:{userId}`: `{ id: string, type: string, title: string, body: string, data: any, createdAt: string }`
