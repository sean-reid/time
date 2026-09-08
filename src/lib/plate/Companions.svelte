<script lang="ts">
	import { bodyById } from '$lib/catalogue';
	import { keplerState } from '$lib/physics';
	import { elementsOf, epochSeconds } from '$lib/sim/defaults';
	import type { Scene } from '$lib/sim/scene.svelte';
	import type { Point } from './trail';
	import { px, sx, sy, visibleRing, type View } from './view';

	let { view, scene, ship }: { view: View; scene: Scene; ship: Point } = $props();

	/** The ellipse each companion follows, in screen space; depends on the camera, not the clock. */
	let orbits = $derived.by(() =>
		(scene.body.companions ?? []).map((c) => {
			const el = elementsOf(c);
			let d = '';
			for (let i = 0; i <= 180; i++) {
				const p = keplerState(el, (el.period * i) / 180);
				d += `${i === 0 ? 'M' : 'L'}${sx(view, p.x).toFixed(1)} ${sy(view, p.y).toFixed(1)}`;
			}
			return d;
		})
	);
	/** Companions where they really are now. */
	let companions = $derived.by(() => {
		const since = epochSeconds(scene.departedAt) + scene.t;
		return (scene.body.companions ?? []).map((c, i) => {
			const partner = bodyById(c.body);
			const now = keplerState(elementsOf(c), since);
			return {
				name: partner.name,
				radius: partner.radius?.value ?? 0,
				x: now.x,
				y: now.y,
				path: orbits[i]
			};
		});
	});
</script>

{#each companions as c (c.name)}
	{#if visibleRing(view, Math.hypot(c.x, c.y))}
		<path d={c.path} class="orbit" />
		<circle
			cx={sx(view, c.x)}
			cy={sy(view, c.y)}
			r={Math.max(1.5, px(view, c.radius))}
			class="body"
		/>
		{#if Math.hypot(sx(view, c.x) - sx(view, ship.x), sy(view, c.y) - sy(view, ship.y)) > 40}
			<text
				x={sx(view, c.x) + Math.max(1.5, px(view, c.radius)) + 6}
				y={sy(view, c.y) + 4}
				class="tag">{c.name}</text
			>
		{/if}
	{/if}
{/each}

<style>
	.orbit {
		fill: none;
		stroke: var(--ink-faint);
		stroke-width: 0.5;
	}
</style>
