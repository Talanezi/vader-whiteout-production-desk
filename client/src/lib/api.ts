import type { CallSheetDraft } from '../data/mockCallSheet'

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ||
  'http://localhost:3001/api'

async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || `Request failed with status ${response.status}`)
  }
  return response.json() as Promise<T>
}

export async function listCallSheets(): Promise<{ items: CallSheetDraft[]; total: number }> {
  const response = await fetch(`${API_BASE_URL}/callsheets`)
  return parseJson(response)
}

export async function getCallSheet(id: string): Promise<CallSheetDraft> {
  const response = await fetch(`${API_BASE_URL}/callsheets/${id}`)
  return parseJson(response)
}

export async function createCallSheet(
  payload: Partial<CallSheetDraft>,
): Promise<CallSheetDraft> {
  const response = await fetch(`${API_BASE_URL}/callsheets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return parseJson(response)
}

export async function updateCallSheet(
  id: string,
  payload: Partial<CallSheetDraft>,
): Promise<CallSheetDraft> {
  const response = await fetch(`${API_BASE_URL}/callsheets/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return parseJson(response)
}
