# Title
Teacher Shell And Profile

## Status
Done

## Scope
- Replace seed-based teacher identity in the dashboard shell and profile screen with backend-authenticated data.
- Wire logout into the real auth/session flow.
- Remove mock-only profile fields that cannot be sourced from the backend.

## Out of scope
- Student profile screens.
- Rich profile editing.
- Dashboard summary feature work.

## Implementation notes
- Use authenticated actor data from session and optionally `GET /admin/users/{id}` for richer teacher details.
- Derive avatar initials from `display_name` or `email`.
- Remove or simplify fields like specialization, experience, and bio if the backend does not provide them.
- Ensure logout clears session state and navigates correctly.

## Success criteria
- The top bar avatar and profile page reflect the logged-in backend actor.
- The profile page only shows backend-backed fields.
- Logout is fully wired and functional.

## Verification
- Confirm profile values match `/auth/me` or `/admin/users/{id}`.
- Confirm shell/profile render paths no longer use seed teacher data.
- Confirm avatar/profile still render correctly when `display_name` is null.
