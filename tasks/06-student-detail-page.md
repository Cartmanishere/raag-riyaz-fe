# Title
Student Detail Page

## Status
Done

## Scope
- Replace the seed-based student detail lookup with backend user detail.
- Reduce or remove unsupported recording-history assumptions from the page.

## Out of scope
- Assignment history reconstruction from unsupported backend joins.
- Student app experience.
- Full student analytics.

## Implementation notes
- Use `GET /admin/users/{id}` to fetch the user detail by string ID.
- Keep a minimal detail card with backend-backed fields only.
- Hide the recordings section or replace it with a deferred state unless assignment data is available reliably.
- Preserve a valid not-found or error path for invalid IDs.

## Success criteria
- The detail page loads a backend user by string ID.
- Invalid or nonexistent IDs show not-found or equivalent error handling.
- The page does not claim recording history the backend cannot provide.

## Verification
- Open a real user ID and confirm rendered values match backend data.
- Open an invalid ID and confirm the error path behaves correctly.
- Confirm there are no seed-based user/recording joins left on this page.
