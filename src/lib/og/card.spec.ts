import { describe, expect, it } from 'vitest';
import { bodyById } from '$lib/catalogue';
import { defaultPlan, fieldFor } from '$lib/sim/defaults';
import { CARD_HEIGHT, CARD_WIDTH, cardSvg } from './card';

function defaultCard(id: string): string {
	const body = bodyById(id);
	return cardSvg(body, defaultPlan(body, fieldFor(body)));
}

describe('share card', () => {
	it('names the body and states the GPS clock rate for the default Earth scene', () => {
		const svg = defaultCard('earth');
		expect(svg).toContain(`width="${CARD_WIDTH}" height="${CARD_HEIGHT}"`);
		expect(svg).toContain('>Earth</text>');
		expect(svg).toMatch(/>38\.[56]\d µs per day fast<\/text>/);
		expect(svg).toMatch(/>20 2\d\d km above the surface<\/text>/);
		expect(svg).toContain('>time</text>');
	});

	it('draws the start orbit as an accent path around an ink disc', () => {
		const svg = defaultCard('earth');
		expect(svg).toMatch(/<path d="M[\d. ]+L[\d. ]+/);
		expect(svg).toContain('stroke="#b23a1d"');
		expect(svg).toMatch(/<circle cx="\d+(\.\d+)?" cy="\d+(\.\d+)?" r="[\d.]+" fill="#16150f"\/>/);
	});

	it('draws the flight as an accent path and escapes the body name', () => {
		const body = bodyById('sgr-a-star');
		const field = fieldFor(body);
		const r = 3 * field.isco(1);
		const svg = cardSvg(body, {
			start: { r, phi: 0, kind: 'orbit', direction: 1 },
			manoeuvres: [{ at: 60, kind: 'kick', dv: 0.15 * 299792458, heading: 'inward' }]
		});
		expect(svg).toContain('>Sagittarius A*</text>');
		expect(svg).toMatch(/<path d="M[\d. ]+L[\d. ]+/);
		expect(svg).toContain('stroke="#b23a1d"');
		expect(svg).toMatch(/>Earth runs [\d.]+× faster</);
		expect(svg).toMatch(/above the horizon</);
	});

	it('says the clock stopped when the flight falls through the horizon', () => {
		const body = bodyById('m87-star');
		const field = fieldFor(body);
		const svg = cardSvg(body, {
			start: { r: 4 * field.isco(1), phi: 0, kind: 'orbit', direction: 1 },
			manoeuvres: [{ at: 1, kind: 'kick', dv: 0.3 * 299792458, heading: 'retrograde' }]
		});
		expect(svg).toContain('>stopped, as Earth sees it</text>');
		expect(svg).toContain('>at the horizon</text>');
	});

	it('treats a start inside the horizon as stopped', () => {
		const body = bodyById('gw150914');
		const field = fieldFor(body);
		const svg = cardSvg(body, {
			start: { r: 0.5 * field.surface, phi: 0, kind: 'hold', direction: 1 },
			manoeuvres: []
		});
		expect(svg).toContain('>stopped, as Earth sees it</text>');
		expect(svg).not.toContain('∞');
	});

	it('raises superscript exponents the font lacks into tspans', () => {
		const body = bodyById('gw150914');
		const field = fieldFor(body);
		const svg = cardSvg(body, {
			start: { r: field.surface * (1 + 1e-10), phi: 0, kind: 'hold', direction: 1 },
			manoeuvres: []
		});
		expect(svg).toMatch(
			/Earth runs [\d.]+×10<tspan baseline-shift="0.5em"[^>]*>\d+<\/tspan> times faster/
		);
		expect(svg).not.toMatch(/[⁰¹²³⁴⁵⁶⁷⁸⁹\u03bc\u2009]/);
	});
});
