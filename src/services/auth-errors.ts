import { ApiError } from "@/types";

export function getGoogleAuthErrorMessage(error: ApiError) {
  switch (error.code) {
    case "invalid_google_id_token":
      return "Please try signing in with Google again.";
    case "inactive_user":
      return "Your account is disabled. Contact support if you believe this is a mistake.";
    case "inactive_membership":
      return "Your membership is inactive. Contact your organization admin for access.";
    case "conflict":
      return "This account cannot sign in with Google yet. Contact support for help resolving the conflict.";
    case "invalid_request":
      return "The Google sign-in request was incomplete. Please try again.";
    default:
      return error.message || "Unable to sign in with Google.";
  }
}
