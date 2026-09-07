<script lang="ts">
	import { bodies, type Body, type BodyKind } from '$lib/catalogue';
	import Picker from './Picker.svelte';

	let { value, onchange }: { value: Body; onchange: (id: string) => void } = $props();

	const KIND_LABEL: Record<BodyKind, string> = {
		star: 'star',
		planet: 'planet',
		moon: 'moon',
		'white-dwarf': 'white dwarf',
		'neutron-star': 'neutron star',
		magnetar: 'magnetar',
		'black-hole': 'black hole'
	};
	const GROUPS: { title: string; kinds: BodyKind[] }[] = [
		{ title: 'Solar system', kinds: ['star', 'planet', 'moon'] },
		{ title: 'Stellar remnants', kinds: ['white-dwarf', 'neutron-star', 'magnetar'] },
		{ title: 'Black holes', kinds: ['black-hole'] }
	];
	const all: readonly Body[] = bodies;
	/** Only bodies that head a scene: companions live inside their primary's scene. */
	const scenes = all.filter(
		(b) =>
			b.companions !== undefined || !all.some((p) => p.companions?.some((c) => c.body === b.id))
	);
	const groups = GROUPS.map((g) => ({
		title: g.title,
		items: scenes
			.filter((b) => g.kinds.includes(b.kind))
			.map((b) => ({ id: b.id, name: b.name, detail: b.summary, caption: KIND_LABEL[b.kind] }))
	})).filter((g) => g.items.length > 0);
</script>

<Picker label="Near" value={value.id} {groups} {onchange} />
