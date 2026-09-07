<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { resolve } from '$app/paths';
	import { replaceState } from '$app/navigation';
	import { page } from '$app/state';
	import { formatDrift, formatRelativeRate } from '$lib/format';
	import Plate from '$lib/plate/Plate.svelte';
	import { Scene } from '$lib/sim/scene.svelte';
	import { Ticker } from '$lib/sim/ticker';
	import { encodeScene } from '$lib/sim/url';
	import { tourById } from '$lib/tours';
	import FlightPanel from '$lib/ui/FlightPanel.svelte';
	import BodyPicker from '$lib/ui/BodyPicker.svelte';
	import Instruments from '$lib/ui/Instruments.svelte';
	import TourBar from '$lib/ui/TourBar.svelte';

	let { data } = $props();
	const scene = new Scene(untrack(() => data.snapshot));
	scene.tour = untrack(() => data.tourId);
	let tour = $derived(scene.tour ? tourById(scene.tour) : null);

	const description =
		'Fly past the Sun, a neutron star, or a black hole and watch your clock drift from the one on Earth.';
	const image = $derived.by(() => {
		const url = new URL(resolve('/og'), page.url.origin);
		if (data.s) url.searchParams.set('s', data.s);
		return url.href;
	});

	let note = $derived.by(() => {
		const rate = formatRelativeRate(scene.ship.deficit, scene.earthDeficit);
		if (scene.ship.phase === 'horizon') {
			return 'You crossed the horizon. Nothing holds station inside, and Earth’s clock runs on without you.';
		}
		if (rate.includes('per day'))
			return `Your clock is running ${rate}. Fly closer to something heavy.`;
		if (rate.startsWith('Earth')) return `${rate} than yours here.`;
		return `Here ${rate} than Earth.`;
	});

	const ticker = new Ticker();

	/** Spoken summary for screen readers, refreshed every half minute rather than every frame. */
	let announcement = $state('');
	function announce() {
		const rate = formatRelativeRate(scene.ship.deficit, scene.earthDeficit);
		announcement = `Near ${scene.body.name}. Drift ${formatDrift(scene.drift)}. Your clock: ${rate}.`;
	}

	onMount(() => {
		announce();
		const voice = setInterval(announce, 30_000);
		let prev = performance.now();
		let frame = 0;
		const tick = (now: number) => {
			scene.advance((now - prev) / 1000);
			prev = now;
			if (ticker.running) {
				const w = scene.playing ? scene.warp : 0;
				ticker.update(
					scene.ship.tau,
					w * (1 - scene.ship.deficit),
					scene.earthElapsed,
					w * (1 - scene.earthDeficit)
				);
			}
			frame = requestAnimationFrame(tick);
		};
		frame = requestAnimationFrame(tick);
		return () => {
			cancelAnimationFrame(frame);
			ticker.stop();
			clearInterval(voice);
		};
	});

	$effect(() => {
		if (scene.sound && !ticker.running) ticker.start(scene.ship.tau, scene.earthElapsed);
		if (!scene.sound && ticker.running) ticker.stop();
	});

	let syncTimer: ReturnType<typeof setTimeout> | undefined;
	$effect(() => {
		const query = scene.tour
			? `/?tour=${scene.tour}`
			: `/?s=${encodeScene({
					body: scene.body.id,
					plan: scene.plan,
					warp: scene.warp,
					t: 0,
					camera: scene.camera
				})}`;
		clearTimeout(syncTimer);
		syncTimer = setTimeout(() => replaceState(resolve(query as `/?${string}`), {}), 400);
	});
</script>

<svelte:head>
	<title>time</title>
	<meta name="description" content={description} />
	<meta property="og:title" content="time" />
	<meta property="og:description" content={description} />
	<meta property="og:image" content={image} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:image" content={image} />
</svelte:head>

<main class="app">
	<header class="bar">
		<a href={resolve('/')} class="wordmark">time</a>
		<div class="pick">
			<BodyPicker value={scene.body} onchange={(id) => scene.setBody(id)} />
		</div>
		<nav>
			<a href={resolve('/tours')}>Tours</a>
			<a href={resolve('/how')}>How this works</a>
		</nav>
	</header>

	<section class="view">
		<Plate {scene} />
	</section>
	{#if tour}
		<div class="note">
			<TourBar {scene} {tour} onleave={() => (scene.tour = null)} />
		</div>
	{:else}
		<p class="note">{note}</p>
	{/if}
	<p class="visually-hidden" aria-live="polite">{announcement}</p>

	<aside class="strip">
		<Instruments {scene} />
		<FlightPanel {scene} />
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
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 10px 16px;
		align-items: baseline;
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
		justify-self: end;
	}
	nav a:hover {
		color: var(--ink);
	}
	.pick {
		grid-column: 1 / -1;
		display: grid;
		gap: 2px;
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
		max-width: 44ch;
		font-size: 14px;
		color: var(--ink-soft);
	}
	.note:not(:has(button)) {
		pointer-events: none;
	}
	.strip {
		grid-area: strip;
		display: grid;
		align-content: start;
		gap: 24px;
		padding: 8px 20px 20px;
		overflow-y: auto;
		overflow-x: hidden;
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
			padding: 12px 16px 10px;
			gap: 8px 16px;
		}
		.pick {
			grid-template-columns: auto 1fr;
			align-items: center;
			gap: 8px;
		}
		.view {
			border-left: 0;
			border-top: var(--hair) solid var(--rule);
			border-bottom: var(--hair) solid var(--rule);
			min-height: 46dvh;
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
	}
</style>
