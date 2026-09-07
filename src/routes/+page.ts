import { decodeScene } from '$lib/sim/url';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ url }) => {
	const s = url.searchParams.get('s');
	return { snapshot: s ? decodeScene(s) : null };
};
