<script module lang="ts">
	export interface PickerItem {
		id: string;
		name: string;
		/** Shown under the name in the list. */
		detail?: string;
		/** Shown under the name on the closed control; falls back to detail. */
		caption?: string;
	}
	export interface PickerGroup {
		title?: string;
		items: PickerItem[];
	}
</script>

<script lang="ts">
	let {
		label,
		value,
		groups,
		onchange,
		compact = false
	}: {
		label: string;
		value: string;
		groups: PickerGroup[];
		onchange: (id: string) => void;
		/** Show the chosen item's detail beside its name rather than under it. */
		compact?: boolean;
	} = $props();

	let flat = $derived(groups.flatMap((g) => g.items));
	let current = $derived(flat.find((i) => i.id === value) ?? flat[0]);
	let open = $state(false);
	let active = $state(0);
	let root: HTMLDivElement;
	const listId = `picker-${Math.random().toString(36).slice(2, 8)}`;

	function show() {
		active = Math.max(
			0,
			flat.findIndex((i) => i.id === value)
		);
		open = true;
	}
	function choose(id: string) {
		open = false;
		if (id !== value) onchange(id);
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
		class:compact
		role="combobox"
		aria-label={label}
		aria-haspopup="listbox"
		aria-expanded={open}
		aria-controls={listId}
		aria-activedescendant={open ? `${listId}-${active}` : undefined}
		onclick={() => (open ? (open = false) : show())}
		onkeydown={onKey}
	>
		<span class="label">{label}</span>
		<span class="name">{current?.name}</span>
		{#if current?.caption ?? current?.detail}
			<span class="detail">{current?.caption ?? current?.detail}</span>
		{/if}
		<svg class="chevron" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 4l4 4 4-4" /></svg>
	</button>
	{#if open}
		<ul id={listId} class="list" role="listbox" aria-label={label} tabindex="-1" onkeydown={onKey}>
			{#each groups as g, gi (g.title ?? gi)}
				<li class="group" role="presentation">
					{#if g.title}
						<span class="label">{g.title}</span>
					{/if}
					<ul role="group" aria-label={g.title}>
						{#each g.items as item (item.id)}
							{@const i = flat.indexOf(item)}
							<li
								id="{listId}-{i}"
								role="option"
								aria-selected={item.id === value}
								class:active={i === active}
								class:compact
								tabindex="-1"
								onpointerenter={() => (active = i)}
								onclick={() => choose(item.id)}
								onkeydown={onKey}
							>
								<span class="name">{item.name}</span>
								{#if item.detail}
									<span class="detail">{item.detail}</span>
								{/if}
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
		min-width: 0;
	}
	.current {
		width: 100%;
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		grid-template-areas:
			'label chevron'
			'name chevron'
			'detail chevron';
		text-align: left;
		padding: 10px 12px;
		gap: 0 8px;
		align-items: center;
		--button-bg: var(--paper);
	}
	.current.compact {
		grid-template-areas:
			'label chevron'
			'name chevron';
		padding: 8px 12px;
	}
	.current.compact .detail {
		display: none;
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
		overflow-wrap: anywhere;
	}
	.current.compact .name {
		font-size: 15px;
	}
	.current .detail {
		grid-area: detail;
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
	[role='option'].compact {
		grid-template-columns: minmax(0, 1fr) auto;
		align-items: baseline;
		gap: 8px;
	}
	[role='option'].active {
		background: var(--ink);
		color: var(--paper);
	}
	[role='option'].active .detail {
		color: var(--rule);
	}
	[role='option'][aria-selected='true'] .name {
		color: var(--accent);
	}
	[role='option'].active[aria-selected='true'] .name {
		color: var(--paper);
	}
	.detail {
		font-size: 13px;
		color: var(--ink-soft);
		line-height: 1.35;
	}
</style>
