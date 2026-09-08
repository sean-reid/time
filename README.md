# time

An interactive map of how gravity and motion change the passage of time. Start on an orbit around the Sun, a neutron star, or Sagittarius A*, kick the ship, and watch your clock drift from the one you left on Earth. The physics is general relativity and cited measurements: exact equatorial Kerr geodesics around compact bodies, Newtonian motion with the first-order clock around the Sun and its planets.

Live at https://time.dwainosaur.com.

## Run

Needs Node 24 and pnpm 10.

```sh
pnpm install
pnpm dev
```

## Test

```sh
pnpm lint
pnpm check
pnpm test:unit
pnpm exec playwright install chromium
pnpm test:e2e
```

## Deploy

Merges to main deploy to Cloudflare Workers through GitHub Actions. To deploy by hand with a logged-in wrangler:

```sh
pnpm deploy:worker
```
