# Title
Recording Assignment

## Scope
- Add the ability to assign recordings to users through the backend assignment endpoint.
- Surface a valid user selection flow in the teacher UI.

## Out of scope
- Assignment history pages.
- Assignment removal if the backend does not support it.
- Student app playback flow.

## Implementation notes
- Use `POST /admin/recordings/{id}/assign`.
- Source candidate assignees from the loaded students list or a fresh users fetch.
- Offer only eligible non-admin users.
- Handle backend `409` conflicts for duplicate assignments cleanly.

## Success criteria
- Teachers can assign a recording to a user from the UI.
- Successful assignments show clear confirmation.
- Duplicate assignments show a clean conflict message.

## Verification
- Assign a recording to a valid user and confirm success.
- Retry the same assignment and confirm `409` handling.
- Confirm only eligible non-admin users are offered for assignment.
