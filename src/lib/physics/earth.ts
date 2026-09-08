import { L_B } from './constants';

/**
 * Rate deficit of a sea-level clock relative to barycentric coordinate time. Every scene's
 * ship deficit is expressed against the same time by adding the scene's own solar share.
 */
export function earthReferenceDeficit(): number {
	return L_B;
}

/** Ratio of the ship clock rate to the Earth clock rate, minus one, from the two deficits. */
export function relativeRateMinusOne(shipDeficit: number, earthDeficit: number): number {
	return (earthDeficit - shipDeficit) / (1 - earthDeficit);
}
