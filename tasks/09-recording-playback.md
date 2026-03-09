# Title
Recording Playback

## Scope
- Make the recording detail drawer fetch and use backend signed playback URLs.
- Handle playback loading and error states.

## Out of scope
- Recording upload/edit.
- Note image management.
- Student playback flows.

## Implementation notes
- Call `GET /admin/recordings/{id}/playback` when the detail drawer opens.
- Bind the returned signed URL to the audio element.
- Refetch playback URL when a signed URL expires or becomes invalid.
- Show clear UI feedback when playback cannot be loaded.

## Success criteria
- Opening a recording fetches a valid playback URL.
- The built-in audio player can play backend-hosted media.
- Playback errors are shown instead of failing silently.

## Verification
- Open a recording and confirm the playback request and audio playback succeed.
- Reopen after signed URL expiry and confirm a fresh URL is fetched.
- Validate that missing or invalid playback responses show usable feedback.
