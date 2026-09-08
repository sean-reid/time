/** CODATA 2018 and IAU 2015 nominal values, SI. */
export const G = 6.6743e-11;
export const C = 299_792_458;
export const C2 = C * C;

export const GM_SUN = 1.3271244e20;
export const GM_EARTH = 3.986004e14;
export const M_SUN = GM_SUN / G;
export const R_SUN = 6.957e8;
export const R_EARTH = 6.3781e6;
export const AU = 1.495978707e11;

/** IAU 2000 B1.9: rate deficit of a sea-level clock relative to geocentric coordinate time. */
export const L_G = 6.969290134e-10;
/** IAU 2006 B3: rate deficit of a sea-level clock relative to barycentric coordinate time. */
export const L_B = 1.550519768e-8;
/** IAU 2000 B1.5: mean rate deficit of geocentric time relative to barycentric time, the Sun's share at Earth. */
export const L_C = 1.48082686741e-8;

export const SECONDS_PER_DAY = 86_400;
export const SECONDS_PER_YEAR = 365.25 * SECONDS_PER_DAY;
