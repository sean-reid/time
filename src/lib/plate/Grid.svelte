<script lang="ts">
	import frag from './grid.frag?raw';
	import vert from './grid.vert?raw';

	/** Camera in metres per CSS pixel and world centre; the body sits at the world origin. */
	let {
		mpp,
		cx,
		cy,
		rs,
		inner
	}: { mpp: number; cx: number; cy: number; rs: number; inner: number } = $props();

	let canvas: HTMLCanvasElement;
	let gl: WebGL2RenderingContext | null = null;
	let uniforms: Record<string, WebGLUniformLocation | null> = {};
	let width = $state(1);
	let height = $state(1);
	let dpr = $state(1);

	function compile(g: WebGL2RenderingContext, type: number, src: string) {
		const s = g.createShader(type)!;
		g.shaderSource(s, src);
		g.compileShader(s);
		return s;
	}

	function setup(node: HTMLCanvasElement) {
		canvas = node;
		const g = node.getContext('webgl2', { antialias: false, premultipliedAlpha: true });
		if (!g) return;
		gl = g;
		const program = g.createProgram()!;
		g.attachShader(program, compile(g, g.VERTEX_SHADER, vert));
		g.attachShader(program, compile(g, g.FRAGMENT_SHADER, frag));
		g.linkProgram(program);
		g.useProgram(program);
		for (const name of [
			'uRes',
			'uMpp',
			'uCentreRes',
			'uRs',
			'uSpacing',
			'uSubFade',
			'uCoarseOn',
			'uInk',
			'uInner'
		]) {
			uniforms[name] = g.getUniformLocation(program, name);
		}
		const ro = new ResizeObserver(([entry]) => {
			width = entry.contentRect.width;
			height = entry.contentRect.height;
			dpr = Math.min(window.devicePixelRatio || 1, 2);
		});
		ro.observe(node.parentElement!);
		return { destroy: () => ro.disconnect() };
	}

	function inkRgb(): [number, number, number] {
		const hex = getComputedStyle(document.documentElement).getPropertyValue('--grid').trim();
		const n = parseInt(hex.slice(1), 16);
		return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
	}

	$effect(() => {
		if (!gl) return;
		const g = gl;
		const w = Math.max(1, Math.round(width * dpr));
		const h = Math.max(1, Math.round(height * dpr));
		if (canvas.width !== w || canvas.height !== h) {
			canvas.width = w;
			canvas.height = h;
		}
		const devMpp = mpp / dpr;
		const spacing = 10 ** Math.ceil(Math.log10(40 * mpp));
		const subPx = spacing / 10 / mpp;
		const subFade = Math.min(1, Math.max(0, (subPx - 12) / 28));
		const coarseOn = (spacing * 10) / mpp < 6000 ? 1 : 0;
		g.viewport(0, 0, w, h);
		g.uniform2f(uniforms.uRes, w, h);
		g.uniform1f(uniforms.uMpp, devMpp);
		g.uniform2f(uniforms.uCentreRes, cx % (spacing * 10), cy % (spacing * 10));
		g.uniform1f(uniforms.uRs, rs);
		g.uniform1f(uniforms.uSpacing, spacing);
		g.uniform1f(uniforms.uSubFade, subFade);
		g.uniform1f(uniforms.uCoarseOn, coarseOn);
		g.uniform1f(uniforms.uInner, inner);
		g.uniform3fv(uniforms.uInk, inkRgb());
		g.clearColor(0, 0, 0, 0);
		g.clear(g.COLOR_BUFFER_BIT);
		g.drawArrays(g.TRIANGLES, 0, 3);
	});
</script>

<canvas use:setup style:width="{width}px" style:height="{height}px" aria-hidden="true"></canvas>

<style>
	canvas {
		position: absolute;
		inset: 0;
		display: block;
	}
</style>
