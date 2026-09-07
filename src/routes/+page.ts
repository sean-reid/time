import { decodeScene } from '$lib/sim/url';
import { tourById, tourSnapshot } from '$lib/tours';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ url }) => {
	const tourId = url.searchParams.get('tour');
	const tour = tourId ? tourById(tourId) : null;
	if (tour) return { snapshot: tourSnapshot(tour), tourId: tour.id };
	const s = url.searchParams.get('s');
	return { snapshot: s ? decodeScene(s) : null, tourId: null };
};
