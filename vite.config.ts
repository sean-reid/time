import { defineConfig } from 'vitest/config';
import adapter from '@sveltejs/adapter-cloudflare';
import { sveltekit } from '@sveltejs/kit/vite';
import { playwright } from '@vitest/browser-playwright';

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			adapter: adapter({ platformProxy: { persist: false } }),
			inlineStyleThreshold: 24_000
		})
	],
	build: { rolldownOptions: { external: ['@resvg/resvg-wasm/index_bg.wasm'] } },
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					css: { include: [/app\.css/] },
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			},
			{
				extends: './vite.config.ts',
				test: {
					name: 'client',
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					browser: {
						enabled: true,
						headless: true,
						screenshotFailures: false,
						provider: playwright(),
						instances: [{ browser: 'chromium' }]
					}
				}
			}
		]
	}
});
