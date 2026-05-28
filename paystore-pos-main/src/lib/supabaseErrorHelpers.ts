export function isSupabaseTableMissingError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;

  const err = error as Record<string, unknown>;
  const code = String(err.code ?? err.status ?? '').toUpperCase().trim();
  const message = String(err.message ?? err.details ?? err.error_description ?? '').toLowerCase();

  return (
    code === 'PGRST116' ||
    code === 'PGRST205' ||
    code === '404' ||
    (message.includes('relation') && message.includes('does not exist')) ||
    (message.includes('table') && message.includes('does not exist')) ||
    message.includes('could not find') ||
    message.includes('not found')
  );
}

export function isSupabasePermissionDeniedError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;

  const err = error as Record<string, unknown>;
  const code = String(err.code ?? err.status ?? '').toUpperCase().trim();
  const message = String(err.message ?? err.details ?? err.error_description ?? '').toLowerCase();

  return (
    code === '403' ||
    message.includes('permission') ||
    message.includes('forbidden') ||
    message.includes('not authorized') ||
    message.includes('access denied')
  );
}
