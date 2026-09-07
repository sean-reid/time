import type { Direction } from './kerr';

export type Dwell =
	| { kind: 'orbit'; revolutions: number; direction: Direction }
	| { kind: 'hover'; duration: number };

/** A place the ship goes, in polar coordinates around the central body, with what it does there. */
export interface Waypoint {
	r: number;
	phi: number;
	dwell?: Dwell;
}

export interface Course {
	waypoints: Waypoint[];
	/** Speed between waypoints as measured by observers holding station, m/s. */
	cruiseSpeed: number;
}

export function waypointXY(w: { r: number; phi: number }): { x: number; y: number } {
	return { x: w.r * Math.cos(w.phi), y: w.r * Math.sin(w.phi) };
}
