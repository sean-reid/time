<script lang="ts">
	import { formatLength, formatPercent } from '$lib/format';
	import { C, dwellEnd, schwarzschildRadius, waypointXY } from '$lib/physics';
	import type { Scene } from '$lib/sim/scene.svelte';
	import { SvelteMap } from 'svelte/reactivity';
	import Grid from './Grid.svelte';
	import { isochroneRadius } from './metric';

	let { scene }: { scene: Scene } = $props();

	let w = $state(1000);
	let h = $state(1000);
	let mpp = $derived(scene.camera.frame / Math.min(w, h));

	const ISOCHRONES = [0.9, 0.5, 0.1, 0.01];

	let shipXY = $derived(waypointXY(scene.ship));
	let centre = $derived(scene.camera.follow ? shipXY : { x: scene.camera.cx, y: scene.camera.cy });

	function sx(x: number) {
		return w / 2 + (x - centre.x) / mpp;
	}
	function sy(y: number) {
		return h / 2 - (y - centre.y) / mpp;
	}
	function px(metres: number) {
		return metres / mpp;
	}
	function visibleRing(r: number) {
		const p = px(r);
		return p > 6 && p < 40_000;
	}

	let field = $derived(scene.field);
	let rs = $derived(field.horizon ?? 0);
	let hole = $derived(field.horizon !== null);
	let rings = $derived.by(() => {
		const out: { r: number; label: string; dash: string; faint?: boolean }[] = [];
		if (hole) {
			out.push({ r: field.photonOrbit(1), label: 'photon sphere', dash: '2 3' });
			out.push({ r: field.isco(1), label: field.spin ? 'ISCO, prograde' : 'ISCO', dash: '6 4' });
			if (field.spin) {
				out.push({ r: field.isco(-1), label: 'ISCO, retrograde', dash: '6 4' });
				out.push({
					r: 2 * (rs / (1 + Math.sqrt(1 - field.spin ** 2))),
					label: 'ergosphere',
					dash: '1 3'
				});
			}
		}
		for (const o of scene.body.orbits ?? [])
			out.push({ r: o.radius.value, label: o.name, dash: '' });
		return out.filter((x) => visibleRing(x.r) && x.r > field.surface);
	});
	let isochrones = $derived.by(() => {
		const rsBody = field.horizon ?? schwarzschildRadius(field.mass);
		return ISOCHRONES.map((rate) => ({ r: isochroneRadius(rsBody, rate), rate })).filter(
			(x) => visibleRing(x.r) && x.r > field.surface
		);
	});
	/** Ring radii that get a caption: at least 16 px apart so captions do not stack. */
	let labelled = $derived.by(() => {
		const radii = [...rings.map((r) => r.r), ...isochrones.map((i) => i.r)].sort((a, b) => a - b);
		const keep: number[] = [];
		let last = -Infinity;
		for (const r of radii) {
			const p = px(r);
			if (p >= 24 && p - last >= 16) {
				keep.push(r);
				last = p;
			}
		}
		return keep;
	});

	let barMetres = $derived(10 ** Math.floor(Math.log10(mpp * 160)));
	let lightLabel = $derived.by(() => {
		const s = barMetres / C;
		if (s < 1) return `${(s * 1000).toPrecision(2)} ms of light`;
		if (s < 60) return `${s.toPrecision(2)} s of light`;
		if (s < 3600) return `${(s / 60).toPrecision(2)} min of light`;
		return `${(s / 3600).toPrecision(2)} h of light`;
	});

	let heading = $derived.by(() => {
		const a = scene.stateAt(Math.max(0, scene.t - 1e-3 * Math.max(1, scene.warp)));
		const b = scene.ship;
		const ax = waypointXY(a);
		const bx = waypointXY(b);
		const ang = Math.atan2(-(bx.y - ax.y), bx.x - ax.x);
		return Number.isFinite(ang) ? (ang * 180) / Math.PI : 0;
	});

	function observe(node: HTMLElement) {
		const ro = new ResizeObserver(([e]) => {
			w = e.contentRect.width;
			h = e.contentRect.height;
		});
		ro.observe(node);
		return { destroy: () => ro.disconnect() };
	}

	function zoomAt(factor: number, atX: number, atY: number) {
		const worldX = centre.x + (atX - w / 2) * mpp;
		const worldY = centre.y - (atY - h / 2) * mpp;
		const frame = Math.min(1e22, Math.max(field.surface * 0.02, scene.camera.frame * factor));
		const nextMpp = frame / Math.min(w, h);
		if (scene.camera.follow) {
			scene.camera = { ...scene.camera, frame };
			return;
		}
		scene.camera = {
			frame,
			cx: worldX - (atX - w / 2) * nextMpp,
			cy: worldY + (atY - h / 2) * nextMpp,
			follow: false
		};
	}

	function onWheel(e: WheelEvent) {
		e.preventDefault();
		zoomAt(Math.exp(e.deltaY * 0.0015), e.offsetX, e.offsetY);
	}

	const pointers = new SvelteMap<number, { x: number; y: number }>();
	let lastPinch = 0;
	let dragging: number | null = null;
	let pressed: { x: number; y: number; moved: boolean } | null = null;

	let snapTo = $derived([
		...rings.map((r) => r.r),
		...isochrones.map((i) => i.r),
		...scene.course.waypoints.filter((w) => w.dwell?.kind === 'orbit').map((w) => w.r)
	]);

	function worldAt(x: number, y: number) {
		return { x: centre.x + (x - w / 2) * mpp, y: centre.y - (y - h / 2) * mpp };
	}
	function waypointAt(x: number, y: number): number | null {
		let best: number | null = null;
		let bestD = 14;
		scene.course.waypoints.forEach((wp, i) => {
			const p = waypointXY(wp);
			const d = Math.hypot(sx(p.x) - x, sy(p.y) - y);
			if (d < bestD) {
				best = i;
				bestD = d;
			}
		});
		return best;
	}

	function onPointerDown(e: PointerEvent) {
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
		pointers.set(e.pointerId, { x: e.offsetX, y: e.offsetY });
		if (pointers.size === 2) {
			lastPinch = pinchDistance();
			dragging = null;
			return;
		}
		pressed = { x: e.offsetX, y: e.offsetY, moved: false };
		dragging = scene.plotting ? waypointAt(e.offsetX, e.offsetY) : null;
	}
	function pinchDistance() {
		const [a, b] = [...pointers.values()];
		return Math.hypot(a.x - b.x, a.y - b.y);
	}
	function onPointerMove(e: PointerEvent) {
		const prev = pointers.get(e.pointerId);
		if (!prev) return;
		const cur = { x: e.offsetX, y: e.offsetY };
		pointers.set(e.pointerId, cur);
		if (pointers.size === 2) {
			const d = pinchDistance();
			if (lastPinch > 0) {
				const [a, b] = [...pointers.values()];
				zoomAt(lastPinch / d, (a.x + b.x) / 2, (a.y + b.y) / 2);
			}
			lastPinch = d;
			return;
		}
		if (e.buttons === 0) return;
		if (pressed && Math.hypot(cur.x - pressed.x, cur.y - pressed.y) > 4) pressed.moved = true;
		if (dragging !== null) {
			const wp = worldAt(cur.x, cur.y);
			scene.moveWaypoint(dragging, wp.x, wp.y, snapTo, 12 * mpp);
			return;
		}
		scene.camera = {
			frame: scene.camera.frame,
			cx: centre.x - (cur.x - prev.x) * mpp,
			cy: centre.y + (cur.y - prev.y) * mpp,
			follow: false
		};
	}
	function onPointerUp(e: PointerEvent) {
		pointers.delete(e.pointerId);
		if (pointers.size < 2) lastPinch = 0;
		if (pressed && !pressed.moved && scene.plotting) {
			const hit = waypointAt(e.offsetX, e.offsetY);
			if (hit !== null) scene.selected = hit;
			else {
				const wp = worldAt(e.offsetX, e.offsetY);
				scene.addWaypointAt(wp.x, wp.y);
			}
		} else if (pressed && !pressed.moved && dragging === null) {
			scene.selected = null;
		}
		if (dragging !== null) scene.selected = dragging;
		dragging = null;
		pressed = null;
	}

	function recentre() {
		scene.camera = { ...scene.camera, cx: 0, cy: 0, follow: false };
	}
	function toggleFollow() {
		scene.camera = { ...scene.camera, follow: !scene.camera.follow };
	}
</script>

<div
	class="plate"
	class:plotting={scene.plotting}
	role="application"
	aria-label="Map of {scene.body.name}. Drag to pan, scroll or pinch to zoom.{scene.plotting
		? ' Tap to add a waypoint, drag one to move it.'
		: ''}"
	use:observe
	onwheel={onWheel}
	onpointerdown={onPointerDown}
	onpointermove={onPointerMove}
	onpointerup={onPointerUp}
	onpointercancel={onPointerUp}
>
	<Grid {mpp} cx={centre.x} cy={centre.y} {rs} inner={field.surface} />

	<svg
		width={w}
		height={h}
		role="img"
		aria-label="{scene.body.name} with your course and your ship"
	>
		{#each isochrones as iso (iso.rate)}
			<circle cx={sx(0)} cy={sy(0)} r={px(iso.r)} class="iso" />
			{#if labelled.includes(iso.r)}
				<text x={sx(0) + 4} y={sy(0) - px(iso.r) - 5} class="tag faint">
					clocks at {formatPercent(iso.rate)}
				</text>
			{/if}
		{/each}

		{#each rings as ring (ring.label)}
			<circle cx={sx(0)} cy={sy(0)} r={px(ring.r)} class="ring" stroke-dasharray={ring.dash} />
			{#if labelled.includes(ring.r)}
				<text x={sx(0) + 4} y={sy(0) - px(ring.r) - 5} class="tag">{ring.label}</text>
			{/if}
		{/each}

		{#if px(field.surface) >= 1.5}
			<circle cx={sx(0)} cy={sy(0)} r={px(field.surface)} class="body" />
		{:else}
			<circle cx={sx(0)} cy={sy(0)} r="1.5" class="body" />
		{/if}
		<text x={sx(0) + Math.max(px(field.surface), 1.5) + 8} y={sy(0) + 4} class="tag">
			{scene.body.name}
		</text>

		{#each scene.course.waypoints as wp, i (i)}
			{@const p = waypointXY(wp)}
			{#if wp.dwell?.kind === 'orbit'}
				<circle cx={sx(0)} cy={sy(0)} r={px(wp.r)} class="course" />
			{/if}
			{#if i < scene.course.waypoints.length - 1}
				{@const from = waypointXY(dwellEnd(wp))}
				{@const q = waypointXY(scene.course.waypoints[i + 1])}
				<line x1={sx(from.x)} y1={sy(from.y)} x2={sx(q.x)} y2={sy(q.y)} class="course" />
			{/if}
			<circle
				cx={sx(p.x)}
				cy={sy(p.y)}
				r={scene.selected === i ? 6 : 3.5}
				class="waypoint"
				class:selected={scene.selected === i}
			/>
			{#if scene.plotting}
				<text x={sx(p.x) + 8} y={sy(p.y) - 6} class="tag accent">{i + 1}</text>
			{/if}
		{/each}

		<g transform="translate({sx(shipXY.x)} {sy(shipXY.y)}) rotate({-heading})">
			<circle r="4" class="ship" />
			<line x1="4" x2="16" class="ship-line" />
		</g>
		<text x={sx(shipXY.x) + 10} y={sy(shipXY.y) + 14} class="tag accent">You</text>
	</svg>

	<div class="scale">
		<span class="bar" style:width="{px(barMetres)}px"></span>
		<span class="tag">{formatLength(barMetres, { roundKm: true })}</span>
		<span class="tag faint">{lightLabel}</span>
	</div>

	<div class="controls">
		<button type="button" onclick={() => zoomAt(1 / 1.6, w / 2, h / 2)} aria-label="Zoom in"
			>+</button
		>
		<button type="button" onclick={() => zoomAt(1.6, w / 2, h / 2)} aria-label="Zoom out">−</button>
		<button type="button" onclick={recentre}>Centre</button>
		<button type="button" onclick={toggleFollow} aria-pressed={scene.camera.follow}>Follow</button>
	</div>
</div>

<style>
	.plate {
		position: absolute;
		inset: 0;
		overflow: hidden;
		touch-action: none;
		cursor: grab;
	}
	.plate:active {
		cursor: grabbing;
	}
	svg {
		position: absolute;
		inset: 0;
		display: block;
	}
	.body {
		fill: var(--ink);
	}
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
	.course {
		fill: none;
		stroke: var(--accent);
		stroke-width: 0.75;
	}
	.waypoint {
		fill: var(--paper);
		stroke: var(--accent);
		stroke-width: 1.2;
	}
	.waypoint.selected {
		fill: var(--accent);
	}
	.plate.plotting {
		cursor: crosshair;
	}
	.ship {
		fill: var(--accent);
	}
	.ship-line {
		stroke: var(--accent);
		stroke-width: 1.2;
	}
	.tag {
		font: 500 11px/1 var(--font);
		fill: var(--ink);
		color: var(--ink);
		letter-spacing: 0.02em;
		paint-order: stroke;
		stroke: var(--paper);
		stroke-width: 3px;
		stroke-linejoin: round;
	}
	.faint {
		fill: var(--ink-faint);
		color: var(--ink-faint);
	}
	.accent {
		fill: var(--accent);
	}
	.scale {
		position: absolute;
		right: 20px;
		bottom: 16px;
		width: max-content;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 3px;
		text-align: right;
		white-space: nowrap;
		pointer-events: none;
	}
	.scale .tag {
		stroke: none;
	}
	.bar {
		position: relative;
		height: 1px;
		background: var(--ink);
		margin-bottom: 4px;
	}
	.bar::before,
	.bar::after {
		content: '';
		position: absolute;
		top: -4px;
		width: 1px;
		height: 9px;
		background: var(--ink);
	}
	.bar::before {
		left: 0;
	}
	.bar::after {
		right: 0;
	}
	.controls {
		position: absolute;
		right: 20px;
		top: 48px;
		display: grid;
		gap: 6px;
	}
	.controls button {
		min-width: 44px;
		padding: 0 10px;
		font-size: 13px;
		background: var(--paper);
	}
	.controls button[aria-pressed='true'] {
		background: var(--ink);
		color: var(--paper);
	}
	@media (max-width: 899px) {
		.controls {
			top: auto;
			bottom: 16px;
			left: 16px;
			right: auto;
			grid-auto-flow: column;
		}
		.scale {
			bottom: 68px;
		}
	}
</style>
