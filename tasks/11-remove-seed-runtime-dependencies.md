# Title
Remove Seed Runtime Dependencies

## Scope
- Eliminate runtime dependence on `src/data/seed.ts` for teacher/admin flows.
- Replace seed-derived runtime models and state with API-backed data.

## Out of scope
- Removing seed data that is still intentionally used for demos or tests.
- Student flow integration.
- Non-runtime cleanup that does not affect production behavior.

## Implementation notes
- Replace component prop types imported from seed data with backend-backed models.
- Ensure no teacher dashboard route reads seed arrays at runtime.
- Remove seed-only UI fields that have no backend source.
- Keep any remaining seed references isolated to explicitly deferred areas only.

## Success criteria
- Teacher/admin screens are fully API-backed.
- Runtime imports from `seed.ts` are removed from those screens/components.
- Seed-only fields no longer leak into UI behavior.

## Verification
- Run `rg "@/data/seed" src` and confirm only intentionally deferred areas remain, if any.
- Verify the full teacher flow works while ignoring seed data.
- Refresh any teacher screen and confirm live backend state is preserved.
