import { getAuthToken } from '../api'
import { shotApiBase } from '../shotApi'
export const flowBase = shotApiBase + '/flows'
export async function flowFetch(path: string, init: RequestInit = {}) {
  const response = await fetch(flowBase + path, {
    ...init,
    headers: {
      Authorization: `Bearer ${getAuthToken() || ''}`,
      ...init.headers,
    },
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw Object.assign(Error(
      response.status === 401
        ? 'UNAUTHORIZED'
        : error.message || 'Could not complete the Flow request.',
    ),{status:response.status})
  }
  return response
}
export async function flowRequest<T>(
  path: string,
  payload?: unknown,
): Promise<T> {
  return (
    await flowFetch(
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

/** Same private authenticated upload contract as M04, scoped to Flow originals. */
export function uploadWorkbook(
  id: string,
  file: File,
  onProgress: (n: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', flowBase + '/' + id + '/sources')
    xhr.setRequestHeader('Authorization', 'Bearer ' + (getAuthToken() || ''))
    xhr.timeout = 60000
    xhr.ontimeout = () =>
      reject(Error('Upload timed out. The original is safe; retry the import.'))
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(e.loaded / e.total)
    }
    xhr.onerror = () =>
      reject(
        Error('Upload interrupted. The original is safe; retry the import.'),
      )
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(1)
        resolve()
      } else {
        let data
        try {
          data = JSON.parse(xhr.responseText)
        } catch {}
        reject(
          Error(
            data?.message ||
              'Could not preserve the private original. Retry the upload.',
          ),
        )
      }
    }
    const form = new FormData()
    form.append('file', file)
    xhr.send(form)
  })
}
