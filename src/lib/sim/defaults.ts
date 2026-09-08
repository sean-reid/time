import { bodies, bodyById, type Body, type Companion } from '$lib/catalogue';
import {
	C2,
	G,
	GM_SUN,
	J2000_MS,
	L_C,
	makeField,
	type Attractor,
	type Elements,
	type Field,
	type FieldSource,
	type Plan,
	type Space
} from '$lib/physics';

export function fieldSource(body: Body): FieldSource {
	return { mass: body.mass.value, spin: body.spin?.value, radius: body.radius?.value };
}

export function fieldFor(body: Body): Field {
	return makeField(fieldSource(body));
}

const COMPACT = new Set(['black-hole', 'neutron-star', 'magnetar', 'white-dwarf']);

/** Geodesics around compact bodies; Newtonian motion with a post-Newtonian clock elsewhere. */
export function regimeFor(body: Body): Space['regime'] {
	return COMPACT.has(body.kind) ? 'geodesic' : 'newtonian';
}

/** Seconds from J2000.0 to a wall-clock instant, so companions sit where they really are. */
export function epochSeconds(wallMs: number): number {
	return (wallMs - J2000_MS) / 1000;
}

export function elementsOf(c: Companion): Elements {
	return {
		a: c.semiMajorAxis.value,
		e: c.eccentricity.value,
		period: c.period.value,
		omega: c.argumentOfPeriapsis.value,
		m0: c.meanAnomalyAtEpoch.value
	};
}

/** Companions pull on the ship only in the Newtonian regime; near compact bodies they are scenery. */
export function attractorsFor(body: Body): Attractor[] {
	if (regimeFor(body) === 'geodesic') return [];
	return (body.companions ?? []).map((c) => {
		const partner = bodyById(c.body);
		return {
			mu: G * partner.mass.value,
			radius: partner.radius?.value ?? 0,
			elements: elementsOf(c)
		};
	});
}

/**
 * The Sun's share of a scene's clock deficit: potential plus orbital speed averaged over the
 * scene body's heliocentric orbit, 1.5 GM/(a c²). Earth and the Moon use the IAU value L_C.
 */
export function solarDeficit(body: Body): number {
	if (body.id === 'sun') return 0;
	let target: Body | undefined = body;
	while (target) {
		if (target.id === 'earth' || target.id === 'moon') return L_C;
		const sun = bodyById('sun');
		const orbit = sun.companions?.find((c) => c.body === target!.id);
		if (orbit) return (1.5 * GM_SUN) / (orbit.semiMajorAxis.value * C2);
		const primary = (bodies as readonly Body[]).find((p) =>
			p.companions?.some((c) => c.body === target!.id)
		);
		if (!primary || primary.id === 'sun') return 0;
		target = primary;
	}
	return 0;
}

/** The most massive body that carries this one as a companion, with the orbit it rides. */
export function parentOf(body: Body): { parent: Body; orbit: Companion } | null {
	let best: { parent: Body; orbit: Companion } | null = null;
	for (const parent of bodies as readonly Body[]) {
		const orbit = parent.companions?.find((c) => c.body === body.id);
		if (!orbit || parent.mass.value <= body.mass.value) continue;
		if (!best || parent.mass.value > best.parent.mass.value) best = { parent, orbit };
	}
	return best;
}

function hill(body: Body, parent: Body, orbit: Companion): number {
	const pericentre = orbit.semiMajorAxis.value * (1 - orbit.eccentricity.value);
	return pericentre * Math.cbrt(body.mass.value / (3 * parent.mass.value));
}

/** Hill radius at the pericentre of the body's orbit around its parent, or null without one. */
export function hillRadius(body: Body): number | null {
	const rel = parentOf(body);
	return rel ? hill(body, rel.parent, rel.orbit) : null;
}

export interface Influence {
	/** The outermost body whose pull the scene models, and the Hill radius that bounds it. */
	body: Body;
	radius: number;
	/** That body's orbit as a companion of the scene body, or null when it is the scene body. */
	orbit: Companion | null;
	/** The parent whose pull is missing beyond the radius. */
	missing: Body;
}

/** Where a Newtonian scene stops being right: the Hill sphere of the last body it pulls with. */
export function influenceFor(body: Body): Influence | null {
	if (regimeFor(body) === 'geodesic') return null;
	let current = body;
	let orbit: Companion | null = null;
	for (;;) {
		const rel = parentOf(current);
		if (!rel) return null;
		const pulled = body.companions?.find((c) => c.body === rel.parent.id);
		if (!pulled) {
			return {
				body: current,
				radius: hill(current, rel.parent, rel.orbit),
				orbit,
				missing: rel.parent
			};
		}
		current = rel.parent;
		orbit = pulled;
	}
}

export function spaceFor(body: Body, wallMs: number): Space {
	return {
		field: fieldFor(body),
		regime: regimeFor(body),
		attractors: attractorsFor(body),
		epoch: epochSeconds(wallMs)
	};
}

/** Where a visitor starts around a body: a named orbit if there is one, else a telling radius. */
export function defaultStartRadius(body: Body, field: Field): number {
	const named = body.orbits?.find((o) => o.id === 'gps') ?? body.orbits?.[0];
	if (named) return named.radius.value;
	if (body.kind === 'black-hole') return 2 * field.isco(1);
	if (body.kind === 'neutron-star' || body.kind === 'magnetar') {
		return Math.max(2 * field.surface, 1.2 * field.isco(1));
	}
	if (body.kind === 'star' || body.kind === 'white-dwarf') return 3 * field.surface;
	return 1.5 * field.surface;
}

export function defaultPlan(body: Body, field: Field): Plan {
	return {
		start: { r: defaultStartRadius(body, field), phi: -Math.PI / 4, kind: 'orbit', direction: 1 },
		manoeuvres: []
	};
}

export interface Camera {
	/** Metres visible across the shorter side of the plate. */
	frame: number;
	cx: number;
	cy: number;
	follow: boolean;
}

export function defaultCamera(plan: Plan): Camera {
	return { frame: 2.6 * plan.start.r, cx: 0, cy: 0, follow: false };
}

export const WARPS = [1, 10, 60, 600, 3600, 86_400, 604_800, 2_629_800, 31_557_600];
