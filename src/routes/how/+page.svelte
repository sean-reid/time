<script lang="ts">
	import { resolve } from '$app/paths';
</script>

<svelte:head>
	<title>How this works</title>
	<meta
		name="description"
		content="What the two clocks measure, which frame they tick in, and what the landmarks around a black hole mean."
	/>
</svelte:head>

<header class="bar">
	<a href={resolve('/')} class="wordmark">time</a>
</header>

<main>
	<h1>How this works</h1>

	<h2 class="label">Two clocks</h2>
	<p>
		Earth's clock is a clock at sea level. It shows your actual local time. Your clock left Earth in
		sync with it when the page loaded. The drift counter is the difference between them. Both tick
		in real seconds unless you speed time up, and the speed-up factor is always shown.
	</p>

	<h2 class="label">Where time slows</h2>
	<p>
		Deep in a gravity well, and at high speed. A clock held still at distance
		<math><mi>r</mi></math> from a mass <math><mi>M</mi></math> runs at
	</p>
	<math display="block">
		<mrow>
			<mfrac>
				<mrow><mi>d</mi><mi>τ</mi></mrow>
				<mrow><mi>d</mi><mi>t</mi></mrow>
			</mfrac>
			<mo>=</mo>
			<msqrt>
				<mn>1</mn>
				<mo>−</mo>
				<mfrac>
					<mrow><mn>2</mn><mi>G</mi><mi>M</mi></mrow>
					<mrow><mi>r</mi><msup><mi>c</mi><mn>2</mn></msup></mrow>
				</mfrac>
			</msqrt>
		</mrow>
	</math>
	<p>
		relative to a clock far away. <math><mi>τ</mi></math> is proper time, what the held clock reads.
		<math><mi>t</mi></math> is coordinate time, what a clock far from the mass reads. Moving at
		speed
		<math><mi>v</mi></math> past observers holding station multiplies that rate by
	</p>
	<math display="block">
		<msqrt>
			<mn>1</mn>
			<mo>−</mo>
			<mfrac>
				<msup><mi>v</mi><mn>2</mn></msup>
				<msup><mi>c</mi><mn>2</mn></msup>
			</mfrac>
		</msqrt>
	</math>
	<p>On a circular orbit the two combine to</p>
	<math display="block">
		<mrow>
			<mfrac>
				<mrow><mi>d</mi><mi>τ</mi></mrow>
				<mrow><mi>d</mi><mi>t</mi></mrow>
			</mfrac>
			<mo>=</mo>
			<msqrt>
				<mn>1</mn>
				<mo>−</mo>
				<mfrac>
					<mrow><mn>3</mn><mi>G</mi><mi>M</mi></mrow>
					<mrow><mi>r</mi><msup><mi>c</mi><mn>2</mn></msup></mrow>
				</mfrac>
			</msqrt>
		</mrow>
	</math>

	<h2 class="label">GPS, the everyday case</h2>
	<p>
		At sea level Earth's own field slows a clock by 6.97 parts in 10<sup>10</sup>, the IAU constant
		<math><msub><mi>L</mi><mi>G</mi></msub></math>. A GPS satellite at 20 180 km altitude sits
		higher in the well and gains about 45.7 µs a day. It also moves at 3.87 km/s and loses about 7.2
		µs a day. Net, its clock gains about 38.6 µs a day, and the system corrects for it.
	</p>

	<h2 class="label">The reference frame</h2>
	<p>
		In Earth scenes coordinate time is geocentric, and Earth's clock runs slow by
		<math>
			<mrow>
				<msub><mi>L</mi><mi>G</mi></msub>
				<mo>=</mo>
				<mn>6.969290134</mn>
				<mo>×</mo>
				<msup><mn>10</mn><mrow><mo>−</mo><mn>10</mn></mrow></msup>
			</mrow>
		</math>. In every other scene coordinate time belongs to the body you are visiting, and Earth's
		clock carries its full share of the solar system's potential,
		<math>
			<mrow>
				<msub><mi>L</mi><mi>B</mi></msub>
				<mo>=</mo>
				<mn>1.550519768</mn>
				<mo>×</mo>
				<msup><mn>10</mn><mrow><mo>−</mo><mn>8</mn></mrow></msup>
			</mrow>
		</math>. Both are IAU defined constants (IAU 2000 Resolution B1.9 and IAU 2006 Resolution B3).
	</p>

	<h2 class="label">What the ship can do</h2>
	<p>
		Hold station anywhere. The engine never runs out; the panel shows the thrust that takes, in g,
		and it grows without bound at a horizon. Circle a body on a circular orbit, prograde or
		retrograde. Move between waypoints at a fixed speed relative to observers holding station.
		Nothing can hold station inside a horizon, so a course that crosses one ends there.
	</p>

	<h2 class="label">Landmarks around a black hole</h2>
	<p>
		Radii in units of
		<math><mrow><mi>G</mi><mi>M</mi><mo>/</mo><msup><mi>c</mi><mn>2</mn></msup></mrow></math>.
	</p>
	<dl>
		<dt>Event horizon</dt>
		<dd>
			2 for a non-spinning hole. With spin
			<math><msup><mi>a</mi><mo>*</mo></msup></math> it is
			<math
				><mrow
					><mn>1</mn><mo>+</mo><msqrt
						><mn>1</mn><mo>−</mo><msup><mi>a</mi><mrow><mo>*</mo><mn>2</mn></mrow></msup></msqrt
					></mrow
				></math
			>.
		</dd>
		<dt>Photon sphere</dt>
		<dd>3 for no spin. Light circles here.</dd>
		<dt>Innermost stable circular orbit</dt>
		<dd>
			6 for no spin. Spin pulls prograde orbits closer, down to 1 at
			<math><mrow><msup><mi>a</mi><mo>*</mo></msup><mo>=</mo><mn>1</mn></mrow></math>, and pushes
			retrograde orbits out, to 9 at the same spin (Bardeen, Press and Teukolsky 1972).
		</dd>
		<dt>Ergosphere</dt>
		<dd>
			Inside 2 around a spinning hole nothing can stay still. The ship holds radius while dragged
			space sweeps it around, a zero angular momentum observer.
		</dd>
	</dl>

	<h2 class="label">Worked numbers</h2>
	<dl>
		<dt>Solar photosphere</dt>
		<dd>2.12 parts per million slower.</dd>
		<dt>Neutron star, 2.01 solar masses, 12 km radius</dt>
		<dd>About 29 percent slower at the surface.</dd>
		<dt>Horizon of any black hole</dt>
		<dd>Rate zero for a clock holding station just outside.</dd>
		<dt>Pound and Rebka, Harvard, 1960</dt>
		<dd>Measured 2.46 × 10<sup>−15</sup> across 22.5 m.</dd>
	</dl>

	<h2 class="label">Scale</h2>
	<p>
		Everything is drawn to true size. Zoom is logarithmic. A scale bar and its light travel time are
		always on screen. Nothing is compressed to fit.
	</p>

	<h2 class="label">Sources</h2>
	<ul>
		<li>
			<a href="https://arxiv.org/abs/1605.09788">IAU 2015 Resolution B3, nominal values</a>, Prša et
			al. 2016.
		</li>
		<li><a href="https://physics.nist.gov/cuu/Constants/">CODATA 2018</a>, NIST.</li>
		<li>
			<a href="https://iauarchive.eso.org/static/resolutions/IAU2000_French.pdf"
				>IAU 2000 Resolution B1.9</a
			>
			and
			<a href="https://iauarchive.eso.org/static/resolutions/IAU2006_Resol3.pdf"
				>IAU 2006 Resolution B3</a
			>.
		</li>
		<li>
			<a href="https://ui.adsabs.harvard.edu/abs/1972ApJ...178..347B"
				>Bardeen, Press and Teukolsky 1972</a
			>, ApJ 178, 347.
		</li>
		<li>
			<a href="https://doi.org/10.1103/PhysRevLett.4.337">Pound and Rebka 1960</a>, Phys. Rev. Lett.
			4, 337.
		</li>
		<li>
			<a href="https://doi.org/10.12942/lrr-2003-1"
				>Ashby 2003, Relativity in the Global Positioning System</a
			>, Living Reviews in Relativity.
		</li>
	</ul>
</main>

<style>
	.bar {
		display: flex;
		align-items: baseline;
		padding: 18px 20px 12px;
		border-bottom: var(--hair) solid var(--rule);
	}
	.wordmark {
		font-weight: 600;
		font-size: 17px;
		letter-spacing: -0.01em;
	}
	main {
		max-width: 64ch;
		margin: 0 auto;
		padding: 40px 20px 96px;
		font-size: 16px;
		line-height: 1.55;
	}
	h1 {
		margin: 0 0 40px;
		font-size: 28px;
		font-weight: 600;
		letter-spacing: -0.01em;
		line-height: 1.2;
	}
	h2 {
		margin: 44px 0 10px;
		font-weight: 600;
	}
	p {
		margin: 0 0 14px;
	}
	math {
		font-size: 1.05em;
	}
	math[display='block'] {
		margin: 6px 0 18px;
	}
	dl {
		margin: 0 0 14px;
	}
	dt {
		font-weight: 600;
	}
	dd {
		margin: 0 0 12px;
	}
	ul {
		margin: 0;
		padding: 0;
		list-style: none;
	}
	li {
		margin: 0 0 10px;
	}
	main a {
		text-decoration: underline;
		text-decoration-color: var(--rule);
		text-underline-offset: 3px;
	}
	main a:hover {
		text-decoration-color: var(--accent);
	}
</style>
