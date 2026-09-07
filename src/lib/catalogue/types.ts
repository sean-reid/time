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
}
