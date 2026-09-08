<script lang="ts">
	import type { Body } from '$lib/catalogue';
	import { formatPercent } from '$lib/format';
	import type { Field } from '$lib/physics';
	import type { Scene } from '$lib/sim/scene.svelte';
	import {
		aroundPoint,
		aroundRing,
		placeCaptions,
		type Direction,
		type Request,
		type Segment
	} from './captions';
	import type { CompanionNow, Isochrone, Ring } from './landmarks';
	import type { Point } from './trail';
	import { polarXY, px, scaleBarBox, sx, sy, visibleRing, type View } from './view';

	let {
		view,
		scene,
		field,
		body,
		rings,
		isochrones,
		companions,
		ship,
		narrow
	}: {
		view: View;
		scene: Scene;
		field: Field;
		body: Body;
		rings: Ring[];
		isochrones: Isochrone[];
		companions: CompanionNow[];
		ship: Point;
		narrow: boolean;
	} = $props();

	const BESIDE: Direction[] = ['E', 'W', 'NE', 'SE', 'NW', 'SW', 'N', 'S'];
	const CORNER: Direction[] = ['SE', 'NE', 'SW', 'NW', 'E', 'W', 'S', 'N'];
	const PATH_SEGMENTS = 256;
	const CLASS = { ink: 'tag', faint: 'tag faint', accent: 'tag accent' };

	let origin = $derived({ x: sx(view, 0), y: sy(view, 0) });
	let surfacePx = $derived(Math.max(1.5, px(view, field.surface)));
	let shipPx = $derived({ x: sx(view, ship.x), y: sy(view, ship.y) });
	let shown = $derived(
		companions
			.filter((c) => visibleRing(view, Math.hypot(c.x, c.y)))
			.map((c) => ({
				name: c.name,
				x: sx(view, c.x),
				y: sy(view, c.y),
				r: Math.max(1.5, px(view, c.radius))
			}))
	);

	/** The flown path as a few hundred chords, enough to keep captions off it. */
	let path = $derived.by(() => {
		void scene.samplesVersion;
		const pts = scene.trajectory.samples;
		const stride = Math.max(1, Math.ceil(pts.length / PATH_SEGMENTS));
		const out: Segment[] = [];
		let prev = polarXY(pts[0]);
		for (let i = stride; i < pts.length + stride; i += stride) {
			const cur = polarXY(pts[Math.min(i, pts.length - 1)]);
			out.push({
				ax: sx(view, prev.x),
				ay: sy(view, prev.y),
				bx: sx(view, cur.x),
				by: sy(view, cur.y)
			});
			prev = cur;
		}
		return out;
	});

	let requests = $derived.by(() => {
		const out: Request[] = [
			{ text: 'You', tone: 'accent', candidates: aroundPoint(shipPx, 8, 'You', CORNER) },
			{
				text: body.name,
				tone: 'ink',
				candidates: aroundPoint(origin, surfacePx + 8, body.name, BESIDE)
			}
		];
		for (const ring of rings) {
			const r = px(view, ring.r);
			if (r >= 24)
				out.push({ text: ring.label, tone: 'ink', candidates: aroundRing(origin, r, ring.label) });
		}
		for (const iso of isochrones) {
			const r = px(view, iso.r);
			const text = `clocks at ${formatPercent(iso.rate)}`;
			if (r >= 24) out.push({ text, tone: 'faint', candidates: aroundRing(origin, r, text) });
		}
		for (const c of shown)
			out.push({ text: c.name, tone: 'ink', candidates: aroundPoint(c, c.r + 6, c.name, BESIDE) });
		return out;
	});

	let placed = $derived(
		placeCaptions(requests, {
			frame: { x: 0, y: 0, w: view.w, h: view.h },
			reserved: [scaleBarBox(view, narrow)],
			solids: [{ ...origin, r: surfacePx }, { ...shipPx, r: 4 }, ...shown],
			lines: [...rings, ...isochrones].map((x) => ({ ...origin, r: px(view, x.r) })),
			path
		})
	);
</script>

{#each placed as p, i (i)}
	<text x={p.x} y={p.y} text-anchor="middle" class={CLASS[p.tone]}>{p.text}</text>
{/each}
