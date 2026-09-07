<script lang="ts">
	import { formatLength } from '$lib/format';

	/** Metres per CSS pixel at the current zoom, centred on Earth. */
	let { metresPerPx, shipAngle }: { metresPerPx: number; shipAngle: number } = $props();

	const EARTH_R = 6.371e6;
	const GPS_R = 2.656e7;
	const ISS_R = 6.371e6 + 4.2e5;
	const LIGHT = 299_792_458;

	let w = $state(1000);
	let h = $state(1000);

	let earth = $derived(EARTH_R / metresPerPx);
	let gps = $derived(GPS_R / metresPerPx);
	let iss = $derived(ISS_R / metresPerPx);
	let sx = $derived(Math.cos(shipAngle) * gps);
	let sy = $derived(Math.sin(shipAngle) * gps);
	let barMetres = $derived(10 ** Math.floor(Math.log10(metresPerPx * 160)));
	let bar = $derived(barMetres / metresPerPx);
	let gridStep = $derived(bar / 2);
	let gridCount = $derived(Math.ceil(Math.max(w, h) / gridStep / 2) + 1);
	let gridLines = $derived(Array.from({ length: gridCount }, (_, i) => i * gridStep));

	function observe(node: HTMLElement) {
		const ro = new ResizeObserver(([entry]) => {
			w = entry.contentRect.width;
			h = entry.contentRect.height;
		});
		ro.observe(node);
		return { destroy: () => ro.disconnect() };
	}
</script>

<div class="plate" use:observe>
	<svg
		viewBox="{-w / 2} {-h / 2} {w} {h}"
		width={w}
		height={h}
		role="img"
		aria-label="Earth with the GPS orbit and your ship"
	>
		<g stroke="var(--grid)" stroke-width="0.75">
			{#each gridLines as g (g)}
				<line x1={g} x2={g} y1={-h} y2={h} />
				<line x1={-g} x2={-g} y1={-h} y2={h} />
				<line y1={g} y2={g} x1={-w} x2={w} />
				<line y1={-g} y2={-g} x1={-w} x2={w} />
			{/each}
		</g>

		<circle r={iss} fill="none" stroke="var(--ink)" stroke-width="0.5" stroke-dasharray="2 3" />
		<circle r={gps} fill="none" stroke="var(--ink)" stroke-width="0.75" />
		<circle r={earth} fill="var(--ink)" />

		<text x={earth + 10} y="4" class="tag">Earth</text>
		<text x="-4" y={gps + 16} text-anchor="end" class="tag"
			>GPS orbit, {formatLength(GPS_R - EARTH_R)} up</text
		>
		<text x="4" y={-iss - 6} class="tag faint">ISS</text>

		<g transform="translate({sx} {sy}) rotate({(shipAngle * 180) / Math.PI + 90})">
			<circle r="4" fill="var(--accent)" />
			<line y1="-4" y2="-16" stroke="var(--accent)" stroke-width="1.2" />
		</g>
		<text x={sx + 10} y={sy + 4} class="tag accent">You</text>
	</svg>

	<div class="scale">
		<span class="bar" style:width="{bar}px"></span>
		<span class="tag">{formatLength(barMetres)}</span>
		<span class="tag faint">{((barMetres / LIGHT) * 1000).toPrecision(2)} ms of light</span>
	</div>
</div>

<style>
	.plate {
		position: absolute;
		inset: 0;
		overflow: hidden;
	}
	svg {
		display: block;
	}
	.tag {
		font: 500 11px/1 var(--font);
		fill: var(--ink);
		letter-spacing: 0.02em;
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
		display: grid;
		justify-items: end;
		gap: 3px;
		text-align: right;
		white-space: nowrap;
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
</style>
