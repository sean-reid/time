<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import Clock from '$lib/ui/Clock.svelte';
	import Plate from '$lib/ui/Plate.svelte';
	import { formatDrift, formatRatePerDay } from '$lib/format';

	/** Net GPS clock rate relative to sea level: +45.7 μs/day gravitational, −7.2 μs/day kinematic. */
	const GPS_RATIO = 1 + 38.5e-6 / 86400;
	const GPS_PERIOD_S = 43_082;
	const FRAME_M = 6.4e7;

	let vw = $state(1440);
	let vh = $state(900);
	let metresPerPx = $derived(FRAME_M / Math.min(vw, vh));

	const start = Date.now();
	let now = $state(start);
	let ship = $derived(start + (now - start) * GPS_RATIO);
	let drift = $derived((ship - now) / 1000);
	let angle = $derived(-Math.PI / 4 + ((now - start) / 1000 / GPS_PERIOD_S) * 2 * Math.PI);

	onMount(() => {
		let frame = 0;
		const tick = () => {
			now = Date.now();
			frame = requestAnimationFrame(tick);
		};
		frame = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(frame);
	});
</script>

<svelte:head>
	<title>time</title>
	<meta
		name="description"
		content="Fly past the Sun, a neutron star, or a black hole and watch your clock drift from the one on Earth."
	/>
</svelte:head>

<main class="app">
	<header class="bar">
		<a href={resolve('/')} class="wordmark">time</a>
		<nav>
			<a href={resolve('/tours')}>Tours</a>
			<a href={resolve('/how')}>How this works</a>
		</nav>
	</header>

	<section class="view" bind:clientWidth={vw} bind:clientHeight={vh}>
		<Plate {metresPerPx} shipAngle={angle} />
		<p class="warp">1× real time</p>
	</section>
	<p class="note">
		Your clock is running 38 microseconds a day fast. Fly closer to something heavy.
	</p>

	<aside class="strip">
		<div class="clocks">
			<Clock label="You" ms={ship} accent />
			<Clock label="Earth, sea level" ms={now} />
		</div>
		<dl class="readout">
			<div>
				<dt class="label">Drift since you left</dt>
				<dd class="big num">{formatDrift(drift)}</dd>
			</div>
			<div>
				<dt class="label">Your clock</dt>
				<dd>{formatRatePerDay(GPS_RATIO)}</dd>
			</div>
			<div class="pair">
				<div>
					<dt class="label">Altitude</dt>
					<dd>20&#8201;189 km</dd>
				</div>
				<div>
					<dt class="label">Speed</dt>
					<dd>3.87 km/s</dd>
				</div>
			</div>
			<div class="pair">
				<div>
					<dt class="label">Thrust to hold</dt>
					<dd>0 g, free fall</dd>
				</div>
				<div>
					<dt class="label">Orbit</dt>
					<dd>11 h 58 min</dd>
				</div>
			</div>
		</dl>
		<div class="actions">
			<button type="button">Plot a course</button>
			<button type="button" aria-pressed="false">Tick</button>
		</div>
	</aside>
</main>

<style>
	.app {
		height: 100dvh;
		display: grid;
		grid-template-columns: var(--strip-w) 1fr;
		grid-template-rows: auto 1fr;
		grid-template-areas:
			'bar view'
			'strip view';
	}
	.bar {
		grid-area: bar;
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		padding: 18px 20px 12px;
	}
	.wordmark {
		font-weight: 600;
		font-size: 17px;
		letter-spacing: -0.01em;
	}
	nav {
		display: flex;
		gap: 16px;
		font-size: 13px;
		color: var(--ink-soft);
	}
	nav a:hover {
		color: var(--ink);
	}
	.view {
		grid-area: view;
		position: relative;
		border-left: var(--hair) solid var(--rule);
		overflow: hidden;
	}
	.note {
		grid-area: view;
		align-self: end;
		justify-self: start;
		z-index: 1;
		margin: 0 20px 16px;
		max-width: 34ch;
		font-size: 14px;
		color: var(--ink-soft);
	}
	.warp {
		position: absolute;
		right: 20px;
		top: 16px;
		margin: 0;
		font-size: 13px;
		color: var(--ink-soft);
	}
	.strip {
		grid-area: strip;
		display: grid;
		align-content: start;
		gap: 28px;
		padding: 8px 20px 20px;
	}
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
		grid-template-columns: 1fr 1fr;
		gap: 12px;
	}
	.big {
		font-size: 22px;
		font-weight: 500;
		line-height: 1.1;
	}
	.actions {
		display: flex;
		gap: 8px;
	}
	.actions button:first-child {
		flex: 1;
	}

	@media (max-width: 899px) {
		.app {
			grid-template-columns: 1fr;
			grid-template-rows: auto 1fr auto auto;
			grid-template-areas:
				'bar'
				'view'
				'note'
				'strip';
		}
		.bar {
			padding: 14px 16px 10px;
		}
		.view {
			border-left: 0;
			border-top: var(--hair) solid var(--rule);
			border-bottom: var(--hair) solid var(--rule);
		}
		.note {
			grid-area: note;
			margin: 12px 16px 0;
			max-width: none;
			font-size: 13px;
		}
		.strip {
			padding: 14px 16px calc(14px + env(safe-area-inset-bottom));
			gap: 16px;
		}
		.clocks {
			grid-template-columns: 1fr 1fr;
			gap: 12px;
		}
		.readout {
			grid-template-columns: 1fr 1fr;
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
