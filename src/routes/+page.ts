import { decodeScene, encodeScene } from '$lib/sim/url';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ url }) => {
	const tourId = url.searchParams.get('tour');
	if (tourId) {
		const [{ tourById, tourSnapshot }, { default: TourBar }] = await Promise.all([
			import('$lib/tours'),
			import('$lib/ui/TourBar.svelte')
		]);
		const tour = tourById(tourId);
		if (tour) {
			const snapshot = tourSnapshot(tour);
			return { snapshot, tour, TourBar, s: encodeScene(snapshot) };
		}
	}
	const s = url.searchParams.get('s');
	return { snapshot: s ? decodeScene(s) : null, tour: null, TourBar: null, s };
};
