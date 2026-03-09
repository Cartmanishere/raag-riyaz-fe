# Title
Students List Integration

## Status
Done

## Scope
- Back the Students Management screen with `/admin/users`.
- Replace seed-backed students list state.
- Make the list reflect actual backend capabilities.

## Out of scope
- Student creation/edit mutation work.
- Student-facing app flow.
- Deletion behavior not supported by backend APIs.

## Implementation notes
- Load users from `GET /admin/users`.
- Define “students” in the UI as non-admin org users.
- Keep search client-side against the loaded list for v1.
- Remove unsupported hard-delete behavior from the UI and empty states.
- Add explicit loading, empty, and error states.

## Success criteria
- Students list loads from backend on page open.
- List controls reflect actual backend capabilities.
- Admin users do not appear in the students table.
- Loading, empty, and error states are visible and correct.

## Verification
- Confirm the list matches backend org users minus admins.
- Confirm search works against live API-loaded data.
- Confirm there is no dead-end delete action in the students screen.
