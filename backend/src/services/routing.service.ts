import fetch from 'node-fetch';
import { RouteResult, RouteStep } from '../types';
import logger from '../utils/logger';

const OSRM_BASE_URL = process.env.OSRM_BASE_URL || 'https://router.project-osrm.org';

type TransportMode = 'driving' | 'walking' | 'cycling';

const OSRM_PROFILES: Record<TransportMode, string> = {
  driving: 'driving',
  walking: 'foot',
  cycling: 'bike',
};

/**
 * Fetch a route from OSRM
 */
export async function getOSRMRoute(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
  mode: TransportMode = 'driving'
): Promise<RouteResult> {
  const profile = OSRM_PROFILES[mode];
  const coords = `${originLng},${originLat};${destLng},${destLat}`;
  const url = `${OSRM_BASE_URL}/route/v1/${profile}/${coords}?overview=full&geometries=geojson&steps=true&annotations=false`;

  logger.info(`Fetching OSRM route: ${url}`);

  const response = await fetch(url, {
    headers: { 'User-Agent': 'FriendMap/1.0' },
    timeout: 10000,
  } as any);

  if (!response.ok) {
    throw new Error(`OSRM request failed: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as any;

  if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
    throw new Error(`OSRM returned no routes: ${data.code || 'Unknown error'}`);
  }

  const route = data.routes[0];

  return {
    geometry: route.geometry,
    distance: Math.round(route.distance),
    duration: Math.round(route.duration),
    steps: parseOSRMSteps(route.legs),
  };
}

/**
 * Parse OSRM route legs into RouteStep[]
 */
export function parseOSRMSteps(legs: any[]): RouteStep[] {
  const steps: RouteStep[] = [];

  for (const leg of legs) {
    if (!leg.steps) continue;

    for (const step of leg.steps) {
      const maneuver = step.maneuver || {};
      const location = maneuver.location || [0, 0];
      const instruction = buildInstruction(maneuver, step.name);

      steps.push({
        instruction,
        distance: Math.round(step.distance || 0),
        duration: Math.round(step.duration || 0),
        maneuver: maneuver.type || 'straight',
        coordinates: [location[1], location[0]], // [lat, lng]
      });
    }
  }

  return steps;
}

/**
 * Build a human-readable instruction from OSRM maneuver data
 */
function buildInstruction(maneuver: any, streetName: string): string {
  const type = maneuver.type || '';
  const modifier = maneuver.modifier || '';
  const name = streetName && streetName !== '' ? ` onto ${streetName}` : '';

  const instructions: Record<string, string> = {
    'depart': `Head ${modifier}${name}`,
    'arrive': 'You have arrived at your destination',
    'turn-left': `Turn left${name}`,
    'turn-right': `Turn right${name}`,
    'turn-slight left': `Bear left${name}`,
    'turn-slight right': `Bear right${name}`,
    'turn-sharp left': `Sharp left${name}`,
    'turn-sharp right': `Sharp right${name}`,
    'turn-uturn': `Make a U-turn${name}`,
    'merge-left': `Merge left${name}`,
    'merge-right': `Merge right${name}`,
    'on ramp-left': `Take the ramp on the left${name}`,
    'on ramp-right': `Take the ramp on the right${name}`,
    'off ramp-left': `Take the exit on the left${name}`,
    'off ramp-right': `Take the exit on the right${name}`,
    'fork-left': `Keep left at the fork${name}`,
    'fork-right': `Keep right at the fork${name}`,
    'roundabout': `Enter the roundabout`,
    'exit roundabout': `Exit the roundabout${name}`,
    'continue': `Continue${name}`,
    'new name': `Continue${name}`,
    'end of road-left': `At the end of the road, turn left${name}`,
    'end of road-right': `At the end of the road, turn right${name}`,
    'notification': `Continue${name}`,
  };

  const key = modifier ? `${type}-${modifier}` : type;
  return instructions[key] || instructions[type] || `Continue${name}`;
}
