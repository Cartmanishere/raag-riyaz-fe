# Deployment

This frontend is deployed as a static Next.js export.

## How the build works

- `npm run build` runs `next build`.
- [next.config.ts](/Users/pranavgajjewar/workspace/projects/raag-riyaz-fe/next.config.ts) sets `output: "export"`, so the final static site is written to `out/`.
- [wrangler.jsonc](/Users/pranavgajjewar/workspace/projects/raag-riyaz-fe/wrangler.jsonc) points Cloudflare at that build output.

In Cloudflare, the project should build the app and publish the generated static assets from `out/`.

## Shared runtime inputs

These public environment variables affect the deployed frontend:

- `NEXT_PUBLIC_API_BASE_URL`: backend base URL used by the app
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`: Google login client ID
- `NEXT_PUBLIC_BASE_PATH`: optional subpath if the app is served under something other than `/`

## STG

Use staging values in the Cloudflare environment for the staging deployment.

- `NEXT_PUBLIC_API_BASE_URL=https://stg-raag-riyaz-api.kanha.dev`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID=<staging-google-client-id>`
- `NEXT_PUBLIC_BASE_PATH=` leave empty unless staging is served from a subpath

Notes:

- If staging is connected to a Git branch in Cloudflare, pushing that branch should trigger a new deployment.
- The generated frontend is static, so these values must be present at build time.

## PROD

Production uses the same build flow as staging, but with production environment values.

- `NEXT_PUBLIC_API_BASE_URL=<production-api-url>`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID=<production-google-client-id>`
- `NEXT_PUBLIC_BASE_PATH=` leave empty unless production is served from a subpath

Notes:

- Production values are not currently checked into this repo.
- If production uses a different domain, Google auth must allow that domain in the Google OAuth app settings.

## Minimal Cloudflare setup

- Build command: `npm run build`
- Deploy target: publish the static output from `out/`
- Root directory: repository root

If Cloudflare is using Wrangler-based deployment commands, they must still point at the static export generated in `out/`.
