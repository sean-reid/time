#!/bin/sh
# Regenerate e2e/__snapshots__ with the Chromium build CI uses, inside the Playwright image.
set -eu
version="$(node -p "require('@playwright/test/package.json').version")"
docker run --rm -v "$PWD:/src" -w /work -e COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
	"mcr.microsoft.com/playwright:v${version}-noble" sh -eu -c '
	tar -C /src --exclude=./node_modules --exclude=./.svelte-kit --exclude=./test-results -cf - . | tar -C /work -xf -
	corepack enable && pnpm install --frozen-lockfile
	CI=1 pnpm exec playwright test visual --update-snapshots
	rm -rf /src/e2e/__snapshots__ && cp -r /work/e2e/__snapshots__ /src/e2e/
'
