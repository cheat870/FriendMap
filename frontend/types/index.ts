// ============================================================
// FriendMap – Shared TypeScript interfaces (frontend)
// ============================================================

// ──────────────────────────────────────
// Auth / User
// ──────────────────────────────────────
export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  role: 'user' | 'moderator' | 'admin';
  isActive: boolean;
  createdAt: string; // ISO string
  updatedAt: string;
}

export interface UserProfile extends User {
  friendCount: number;
  isLocationSharing: boolean;
  shareMode: ShareMode;
}

export interface AuthResponse {
  user: UserProfile;
  token: string;
  expiresIn: number;
}

export interface LoginCredentials {
  emailOrUsername: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  displayName: string;
  password: string;
  confirmPassword: string;
}

// ──────────────────────────────────────
// Friends
// ──────────────────────────────────────
export type FriendStatus = 'pending' | 'accepted' | 'rejected' | 'blocked';
export type ShareMode = 'all' | 'selected' | 'paused';

export interface Friend {
  id: string;
  userId: string;
  friendId: string;
  friend: UserProfile;
  status: FriendStatus;
  isSharing: boolean;
  createdAt: string;
}

export interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  sender: UserProfile;
  receiver: UserProfile;
  status: FriendStatus;
  direction: 'incoming' | 'outgoing';
  createdAt: string;
}

// ──────────────────────────────────────
// Location
// ──────────────────────────────────────
export interface LocationCoords {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number | null;
  heading?: number | null;
  speed?: number | null;
}

export interface FriendLocation {
  userId: string;
  user: UserProfile;
  latitude: number;
  longitude: number;
  accuracy?: number;
  heading?: number | null;
  speed?: number | null;
  isOnline: boolean;
  lastActive: string; // ISO string
  updatedAt: string;
}

// ──────────────────────────────────────
// Navigation / Routing
// ──────────────────────────────────────
export type TransportMode = 'driving' | 'walking' | 'cycling';
export type TurnDirection =
  | 'straight'
  | 'turn-left'
  | 'turn-right'
  | 'turn-sharp-left'
  | 'turn-sharp-right'
  | 'uturn'
  | 'roundabout'
  | 'arrive';

export interface RouteStep {
  instruction: string;
  distance: number; // meters
  duration: number; // seconds
  maneuver: TurnDirection;
  streetName: string;
  coordinates: [number, number][]; // [lat, lng]
}

export interface RouteResult {
  distance: number; // meters total
  duration: number; // seconds total
  steps: RouteStep[];
  geometry: any; // GeoJSON or [lat, lng][]
  origin?: LocationCoords;
  destination?: LocationCoords;
}

export interface NavigationState {
  isNavigating: boolean;
  route: RouteResult | null;
  currentStep: number;
  remainingDistance: number;
  remainingDuration: number;
  transportMode: TransportMode;
  friendId: string | null;
  hasArrived: boolean;
}

// ──────────────────────────────────────
// Chat / Messaging
// ──────────────────────────────────────
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  sender: UserProfile;
  content: string;
  type: 'text' | 'image' | 'location' | 'deleted';
  status: MessageStatus;
  readAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: string;
  participants: UserProfile[];
  lastMessage?: Message;
  unreadCount: number;
  updatedAt: string;
  createdAt: string;
}

// ──────────────────────────────────────
// Notifications
// ──────────────────────────────────────
export type NotificationType =
  | 'friend_request'
  | 'friend_accepted'
  | 'message'
  | 'location_shared'
  | 'navigation_started'
  | 'arrival'
  | 'system';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  data?: Record<string, string | number | boolean>;
  createdAt: string;
}

// ──────────────────────────────────────
// Settings
// ──────────────────────────────────────
export type AppLanguage = 'en' | 'km';
export type AppTheme = 'light' | 'dark' | 'system';

export interface AppSettings {
  language: AppLanguage;
  theme: AppTheme;
  isLocationSharing: boolean;
  shareMode: ShareMode;
  locationHistory: boolean;
  notifications: {
    friendRequests: boolean;
    messages: boolean;
    locationUpdates: boolean;
    arrivals: boolean;
  };
}

// ──────────────────────────────────────
// API responses
// ──────────────────────────────────────
export interface ApiError {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
