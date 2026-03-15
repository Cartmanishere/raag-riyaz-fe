# Title
Recording Attachments Refactor

## Scope
- Replace all note-images API usage with the generic recording attachments API.
- Update the admin recording detail UI to support both image and PDF attachments.
- Keep shared frontend attachment types and API clients aligned for both admin and user recording flows.

## Out of scope
- Adding a new user-facing attachments screen.
- Embedding PDFs in an inline viewer.
- Backend API changes.

## Implementation notes
- Use the Swagger contract from [http://localhost:3000/swagger.json](http://localhost:3000/swagger.json) as the API source of truth.
- Replace `/note-images` endpoints with:
  - `GET /admin/recordings/{id}/attachments`
  - `POST /admin/recordings/{id}/attachments`
  - `DELETE /admin/recordings/{recording_id}/attachments/{attachment_id}`
  - `GET /user/recordings/{id}/attachments`
- Replace note-image response parsing with attachment response parsing:
  - `attachment`
  - `attachments`
- Replace `NoteImageDto` / `NoteImage` with `RecordingAttachmentDto` / `RecordingAttachment`.
- Add attachment `type` support to the frontend model and upload request payload.
- Send attachment uploads as `multipart/form-data` with required `type`, required `file`, and optional `mime_type`.
- Rename API client methods from note-image terminology to attachment terminology for both admin and user recording APIs.
- Replace the note-images section in the admin recording detail drawer with a generic attachments section.
- Support client-side upload selection for `image/*` and `application/pdf`.
- Infer upload `type` from file MIME type and reject unsupported file types before making a request.
- Render image attachments as thumbnail previews using signed URLs.
- Render PDF attachments as file-style cards with an open action using the signed URL.
- Update load, upload, delete, and limit-reached messaging to refer to attachments rather than note images.
- Use the backend conflict message semantics for the attachment cap: "Recording already has the maximum number of attachments."

## Success criteria
- The frontend has no remaining runtime dependency on `/note-images` endpoints.
- Admins can list, upload, and delete recording attachments through the updated UI.
- The admin UI supports both image and PDF attachments with appropriate rendering for each type.
- Shared attachment types and API helpers are consistent with the current backend contract.

## Verification
- Search `src/` and confirm there are no remaining `note-images`, `NoteImage`, or "note images" references tied to the API surface.
- Open a recording detail drawer and confirm attachments load from `/admin/recordings/{id}/attachments`.
- Upload an image attachment and confirm it appears as a thumbnail.
- Upload a PDF attachment and confirm it appears as a file card with a working open action.
- Delete uploaded attachments and confirm the UI updates immediately.
- Trigger a 409 attachment upload response and confirm the max-attachments error message is shown.
- Run the frontend validation path and confirm the renamed types and API methods compile cleanly.
