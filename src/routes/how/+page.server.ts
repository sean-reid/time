import { catalogueSources } from '$lib/catalogue/sources';
import type { PageServerLoad } from './$types';

export const prerender = true;

export const load: PageServerLoad = () => ({ catalogue: catalogueSources() });
