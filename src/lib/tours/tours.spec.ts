import { describe, expect, it } from 'vitest';
import { integrate } from '$lib/physics';
import { fieldFor } from '$lib/sim/defaults';
import { currentStop, tourById, tours } from './index';

describe('tours', () => {
	it('every tour integrates to a finite course with its stops in range', () => {
		for (const tour of tours) {
			const flight = integrate(fieldFor(tour.body), tour.course);
			expect(Number.isFinite(flight.totalT)).toBe(true);
			expect(flight.totalT).toBeGreaterThan(0);
			const lastSegment = flight.samples[flight.samples.length - 1].segment;
			for (const stop of tour.stops) {
				if (stop.segment !== 'end') expect(stop.segment).toBeLessThanOrEqual(lastSegment);
			}
		}
	});

	it('the Sgr A* tour ends at the horizon', () => {
		const tour = tourById('sgr-a-star')!;
		expect(integrate(fieldFor(tour.body), tour.course).ending.kind).toBe('horizon');
	});

	it('the GPS tour lands near the ground', () => {
		const tour = tourById('gps')!;
		const flight = integrate(fieldFor(tour.body), tour.course);
		expect(flight.ending.kind).toBe('complete');
		const last = flight.samples[flight.samples.length - 1];
		expect(last.r - fieldFor(tour.body).surface).toBeLessThan(25e3);
	});

	it('picks the latest stop reached', () => {
		const tour = tourById('sgr-a-star')!;
		expect(currentStop(tour, 0, false)).toBe(0);
		expect(currentStop(tour, 3, false)).toBe(1);
		expect(currentStop(tour, 4, false)).toBe(2);
		expect(currentStop(tour, 5, true)).toBe(3);
	});
});
