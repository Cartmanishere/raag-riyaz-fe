# Title
Regression And Integration Verification

## Scope
- Run the full integrated teacher flow and close remaining gaps in loading states, error handling, and role gating.
- Validate there are no mock-data fallbacks left in the implemented admin/teacher experience.

## Out of scope
- Student-facing product rollout.
- Backend API changes.
- New features outside integration hardening.

## Implementation notes
- Verify login, protected navigation, users CRUD subset, recordings CRUD subset, playback, assignment, and logout.
- Check that unsupported backend capabilities are not exposed as working UI actions.
- Confirm build and type checks pass after integration changes land.

## Success criteria
- The teacher/admin flow is coherent end-to-end with no mock-data fallbacks.
- Main failure states have visible and usable UX handling.
- Build and type checks pass.

## Verification
- Run `next build`.
- Perform a manual end-to-end pass across login, profile, students, student detail, recordings, playback, assignment, and logout.
- Confirm the browser console has no integration errors during the happy path.
