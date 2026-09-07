import { bodyById, type Body } from '$lib/catalogue';
import { cardSvg } from '$lib/og/card';
import { renderPng } from '$lib/og/render';
import { defaultPlan, fieldFor } from '$lib/sim/defaults';
import { decodeScene } from '$lib/sim/url';
import type { Plan } from '$lib/physics';
import type { RequestHandler } from './$types';

function defaultScene(): { body: Body; plan: Plan } {
	const body = bodyById('earth');
	return { body, plan: defaultPlan(body, fieldFor(body)) };
}

function svgFor(encoded: string | null): string {
	const scene = encoded ? decodeScene(encoded) : null;
	if (scene) {
		try {
			return cardSvg(bodyById(scene.body), scene.plan);
		} catch {
			// a stale or hand-edited link still gets a card
		}
	}
	const { body, plan } = defaultScene();
	return cardSvg(body, plan);
}

export const GET: RequestHandler = async ({ url }) => {
	const encoded = url.searchParams.get('s');
	const png = await renderPng(svgFor(encoded));
	return new Response(png, {
		headers: {
			'Content-Type': 'image/png',
			'Cache-Control': encoded ? 'public, max-age=31536000, immutable' : 'public, max-age=86400'
		}
	});
};
