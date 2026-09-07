<script lang="ts">
	import { bodies, type Body, type BodyKind } from '$lib/catalogue';

	let { value, onchange }: { value: Body; onchange: (id: string) => void } = $props();

	const GROUPS: { title: string; kinds: BodyKind[] }[] = [
		{ title: 'Solar system', kinds: ['star', 'planet', 'moon'] },
		{ title: 'Stellar remnants', kinds: ['white-dwarf', 'neutron-star', 'magnetar'] },
		{ title: 'Black holes', kinds: ['black-hole'] }
	];
	const KIND_LABEL: Record<BodyKind, string> = {
		star: 'star',
		planet: 'planet',
		moon: 'moon',
		'white-dwarf': 'white dwarf',
		'neutron-star': 'neutron star',
		magnetar: 'magnetar',
		'black-hole': 'black hole'
	};

	const all: readonly Body[] = bodies;
	/** Only bodies that head a scene: companions live inside their primary's scene. */
	const scenes = all.filter(
		(b) =>
			b.companions !== undefined || !all.some((p) => p.companions?.some((c) => c.body === b.id))
	);
	const grouped = GROUPS.map((g) => ({
		...g,
		items: scenes.filter((b) => g.kinds.includes(b.kind))
	})).filter((g) => g.items.length > 0);
	const flat = grouped.flatMap((g) => g.items);

	let open = $state(false);
	let active = $state(0);
	let root: HTMLDivElement;
	let listId = `bodies-${Math.random().toString(36).slice(2, 8)}`;

	function show() {
		active = Math.max(
			0,
			flat.findIndex((b) => b.id === value.id)
		);
		open = true;
	}
	function choose(id: string) {
		open = false;
		if (id !== value.id) onchange(id);
	}
	function onKey(e: KeyboardEvent) {
		if (!open) {
			if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				show();
			}
			return;
		}
		switch (e.key) {
			case 'ArrowDown':
				active = Math.min(flat.length - 1, active + 1);
				break;
			case 'ArrowUp':
				active = Math.max(0, active - 1);
				break;
			case 'Home':
				active = 0;
				break;
			case 'End':
				active = flat.length - 1;
				break;
			case 'Enter':
			case ' ':
				choose(flat[active].id);
				break;
			case 'Escape':
				open = false;
				break;
			default:
				return;
		}
		e.preventDefault();
	}
	function onFocusOut(e: FocusEvent) {
		if (!root.contains(e.relatedTarget as Node | null)) open = false;
	}
</script>

<div class="picker" bind:this={root} onfocusout={onFocusOut}>
	<button
		type="button"
		class="current"
		aria-haspopup="listbox"
		aria-expanded={open}
		aria-controls={listId}
		onclick={() => (open ? (open = false) : show())}
		onkeydown={onKey}
	>
		<span class="label">Near</span>
		<span class="name">{value.name}</span>
		<span class="kind">{KIND_LABEL[value.kind]}</span>
		<svg class="chevron" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 4l4 4 4-4" /></svg>
	</button>
	{#if open}
		<ul id={listId} class="list" role="listbox" aria-label="Scene" tabindex="-1" onkeydown={onKey}>
			{#each grouped as g (g.title)}
				<li class="group" role="presentation">
					<span class="label">{g.title}</span>
					<ul role="group" aria-label={g.title}>
						{#each g.items as b (b.id)}
							{@const i = flat.indexOf(b)}
							<li
								role="option"
								aria-selected={b.id === value.id}
								class:active={i === active}
								tabindex="-1"
								onpointerenter={() => (active = i)}
								onclick={() => choose(b.id)}
								onkeydown={onKey}
							>
								<span class="name">{b.name}</span>
								<span class="summary">{b.summary}</span>
							</li>
						{/each}
					</ul>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.picker {
		position: relative;
	}
	.current {
		width: 100%;
		display: grid;
		grid-template-columns: 1fr auto;
		grid-template-areas:
			'label chevron'
			'name chevron'
			'kind chevron';
		text-align: left;
		padding: 10px 12px;
		gap: 0 8px;
		align-items: center;
		--button-bg: var(--paper);
	}
	.current:hover {
		background: var(--paper);
		color: var(--ink);
	}
	.current:hover .name {
		color: var(--accent);
	}
	.current .label {
		grid-area: label;
	}
	.current .name {
		grid-area: name;
		font-size: 17px;
		font-weight: 500;
	}
	.current .kind {
		grid-area: kind;
		font-size: 13px;
		color: var(--ink-soft);
	}
	.chevron {
		grid-area: chevron;
		width: 12px;
		height: 12px;
		fill: none;
		stroke: var(--ink);
		stroke-width: 1.2;
	}
	.list {
		position: absolute;
		z-index: 5;
		top: calc(100% - var(--hair));
		left: 0;
		right: 0;
		margin: 0;
		padding: 0;
		list-style: none;
		background: var(--paper);
		border: var(--hair) solid var(--ink);
		max-height: min(70dvh, 560px);
		overflow-y: auto;
	}
	.group {
		padding: 10px 12px 4px;
		border-top: var(--hair) solid var(--rule);
	}
	.group:first-child {
		border-top: 0;
	}
	.group ul {
		list-style: none;
		margin: 6px 0 0;
		padding: 0;
	}
	[role='option'] {
		display: grid;
		gap: 2px;
		padding: 10px 8px;
		margin: 0 -8px;
		min-height: 44px;
		cursor: pointer;
	}
	[role='option'].active {
		background: var(--ink);
		color: var(--paper);
	}
	[role='option'].active .summary {
		color: var(--rule);
	}
	[role='option'][aria-selected='true'] .name {
		color: var(--accent);
	}
	[role='option'].active[aria-selected='true'] .name {
		color: var(--paper);
	}
	.summary {
		font-size: 13px;
		color: var(--ink-soft);
		line-height: 1.35;
	}
</style>
