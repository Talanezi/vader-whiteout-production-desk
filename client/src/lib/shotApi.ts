import { getAuthToken } from './api'
export const shotApiBase =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(
    /\/$/,
    '',
  ) || (import.meta.env.DEV
    ? 'http://localhost:3001/api'
    : 'https://vader-whiteout-production-desk-production.up.railway.app/api')
export async function shotRequest<T>(
  path: string,
  payload?: unknown,
): Promise<T> {
  const response = await fetch(`${shotApiBase}/shotlists${path}`, {
    method: payload === undefined ? 'GET' : 'POST',
    headers: {
      Authorization: `Bearer ${getAuthToken() || ''}`,
      ...(payload === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    body: payload === undefined ? undefined : JSON.stringify(payload),
  })
  if (!response.ok) {
    if (response.status === 401) throw new Error('UNAUTHORIZED')
    const data = await response.json().catch(() => ({}))
    throw new Error(data.message || 'Could not complete the request.')
  }
  return response.json()
}
export type ShotListMetadata = { id: string; name: string; updatedAt?: string }
export type ShotSession = ShotListMetadata & {
  user: { id: number; name: string; color: string }
}
