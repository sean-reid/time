<script lang="ts">
	import { formatDuration, formatLength, formatSpeed } from '$lib/format';
	import type { Dwell } from '$lib/physics';
	import { CRUISE_SPEEDS, orbitStatus } from '$lib/sim/edit';
	import type { Scene } from '$lib/sim/scene.svelte';

	let { scene }: { scene: Scene } = $props();

	const AU = 1.495978707e11;
	let sel = $derived(scene.selected === null ? null : scene.course.waypoints[scene.selected]);
	let unitAU = $derived(sel !== null && sel.r >= 0.1 * AU);
	let distanceValue = $derived(
		sel === null ? '' : String(Number((unitAU ? sel.r / AU : sel.r / 1e3).toPrecision(6)))
	);
	let angleValue = $derived(sel === null ? '' : String(Math.round((sel.phi * 180) / Math.PI)));
	let dwellKind = $derived(sel?.dwell?.kind ?? 'pass');
	let status = $derived(
		sel?.dwell?.kind === 'orbit' ? orbitStatus(scene.field, sel.r, sel.dwell.direction) : 'stable'
	);
	let horizon = $derived(scene.flight.ending.kind);
	let scrubMax = $derived(Math.max(60, scene.flight.totalT * 1.25));

	function describe(w: (typeof scene.course.waypoints)[number]): string {
		const where = formatLength(w.r - scene.field.surface);
		if (!w.dwell) return `${where} up, pass through`;
		if (w.dwell.kind === 'orbit') {
			return `${where} up, orbit ×${w.dwell.revolutions}${w.dwell.direction < 0 ? ' retrograde' : ''}`;
		}
		return `${where} up, hold ${formatDuration(w.dwell.duration)}`;
	}

	function setDistance(v: string) {
		if (scene.selected === null) return;
		const n = Number(v);
		if (!Number.isFinite(n) || n <= 0) return;
		scene.patchWaypoint(scene.selected, { r: unitAU ? n * AU : n * 1e3 });
	}
	function setAngle(v: string) {
		if (scene.selected === null) return;
		const n = Number(v);
		if (!Number.isFinite(n)) return;
		scene.patchWaypoint(scene.selected, { phi: (n * Math.PI) / 180 });
	}
	function setKind(kind: string) {
		if (scene.selected === null) return;
		const dwell: Dwell | undefined =
			kind === 'orbit'
				? { kind: 'orbit', revolutions: 1, direction: 1 }
				: kind === 'hover'
					? { kind: 'hover', duration: 3600 }
					: undefined;
		scene.patchWaypoint(scene.selected, { dwell });
	}
	function setRevolutions(v: string) {
		if (scene.selected === null || sel?.dwell?.kind !== 'orbit') return;
		const n = Math.max(0.1, Number(v) || 1);
		scene.patchWaypoint(scene.selected, { dwell: { ...sel.dwell, revolutions: n } });
	}
	function flipDirection() {
		if (scene.selected === null || sel?.dwell?.kind !== 'orbit') return;
		scene.patchWaypoint(scene.selected, {
			dwell: { ...sel.dwell, direction: sel.dwell.direction === 1 ? -1 : 1 }
		});
	}
	function setHold(seconds: number) {
		if (scene.selected === null || sel?.dwell?.kind !== 'hover') return;
		scene.patchWaypoint(scene.selected, { dwell: { kind: 'hover', duration: seconds } });
	}
	const HOLDS = [60, 600, 3600, 86_400, 604_800, 31_557_600];
</script>

<section class="course" aria-labelledby="course-heading">
	<div class="head">
		<h2 id="course-heading" class="label">Course</h2>
		<div class="row">
			<button
				type="button"
				onclick={() => (scene.plotting = !scene.plotting)}
				aria-pressed={scene.plotting}
			>
				{scene.plotting ? 'Done plotting' : 'Plot a course'}
			</button>
			<button type="button" onclick={() => scene.clearCourse()}>Clear</button>
		</div>
	</div>

	{#if scene.plotting}
		<p class="hint">
			Tap the map to add a waypoint. Drag one to move it; it snaps to marked orbits.
		</p>
	{/if}

	<ol class="waypoints">
		{#each scene.course.waypoints as w, i (i)}
			<li>
				<button
					type="button"
					class="wp"
					class:current={scene.selected === i}
					onclick={() => (scene.selected = scene.selected === i ? null : i)}
					aria-pressed={scene.selected === i}
				>
					<span class="num n">{i + 1}</span>
					<span>{describe(w)}</span>
				</button>
			</li>
		{/each}
	</ol>
	<button type="button" class="add" onclick={() => scene.addWaypointByKeyboard()}
		>Add a waypoint</button
	>

	{#if sel !== null && scene.selected !== null}
		<div class="editor">
			<label>
				<span class="label">Distance from centre, {unitAU ? 'AU' : 'km'}</span>
				<input
					type="number"
					inputmode="decimal"
					value={distanceValue}
					min="0"
					onchange={(e) => setDistance(e.currentTarget.value)}
				/>
			</label>
			<label>
				<span class="label">Angle, degrees</span>
				<input
					type="number"
					inputmode="numeric"
					value={angleValue}
					step="1"
					onchange={(e) => setAngle(e.currentTarget.value)}
				/>
			</label>
			<label>
				<span class="label">At this point</span>
				<select value={dwellKind} onchange={(e) => setKind(e.currentTarget.value)}>
					<option value="pass">Pass through</option>
					<option value="orbit">Orbit</option>
					<option value="hover">Hold station</option>
				</select>
			</label>
			{#if sel.dwell?.kind === 'orbit'}
				<label>
					<span class="label">Revolutions</span>
					<input
						type="number"
						inputmode="decimal"
						value={sel.dwell.revolutions}
						min="0.1"
						step="0.5"
						onchange={(e) => setRevolutions(e.currentTarget.value)}
					/>
				</label>
				<button type="button" onclick={flipDirection}>
					{sel.dwell.direction === 1 ? 'Prograde, with the spin' : 'Retrograde, against the spin'}
				</button>
				{#if status === 'unstable'}
					<p class="hint">Inside the ISCO: this orbit needs a steadying hand.</p>
				{/if}
			{:else if sel.dwell?.kind === 'hover'}
				<label>
					<span class="label">Hold for</span>
					<select
						value={String(sel.dwell.duration)}
						onchange={(e) => setHold(Number(e.currentTarget.value))}
					>
						{#each HOLDS as h (h)}
							<option value={String(h)}>{formatDuration(h)}</option>
						{/each}
						{#if !HOLDS.includes(sel.dwell.duration)}
							<option value={String(sel.dwell.duration)}
								>{formatDuration(sel.dwell.duration)}</option
							>
						{/if}
					</select>
				</label>
			{/if}
			<button type="button" onclick={() => scene.removeWaypoint(scene.selected!)}
				>Remove waypoint</button
			>
		</div>
	{/if}

	<label>
		<span class="label">Speed between waypoints</span>
		<select
			value={String(scene.course.cruiseSpeed)}
			onchange={(e) => scene.setCruiseSpeed(Number(e.currentTarget.value))}
		>
			{#each CRUISE_SPEEDS as v (v)}
				<option value={String(v)}>{formatSpeed(v)}</option>
			{/each}
			{#if !CRUISE_SPEEDS.includes(scene.course.cruiseSpeed)}
				<option value={String(scene.course.cruiseSpeed)}
					>{formatSpeed(scene.course.cruiseSpeed)}</option
				>
			{/if}
		</select>
	</label>

	<label class="timeline">
		<span class="label">
			Elapsed on Earth: {formatDuration(scene.earthElapsed)}{horizon === 'horizon'
				? ', horizon reached'
				: ''}
		</span>
		<input
			type="range"
			min="0"
			max={scrubMax}
			step={scrubMax / 2000}
			value={Math.min(scene.t, scrubMax)}
			oninput={(e) => (scene.t = Number(e.currentTarget.value))}
		/>
	</label>
</section>

<style>
	.course {
		display: grid;
		gap: 12px;
	}
	.head {
		display: grid;
		gap: 8px;
	}
	h2 {
		margin: 0;
		font-weight: 400;
	}
	.row {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 8px;
	}
	.hint {
		margin: 0;
		font-size: 13px;
		color: var(--ink-soft);
	}
	.waypoints {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 2px;
	}
	.wp {
		width: 100%;
		display: grid;
		grid-template-columns: 20px 1fr;
		gap: 8px;
		text-align: left;
		border: 0;
		border-bottom: var(--hair) solid var(--rule);
		padding: 0 4px;
		font-size: 13px;
		color: var(--ink-soft);
	}
	.wp:hover,
	.wp.current {
		background: none;
		color: var(--ink);
	}
	.wp.current .n {
		color: var(--accent);
	}
	.add {
		font-size: 13px;
	}
	.editor {
		display: grid;
		gap: 10px;
		padding: 12px;
		border: var(--hair) solid var(--rule);
	}
	label {
		display: grid;
		gap: 4px;
	}
	input,
	select {
		font: inherit;
		color: inherit;
		background: var(--paper);
		border: var(--hair) solid var(--ink);
		border-radius: 0;
		min-height: 44px;
		padding: 0 10px;
	}
	input[type='range'] {
		min-height: 44px;
		border: 0;
		padding: 0;
		accent-color: var(--accent);
	}
	button[aria-pressed='true'] {
		background: var(--ink);
		color: var(--paper);
	}
	button[aria-pressed='true'].wp {
		background: none;
		color: var(--ink);
	}
</style>
