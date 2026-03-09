# Title
API Types And Client

## Status
Done

## Scope
- Replace the current generic API wrapper assumptions with typed domain-specific API methods.
- Add FE-safe model mapping for auth, users, recordings, playback, assignments, and dashboard data.
- Update IDs to use backend string identifiers.
- Make the API endpoint configurable for local and staging backend targets.

## Out of scope
- UI redesign work.
- Student app API integration.
- Backend schema generation tooling.

## Implementation notes
- Add typed methods for auth, users, recordings, playback, assignments, and dashboard endpoints.
- Normalize backend snake_case fields to camelCase at the API boundary.
- Remove reliance on the current generic `ApiResponse<T>` wrapper where backend responses differ.
- Ensure components consume FE models instead of raw Swagger response objects.
- Drive the API base URL from frontend configuration such as environment variables, with documented values for localhost and `https://stg-raag-riyaz-api.kanha.dev/`.
- Ensure the configuration works consistently for JSON requests and multipart upload requests.

## Success criteria
- The frontend has a typed API layer covering all teacher/admin endpoints needed for the current flow.
- Components no longer parse raw backend payloads directly.
- TypeScript catches numeric/string ID mismatches during development.
- Changing configuration is sufficient to point the app at either local or staging backend environments.

## Verification
- Run `next build` or `tsc` and confirm no type errors.
- Spot-check mapped API models in the browser or logs against live responses.
- Confirm API-backed components no longer use seed-derived runtime types.
- Start the app once with a localhost API base URL and once with the staging API base URL and confirm requests are sent to the configured target.
