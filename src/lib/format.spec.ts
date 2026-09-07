import { describe, expect, it } from 'vitest';
import {
	formatDrift,
	formatDuration,
	formatLength,
	formatRatePerDay,
	formatRelativeRate,
	formatSpeed,
	formatThrust,
	formatWarp
} from './format';

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

describe('formatRelativeRate', () => {
	it('uses per-day drift when the difference is tiny and multipliers when it is not', () => {
		expect(formatRelativeRate(2.5e-10, 6.97e-10)).toBe('38.62 μs per day fast');
		expect(formatRelativeRate(0.29, 1.55e-8)).toBe('Earth runs 1.41× faster');
		expect(formatRelativeRate(0.999999, 0)).toBe('Earth runs 1.0×10⁶ times faster');
		expect(formatRelativeRate(1, 0)).toBe('stopped, as Earth sees it');
	});
});

describe('formatThrust, formatSpeed, formatDuration, formatWarp', () => {
	it('formats thrust in g', () => {
		expect(formatThrust(0)).toBe('0 g, free fall');
		expect(formatThrust(9.80665)).toBe('1.00 g');
		expect(formatThrust(2.7e12)).toBe('2.8×10¹¹ g');
	});
	it('formats speed in m/s, km/s, then c', () => {
		expect(formatSpeed(3874)).toBe('3.87 km/s');
		expect(formatSpeed(0.3 * 299_792_458)).toBe('0.30 c');
		expect(formatSpeed(12)).toBe('12.0 m/s');
	});
	it('formats durations the way people say them', () => {
		expect(formatDuration(43_082)).toBe('11 h 58 min');
		expect(formatDuration(88 * 86400)).toBe('88.0 d');
		expect(formatDuration(0.0023)).toBe('2.300 ms');
	});
	it('describes the time warp', () => {
		expect(formatWarp(1)).toBe('1× real time');
		expect(formatWarp(3600)).toBe('3\u2009600×, a second is 1 h 0 min');
	});
});
