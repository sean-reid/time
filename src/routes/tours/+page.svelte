<script lang="ts">
	import { resolve } from '$app/paths';
	import { tours } from '$lib/tours';
</script>

<svelte:head>
	<title>Tours</title>
	<meta
		name="description"
		content="Four guided flights: GPS, a dive to the Sun, a neutron star, and Sagittarius A*."
	/>
</svelte:head>

<header class="bar">
	<a href={resolve('/')} class="wordmark">time</a>
</header>

<main>
	<h1>Tours</h1>
	<p class="lede">
		Four flights with the numbers read out along the way. Leave any of them whenever you like and
		keep flying.
	</p>
	<ol>
		{#each tours as tour (tour.id)}
			<li>
				<a href={resolve(`/?tour=${tour.id}` as `/?${string}`)}>
					<span class="title">{tour.title}</span>
					<span class="blurb">{tour.blurb}</span>
					<span class="label">{tour.body.name}</span>
				</a>
			</li>
		{/each}
	</ol>
</main>

<style>
	.bar {
		padding: 18px 20px 12px;
	}
	.wordmark {
		font-weight: 600;
		font-size: 17px;
		letter-spacing: -0.01em;
	}
	main {
		max-width: 64ch;
		padding: 8px 20px 48px;
	}
	h1 {
		font-size: 22px;
		font-weight: 500;
		margin: 0 0 8px;
	}
	.lede {
		margin: 0 0 28px;
		color: var(--ink-soft);
	}
	ol {
		list-style: none;
		margin: 0;
		padding: 0;
		border-top: var(--hair) solid var(--rule);
	}
	li a {
		display: grid;
		gap: 4px;
		padding: 16px 0;
		border-bottom: var(--hair) solid var(--rule);
	}
	li a:hover .title {
		color: var(--accent);
	}
	.title {
		font-size: 17px;
		font-weight: 500;
	}
	.blurb {
		color: var(--ink-soft);
	}
</style>
