import {networkFetch,responseFailure} from '../network'
import { getAuthToken } from '../api'
import { shotApiBase } from '../shotApi'
export const boardBase = shotApiBase + '/storyboards'
export async function boardFetch(path: string, init: RequestInit = {}) {
  const response = await networkFetch(boardBase + path, {
    ...init,
    headers: {
      Authorization: `Bearer ${getAuthToken() || ''}`,
      ...init.headers,
    },
  })
  if (!response.ok) throw await responseFailure(response)

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
  signal?: AbortSignal,
): Promise<MediaAsset> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const uploadBase=file.size>90*1024*1024&&shotApiBase==='https://api.vaderwhiteout.com/api'?'https://uploads.vaderwhiteout.com/api/storyboards':boardBase
    xhr.open('POST', uploadBase + '/' + id + '/assets')
    xhr.setRequestHeader('Authorization', `Bearer ${getAuthToken() || ''}`)
    xhr.timeout = 900000
    xhr.ontimeout = () => reject(Error('Artwork upload timed out. Your original is safe. Check the panel before retrying.'))
    xhr.upload.onprogress = (e) =>
      e.lengthComputable && progress?.(e.loaded / e.total)
    const abort = () => xhr.abort()
    signal?.addEventListener('abort', abort, { once: true })
    xhr.onloadend = () => signal?.removeEventListener('abort', abort)
    xhr.onabort = () => reject(Error('Upload cancelled.'))
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
