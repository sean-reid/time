import { describe, expect, it } from 'vitest';
import { bodyById } from '$lib/catalogue';
import { defaultCourse, fieldFor } from '$lib/sim/defaults';
import { CARD_HEIGHT, CARD_WIDTH, cardSvg } from './card';

function defaultCard(id: string): string {
	const body = bodyById(id);
	return cardSvg(body, defaultCourse(body, fieldFor(body)));
}

describe('share card', () => {
	it('names the body and states the GPS clock rate for the default Earth scene', () => {
		const svg = defaultCard('earth');
		expect(svg).toContain(`width="${CARD_WIDTH}" height="${CARD_HEIGHT}"`);
		expect(svg).toContain('>Earth</text>');
		expect(svg).toContain('>38.58 µs per day fast</text>');
		expect(svg).toContain('>20 200 km above the surface</text>');
		expect(svg).toContain('>time</text>');
	});

	it('draws the first orbit as an accent hairline circle around an ink disc', () => {
		const svg = defaultCard('earth');
		expect(svg).toMatch(/<circle [^>]*fill="none" stroke="#b23a1d"/);
		expect(svg).toMatch(/<circle [^>]*fill="#16150f"/);
		expect(svg).not.toContain('<path');
	});

	it('follows a transfer as an accent path and escapes the body name', () => {
		const body = bodyById('sgr-a-star');
		const field = fieldFor(body);
		const r = 3 * field.isco(1);
		const svg = cardSvg(body, {
			cruiseSpeed: 3e7,
			waypoints: [
				{ r, phi: 0 },
				{ r: 1.2 * field.surface, phi: 1, dwell: { kind: 'hover', duration: 60 } }
			]
		});
		expect(svg).toContain('>Sagittarius A*</text>');
		expect(svg).toMatch(/<path d="M[\d. ]+L[\d. ]+/);
		expect(svg).toContain('stroke="#b23a1d"');
		expect(svg).toMatch(/>Earth runs [\d.]+× faster</);
		expect(svg).toMatch(/above the horizon</);
	});

	it('says the clock stopped when the course ends inside the horizon', () => {
		const body = bodyById('m87-star');
		const field = fieldFor(body);
		const svg = cardSvg(body, {
			cruiseSpeed: 3e7,
			waypoints: [
				{ r: 4 * field.surface, phi: 0 },
				{ r: 0.5 * field.surface, phi: 0 }
			]
		});
		expect(svg).toContain('>stopped, as Earth sees it</text>');
		expect(svg).toContain('>at the horizon</text>');
	});

	it('treats a course that starts inside the horizon as stopped', () => {
		const body = bodyById('gw150914');
		const field = fieldFor(body);
		const svg = cardSvg(body, {
			cruiseSpeed: 1e6,
			waypoints: [{ r: 0.5 * field.surface, phi: 0, dwell: { kind: 'hover', duration: 1 } }]
		});
		expect(svg).toContain('>stopped, as Earth sees it</text>');
		expect(svg).not.toContain('∞');
	});

	it('raises superscript exponents the font lacks into tspans', () => {
		const body = bodyById('gw150914');
		const field = fieldFor(body);
		const svg = cardSvg(body, {
			cruiseSpeed: 1e6,
			waypoints: [{ r: field.surface * (1 + 1e-13), phi: 0, dwell: { kind: 'hover', duration: 1 } }]
		});
		expect(svg).toMatch(
			/Earth runs [\d.]+×10<tspan baseline-shift="super"[^>]*>\d+<\/tspan> times faster/
		);
		expect(svg).not.toMatch(/[⁰¹²³⁴⁵⁶⁷⁸⁹\u03bc\u2009]/);
	});
});
