export function isRecoverableAuthError(error: unknown): boolean {
  if (!error) return false;
  const message =
    typeof error === 'string'
      ? error
      : error instanceof Error
        ? error.message
        : JSON.stringify(error);

  const normalized = message.toLowerCase();
  return (
    normalized.includes('auth session missing') ||
    normalized.includes('refresh_token_not_found') ||
    normalized.includes('invalid refresh token') ||
    normalized.includes('invalid_grant') ||
    normalized.includes('jwt expired')
  );
}
