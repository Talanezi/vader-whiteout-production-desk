import type { CallSheetDraft } from '../data/mockCallSheet'

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ||
  'http://localhost:3001/api'

const TOKEN_KEY = 'production_desk_token'
const USER_KEY = 'production_desk_user'

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setAuthSession(token: string, user: { id: number; email: string; name: string }) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearAuthSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export function getStoredUser(): { id: number; email: string; name: string } | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

async function parseJson<T>(response: Response): Promise<T> {
  if (response.status === 401) {
    clearAuthSession()
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

export async function login(email: string, password: string) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  return parseJson<{ token: string; user: { id: number; email: string; name: string } }>(response)
}

export async function me() {
  const response = await authFetch(`${API_BASE_URL}/auth/me`)
  return parseJson<{ id: number; email: string; name: string }>(response)
}

export async function listCallSheets(): Promise<{ items: CallSheetDraft[]; total: number }> {
  const response = await authFetch(`${API_BASE_URL}/callsheets`)
  return parseJson(response)
}

export async function getCallSheet(id: string): Promise<CallSheetDraft> {
  const response = await authFetch(`${API_BASE_URL}/callsheets/${id}`)
  return parseJson(response)
}

export async function createCallSheet(
  payload: Partial<CallSheetDraft>,
): Promise<CallSheetDraft> {
  const response = await authFetch(`${API_BASE_URL}/callsheets`, {
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
  const response = await authFetch(`${API_BASE_URL}/callsheets/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return parseJson(response)
}
