<script lang="ts">
	import { formatClock } from '$lib/format';

	let {
		label,
		ms,
		accent = false,
		size = 96
	}: { label: string; ms: number; accent?: boolean; size?: number } = $props();

	const r = 46;
	const ticks = Array.from({ length: 60 }, (_, i) => i);

	let d = $derived(new Date(ms));
	let secFrac = $derived((d.getSeconds() + (ms % 1000) / 1000) / 60);
	let minFrac = $derived((d.getMinutes() + secFrac) / 60);
	let hourFrac = $derived(((d.getHours() % 12) + minFrac) / 12);
	let color = $derived(accent ? 'var(--accent)' : 'var(--ink)');
</script>

<figure class="clock" style:--size="{size}px">
	<svg viewBox="-50 -50 100 100" width={size} height={size} aria-hidden="true">
		<circle {r} fill="none" stroke="var(--ink)" stroke-width="0.6" />
		{#each ticks as i (i)}
			<line
				y1={-r}
				y2={-r + (i % 5 === 0 ? 5 : 2.5)}
				transform="rotate({i * 6})"
				stroke="var(--ink)"
				stroke-width={i % 5 === 0 ? 0.9 : 0.5}
			/>
		{/each}
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
