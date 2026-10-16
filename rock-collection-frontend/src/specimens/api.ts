// api.ts - Fetch-based client for the backend REST API
import { Material, MaterialRequest, Order, Page, SpecimenRequest, SpecimenSortKey, SpecimenSummary } from './types';

// NEXT_PUBLIC_ variables are inlined into the browser bundle at build time
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

/** Error carrying the backend's message (or per-field validation messages). */
export class ApiError extends Error {
  constructor(message: string, readonly status: number, readonly fieldErrors: Record<string, string> = {}) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: init?.body ? { 'Content-Type': 'application/json', ...init.headers } : init?.headers,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    if (typeof body.error === 'string') throw new ApiError(body.error, res.status);
    // Validation failures come back as { field: message }
    const fieldErrors = body as Record<string, string>;
    const message = Object.entries(fieldErrors).map(([f, m]) => `${f}: ${m}`).join(', ') || `Request failed (${res.status})`;
    throw new ApiError(message, res.status, fieldErrors);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

/** One page of specimens; `page` is zero-based. */
export function fetchSpecimens(page: number, size: number, sort: SpecimenSortKey, direction: Order): Promise<Page<SpecimenSummary>> {
  const params = new URLSearchParams({ page: String(page), size: String(size), sort, direction });
  return request(`/api/specimens?${params}`);
}

export function createSpecimen(body: SpecimenRequest): Promise<unknown> {
  return request('/api/specimens', { method: 'POST', body: JSON.stringify(body) });
}

export function deleteSpecimen(id: number): Promise<void> {
  return request(`/api/specimens/${id}`, { method: 'DELETE' });
}

/** All tags in use, for autocomplete. */
export function fetchTags(): Promise<string[]> {
  return request('/api/specimens/tags');
}

export function fetchMaterials(): Promise<Material[]> {
  return request('/api/materials');
}

export function createMaterial(body: MaterialRequest): Promise<Material> {
  return request('/api/materials', { method: 'POST', body: JSON.stringify(body) });
}
