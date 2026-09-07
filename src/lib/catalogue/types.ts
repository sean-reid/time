export interface Source {
	label: string;
	url: string;
}

export interface Quantity {
	value: number;
	unit: 'kg' | 'm' | 's' | '1';
	source: Source;
	note?: string;
}

export type BodyKind =
	'star' | 'planet' | 'moon' | 'white-dwarf' | 'neutron-star' | 'magnetar' | 'black-hole';

/** A named circular orbit, radius measured from the body's centre. */
export interface Orbit {
	id: string;
	name: string;
	radius: Quantity;
}

/** A body on a Kepler orbit around the scene's central body, drawn to scale and moving with time. */
export interface Companion {
	/** Id of a catalogued Body. */
	body: string;
	semiMajorAxis: Quantity;
	/** Unit '1', in [0, 1). */
	eccentricity: Quantity;
	/** Sidereal orbital period. */
	period: Quantity;
	/** Argument of periapsis in the plate plane, radians, unit '1'; 0 when unknown, with a note. */
	argumentOfPeriapsis: Quantity;
	/** Mean anomaly at J2000.0 (JD 2451545.0 TT), radians, unit '1'; 0 when unknown, with a note. */
	meanAnomalyAtEpoch: Quantity;
}

export interface Body {
	id: string;
	name: string;
	kind: BodyKind;
	mass: Quantity;
	/** Physical radius; absent for black holes. */
	radius?: Quantity;
	/** Dimensionless Kerr parameter in [0, 1); black holes only. */
	spin?: Quantity;
	/** Sidereal rotation period. */
	rotationPeriod?: Quantity;
	distanceFromEarth?: Quantity;
	summary: string;
	orbits?: readonly Orbit[];
	companions?: readonly Companion[];
}
