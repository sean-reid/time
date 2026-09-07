import type { Body, Quantity, Source } from './types';

const G = 6.6743e-11;
const GM_SUN = 1.32712440018e20;
const M_SUN = GM_SUN / G;
const AU = 149597870700;
const PC = (648000 / Math.PI) * AU;
const R_SUN = 6.957e8;
const R_EARTH = 6.371e6;
const R_EARTH_EQUATORIAL = 6378137;

const SOLAR_MASS_NOTE =
	'Converted with the IAU 2015 nominal GM_sun = 1.32712440018e20 m^3 s^-2 and CODATA 2018 G = 6.67430e-11 m^3 kg^-1 s^-2.';

const iau2015: Source = {
	label: 'Prsa et al. 2016, IAU 2015 Resolution B3 nominal values',
	url: 'https://arxiv.org/abs/1605.09788'
};
const iau2012: Source = {
	label: 'IAU 2012 Resolution B2, astronomical unit',
	url: 'https://syrte.obspm.fr/IAU_resolutions/Res_IAU2012_B2.pdf'
};
const iersConstants: Source = {
	label: 'IERS Earth orientation centre, useful constants',
	url: 'https://hpiers.obspm.fr/eop-pc/models/constants.html'
};
const nasaEarth: Source = {
	label: 'NASA NSSDCA Earth fact sheet',
	url: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html'
};
const nasaMercury: Source = {
	label: 'NASA NSSDCA Mercury fact sheet',
	url: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/mercuryfact.html'
};
const nasaMoon: Source = {
	label: 'NASA NSSDCA Moon fact sheet',
	url: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html'
};
const nasaJupiter: Source = {
	label: 'NASA NSSDCA Jupiter fact sheet',
	url: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/jupiterfact.html'
};
const nasaIss: Source = {
	label: 'NASA, International Space Station reference',
	url: 'https://www.nasa.gov/reference/international-space-station/'
};
const gpsGov: Source = {
	label: 'GPS.gov, space segment',
	url: 'https://www.gps.gov/space-segment'
};
const nasaOrbits: Source = {
	label: 'NASA Earthdata, satellite orbits',
	url: 'https://www.earthdata.nasa.gov/learn/earth-observation-data-basics/orbits'
};
const bond2017: Source = {
	label: 'Bond et al. 2017, ApJ 840, 70',
	url: 'https://arxiv.org/abs/1703.10625'
};
const joyce2018: Source = {
	label: 'Joyce et al. 2018, MNRAS 481, 2361',
	url: 'https://arxiv.org/abs/1809.01240'
};
const antoniadis2013: Source = {
	label: 'Antoniadis et al. 2013, Science 340, 448',
	url: 'https://arxiv.org/abs/1304.6875'
};
const ozelFreire2016: Source = {
	label: 'Ozel and Freire 2016, ARA&A 54, 401',
	url: 'https://arxiv.org/abs/1603.02698'
};
const riley2021: Source = {
	label: 'Riley et al. 2021, ApJL 918, L27',
	url: 'https://arxiv.org/abs/2105.06980'
};
const mcgill: Source = {
	label: 'Olausen and Kaspi 2014, McGill magnetar catalog',
	url: 'https://www.physics.mcgill.ca/~pulsar/magnetar/main.html'
};
const millerJones2021: Source = {
	label: 'Miller-Jones et al. 2021, Science 371, 1046',
	url: 'https://arxiv.org/abs/2102.09091'
};
const zhao2021: Source = {
	label: 'Zhao et al. 2021, ApJ 908, 117',
	url: 'https://arxiv.org/abs/2102.09093'
};
const gravity2022: Source = {
	label: 'GRAVITY Collaboration 2022, A&A 657, L12',
	url: 'https://arxiv.org/abs/2112.07478'
};
const daly2024: Source = {
	label: 'Daly et al. 2024, MNRAS 527, 428',
	url: 'https://arxiv.org/abs/2310.12108'
};
const eht2019: Source = {
	label: 'EHT Collaboration 2019, ApJL 875, L1',
	url: 'https://arxiv.org/abs/1906.11238'
};
const tamburini2020: Source = {
	label: 'Tamburini, Thide and Della Valle 2020, MNRAS 492, L22',
	url: 'https://arxiv.org/abs/1904.07923'
};
const ligo2016: Source = {
	label: 'LIGO and Virgo Collaborations 2016, PRL 116, 061102',
	url: 'https://arxiv.org/abs/1602.03837'
};

function solarMasses(n: number, source: Source, detail: string): Quantity {
	return { value: n * M_SUN, unit: 'kg', source, note: `${detail} ${SOLAR_MASS_NOTE}` };
}

function parsecs(n: number, source: Source, detail: string): Quantity {
	return {
		value: n * PC,
		unit: 'm',
		source,
		note: `${detail} 1 pc = 648000/pi au with the IAU 2012 au.`
	};
}

export const bodies = [
	{
		id: 'sun',
		name: 'Sun',
		kind: 'star',
		mass: {
			value: M_SUN,
			unit: 'kg',
			source: iau2015,
			note: `One nominal solar mass. ${SOLAR_MASS_NOTE}`
		},
		radius: { value: R_SUN, unit: 'm', source: iau2015, note: 'IAU 2015 nominal solar radius.' },
		distanceFromEarth: {
			value: AU,
			unit: 'm',
			source: iau2012,
			note: 'One astronomical unit, the mean Earth to Sun distance.'
		},
		summary:
			'A clock at the surface of the Sun runs about a minute a year slower than one far from it.'
	},
	{
		id: 'mercury',
		name: 'Mercury',
		kind: 'planet',
		mass: { value: 0.3301e24, unit: 'kg', source: nasaMercury },
		radius: { value: 2.4397e6, unit: 'm', source: nasaMercury, note: 'Volumetric mean radius.' },
		summary:
			'The smallest planet, whose orbit was the first place the gravity of general relativity was seen to differ from Newton.'
	},
	{
		id: 'earth',
		name: 'Earth',
		kind: 'planet',
		mass: { value: 5.9722e24, unit: 'kg', source: nasaEarth },
		radius: { value: R_EARTH, unit: 'm', source: nasaEarth, note: 'Volumetric mean radius.' },
		rotationPeriod: {
			value: 86164.0905,
			unit: 's',
			source: iersConstants,
			note: 'Mean sidereal day.'
		},
		summary: 'Home, and the reference clock every other body here is compared against.',
		orbits: [
			{
				id: 'iss',
				name: 'International Space Station',
				radius: {
					value: R_EARTH + 420e3,
					unit: 'm',
					source: nasaIss,
					note: '420 km above the mean radius; NASA gives an operating band of 370 to 460 km.'
				}
			},
			{
				id: 'gps',
				name: 'GPS constellation',
				radius: {
					value: R_EARTH + 20200e3,
					unit: 'm',
					source: gpsGov,
					note: '20 200 km above the mean radius.'
				}
			},
			{
				id: 'geostationary',
				name: 'Geostationary orbit',
				radius: {
					value: R_EARTH_EQUATORIAL + 35786e3,
					unit: 'm',
					source: nasaOrbits,
					note: '35 786 km above the equator, using the WGS 84 equatorial radius of 6378.137 km.'
				}
			},
			{
				id: 'moon',
				name: 'Moon',
				radius: {
					value: 384400e3,
					unit: 'm',
					source: nasaMoon,
					note: 'Semimajor axis of the lunar orbit.'
				}
			}
		]
	},
	{
		id: 'moon',
		name: 'Moon',
		kind: 'moon',
		mass: { value: 0.07346e24, unit: 'kg', source: nasaMoon },
		radius: { value: 1.7374e6, unit: 'm', source: nasaMoon, note: 'Volumetric mean radius.' },
		distanceFromEarth: {
			value: 384400e3,
			unit: 'm',
			source: nasaMoon,
			note: 'Semimajor axis of the lunar orbit.'
		},
		summary:
			'A clock on the Moon gains about 56 microseconds a day on one at sea level, mostly because it sits higher in the gravity of Earth.'
	},
	{
		id: 'jupiter',
		name: 'Jupiter',
		kind: 'planet',
		mass: { value: 1898.13e24, unit: 'kg', source: nasaJupiter },
		radius: { value: 69.911e6, unit: 'm', source: nasaJupiter, note: 'Volumetric mean radius.' },
		summary:
			'The largest planet, with a surface potential about 30 times deeper than that of Earth and a hundredth of that of the Sun.'
	},
	{
		id: 'sirius-b',
		name: 'Sirius B',
		kind: 'white-dwarf',
		mass: solarMasses(1.018, bond2017, 'Dynamical mass 1.018 +/- 0.011 solar masses.'),
		radius: {
			value: 0.00803 * R_SUN,
			unit: 'm',
			source: joyce2018,
			note: '0.00803 +/- 0.00011 solar radii from the flux and parallax, scaled by the IAU 2015 nominal solar radius.'
		},
		distanceFromEarth: parsecs(1000 / 378.9, bond2017, 'Parallax 378.9 +/- 1.4 mas.'),
		summary:
			'The nearest white dwarf, a solar mass packed into a body the size of Earth, whose gravitational redshift has been measured directly.'
	},
	{
		id: 'psr-j0348-0432',
		name: 'PSR J0348+0432',
		kind: 'neutron-star',
		mass: solarMasses(2.01, antoniadis2013, 'Pulsar mass 2.01 +/- 0.04 solar masses.'),
		radius: {
			value: 12e3,
			unit: 'm',
			source: riley2021,
			note: 'Assumed, not measured. NICER finds 12.39 km for PSR J0740+6620, the other two solar mass pulsar.'
		},
		rotationPeriod: {
			value: 0.0391226569017806,
			unit: 's',
			source: antoniadis2013,
			note: 'Spin period from radio timing.'
		},
		distanceFromEarth: parsecs(2100, antoniadis2013, 'Distance 2.1 +/- 0.2 kpc.'),
		summary:
			'One of the heaviest neutron stars known, two solar masses spinning 25 times a second in a 2.5 hour orbit with a white dwarf.'
	},
	{
		id: 'sgr-1806-20',
		name: 'SGR 1806-20',
		kind: 'magnetar',
		mass: solarMasses(
			1.4,
			ozelFreire2016,
			'Assumed canonical neutron star mass; magnetar masses are not measured.'
		),
		radius: {
			value: 12e3,
			unit: 'm',
			source: ozelFreire2016,
			note: 'Assumed, not measured. Inferred neutron star radii cluster between 10 and 13 km.'
		},
		rotationPeriod: {
			value: 7.54773,
			unit: 's',
			source: mcgill,
			note: 'Spin period from X-ray timing.'
		},
		distanceFromEarth: parsecs(8700, mcgill, 'Distance 8.7 (+1.8, -1.5) kpc.'),
		summary:
			'The magnetar whose 2004 giant flare was the brightest event ever seen from outside the solar system, with a field a thousand times a typical pulsar.'
	},
	{
		id: 'cygnus-x-1',
		name: 'Cygnus X-1',
		kind: 'black-hole',
		mass: solarMasses(21.2, millerJones2021, 'Black hole mass 21.2 +/- 2.2 solar masses.'),
		spin: {
			value: 0.9985,
			unit: '1',
			source: zhao2021,
			note: 'Lower bound: a* > 0.9985 at 3 sigma from continuum fitting.'
		},
		distanceFromEarth: parsecs(2220, millerJones2021, 'Distance 2.22 (+0.18, -0.17) kpc.'),
		summary:
			'The first black hole identified, a 21 solar mass companion to a blue supergiant and spinning close to the limit.'
	},
	{
		id: 'sgr-a-star',
		name: 'Sagittarius A*',
		kind: 'black-hole',
		mass: solarMasses(
			4.297e6,
			gravity2022,
			'Mass (4.297 +/- 0.012) million solar masses from stellar orbits.'
		),
		spin: {
			value: 0.9,
			unit: '1',
			source: daly2024,
			note: 'Poorly constrained. Outflow method gives 0.90 +/- 0.06; EHT models admit spins from 0.5 to 0.94 and stellar orbit limits favour lower values.'
		},
		distanceFromEarth: parsecs(8277, gravity2022, 'Distance 8277 +/- 9 pc.'),
		summary:
			'The black hole at the centre of the Milky Way, weighed by tracking stars through full orbits around it.'
	},
	{
		id: 'm87-star',
		name: 'M87*',
		kind: 'black-hole',
		mass: solarMasses(
			6.5e9,
			eht2019,
			'Mass (6.5 +/- 0.7) billion solar masses from the shadow diameter.'
		),
		spin: {
			value: 0.9,
			unit: '1',
			source: tamburini2020,
			note: 'Uncertain. 0.90 +/- 0.05 from the twisted light of the ring; EHT model comparison only requires a non-zero spin.'
		},
		distanceFromEarth: parsecs(16.8e6, eht2019, 'Distance 16.8 +/- 0.8 Mpc.'),
		summary:
			'The first black hole ever imaged, six and a half billion solar masses at the heart of the Virgo cluster.'
	},
	{
		id: 'gw150914',
		name: 'GW150914 remnant',
		kind: 'black-hole',
		mass: solarMasses(62, ligo2016, 'Final black hole mass 62 +/- 4 solar masses.'),
		spin: {
			value: 0.67,
			unit: '1',
			source: ligo2016,
			note: 'Final black hole spin 0.67 (+0.05, -0.07).'
		},
		distanceFromEarth: parsecs(410e6, ligo2016, 'Luminosity distance 410 (+160, -180) Mpc.'),
		summary:
			'The black hole left behind by the first gravitational waves ever detected, formed when two black holes of 36 and 29 solar masses merged.'
	}
] as const satisfies readonly Body[];

export type BodyId = (typeof bodies)[number]['id'];
