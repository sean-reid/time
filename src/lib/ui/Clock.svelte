<script lang="ts">
	import { formatClock } from '$lib/format';

	let {
		label,
		ms,
		accent = false,
		size = 96
	}: { label: string; ms: number; accent?: boolean; size?: number } = $props();

	const r = 46;
	const tick = (i: number, len: number) => {
		const a = (i * Math.PI) / 30;
		const s = Math.sin(a);
		const c = -Math.cos(a);
		return `M${(r * s).toFixed(2)} ${(r * c).toFixed(2)}L${((r - len) * s).toFixed(2)} ${((r - len) * c).toFixed(2)}`;
	};
	const minuteTicks = Array.from({ length: 60 }, (_, i) => (i % 5 ? tick(i, 2.5) : '')).join('');
	const hourTicks = Array.from({ length: 12 }, (_, i) => tick(i * 5, 5)).join('');

	let d = $derived(new Date(ms));
	let secFrac = $derived((d.getSeconds() + (ms % 1000) / 1000) / 60);
	let minFrac = $derived((d.getMinutes() + secFrac) / 60);
	let hourFrac = $derived(((d.getHours() % 12) + minFrac) / 12);
	let color = $derived(accent ? 'var(--accent)' : 'var(--ink)');
</script>

<figure class="clock" style:--size="{size}px">
	<svg viewBox="-50 -50 100 100" width={size} height={size} aria-hidden="true">
		<circle {r} fill="none" stroke="var(--ink)" stroke-width="0.6" />
		<path d={minuteTicks} stroke="var(--ink)" stroke-width="0.5" />
		<path d={hourTicks} stroke="var(--ink)" stroke-width="0.9" />
		<line y2={-22} transform="rotate({hourFrac * 360})" stroke="var(--ink)" stroke-width="2" />
		<line y2={-36} transform="rotate({minFrac * 360})" stroke="var(--ink)" stroke-width="1.4" />
		<line y1={8} y2={-42} transform="rotate({secFrac * 360})" stroke={color} stroke-width="0.7" />
		<circle r="1.6" fill={color} />
	</svg>
	<figcaption>
		<span class="label" style:color={accent ? 'var(--accent)' : undefined}>{label}</span>
		<span class="digits">
			{#each formatClock(ms).split(/([:.])/) as part, i (i)}
				{#if part === ':' || part === '.'}<span class="sep">{part}</span>{:else}<span class="num"
						>{part}</span
					>{/if}
			{/each}
		</span>
	</figcaption>
</figure>

<style>
	.clock {
		margin: 0;
		display: grid;
		gap: 6px;
		justify-items: start;
	}
	figcaption {
		display: grid;
		gap: 1px;
	}
	.digits {
		font-size: 22px;
		font-weight: 500;
		line-height: 1.1;
		white-space: nowrap;
	}
	.sep {
		margin: 0 0.02em;
	}
</style>
