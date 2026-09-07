<script lang="ts">
	import { formatDuration, formatLength, formatSpeed } from '$lib/format';
	import type { Heading } from '$lib/physics';
	import type { Scene } from '$lib/sim/scene.svelte';

	let { scene }: { scene: Scene } = $props();

	const FRACTIONS = [0.05, 0.2, 0.5];
	const HEADINGS: { key: Heading; label: string }[] = [
		{ key: 'prograde', label: 'Prograde' },
		{ key: 'retrograde', label: 'Retrograde' },
		{ key: 'outward', label: 'Outward' },
		{ key: 'inward', label: 'Inward' }
	];

	let fraction = $state(0.2);
	let field = $derived(scene.field);
	let reference = $derived(Math.max(scene.ship.speed, field.orbitLocalSpeed(scene.ship.r)));
	let dv = $derived(fraction * reference);
	let dead = $derived(scene.ship.phase === 'horizon' || scene.ship.phase === 'landed');

	interface StartChoice {
		id: string;
		label: string;
		r: number;
	}
	let startChoices = $derived.by(() => {
		const out: StartChoice[] = [];
		for (const o of scene.body.orbits ?? [])
			out.push({ id: o.id, label: o.name, r: o.radius.value });
		if (field.horizon !== null) {
			out.push({ id: 'isco', label: 'Innermost stable orbit', r: field.isco(1) * 1.001 });
			out.push({ id: 'isco-4', label: 'Four times the ISCO', r: 4 * field.isco(1) });
			out.push({ id: 'isco-20', label: 'Twenty times the ISCO', r: 20 * field.isco(1) });
		} else {
			for (const k of [1.5, 3, 10]) {
				out.push({ id: `r-${k}`, label: `${k} radii out`, r: k * field.surface });
			}
		}
		out.sort((a, b) => a.r - b.r);
		return out;
	});
	let currentStart = $derived(
		startChoices.find((c) => Math.abs(c.r - scene.plan.start.r) / c.r < 1e-6)?.id ?? 'custom'
	);

	function chooseStart(id: string) {
		const c = startChoices.find((x) => x.id === id);
		if (c) scene.setStart({ r: c.r });
	}
	function describe(m: (typeof scene.plan.manoeuvres)[number]): string {
		if (m.kind === 'hold') return `hold station`;
		if (m.dv === 0) return 'let go';
		return `${formatSpeed(m.dv)} ${m.heading}`;
	}
	let scrubMax = $derived(Math.max(60, scene.trajectory.last.t * 1.25));
</script>

<section class="flight" aria-labelledby="flight-heading">
	<h2 id="flight-heading" class="label">Flight</h2>

	<div class="start">
		<label>
			<span class="label">Start on</span>
			<select value={currentStart} onchange={(e) => chooseStart(e.currentTarget.value)}>
				{#each startChoices as c (c.id)}
					<option value={c.id}>{c.label}, {formatLength(c.r - field.surface)} up</option>
				{/each}
				{#if currentStart === 'custom'}
					<option value="custom">{formatLength(scene.plan.start.r - field.surface)} up</option>
				{/if}
			</select>
		</label>
		<div class="row">
			<button
				type="button"
				onclick={() => scene.setStart({ kind: 'orbit', direction: 1 })}
				aria-pressed={scene.plan.start.kind === 'orbit' && scene.plan.start.direction === 1}
			>
				Orbit, prograde
			</button>
			<button
				type="button"
				onclick={() => scene.setStart({ kind: 'orbit', direction: -1 })}
				aria-pressed={scene.plan.start.kind === 'orbit' && scene.plan.start.direction === -1}
			>
				Retrograde
			</button>
			<button
				type="button"
				onclick={() => scene.setStart({ kind: 'hold' })}
				aria-pressed={scene.plan.start.kind === 'hold'}
			>
				Hold
			</button>
		</div>
	</div>

	<div class="kick">
		<span class="label">Kick by {formatSpeed(dv)}</span>
		<div class="row">
			{#each FRACTIONS as f (f)}
				<button type="button" onclick={() => (fraction = f)} aria-pressed={fraction === f}>
					{Math.round(f * 100)}%
				</button>
			{/each}
		</div>
		<div class="row four">
			{#each HEADINGS as h (h.key)}
				<button type="button" disabled={dead} onclick={() => scene.kick(dv, h.key)}
					>{h.label}</button
				>
			{/each}
		</div>
		<div class="row">
			{#if scene.ship.holding}
				<button type="button" disabled={dead} onclick={() => scene.letGo()}>Let go</button>
			{:else}
				<button type="button" disabled={dead} onclick={() => scene.hold()}>Hold station</button>
			{/if}
			<button
				type="button"
				onclick={() => scene.clearManoeuvres()}
				disabled={scene.plan.manoeuvres.length === 0}
			>
				Undo all
			</button>
		</div>
	</div>

	{#if scene.plan.manoeuvres.length > 0}
		<ol class="manoeuvres">
			{#each scene.plan.manoeuvres as m, i (i)}
				<li>
					<span class="n">{formatDuration(m.at)}</span>
					<span>{describe(m)}</span>
					<button
						type="button"
						class="remove"
						onclick={() => scene.removeManoeuvre(i)}
						aria-label="Remove this manoeuvre">×</button
					>
				</li>
			{/each}
		</ol>
	{/if}

	<label class="timeline">
		<span class="label">Elapsed on Earth: {formatDuration(scene.earthElapsed)}</span>
		<input
			type="range"
			min="0"
			max={scrubMax}
			step={scrubMax / 2000}
			value={Math.min(scene.t, scrubMax)}
			oninput={(e) => scene.seek(Number(e.currentTarget.value))}
		/>
	</label>
</section>

<style>
	.flight {
		display: grid;
		gap: 14px;
	}
	h2 {
		margin: 0;
		font-weight: 400;
	}
	.start,
	.kick {
		display: grid;
		gap: 8px;
	}
	.row {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 6px;
	}
	.row.four {
		grid-template-columns: repeat(2, 1fr);
	}
	.row button {
		min-width: 0;
		padding: 0 4px;
		font-size: 13px;
		line-height: 1.2;
	}
	label {
		display: grid;
		gap: 4px;
	}
	select,
	input {
		font: inherit;
		color: inherit;
		background: var(--paper);
		border: var(--hair) solid var(--ink);
		border-radius: 0;
		min-height: 44px;
		padding: 0 10px;
	}
	input[type='range'] {
		border: 0;
		padding: 0;
		accent-color: var(--accent);
	}
	.manoeuvres {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 2px;
		font-size: 13px;
	}
	.manoeuvres li {
		display: grid;
		grid-template-columns: 7ch 1fr 44px;
		align-items: center;
		gap: 8px;
		border-bottom: var(--hair) solid var(--rule);
	}
	.n {
		color: var(--ink-soft);
	}
	.remove {
		border: 0;
		min-height: 40px;
	}
	button[aria-pressed='true'] {
		background: var(--ink);
		color: var(--paper);
	}
	button:disabled {
		color: var(--ink-faint);
		cursor: default;
	}
	button:disabled:hover {
		background: none;
		color: var(--ink-faint);
	}
</style>
