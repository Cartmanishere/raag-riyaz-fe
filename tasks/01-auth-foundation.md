# Title
Auth Foundation

## Scope
- Replace mock login with backend authentication.
- Add client-side session storage for access token, refresh token, and actor context.
- Attach bearer tokens to authenticated API requests.
- Add token refresh flow and logout flow.
- Add route protection bootstrap for teacher/admin screens.

## Out of scope
- Student-facing application flows.
- Server-side session or cookie proxy architecture.
- Dashboard feature work beyond auth gating.

## Implementation notes
- Use `POST /auth/login` for email/password authentication.
- Use `POST /auth/refresh` to rotate tokens after access token expiry.
- Use `POST /auth/logout` to revoke the refresh token.
- Use `GET /auth/me` to restore and validate the authenticated actor.
- Make the API base URL configurable so auth can target either a local backend such as `http://localhost:<port>` or `https://stg-raag-riyaz-api.kanha.dev/`.
- Update the login form to use `email` instead of `username`.
- Treat backend `admin` as the frontend teacher role.
- Redirect non-admin users away from teacher routes.

## Success criteria
- Admin users can log in with email/password and reach teacher screens.
- Authenticated requests include the bearer access token.
- Expired access tokens refresh once automatically.
- Logout revokes the refresh token and clears client session state.
- Unauthenticated access to teacher routes redirects to `/login`.

## Verification
- Manually verify login success and invalid-credentials behavior.
- Simulate an expired access token and confirm refresh + retry behavior.
- Refresh the browser and confirm the session is restored correctly.
- Log out and confirm redirect to `/login` plus loss of protected access.
- Switch the configured API base URL between local and staging values and confirm auth works against both.
