export async function api(path: string, options?: RequestInit) {
  const response = await fetch(`/api${path}`, {
    ...options, credentials: 'same-origin',
    headers: { ...(options?.body && !(options.body instanceof File) ? { 'Content-Type': 'application/json' } : {}), ...options?.headers },
  });
  if (response.redirected || !response.headers.get('Content-Type')?.includes('application/json'))
    throw new Error('Your Access session may have expired. Reload the private studio to sign in.');
  const result = await response.json();
  if (!response.ok)
    throw new Error(`${result.error || result.status || 'Request failed'}${result.issues ? ' ' + result.issues.map((issue: { path: string; message: string }) => `${issue.path}: ${issue.message}`).join('; ') : ''}`);
  return result;
}
