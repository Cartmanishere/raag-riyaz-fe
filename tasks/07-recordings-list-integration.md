# Title
Recordings List Integration

## Scope
- Back the recordings library with `GET /admin/recordings`.
- Remove seed-backed recordings list state.
- Keep search and filter behavior aligned to backend-supported fields.

## Out of scope
- Recording upload and edit mutations.
- Playback integration.
- Assignment and note image flows.

## Implementation notes
- Load recordings from `GET /admin/recordings`.
- Keep search and raag filters client-side for v1.
- Remove mock-only assumptions like duration and date unless backend data is available.
- Add explicit loading, empty, and error states for the recordings page.

## Success criteria
- Recordings page loads from backend.
- Search and filter behavior work against live API data.
- Empty, loading, and error states are handled cleanly.

## Verification
- Compare the rendered recordings list with backend response data.
- Test search and raag filtering behavior.
- Confirm seed recordings no longer drive page state.
