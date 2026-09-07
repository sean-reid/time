import { describe, expect, it } from 'vitest';
import { formatDrift, formatLength, formatRatePerDay } from './format';

describe('formatDrift', () => {
	it('scales to the largest fitting unit', () => {
		expect(formatDrift(38.6e-6)).toBe('+38.60 μs');
		expect(formatDrift(-2.5e-9)).toBe('−2.500 ns');
		expect(formatDrift(90)).toBe('+1.500 min');
		expect(formatDrift(3 * 365.25 * 86400)).toBe('+3.000 y');
	});
	it('treats sub-nanosecond as zero', () => {
		expect(formatDrift(1e-12)).toBe('+0 ns');
	});
});

describe('formatRatePerDay', () => {
	it('expresses a rate ratio as drift per day', () => {
		expect(formatRatePerDay(1 + 38.6e-6 / 86400)).toBe('38.60 μs per day fast');
		expect(formatRatePerDay(0.7)).toBe('7.200 h per day slow');
	});
});

describe('formatLength', () => {
	it('picks km, AU, ly with thin-space grouping', () => {
		expect(formatLength(20_180_000)).toBe('20\u2009180 km');
		expect(formatLength(1.495978707e11 * 5.2)).toBe('5.2 AU');
		expect(formatLength(500)).toBe('500 m');
		expect(formatLength(1.2e15)).toBe('8\u2009022 AU');
	});
});
