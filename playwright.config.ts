import { defineConfig, devices } from '@playwright/test';

const ci = !!process.env.CI;
const visual = '**/visual.e2e.ts';
/** Committed snapshots are Linux renders, so the visual projects only run where they can match. */
const linux = process.platform === 'linux';

export default defineConfig({
	testDir: 'e2e',
	testMatch: '**/*.e2e.ts',
	snapshotPathTemplate: '{testDir}/__snapshots__/{arg}-{projectName}-{platform}{ext}',
	fullyParallel: true,
	forbidOnly: ci,
	retries: ci ? 1 : 0,
	reporter: ci ? [['github'], ['html', { open: 'never' }]] : 'list',
	use: {
		baseURL: 'http://localhost:4173',
		trace: 'retain-on-failure',
		screenshot: 'only-on-failure'
	},
	webServer: {
		command: 'pnpm build && pnpm preview',
		port: 4173,
		reuseExistingServer: false
	},
	projects: [
		{ name: 'desktop', use: { ...devices['Desktop Chrome'] }, testIgnore: visual },
		{ name: 'mobile', use: { ...devices['Pixel 7'] }, testIgnore: visual },
		...(linux
			? [
					{
						name: 'visual-desktop',
						testMatch: visual,
						use: {
							...devices['Desktop Chrome'],
							viewport: { width: 1440, height: 900 },
							timezoneId: 'UTC'
						}
					},
					{
						name: 'visual-mobile',
						testMatch: visual,
						use: {
							...devices['Pixel 7'],
							viewport: { width: 375, height: 812 },
							deviceScaleFactor: 1,
							timezoneId: 'UTC'
						}
					}
				]
			: [])
	]
});
