import { read } from '$app/server';
import { initWasm, Resvg } from '@resvg/resvg-wasm';
import font from '../../../static/fonts/schibsted-grotesk-latin.woff2?inline';

const FONT_FAMILY = 'Schibsted Grotesk';

let ready: Promise<Uint8Array> | undefined;

/** Workers hand the wasm over as a compiled module import; Node cannot import wasm, so it reads the file. */
async function wasmModule(): Promise<WebAssembly.Module | Uint8Array> {
	try {
		return (await import('@resvg/resvg-wasm/index_bg.wasm')).default;
	} catch {
		const fs = process.getBuiltinModule('node:fs/promises');
		return fs.readFile(new URL(import.meta.resolve('@resvg/resvg-wasm/index_bg.wasm')));
	}
}

async function prepare(): Promise<Uint8Array> {
	await initWasm(wasmModule());
	return new Uint8Array(await read(font).arrayBuffer());
}

export async function renderPng(svg: string): Promise<Uint8Array<ArrayBuffer>> {
	ready ??= prepare();
	const fontBuffer = await ready;
	const resvg = new Resvg(svg, {
		font: { fontBuffers: [fontBuffer], loadSystemFonts: false, defaultFontFamily: FONT_FAMILY }
	});
	const image = resvg.render();
	try {
		return new Uint8Array(image.asPng());
	} finally {
		image.free();
		resvg.free();
	}
}
