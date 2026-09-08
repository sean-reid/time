<script lang="ts">
	import {
		formatDrift,
		formatDuration,
		formatLength,
		formatRelativeRate,
		formatSpeed,
		formatThrust,
		formatWarp
	} from '$lib/format';
	import type { Scene } from '$lib/sim/scene.svelte';
	import Clock from './Clock.svelte';

	let { scene }: { scene: Scene } = $props();

	let altitude = $derived(scene.ship.r - scene.field.surface);
	let status = $derived.by(() => {
		const s = scene.ship;
		switch (s.phase) {
			case 'orbiting':
				return `free fall, ${formatDuration(scene.field.orbitPeriod(s.r, scene.plan.start.direction))} per revolution`;
			case 'coasting':
				return 'free fall';
			case 'holding':
				return 'holding station';
			case 'landed':
				return 'landed';
			case 'horizon':
				return 'past the horizon';
		}
	});
</script>

<div class="clocks">
	<Clock label="You" ms={scene.shipMs} accent />
	<Clock label="Earth, sea level" ms={scene.earthMs} />
</div>

<dl class="readout">
	<div>
		<dt class="label">Drift since you left</dt>
		<dd class="big">{formatDrift(scene.drift)}</dd>
	</div>
	<div>
		<dt class="label">Your clock</dt>
		<dd>{formatRelativeRate(scene.shipDeficit, scene.earthDeficit)}</dd>
	</div>
	<div class="pair">
		<div>
			<dt class="label">{scene.field.horizon !== null ? 'Above horizon' : 'Altitude'}</dt>
			<dd>{altitude > 0 && scene.ship.phase !== 'horizon' ? formatLength(altitude) : 'none'}</dd>
		</div>
		<div>
			<dt class="label">Speed</dt>
			<dd>{scene.ship.phase === 'horizon' ? 'none' : formatSpeed(scene.ship.speed)}</dd>
		</div>
	</div>
	<div class="pair">
		<div>
			<dt class="label">Thrust to hold</dt>
			<dd>
				{scene.ship.phase === 'horizon' ? 'nothing holds station' : formatThrust(scene.ship.thrust)}
			</dd>
		</div>
		<div>
			<dt class="label">Ship</dt>
			<dd>{status}</dd>
		</div>
	</div>
</dl>

<div class="warp">
	<span class="label">Time</span>
	<div class="stepper">
		<button
			type="button"
			onclick={() => scene.stepWarp(-1)}
			aria-label="Slow time down"
			disabled={scene.warp === 1}>−</button
		>
		<span>{formatWarp(scene.warp)}</span>
		<button
			type="button"
			onclick={() => scene.stepWarp(1)}
			aria-label="Speed time up"
			disabled={scene.warp >= scene.maxWarp}
		>
			+
		</button>
	</div>
	<div class="row three">
		<button type="button" onclick={() => (scene.playing = !scene.playing)}>
			{scene.playing ? 'Pause' : 'Resume'}
		</button>
		<button type="button" onclick={() => scene.restart()}>Restart</button>
		<button
			type="button"
			onclick={() => (scene.sound = !scene.sound)}
			aria-pressed={scene.sound}
			aria-label="Tick sound, hear both clocks"
		>
			Tick
		</button>
	</div>
</div>

<style>
	.clocks {
		display: grid;
		gap: 20px;
	}
	.readout {
		margin: 0;
		display: grid;
		gap: 14px;
	}
	.readout div {
		display: grid;
		gap: 2px;
	}
	.readout dd {
		margin: 0;
	}
	.pair {
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 12px;
	}
	.big {
		font-size: 22px;
		font-weight: 500;
		line-height: 1.1;
	}
	.warp {
		display: grid;
		gap: 8px;
	}
	.stepper {
		display: grid;
		grid-template-columns: 44px minmax(0, 1fr) 44px;
		align-items: center;
		border: var(--hair) solid var(--ink);
	}
	.stepper button {
		border: 0;
		min-height: 44px;
	}
	.stepper span {
		text-align: center;
		font-size: 13px;
		padding: 0 6px;
	}
	.row {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 8px;
	}
	.row.three {
		grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
	}
	.row button {
		min-width: 0;
		padding: 0 8px;
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
	@media (max-width: 899px) {
		.clocks {
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 12px;
		}
		.readout {
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 10px 12px;
		}
		.readout .pair {
			grid-column: 1 / -1;
		}
		.big {
			font-size: 20px;
		}
	}
</style>
