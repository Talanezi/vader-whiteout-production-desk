import { getAuthToken } from '../api'
import { shotApiBase } from '../shotApi'
export const boardBase = shotApiBase + '/storyboards'
export async function boardFetch(path: string, init: RequestInit = {}) {
  const response = await fetch(boardBase + path, {
    ...init,
    headers: {
      Authorization: `Bearer ${getAuthToken() || ''}`,
      ...init.headers,
    },
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw Error(
      response.status === 401
        ? 'UNAUTHORIZED'
        : error.message || 'Could not complete the storyboard request.',
    )
  }
  return response
}
export async function boardRequest<T>(
  path: string,
  payload?: unknown,
): Promise<T> {
  return (
    await boardFetch(
      path,
      payload === undefined
        ? {}
        : {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          },
    )
  ).json()
}
export type MediaAsset = {
  id: string
  filename: string
  mime: string
  bytes: number
  width?: number
  height?: number
}
export async function uploadAsset(
  id: string,
  file: File,
  progress?: (p: number) => void,
): Promise<MediaAsset> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', boardBase + '/' + id + '/assets')
    xhr.setRequestHeader('Authorization', `Bearer ${getAuthToken() || ''}`)
    xhr.upload.onprogress = (e) =>
      e.lengthComputable && progress?.(e.loaded / e.total)
    xhr.onerror = () =>
      reject(
        Error(
          'Upload interrupted. Your original file is safe; retry the upload.',
        ),
      )
    xhr.onload = () => {
      let body
      try {
        body = JSON.parse(xhr.responseText)
      } catch {}
      if (xhr.status >= 200 && xhr.status < 300) resolve(body)
      else reject(Error(body?.message || 'Artwork upload failed.'))
    }
    const form = new FormData()
    form.append('file', file)
    xhr.send(form)
  })
}
