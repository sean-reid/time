import type { Body, Companion, Quantity } from './types';

const G = 6.6743e-11;
const GM_SUN = 1.32712440018e20;
const M_SUN = GM_SUN / G;
const AU = 149597870700;
const PC = (648000 / Math.PI) * AU;
const R_SUN = 6.957e8;
const R_EARTH = 6.371e6;
const R_EARTH_EQUATORIAL = 6378137;
const DAY = 86400;
const JULIAN_YEAR = 365.25 * DAY;
const TAU = 2 * Math.PI;
/** J2000.0 as a decimal Julian year and as a Modified Julian Date. */
const J2000_YEAR = 2000;
const J2000_MJD = 51544.5;

function solarMasses(n: number): Quantity {
	return { value: n * M_SUN, unit: 'kg' };
}

function parsecs(n: number): Quantity {
	return { value: n * PC, unit: 'm' };
}

function wrapAngle(radians: number): number {
	return ((radians % TAU) + TAU) % TAU;
}

function degrees(n: number): number {
	return wrapAngle((n * Math.PI) / 180);
}

/** Mean anomaly at J2000.0 from a periapsis passage and period, both in Julian years or both in days. */
function meanAnomalyAtJ2000(epoch: number, periapsis: number, period: number): number {
	return wrapAngle((TAU * (epoch - periapsis)) / period);
}

function keplerSemiMajorAxis(totalMass: number, period: number): number {
	return Math.cbrt((G * totalMass * period ** 2) / (4 * Math.PI ** 2));
}

interface J2000Elements {
	meanLongitude: number;
	longitudeOfPerihelion: number;
	longitudeOfNode: number;
}

function planet(
	body: string,
	semiMajorAxisMillionKm: number,
	eccentricity: number,
	periodDays: number,
	el: J2000Elements
): Companion {
	return {
		body,
		semiMajorAxis: { value: semiMajorAxisMillionKm * 1e9, unit: 'm' },
		eccentricity: { value: eccentricity, unit: '1' },
		period: { value: periodDays * DAY, unit: 's' },
		argumentOfPeriapsis: { value: degrees(el.longitudeOfPerihelion), unit: '1' },
		meanAnomalyAtEpoch: {
			value: degrees(el.meanLongitude - el.longitudeOfPerihelion),
			unit: '1'
		}
	};
}

function lunarOrbit(body: string): Companion {
	return {
		body,
		semiMajorAxis: { value: 384400e3, unit: 'm' },
		eccentricity: { value: 0.0549, unit: '1' },
		period: { value: 27.3217 * DAY, unit: 's' },
		argumentOfPeriapsis: { value: 0, unit: '1' },
		meanAnomalyAtEpoch: { value: 0, unit: '1' }
	};
}

const SIRIUS_PERIOD_YEARS = 50.1284;
const SIRIUS_PERIASTRON_YEAR = 1994.5715;
const PSR_J0348_PERIOD_DAYS = 0.102424062722;
const PSR_J0348_ASCENDING_NODE_MJD = 56000.084771047;
const CYGNUS_X1_PERIOD_DAYS = 5.599829;
const S2_PERIOD_YEARS = 16.0455;
const S2_PERIASTRON_YEAR = 2018.379;

export const bodies = [
	{
		id: 'sun',
		name: 'Sun',
		kind: 'star',
		mass: { value: M_SUN, unit: 'kg' },
		radius: { value: R_SUN, unit: 'm' },
		distanceFromEarth: { value: AU, unit: 'm' },
		summary:
			'A clock at the surface of the Sun runs about a minute a year slower than one far from it.',
		companions: [
			planet('mercury', 57.909, 0.2056, 87.969, {
				meanLongitude: 252.2503235,
				longitudeOfPerihelion: 77.45779628,
				longitudeOfNode: 48.33076593
			}),
			planet('venus', 108.21, 0.0068, 224.701, {
				meanLongitude: 181.9790995,
				longitudeOfPerihelion: 131.60246718,
				longitudeOfNode: 76.67984255
			}),
			planet('earth', 149.598, 0.0167, 365.256, {
				meanLongitude: 100.46457166,
				longitudeOfPerihelion: 102.93768193,
				longitudeOfNode: 0
			}),
			planet('mars', 227.956, 0.0935, 686.98, {
				meanLongitude: -4.55343205,
				longitudeOfPerihelion: -23.94362959,
				longitudeOfNode: 49.55953891
			}),
			planet('jupiter', 778.479, 0.0487, 4332.589, {
				meanLongitude: 34.39644051,
				longitudeOfPerihelion: 14.72847983,
				longitudeOfNode: 100.47390909
			})
		]
	},
	{
		id: 'mercury',
		name: 'Mercury',
		kind: 'planet',
		mass: { value: 0.3301e24, unit: 'kg' },
		radius: { value: 2.4397e6, unit: 'm' },
		summary:
			'The smallest planet, whose orbit was the first place the gravity of general relativity was seen to differ from Newton.'
	},
	{
		id: 'venus',
		name: 'Venus',
		kind: 'planet',
		mass: { value: 4.8673e24, unit: 'kg' },
		radius: { value: 6.0518e6, unit: 'm' },
		summary:
			'Nearly a twin of Earth in size and mass, so a clock on its surface runs at very nearly the same rate as one at sea level here.'
	},
	{
		id: 'earth',
		name: 'Earth',
		kind: 'planet',
		mass: { value: 5.9722e24, unit: 'kg' },
		radius: { value: R_EARTH, unit: 'm' },
		rotationPeriod: { value: 86164.0905, unit: 's' },
		summary: 'Home, and the reference clock every other body here is compared against.',
		orbits: [
			{
				id: 'iss',
				name: 'International Space Station',
				radius: { value: R_EARTH + 420e3, unit: 'm' }
			},
			{ id: 'gps', name: 'GPS constellation', radius: { value: R_EARTH + 20200e3, unit: 'm' } },
			{
				id: 'geostationary',
				name: 'Geostationary orbit',
				radius: { value: R_EARTH_EQUATORIAL + 35786e3, unit: 'm' }
			},
			{ id: 'moon', name: 'Moon', radius: { value: 384400e3, unit: 'm' } }
		],
		companions: [lunarOrbit('moon')]
	},
	{
		id: 'moon',
		name: 'Moon',
		kind: 'moon',
		mass: { value: 0.07346e24, unit: 'kg' },
		radius: { value: 1.7374e6, unit: 'm' },
		distanceFromEarth: { value: 384400e3, unit: 'm' },
		summary:
			'A clock on the Moon gains about 56 microseconds a day on one at sea level, mostly because it sits higher in the gravity of Earth.',
		companions: [lunarOrbit('earth')]
	},
	{
		id: 'mars',
		name: 'Mars',
		kind: 'planet',
		mass: { value: 0.64169e24, unit: 'kg' },
		radius: { value: 3.3895e6, unit: 'm' },
		summary:
			'A tenth the mass of Earth, with a surface potential a fifth as deep, so its clocks run a little faster than ours.'
	},
	{
		id: 'jupiter',
		name: 'Jupiter',
		kind: 'planet',
		mass: { value: 1898.13e24, unit: 'kg' },
		radius: { value: 69.911e6, unit: 'm' },
		summary:
			'The largest planet, with a surface potential about 30 times deeper than that of Earth and a hundredth of that of the Sun.'
	},
	{
		id: 'sirius-b',
		name: 'Sirius B',
		kind: 'white-dwarf',
		mass: solarMasses(1.018),
		radius: { value: 0.00803 * R_SUN, unit: 'm' },
		distanceFromEarth: parsecs(1000 / 378.9),
		summary:
			'The nearest white dwarf, a solar mass packed into a body the size of Earth, whose gravitational redshift has been measured directly.',
		companions: [
			{
				body: 'sirius-a',
				semiMajorAxis: { value: (7.4957 / 0.3789) * AU, unit: 'm' },
				eccentricity: { value: 0.59142, unit: '1' },
				period: { value: SIRIUS_PERIOD_YEARS * JULIAN_YEAR, unit: 's' },
				argumentOfPeriapsis: { value: degrees(149.161 + 180), unit: '1' },
				meanAnomalyAtEpoch: {
					value: meanAnomalyAtJ2000(J2000_YEAR, SIRIUS_PERIASTRON_YEAR, SIRIUS_PERIOD_YEARS),
					unit: '1'
				}
			}
		]
	},
	{
		id: 'sirius-a',
		name: 'Sirius A',
		kind: 'star',
		mass: solarMasses(2.063),
		radius: { value: 1.711 * R_SUN, unit: 'm' },
		distanceFromEarth: parsecs(1000 / 378.9),
		summary:
			'The brightest star in the night sky, twice the mass of the Sun and the primary that Sirius B circles every fifty years.'
	},
	{
		id: 'psr-j0348-0432',
		name: 'PSR J0348+0432',
		kind: 'neutron-star',
		mass: solarMasses(2.01),
		radius: { value: 12e3, unit: 'm' },
		rotationPeriod: { value: 0.0391226569017806, unit: 's' },
		distanceFromEarth: parsecs(2100),
		summary:
			'One of the heaviest neutron stars known, two solar masses spinning 25 times a second in a 2.5 hour orbit with a white dwarf.',
		companions: [
			{
				body: 'psr-j0348-0432-b',
				semiMajorAxis: { value: 0.832e9, unit: 'm' },
				eccentricity: { value: 0, unit: '1' },
				period: { value: PSR_J0348_PERIOD_DAYS * DAY, unit: 's' },
				argumentOfPeriapsis: { value: 0, unit: '1' },
				meanAnomalyAtEpoch: {
					value: meanAnomalyAtJ2000(J2000_MJD, PSR_J0348_ASCENDING_NODE_MJD, PSR_J0348_PERIOD_DAYS),
					unit: '1'
				}
			}
		]
	},
	{
		id: 'psr-j0348-0432-b',
		name: 'PSR J0348+0432 B',
		kind: 'white-dwarf',
		mass: solarMasses(0.172),
		radius: { value: 0.065 * R_SUN, unit: 'm' },
		distanceFromEarth: parsecs(2100),
		summary:
			'The light helium white dwarf whose spectral lines weighed the pulsar it circles every 2.46 hours.'
	},
	{
		id: 'sgr-1806-20',
		name: 'SGR 1806-20',
		kind: 'magnetar',
		mass: solarMasses(1.4),
		radius: { value: 12e3, unit: 'm' },
		rotationPeriod: { value: 7.54773, unit: 's' },
		distanceFromEarth: parsecs(8700),
		summary:
			'The magnetar whose 2004 giant flare was the brightest event ever seen from outside the solar system, with a field a thousand times a typical pulsar.'
	},
	{
		id: 'cygnus-x-1',
		name: 'Cygnus X-1',
		kind: 'black-hole',
		mass: solarMasses(21.2),
		spin: { value: 0.9985, unit: '1' },
		distanceFromEarth: parsecs(2220),
		summary:
			'The first black hole identified, a 21 solar mass companion to a blue supergiant and spinning close to the limit.',
		companions: [
			{
				body: 'hde-226868',
				semiMajorAxis: {
					value: keplerSemiMajorAxis((21.2 + 40.6) * M_SUN, CYGNUS_X1_PERIOD_DAYS * DAY),
					unit: 'm'
				},
				eccentricity: { value: 0.0189, unit: '1' },
				period: { value: CYGNUS_X1_PERIOD_DAYS * DAY, unit: 's' },
				argumentOfPeriapsis: { value: degrees(306.6), unit: '1' },
				meanAnomalyAtEpoch: { value: 0, unit: '1' }
			}
		]
	},
	{
		id: 'hde-226868',
		name: 'HDE 226868',
		kind: 'star',
		mass: solarMasses(40.6),
		radius: { value: 22.3 * R_SUN, unit: 'm' },
		distanceFromEarth: parsecs(2220),
		summary:
			'The blue supergiant whose wind feeds Cygnus X-1, forty solar masses in a 5.6 day orbit with the black hole.'
	},
	{
		id: 'sgr-a-star',
		name: 'Sagittarius A*',
		kind: 'black-hole',
		mass: solarMasses(4.297e6),
		spin: { value: 0.9, unit: '1' },
		distanceFromEarth: parsecs(8277),
		summary:
			'The black hole at the centre of the Milky Way, weighed by tracking stars through full orbits around it.',
		companions: [
			{
				body: 's2',
				semiMajorAxis: { value: 0.125058 * 8246.7 * AU, unit: 'm' },
				eccentricity: { value: 0.884649, unit: '1' },
				period: { value: S2_PERIOD_YEARS * JULIAN_YEAR, unit: 's' },
				argumentOfPeriapsis: { value: degrees(66.263), unit: '1' },
				meanAnomalyAtEpoch: {
					value: meanAnomalyAtJ2000(J2000_YEAR, S2_PERIASTRON_YEAR, S2_PERIOD_YEARS),
					unit: '1'
				}
			}
		]
	},
	{
		id: 's2',
		name: 'S2',
		kind: 'star',
		mass: solarMasses(13.6),
		radius: { value: 5.53 * R_SUN, unit: 'm' },
		distanceFromEarth: parsecs(8277),
		summary:
			'The star whose 16 year orbit around Sagittarius A* showed the gravitational redshift and the precession of general relativity.'
	},
	{
		id: 'm87-star',
		name: 'M87*',
		kind: 'black-hole',
		mass: solarMasses(6.5e9),
		spin: { value: 0.9, unit: '1' },
		distanceFromEarth: parsecs(16.8e6),
		summary:
			'The first black hole ever imaged, six and a half billion solar masses at the heart of the Virgo cluster.'
	},
	{
		id: 'gw150914',
		name: 'GW150914 remnant',
		kind: 'black-hole',
		mass: solarMasses(62),
		spin: { value: 0.67, unit: '1' },
		distanceFromEarth: parsecs(410e6),
		summary:
			'The black hole left behind by the first gravitational waves ever detected, formed when two black holes of 36 and 29 solar masses merged.'
	}
] as const satisfies readonly Body[];

export type BodyId = (typeof bodies)[number]['id'];
