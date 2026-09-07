import { L_B, L_G } from './constants';

/**
 * Rate deficit of a sea-level clock relative to the coordinate time of the scene.
 * Scenes centred on Earth use geocentric time; every other scene sits far enough
 * away that Earth's own share of the solar system potential is what remains.
 */
export function earthReferenceDeficit(centreIsEarth: boolean): number {
	return centreIsEarth ? L_G : L_B;
}

/** Ratio of the ship clock rate to the Earth clock rate, minus one, from the two deficits. */
export function relativeRateMinusOne(shipDeficit: number, earthDeficit: number): number {
	return (earthDeficit - shipDeficit) / (1 - earthDeficit);
}
