import { Request } from 'express';

export interface AuthUser {
  id: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export interface RequestWithUser extends Request {
  user: AuthUser;
}

export interface LocationCoords {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  heading?: number;
  speed?: number;
}

export interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
  maneuver: string;
  coordinates: [number, number];
}

export interface RouteResult {
  geometry: any;
  distance: number;
  duration: number;
  steps: RouteStep[];
}

export interface SocketData {
  userId: string;
  role: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}
