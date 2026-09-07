import { describe, expect, it } from 'vitest';
import { crossings, foldDivisor, TONE_THRESHOLD } from './ticker';

describe('ticker helpers', () => {
	it('counts whole seconds crossed and caps floods', () => {
		expect(crossings(0.2, 0.9)).toBe(0);
		expect(crossings(0.9, 1.1)).toBe(1);
		expect(crossings(3, 7.5)).toBe(4);
		expect(crossings(0, 1e6)).toBe(30);
		expect(crossings(5, 4)).toBe(0);
	});

	it('folds fast tick rates into hearing by a shared power of ten', () => {
		expect(foldDivisor(TONE_THRESHOLD)).toBe(1);
		expect(foldDivisor(3600)).toBe(1);
		expect(foldDivisor(86_400)).toBe(100);
		expect(foldDivisor(31_557_600)).toBe(10_000);
	});
});
