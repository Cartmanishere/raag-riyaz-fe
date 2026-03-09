# Title
Student Create And Edit

## Scope
- Wire the add/edit student drawer to backend user creation and update endpoints.
- Align the form with supported backend user fields.
- Show backend validation and conflict errors in the UI.

## Out of scope
- User deletion.
- Student detail page rendering changes outside mutation updates.
- Student-only application features.

## Implementation notes
- Use `POST /admin/users` for create and `PATCH /admin/users/{id}` for edit.
- Remove mock-only fields such as instrument, progress, and join date from request payloads.
- Map form fields to backend-supported properties only.
- Surface backend `400` and `409` errors clearly in the drawer.

## Success criteria
- Creating a student persists to backend and updates the students list.
- Editing a student persists to backend and updates list/detail state.
- Duplicate email and invalid-payload errors are shown clearly.

## Verification
- Create a new user and confirm it appears after refresh.
- Edit an existing user and confirm the changes persist.
- Trigger backend `409` and `400` responses and confirm UI error handling.
