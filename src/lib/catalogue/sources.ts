import type { BodyId } from './bodies';
import type { BodyCitations, Citation, CompanionCitations, Source } from './types';

const SOLAR_MASS_NOTE =
	'Converted with the IAU 2015 nominal GM_sun = 1.32712440018e20 m^3 s^-2 and CODATA 2018 G = 6.67430e-11 m^3 kg^-1 s^-2.';
const PARSEC_NOTE = '1 pc = 648000/pi au with the IAU 2012 au.';
const UNKNOWN_ANGLE = 'Not fixed here; 0 places periapsis on the positive x axis of the plate.';
const UNKNOWN_PHASE = 'Not fixed here; 0 puts the body at periapsis at J2000.0.';

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

function cite(source: Source, note?: string): Citation {
	return note === undefined ? { source } : { source, note };
}

function solarMass(source: Source, detail: string): Citation {
	return cite(source, `${detail} ${SOLAR_MASS_NOTE}`);
}

function parsecs(source: Source, detail: string): Citation {
	return cite(source, `${detail} ${PARSEC_NOTE}`);
}

const volumetricRadius = (source: Source) => cite(source, 'Volumetric mean radius.');

function planet(factSheet: Source): CompanionCitations {
	return {
		semiMajorAxis: cite(factSheet),
		eccentricity: cite(factSheet),
		period: cite(factSheet, 'Sidereal orbit period.'),
		argumentOfPeriapsis: cite(
			jplElements,
			'Longitude of perihelion at J2000, the in-plane direction once inclination is dropped.'
		),
		meanAnomalyAtEpoch: cite(jplElements, 'Mean longitude minus longitude of perihelion at J2000.')
	};
}

const lunarOrbit: CompanionCitations = {
	semiMajorAxis: cite(nasaMoon),
	eccentricity: cite(nasaMoon),
	period: cite(nasaMoon, 'Sidereal revolution period.'),
	argumentOfPeriapsis: cite(nasaMoon, UNKNOWN_ANGLE),
	meanAnomalyAtEpoch: cite(nasaMoon, UNKNOWN_PHASE)
};

export const citations: Readonly<Record<BodyId, BodyCitations>> = {
	sun: {
		mass: cite(iau2015, `One nominal solar mass. ${SOLAR_MASS_NOTE}`),
		radius: cite(iau2015, 'IAU 2015 nominal solar radius.'),
		distanceFromEarth: cite(iau2012, 'One astronomical unit, the mean Earth to Sun distance.'),
		companions: {
			mercury: planet(nasaMercury),
			venus: planet(nasaVenus),
			earth: planet(nasaEarth),
			mars: planet(nasaMars),
			jupiter: planet(nasaJupiter)
		}
	},
	mercury: { mass: cite(nasaMercury), radius: volumetricRadius(nasaMercury) },
	venus: { mass: cite(nasaVenus), radius: volumetricRadius(nasaVenus) },
	earth: {
		mass: cite(nasaEarth),
		radius: volumetricRadius(nasaEarth),
		rotationPeriod: cite(iersConstants, 'Mean sidereal day.'),
		orbits: {
			iss: cite(
				nasaIss,
				'420 km above the mean radius; NASA gives an operating band of 370 to 460 km.'
			),
			gps: cite(gpsGov, '20 200 km above the mean radius.'),
			geostationary: cite(
				nasaOrbits,
				'35 786 km above the equator, using the WGS 84 equatorial radius of 6378.137 km.'
			),
			moon: cite(nasaMoon, 'Semimajor axis of the lunar orbit.')
		},
		companions: { moon: lunarOrbit }
	},
	moon: {
		mass: cite(nasaMoon),
		radius: volumetricRadius(nasaMoon),
		distanceFromEarth: cite(nasaMoon, 'Semimajor axis of the lunar orbit.'),
		companions: { earth: lunarOrbit }
	},
	mars: { mass: cite(nasaMars), radius: volumetricRadius(nasaMars) },
	jupiter: { mass: cite(nasaJupiter), radius: volumetricRadius(nasaJupiter) },
	'sirius-b': {
		mass: solarMass(bond2017, 'Dynamical mass 1.018 +/- 0.011 solar masses.'),
		radius: cite(
			joyce2018,
			'0.00803 +/- 0.00011 solar radii from the flux and parallax, scaled by the IAU 2015 nominal solar radius.'
		),
		distanceFromEarth: parsecs(bond2017, 'Parallax 378.9 +/- 1.4 mas.'),
		companions: {
			'sirius-a': {
				semiMajorAxis: cite(
					bond2017,
					'Relative orbit semimajor axis 7.4957 +/- 0.0025 arcsec over the adopted parallax 0.3789 +/- 0.0014 arcsec, about 19.8 au.'
				),
				eccentricity: cite(bond2017),
				period: cite(bond2017),
				argumentOfPeriapsis: cite(
					bond2017,
					'Longitude of periastron 149.161 deg for B about A, plus 180 deg for A about B.'
				),
				meanAnomalyAtEpoch: cite(
					bond2017,
					'From the periastron passage T0 = 1994.5715 and the period.'
				)
			}
		}
	},
	'sirius-a': {
		mass: solarMass(bond2017, 'Dynamical mass 2.063 +/- 0.023 solar masses.'),
		radius: cite(
			kervella2003,
			'Linear diameter 1.711 +/- 0.013 solar diameters from the interferometric angular diameter and parallax.'
		),
		distanceFromEarth: parsecs(bond2017, 'Parallax 378.9 +/- 1.4 mas.')
	},
	'psr-j0348-0432': {
		mass: solarMass(antoniadis2013, 'Pulsar mass 2.01 +/- 0.04 solar masses.'),
		radius: cite(
			riley2021,
			'Assumed, not measured. NICER finds 12.39 km for PSR J0740+6620, the other two solar mass pulsar.'
		),
		rotationPeriod: cite(antoniadis2013, 'Spin period from radio timing.'),
		distanceFromEarth: parsecs(antoniadis2013, 'Distance 2.1 +/- 0.2 kpc.'),
		companions: {
			'psr-j0348-0432-b': {
				semiMajorAxis: cite(
					antoniadis2013,
					"Orbital separation from the timing solution and mass ratio; Kepler's third law with both masses gives the same value."
				),
				eccentricity: cite(
					antoniadis2013,
					'e sin(omega) and e cos(omega) are both of order 1e-6, consistent with circular.'
				),
				period: cite(antoniadis2013),
				argumentOfPeriapsis: cite(
					antoniadis2013,
					'Undefined for a circular orbit; phase is counted from the ascending node.'
				),
				meanAnomalyAtEpoch: cite(
					antoniadis2013,
					'Orbital phase at J2000.0 from the time of ascending node MJD 56000.084771047 and the period.'
				)
			}
		}
	},
	'psr-j0348-0432-b': {
		mass: solarMass(antoniadis2013, 'White dwarf mass 0.172 +/- 0.003 solar masses.'),
		radius: cite(
			antoniadis2013,
			'0.065 +/- 0.005 solar radii from the spectroscopic surface gravity and mass, scaled by the IAU 2015 nominal solar radius.'
		),
		distanceFromEarth: parsecs(antoniadis2013, 'Distance 2.1 +/- 0.2 kpc.')
	},
	'sgr-1806-20': {
		mass: solarMass(
			ozelFreire2016,
			'Assumed canonical neutron star mass; magnetar masses are not measured.'
		),
		radius: cite(
			ozelFreire2016,
			'Assumed, not measured. Inferred neutron star radii cluster between 10 and 13 km.'
		),
		rotationPeriod: cite(mcgill, 'Spin period from X-ray timing.'),
		distanceFromEarth: parsecs(mcgill, 'Distance 8.7 (+1.8, -1.5) kpc.')
	},
	'cygnus-x-1': {
		mass: solarMass(millerJones2021, 'Black hole mass 21.2 +/- 2.2 solar masses.'),
		spin: cite(zhao2021, 'Lower bound: a* > 0.9985 at 3 sigma from continuum fitting.'),
		distanceFromEarth: parsecs(millerJones2021, 'Distance 2.22 (+0.18, -0.17) kpc.'),
		companions: {
			'hde-226868': {
				semiMajorAxis: cite(
					millerJones2021,
					"Kepler's third law with the black hole and star masses and the orbital period; the paper derives 0.244 au the same way."
				),
				eccentricity: cite(millerJones2021),
				period: cite(
					brocksopp1999,
					'Spectroscopic period 5.599829 +/- 0.000016 d, adopted by Miller-Jones et al. 2021.'
				),
				argumentOfPeriapsis: cite(
					millerJones2021,
					'Argument of periastron of the O-star orbit from the radial velocity fit.'
				),
				meanAnomalyAtEpoch: cite(
					millerJones2021,
					`${UNKNOWN_PHASE} The published ephemeris is phased to conjunction, not periastron.`
				)
			}
		}
	},
	'hde-226868': {
		mass: solarMass(millerJones2021, 'Donor star mass 40.6 (+7.7, -7.1) solar masses.'),
		radius: cite(
			millerJones2021,
			'22.3 +/- 1.8 solar radii, scaled by the IAU 2015 nominal solar radius.'
		),
		distanceFromEarth: parsecs(millerJones2021, 'Distance 2.22 (+0.18, -0.17) kpc.')
	},
	'sgr-a-star': {
		mass: solarMass(
			gravity2022,
			'Mass (4.297 +/- 0.012) million solar masses from stellar orbits.'
		),
		spin: cite(
			daly2024,
			'Poorly constrained. Outflow method gives 0.90 +/- 0.06; EHT models admit spins from 0.5 to 0.94 and stellar orbit limits favour lower values.'
		),
		distanceFromEarth: parsecs(gravity2022, 'Distance 8277 +/- 9 pc.'),
		companions: {
			s2: {
				semiMajorAxis: cite(
					gravity2020,
					'Angular semimajor axis 125.058 mas at the fitted distance 8246.7 pc, about 1031 au.'
				),
				eccentricity: cite(gravity2020),
				period: cite(gravity2020),
				argumentOfPeriapsis: cite(
					gravity2020,
					'Osculating argument of periapsis at the 2010 apocentre.'
				),
				meanAnomalyAtEpoch: cite(
					gravity2020,
					'From the pericentre passage 2018.379 and the period.'
				)
			}
		}
	},
	s2: {
		mass: solarMass(habibi2017, 'Spectroscopic-evolutionary mass 13.6 (+2.2, -1.8) solar masses.'),
		radius: cite(
			habibi2017,
			'5.53 (+1.77, -0.79) solar radii, scaled by the IAU 2015 nominal solar radius.'
		),
		distanceFromEarth: parsecs(gravity2022, 'Distance 8277 +/- 9 pc.')
	},
	'm87-star': {
		mass: solarMass(eht2019, 'Mass (6.5 +/- 0.7) billion solar masses from the shadow diameter.'),
		spin: cite(
			tamburini2020,
			'Uncertain. 0.90 +/- 0.05 from the twisted light of the ring; EHT model comparison only requires a non-zero spin.'
		),
		distanceFromEarth: parsecs(eht2019, 'Distance 16.8 +/- 0.8 Mpc.')
	},
	gw150914: {
		mass: solarMass(ligo2016, 'Final black hole mass 62 +/- 4 solar masses.'),
		spin: cite(ligo2016, 'Final black hole spin 0.67 (+0.05, -0.07).'),
		distanceFromEarth: parsecs(ligo2016, 'Luminosity distance 410 (+160, -180) Mpc.')
	}
};

/** Every source the catalogue cites, once each, in order of first citation. */
export function catalogueSources(): Source[] {
	const seen = new Map<string, Source>();
	const add = (c: Citation) => {
		if (!seen.has(c.source.url)) seen.set(c.source.url, c.source);
	};
	for (const body of Object.values(citations)) {
		for (const key of ['mass', 'radius', 'spin', 'rotationPeriod', 'distanceFromEarth'] as const) {
			const c = body[key];
			if (c) add(c);
		}
		for (const c of Object.values(body.orbits ?? {})) add(c);
		for (const companion of Object.values(body.companions ?? {})) {
			for (const c of Object.values(companion)) add(c);
		}
	}
	return [...seen.values()];
}
