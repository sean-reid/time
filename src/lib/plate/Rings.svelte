<script lang="ts">
	import type { Body } from '$lib/catalogue';
	import { formatPercent } from '$lib/format';
	import { schwarzschildRadius, type Field } from '$lib/physics';
	import { isochroneRadius } from './metric';
	import { px, sx, sy, visibleRing, type View } from './view';

	let { view, field, body }: { view: View; field: Field; body: Body } = $props();

	const ISOCHRONES = [0.9, 0.5, 0.1, 0.01];

	let hole = $derived(field.horizon !== null);
	let rings = $derived.by(() => {
		const out: { r: number; label: string; dash: string }[] = [];
		if (hole) {
			out.push({ r: field.photonOrbit(1), label: 'photon sphere', dash: '2 3' });
			out.push({ r: field.isco(1), label: field.spin ? 'ISCO, prograde' : 'ISCO', dash: '6 4' });
			if (field.spin) {
				out.push({ r: field.isco(-1), label: 'ISCO, retrograde', dash: '6 4' });
				out.push({ r: field.ergosphere!, label: 'ergosphere', dash: '1 3' });
			}
		}
		for (const o of body.orbits ?? []) out.push({ r: o.radius.value, label: o.name, dash: '' });
		return out.filter((x) => visibleRing(view, x.r) && x.r > field.surface);
	});
	let isochrones = $derived.by(() => {
		const rsBody = field.horizon ?? schwarzschildRadius(field.mass);
		return ISOCHRONES.map((rate) => ({ r: isochroneRadius(rsBody, rate), rate })).filter(
			(x) => visibleRing(view, x.r) && x.r > field.surface
		);
	});
	/** Ring radii that get a caption: at least 16 px apart so captions do not stack. */
	let labelled = $derived.by(() => {
		const radii = [...rings.map((r) => r.r), ...isochrones.map((i) => i.r)].sort((a, b) => a - b);
		const keep: number[] = [];
		let last = -Infinity;
		for (const r of radii) {
			const p = px(view, r);
			if (p >= 24 && p - last >= 16) {
				keep.push(r);
				last = p;
			}
		}
		return keep;
	});

	let ox = $derived(sx(view, 0));
	let oy = $derived(sy(view, 0));
	let surfacePx = $derived(Math.max(1.5, px(view, field.surface)));
</script>

{#each isochrones as iso (iso.rate)}
	<circle cx={ox} cy={oy} r={px(view, iso.r)} class="iso" />
	{#if labelled.includes(iso.r)}
		<text x={ox + 4} y={oy - px(view, iso.r) - 5} class="tag faint">
			clocks at {formatPercent(iso.rate)}
		</text>
	{/if}
{/each}

{#each rings as ring (ring.label)}
	<circle cx={ox} cy={oy} r={px(view, ring.r)} class="ring" stroke-dasharray={ring.dash} />
	{#if labelled.includes(ring.r)}
		<text x={ox + 4} y={oy - px(view, ring.r) - 5} class="tag">{ring.label}</text>
	{/if}
{/each}

<circle cx={ox} cy={oy} r={surfacePx} class="body central" />
<text x={ox + surfacePx + 8} y={oy + 4} class="tag">{body.name}</text>

<style>
	.ring {
		fill: none;
		stroke: var(--ink);
		stroke-width: 0.75;
	}
	.iso {
		fill: none;
		stroke: var(--ink-faint);
		stroke-width: 0.75;
		stroke-dasharray: 1 4;
	}
</style>
