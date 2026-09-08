<script lang="ts">
	import type { Isochrone, Ring } from './landmarks';
	import { px, sx, sy, type View } from './view';

	let {
		view,
		rings,
		isochrones,
		surface
	}: { view: View; rings: Ring[]; isochrones: Isochrone[]; surface: number } = $props();

	let ox = $derived(sx(view, 0));
	let oy = $derived(sy(view, 0));
</script>

{#each isochrones as iso (iso.rate)}
	<circle cx={ox} cy={oy} r={px(view, iso.r)} class="iso" />
{/each}

{#each rings as ring (ring.label)}
	<circle cx={ox} cy={oy} r={px(view, ring.r)} class="ring" stroke-dasharray={ring.dash} />
{/each}

<circle cx={ox} cy={oy} r={Math.max(1.5, px(view, surface))} class="body central" />

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
