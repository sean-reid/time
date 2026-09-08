<script lang="ts">
	import type { FlightSample } from '$lib/physics';
	import type { Scene } from '$lib/sim/scene.svelte';
	import { Trail, type Point } from './trail';
	import { polarXY, sx, sy, type View } from './view';

	let { view, scene, ship }: { view: View; scene: Scene; ship: Point } = $props();

	let w = $derived(view.w);
	let h = $derived(view.h);
	let mpp = $derived(view.mpp);

	let heading = $derived.by(() => {
		const a = scene.trajectory.stateAt(Math.max(0, scene.t - 1e-3 * Math.max(1, scene.warp)));
		const ax = polarXY(a);
		const bx = polarXY(scene.ship);
		const ang = Math.atan2(bx.y - ax.y, bx.x - ax.x);
		return Number.isFinite(ang) ? (ang * 180) / Math.PI : 0;
	});

	/** The flown path in screen pixels at the current zoom, panned by a transform so it grows in place. */
	const trailCache = new Trail();
	let trailOrigin = $state({ x: 0, y: 0 });
	let trail = $derived.by(() => {
		void scene.samplesVersion;
		const pts = scene.trajectory.samples;
		const origin = trailOrigin;
		const key = `${scene.camera.frame}|${w}|${h}|${origin.x}|${origin.y}`;
		const project = (s: FlightSample) => {
			const p = polarXY(s);
			return { x: w / 2 + (p.x - origin.x) / mpp, y: h / 2 - (p.y - origin.y) / mpp };
		};
		const d = trailCache.extend(pts, key, project);
		const last = pts[pts.length - 1];
		if (!last) return '';
		const p = project(last);
		return `${d}${d ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
	});
	let trailShift = $derived(
		`translate(${((trailOrigin.x - view.cx) / mpp).toFixed(2)} ${(-(trailOrigin.y - view.cy) / mpp).toFixed(2)})`
	);
	$effect(() => {
		const dx = Math.abs(view.cx - trailOrigin.x) / mpp;
		const dy = Math.abs(view.cy - trailOrigin.y) / mpp;
		if (dx > 1e5 || dy > 1e5) trailOrigin = { x: view.cx, y: view.cy };
	});

	let marks = $derived(
		scene.plan.manoeuvres.map((m) => ({ ...polarXY(scene.trajectory.stateAt(m.at)), kind: m.kind }))
	);
</script>

<path d={trail} transform={trailShift} class="course" />
{#each marks as m, i (i)}
	<circle
		cx={sx(view, m.x)}
		cy={sy(view, m.y)}
		r="3.5"
		class="mark"
		class:hold={m.kind === 'hold'}
	/>
{/each}

<g transform="translate({sx(view, ship.x)} {sy(view, ship.y)}) rotate({-heading})">
	<circle r="4" class="ship" />
	<line x1="4" x2="16" class="ship-line" />
</g>
<text x={sx(view, ship.x) + 10} y={sy(view, ship.y) + 14} class="tag accent">You</text>

<style>
	.course {
		fill: none;
		stroke: var(--accent);
		stroke-width: 0.75;
	}
	.mark {
		fill: var(--paper);
		stroke: var(--accent);
		stroke-width: 1.2;
	}
	.mark.hold {
		fill: var(--accent);
	}
	.ship {
		fill: var(--accent);
	}
	.ship-line {
		stroke: var(--accent);
		stroke-width: 1.2;
	}
</style>
