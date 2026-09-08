<script lang="ts">
	import type { CompanionNow } from './landmarks';
	import { px, sx, sy, visibleRing, type View } from './view';

	let { view, companions }: { view: View; companions: CompanionNow[] } = $props();
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
	{/if}
{/each}

<style>
	.orbit {
		fill: none;
		stroke: var(--ink-faint);
		stroke-width: 0.5;
	}
</style>
