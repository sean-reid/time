<script lang="ts">
	import { epochSeconds } from '$lib/sim/defaults';
	import type { Scene } from '$lib/sim/scene.svelte';
	import { Gestures, panCamera, zoomCamera } from './camera';
	import Captions from './Captions.svelte';
	import Companions from './Companions.svelte';
	import Course from './Course.svelte';
	import Grid from './Grid.svelte';
	import { companionPaths, companionsNow, isochroneRings, landmarkRings } from './landmarks';
	import Rings from './Rings.svelte';
	import ScaleBar from './ScaleBar.svelte';
	import { polarXY, type View } from './view';

	let { scene }: { scene: Scene } = $props();

	let w = $state(1000);
	let h = $state(1000);
	let mpp = $derived(scene.camera.frame / Math.min(w, h));

	let reducedMotion = $state(false);
	let narrow = $state(false);
	let shownShip = $state({ x: 0, y: 0 });
	let lastShown = 0;
	$effect(() => {
		const xy = polarXY(scene.ship);
		if (!reducedMotion) {
			shownShip = xy;
			return;
		}
		const now = performance.now();
		if (now - lastShown >= 1000) {
			lastShown = now;
			shownShip = xy;
		}
	});
	let centre = $derived(
		scene.camera.follow ? shownShip : { x: scene.camera.cx, y: scene.camera.cy }
	);
	let view = $derived<View>({ w, h, mpp, cx: centre.x, cy: centre.y });

	let field = $derived(scene.field);
	let rs = $derived(field.horizon ?? 0);
	let rings = $derived(landmarkRings(view, field, scene.body));
	let isochrones = $derived(isochroneRings(view, field));
	let paths = $derived(companionPaths(view, scene.body));
	let companions = $derived(
		companionsNow(scene.body, epochSeconds(scene.departedAt) + scene.t, paths)
	);

	function observe(node: HTMLElement) {
		const ro = new ResizeObserver(([e]) => {
			w = e.contentRect.width;
			h = e.contentRect.height;
		});
		ro.observe(node);
		const motion = matchMedia('(prefers-reduced-motion: reduce)');
		reducedMotion = motion.matches;
		const onMotion = () => (reducedMotion = motion.matches);
		motion.addEventListener('change', onMotion);
		const width = matchMedia('(max-width: 899px)');
		narrow = width.matches;
		const onWidth = () => (narrow = width.matches);
		width.addEventListener('change', onWidth);
		return {
			destroy: () => {
				ro.disconnect();
				motion.removeEventListener('change', onMotion);
				width.removeEventListener('change', onWidth);
			}
		};
	}

	function zoomAt(factor: number, atX: number, atY: number) {
		scene.camera = zoomCamera(scene.camera, view, field.surface * 0.02, factor, atX, atY);
	}
	function pan(dx: number, dy: number) {
		scene.camera = panCamera(scene.camera, view, dx, dy);
	}
	function recentre() {
		scene.camera = { ...scene.camera, cx: 0, cy: 0, follow: false };
	}
	function toggleFollow() {
		scene.camera = { ...scene.camera, follow: !scene.camera.follow };
	}
	const gestures = new Gestures({ zoom: zoomAt, pan });

	function onKey(e: KeyboardEvent) {
		switch (e.key) {
			case '+':
			case '=':
				zoomAt(1 / 1.6, w / 2, h / 2);
				break;
			case '-':
			case '_':
				zoomAt(1.6, w / 2, h / 2);
				break;
			case 'ArrowLeft':
				pan(40, 0);
				break;
			case 'ArrowRight':
				pan(-40, 0);
				break;
			case 'ArrowUp':
				pan(0, 40);
				break;
			case 'ArrowDown':
				pan(0, -40);
				break;
			case 'c':
				recentre();
				break;
			case 'f':
				toggleFollow();
				break;
			default:
				return;
		}
		e.preventDefault();
	}
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
<div
	class="plate"
	role="application"
	tabindex="0"
	onkeydown={onKey}
	aria-label="Map of {scene.body
		.name}. Drag or use arrow keys to pan, scroll, pinch or press plus and minus to zoom, c to centre, f to follow the ship."
	use:observe
	onwheel={gestures.onWheel}
	onpointerdown={gestures.onPointerDown}
	onpointermove={gestures.onPointerMove}
	onpointerup={gestures.onPointerUp}
	onpointercancel={gestures.onPointerUp}
>
	<Grid {mpp} cx={centre.x} cy={centre.y} {rs} inner={field.surface} />

	<svg
		width={w}
		height={h}
		role="img"
		aria-label="{scene.body.name} with your course and your ship"
	>
		<Rings {view} {rings} {isochrones} surface={field.surface} />
		<Companions {view} {companions} />
		<Course {view} {scene} ship={shownShip} />
		<Captions
			{view}
			{scene}
			{field}
			body={scene.body}
			{rings}
			{isochrones}
			{companions}
			ship={shownShip}
			{narrow}
		/>
	</svg>

	<ScaleBar {mpp} />

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
	/* Ink shared by every drawing on the plate. */
	.plate :global(.body) {
		fill: var(--ink);
	}
	.plate :global(.tag) {
		font: 500 11px/1 var(--font);
		fill: var(--ink);
		color: var(--ink);
		letter-spacing: 0.02em;
		paint-order: stroke;
		stroke: var(--paper);
		stroke-width: 3px;
		stroke-linejoin: round;
	}
	.plate :global(.faint) {
		fill: var(--ink-faint);
		color: var(--ink-faint);
	}
	.plate :global(.accent) {
		fill: var(--accent);
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
		--button-bg: var(--paper);
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
	}
</style>
