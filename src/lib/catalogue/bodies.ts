import type { Body, Companion, Quantity, Source } from './types';

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
const nasaVenus: Source = {
	label: 'NASA NSSDCA Venus fact sheet',
	url: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/venusfact.html'
};
const nasaMars: Source = {
	label: 'NASA NSSDCA Mars fact sheet',
	url: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html'
};
const nasaMoon: Source = {
	label: 'NASA NSSDCA Moon fact sheet',
	url: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html'
};
const nasaJupiter: Source = {
	label: 'NASA NSSDCA Jupiter fact sheet',
	url: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/jupiterfact.html'
};
const jplElements: Source = {
	label: 'Standish, Keplerian elements for approximate positions of the major planets, JPL SSD',
	url: 'https://ssd.jpl.nasa.gov/planets/approx_pos.html'
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
const kervella2003: Source = {
	label: 'Kervella et al. 2003, A&A 408, 681',
	url: 'https://arxiv.org/abs/astro-ph/0306604'
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
const brocksopp1999: Source = {
	label: 'Brocksopp et al. 1999, A&A 343, 861',
	url: 'https://arxiv.org/abs/astro-ph/9812077'
};
const zhao2021: Source = {
	label: 'Zhao et al. 2021, ApJ 908, 117',
	url: 'https://arxiv.org/abs/2102.09093'
};
const gravity2020: Source = {
	label: 'GRAVITY Collaboration 2020, A&A 636, L5',
	url: 'https://arxiv.org/abs/2004.07187'
};
const gravity2022: Source = {
	label: 'GRAVITY Collaboration 2022, A&A 657, L12',
	url: 'https://arxiv.org/abs/2112.07478'
};
const habibi2017: Source = {
	label: 'Habibi et al. 2017, ApJ 847, 120',
	url: 'https://arxiv.org/abs/1708.06353'
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

const UNKNOWN_ANGLE = 'Not fixed here; 0 places periapsis on the positive x axis of the plate.';
const UNKNOWN_PHASE = 'Not fixed here; 0 puts the body at periapsis at J2000.0.';

function unknownAngle(source: Source): Quantity {
	return { value: 0, unit: '1', source, note: UNKNOWN_ANGLE };
}

function unknownPhase(source: Source): Quantity {
	return { value: 0, unit: '1', source, note: UNKNOWN_PHASE };
}

interface J2000Elements {
	meanLongitude: number;
	longitudeOfPerihelion: number;
	longitudeOfNode: number;
}

function planet(
	body: string,
	factSheet: Source,
	semiMajorAxisMillionKm: number,
	eccentricity: number,
	periodDays: number,
	el: J2000Elements
): Companion {
	return {
		body,
		semiMajorAxis: { value: semiMajorAxisMillionKm * 1e9, unit: 'm', source: factSheet },
		eccentricity: { value: eccentricity, unit: '1', source: factSheet },
		period: {
			value: periodDays * DAY,
			unit: 's',
			source: factSheet,
			note: 'Sidereal orbit period.'
		},
		argumentOfPeriapsis: {
			value: degrees(el.longitudeOfPerihelion - el.longitudeOfNode),
			unit: '1',
			source: jplElements,
			note: 'Longitude of perihelion minus longitude of the ascending node at J2000, in the ecliptic.'
		},
		meanAnomalyAtEpoch: {
			value: degrees(el.meanLongitude - el.longitudeOfPerihelion),
			unit: '1',
			source: jplElements,
			note: 'Mean longitude minus longitude of perihelion at J2000.'
		}
	};
}

function lunarOrbit(body: string): Companion {
	return {
		body,
		semiMajorAxis: { value: 384400e3, unit: 'm', source: nasaMoon },
		eccentricity: { value: 0.0549, unit: '1', source: nasaMoon },
		period: {
			value: 27.3217 * DAY,
			unit: 's',
			source: nasaMoon,
			note: 'Sidereal revolution period.'
		},
		argumentOfPeriapsis: unknownAngle(nasaMoon),
		meanAnomalyAtEpoch: unknownPhase(nasaMoon)
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
			'A clock at the surface of the Sun runs about a minute a year slower than one far from it.',
		companions: [
			planet('mercury', nasaMercury, 57.909, 0.2056, 87.969, {
				meanLongitude: 252.2503235,
				longitudeOfPerihelion: 77.45779628,
				longitudeOfNode: 48.33076593
			}),
			planet('venus', nasaVenus, 108.21, 0.0068, 224.701, {
				meanLongitude: 181.9790995,
				longitudeOfPerihelion: 131.60246718,
				longitudeOfNode: 76.67984255
			}),
			planet('earth', nasaEarth, 149.598, 0.0167, 365.256, {
				meanLongitude: 100.46457166,
				longitudeOfPerihelion: 102.93768193,
				longitudeOfNode: 0
			}),
			planet('mars', nasaMars, 227.956, 0.0935, 686.98, {
				meanLongitude: -4.55343205,
				longitudeOfPerihelion: -23.94362959,
				longitudeOfNode: 49.55953891
			}),
			planet('jupiter', nasaJupiter, 778.479, 0.0487, 4332.589, {
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
		mass: { value: 0.3301e24, unit: 'kg', source: nasaMercury },
		radius: { value: 2.4397e6, unit: 'm', source: nasaMercury, note: 'Volumetric mean radius.' },
		summary:
			'The smallest planet, whose orbit was the first place the gravity of general relativity was seen to differ from Newton.'
	},
	{
		id: 'venus',
		name: 'Venus',
		kind: 'planet',
		mass: { value: 4.8673e24, unit: 'kg', source: nasaVenus },
		radius: { value: 6.0518e6, unit: 'm', source: nasaVenus, note: 'Volumetric mean radius.' },
		summary:
			'Nearly a twin of Earth in size and mass, so a clock on its surface runs at very nearly the same rate as one at sea level here.'
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
		],
		companions: [lunarOrbit('moon')]
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
			'A clock on the Moon gains about 56 microseconds a day on one at sea level, mostly because it sits higher in the gravity of Earth.',
		companions: [lunarOrbit('earth')]
	},
	{
		id: 'mars',
		name: 'Mars',
		kind: 'planet',
		mass: { value: 0.64169e24, unit: 'kg', source: nasaMars },
		radius: { value: 3.3895e6, unit: 'm', source: nasaMars, note: 'Volumetric mean radius.' },
		summary:
			'A tenth the mass of Earth, with a surface potential a fifth as deep, so its clocks run a little faster than ours.'
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
			'The nearest white dwarf, a solar mass packed into a body the size of Earth, whose gravitational redshift has been measured directly.',
		companions: [
			{
				body: 'sirius-a',
				semiMajorAxis: {
					value: (7.4957 / 0.3789) * AU,
					unit: 'm',
					source: bond2017,
					note: 'Relative orbit semimajor axis 7.4957 +/- 0.0025 arcsec over the adopted parallax 0.3789 +/- 0.0014 arcsec, about 19.8 au.'
				},
				eccentricity: { value: 0.59142, unit: '1', source: bond2017 },
				period: { value: SIRIUS_PERIOD_YEARS * JULIAN_YEAR, unit: 's', source: bond2017 },
				argumentOfPeriapsis: {
					value: degrees(149.161 + 180),
					unit: '1',
					source: bond2017,
					note: 'Longitude of periastron 149.161 deg for B about A, plus 180 deg for A about B.'
				},
				meanAnomalyAtEpoch: {
					value: meanAnomalyAtJ2000(J2000_YEAR, SIRIUS_PERIASTRON_YEAR, SIRIUS_PERIOD_YEARS),
					unit: '1',
					source: bond2017,
					note: 'From the periastron passage T0 = 1994.5715 and the period.'
				}
			}
		]
	},
	{
		id: 'sirius-a',
		name: 'Sirius A',
		kind: 'star',
		mass: solarMasses(2.063, bond2017, 'Dynamical mass 2.063 +/- 0.023 solar masses.'),
		radius: {
			value: 1.711 * R_SUN,
			unit: 'm',
			source: kervella2003,
			note: 'Linear diameter 1.711 +/- 0.013 solar diameters from the interferometric angular diameter and parallax.'
		},
		distanceFromEarth: parsecs(1000 / 378.9, bond2017, 'Parallax 378.9 +/- 1.4 mas.'),
		summary:
			'The brightest star in the night sky, twice the mass of the Sun and the primary that Sirius B circles every fifty years.'
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
			'One of the heaviest neutron stars known, two solar masses spinning 25 times a second in a 2.5 hour orbit with a white dwarf.',
		companions: [
			{
				body: 'psr-j0348-0432-b',
				semiMajorAxis: {
					value: 0.832e9,
					unit: 'm',
					source: antoniadis2013,
					note: "Orbital separation from the timing solution and mass ratio; Kepler's third law with both masses gives the same value."
				},
				eccentricity: {
					value: 0,
					unit: '1',
					source: antoniadis2013,
					note: 'e sin(omega) and e cos(omega) are both of order 1e-6, consistent with circular.'
				},
				period: { value: PSR_J0348_PERIOD_DAYS * DAY, unit: 's', source: antoniadis2013 },
				argumentOfPeriapsis: {
					value: 0,
					unit: '1',
					source: antoniadis2013,
					note: 'Undefined for a circular orbit; phase is counted from the ascending node.'
				},
				meanAnomalyAtEpoch: {
					value: meanAnomalyAtJ2000(J2000_MJD, PSR_J0348_ASCENDING_NODE_MJD, PSR_J0348_PERIOD_DAYS),
					unit: '1',
					source: antoniadis2013,
					note: 'Orbital phase at J2000.0 from the time of ascending node MJD 56000.084771047 and the period.'
				}
			}
		]
	},
	{
		id: 'psr-j0348-0432-b',
		name: 'PSR J0348+0432 B',
		kind: 'white-dwarf',
		mass: solarMasses(0.172, antoniadis2013, 'White dwarf mass 0.172 +/- 0.003 solar masses.'),
		radius: {
			value: 0.065 * R_SUN,
			unit: 'm',
			source: antoniadis2013,
			note: '0.065 +/- 0.005 solar radii from the spectroscopic surface gravity and mass, scaled by the IAU 2015 nominal solar radius.'
		},
		distanceFromEarth: parsecs(2100, antoniadis2013, 'Distance 2.1 +/- 0.2 kpc.'),
		summary:
			'The light helium white dwarf whose spectral lines weighed the pulsar it circles every 2.46 hours.'
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
			'The first black hole identified, a 21 solar mass companion to a blue supergiant and spinning close to the limit.',
		companions: [
			{
				body: 'hde-226868',
				semiMajorAxis: {
					value: keplerSemiMajorAxis((21.2 + 40.6) * M_SUN, CYGNUS_X1_PERIOD_DAYS * DAY),
					unit: 'm',
					source: millerJones2021,
					note: "Kepler's third law with the black hole and star masses and the orbital period; the paper derives 0.244 au the same way."
				},
				eccentricity: { value: 0.0189, unit: '1', source: millerJones2021 },
				period: {
					value: CYGNUS_X1_PERIOD_DAYS * DAY,
					unit: 's',
					source: brocksopp1999,
					note: 'Spectroscopic period 5.599829 +/- 0.000016 d, adopted by Miller-Jones et al. 2021.'
				},
				argumentOfPeriapsis: {
					value: degrees(306.6),
					unit: '1',
					source: millerJones2021,
					note: 'Argument of periastron of the O-star orbit from the radial velocity fit.'
				},
				meanAnomalyAtEpoch: {
					value: 0,
					unit: '1',
					source: millerJones2021,
					note: `${UNKNOWN_PHASE} The published ephemeris is phased to conjunction, not periastron.`
				}
			}
		]
	},
	{
		id: 'hde-226868',
		name: 'HDE 226868',
		kind: 'star',
		mass: solarMasses(40.6, millerJones2021, 'Donor star mass 40.6 (+7.7, -7.1) solar masses.'),
		radius: {
			value: 22.3 * R_SUN,
			unit: 'm',
			source: millerJones2021,
			note: '22.3 +/- 1.8 solar radii, scaled by the IAU 2015 nominal solar radius.'
		},
		distanceFromEarth: parsecs(2220, millerJones2021, 'Distance 2.22 (+0.18, -0.17) kpc.'),
		summary:
			'The blue supergiant whose wind feeds Cygnus X-1, forty solar masses in a 5.6 day orbit with the black hole.'
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
			'The black hole at the centre of the Milky Way, weighed by tracking stars through full orbits around it.',
		companions: [
			{
				body: 's2',
				semiMajorAxis: {
					value: 0.125058 * 8246.7 * AU,
					unit: 'm',
					source: gravity2020,
					note: 'Angular semimajor axis 125.058 mas at the fitted distance 8246.7 pc, about 1031 au.'
				},
				eccentricity: { value: 0.884649, unit: '1', source: gravity2020 },
				period: { value: S2_PERIOD_YEARS * JULIAN_YEAR, unit: 's', source: gravity2020 },
				argumentOfPeriapsis: {
					value: degrees(66.263),
					unit: '1',
					source: gravity2020,
					note: 'Osculating argument of periapsis at the 2010 apocentre.'
				},
				meanAnomalyAtEpoch: {
					value: meanAnomalyAtJ2000(J2000_YEAR, S2_PERIASTRON_YEAR, S2_PERIOD_YEARS),
					unit: '1',
					source: gravity2020,
					note: 'From the pericentre passage 2018.379 and the period.'
				}
			}
		]
	},
	{
		id: 's2',
		name: 'S2',
		kind: 'star',
		mass: solarMasses(
			13.6,
			habibi2017,
			'Spectroscopic-evolutionary mass 13.6 (+2.2, -1.8) solar masses.'
		),
		radius: {
			value: 5.53 * R_SUN,
			unit: 'm',
			source: habibi2017,
			note: '5.53 (+1.77, -0.79) solar radii, scaled by the IAU 2015 nominal solar radius.'
		},
		distanceFromEarth: parsecs(8277, gravity2022, 'Distance 8277 +/- 9 pc.'),
		summary:
			'The star whose 16 year orbit around Sagittarius A* showed the gravitational redshift and the precession of general relativity.'
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
