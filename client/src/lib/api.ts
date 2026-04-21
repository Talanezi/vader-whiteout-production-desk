import type { CallSheetDraft } from '../data/mockCallSheet'

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ||
  'http://localhost:3001/api'

const SCHEDULER_TOKEN_KEY = 'token'

export function getAuthToken() {
  return localStorage.getItem(SCHEDULER_TOKEN_KEY)
}

async function parseJson<T>(response: Response): Promise<T> {
  if (response.status === 401) {
    throw new Error('UNAUTHORIZED')
  }
  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || `Request failed with status ${response.status}`)
  }
  return response.json() as Promise<T>
}

async function authFetch(input: string, init?: RequestInit) {
  const token = getAuthToken()
  const headers = new Headers(init?.headers || {})
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  return fetch(input, {
    ...init,
    headers,
  })
}

export async function listCallSheets(): Promise<{ items: CallSheetDraft[]; total: number }> {
  const response = await authFetch(`${API_BASE_URL}/callsheets`)
  return parseJson(response)
}

export async function getCallSheet(id: string): Promise<CallSheetDraft> {
  const response = await authFetch(`${API_BASE_URL}/callsheets/${id}`)
  return parseJson(response)
}

export async function createCallSheet(payload: Partial<CallSheetDraft>): Promise<CallSheetDraft> {
  const response = await authFetch(`${API_BASE_URL}/callsheets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return parseJson(response)
}

export async function duplicateCallSheet(id: string): Promise<CallSheetDraft> {
  const response = await authFetch(`${API_BASE_URL}/callsheets/${id}/duplicate`, {
    method: 'POST',
  })
  return parseJson(response)
}

export async function updateCallSheet(id: string, payload: Partial<CallSheetDraft>): Promise<CallSheetDraft> {
  const response = await authFetch(`${API_BASE_URL}/callsheets/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return parseJson(response)
}

export async function deleteCallSheet(id: string): Promise<{ ok: true; id: string }> {
  const response = await authFetch(`${API_BASE_URL}/callsheets/${id}`, {
    method: 'DELETE',
  })
  return parseJson(response)
}

export async function downloadPdfFile(id: string, suggestedTitle: string) {
  const response = await authFetch(`${API_BASE_URL}/callsheets/${id}/pdf`)
  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || 'Failed to download PDF')
  }

  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const safeTitle = (suggestedTitle || 'callsheet').replace(/[^a-z0-9-_]+/gi, '-').toLowerCase()
  a.href = url
  a.download = `${safeTitle}.pdf`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
