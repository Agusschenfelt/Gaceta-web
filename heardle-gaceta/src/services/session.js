/**
 * Whether an auth error means the stored session belongs to nobody any more
 * (user deleted, token revoked or unreadable), as opposed to a failed request.
 * Only a dead session is worth replacing with a new anonymous sign-in: doing
 * that on a network blip would silently swap the player for a stranger.
 */
export function isDeadSession(error) {
  if (!error) return false;
  if (error.code === "user_not_found" || error.code === "session_not_found" || error.code === "bad_jwt") {
    return true;
  }
  return error.status === 401 || error.status === 403;
}
