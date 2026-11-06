import {networkFetch,responseFailure} from './network'
import { getAuthToken } from './api'
export const shotApiBase =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(
    /\/$/,
    '',
  ) ||
  (import.meta.env.DEV
    ? 'http://localhost:3001/api'
    : 'https://api.vaderwhiteout.com/api')
export async function shotRequest<T>(
  path: string,
  payload?: unknown,
): Promise<T> {
  const response = await networkFetch(`${shotApiBase}/shotlists${path}`, {
    method: payload === undefined ? 'GET' : 'POST',
    headers: {
      Authorization: `Bearer ${getAuthToken() || ''}`,
      ...(payload === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    body: payload === undefined ? undefined : JSON.stringify(payload),
  })
  if (!response.ok) throw await responseFailure(response)

  return response.json()
}
export type ShotListMetadata = {
  id: string
  name: string
  updatedAt?: string
  sceneCount?: number
  shotCount?: number
  scheduledShotCount?: number
  dates?: string[]
}
export type ShotSession = ShotListMetadata & {
  user: { id: number; name: string; color: string; role?: string; department?: string }
}
