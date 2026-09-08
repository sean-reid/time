<script lang="ts">
	import { formatLength } from '$lib/format';
	import { C } from '$lib/physics';

	let { mpp }: { mpp: number } = $props();

	let barMetres = $derived(10 ** Math.floor(Math.log10(mpp * 160)));
	let lightLabel = $derived.by(() => {
		const s = barMetres / C;
		const two = (x: number) =>
			x >= 100 ? String(Math.round(x)) : String(Number(x.toPrecision(2)));
		if (s < 1) return `${two(s * 1000)} ms of light`;
		if (s < 60) return `${two(s)} s of light`;
		if (s < 3600) return `${two(s / 60)} min of light`;
		return `${two(s / 3600)} h of light`;
	});
</script>

<div class="scale">
	<span class="bar" style:width="{barMetres / mpp}px"></span>
	<span class="tag">{formatLength(barMetres, { roundKm: true })}</span>
	<span class="tag faint">{lightLabel}</span>
</div>

<style>
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
	@media (max-width: 899px) {
		.scale {
			top: 44px;
			bottom: auto;
		}
	}
</style>
