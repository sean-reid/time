<script lang="ts">
	import type { Scene } from '$lib/sim/scene.svelte';
	import { currentStop, type Tour } from '$lib/tours';

	let { scene, tour, onleave }: { scene: Scene; tour: Tour; onleave: () => void } = $props();

	let over = $derived(scene.t >= scene.flight.totalT);
	let index = $derived(currentStop(tour, scene.ship.segment, over));
	let stop = $derived(tour.stops[index]);
	let last = $derived(index === tour.stops.length - 1);

	$effect(() => {
		const frame = stop.frame;
		if (frame !== undefined && Math.abs(scene.camera.frame - frame) / frame > 1e-6) {
			scene.camera = { ...scene.camera, frame };
		}
	});

	function next() {
		const target = tour.stops[index + 1];
		if (!target) return;
		if (target.segment === 'end') {
			scene.t = scene.flight.totalT + 1;
			return;
		}
		const sample = scene.flight.samples.find((s) => s.segment >= (target.segment as number));
		if (sample) scene.t = sample.t;
	}
</script>

<div class="tour" aria-live="polite">
	<p class="label">{tour.title}, stop {index + 1} of {tour.stops.length}</p>
	<p class="text">{stop.text(scene)}</p>
	<div class="row">
		{#if !last}
			<button type="button" onclick={next}>Next stop</button>
		{/if}
		<button type="button" onclick={onleave}>Leave the tour</button>
	</div>
</div>

<style>
	.tour {
		display: grid;
		gap: 8px;
		max-width: 44ch;
	}
	.tour p {
		margin: 0;
	}
	.text {
		font-size: 14px;
	}
	.row {
		display: flex;
		gap: 8px;
	}
	.row button {
		font-size: 13px;
		--button-bg: var(--paper);
	}
</style>
