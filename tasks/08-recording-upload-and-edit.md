# Title
Recording Upload And Edit

## Status
Done

## Scope
- Wire recording create and edit flows to backend recording endpoints.
- Support multipart upload for audio files.
- Remove unsupported delete behavior from the UI.

## Out of scope
- Playback integration.
- Recording assignment.
- Note image management.

## Implementation notes
- Use multipart `POST /admin/recordings` for create with `FormData`.
- Send `title`, `raag`, `taal`, `notes`, `mime_type`, and `file`.
- Use `PATCH /admin/recordings/{id}` for metadata edits.
- Remove or disable recording delete actions because the backend does not expose delete.
- Surface validation and storage/upload failures clearly.

## Success criteria
- Uploading an audio file creates a backend recording.
- Editing title, raag, taal, and notes persists correctly.
- Unsupported delete is not presented as available.

## Verification
- Upload a real audio file and confirm it appears after reload.
- Edit recording metadata and confirm persistence.
- Trigger upload validation or storage failures and confirm error handling.
