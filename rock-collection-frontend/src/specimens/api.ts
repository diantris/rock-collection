// api.ts - Fetch-based client for the backend REST API
import { Material, MaterialRequest, Order, Page, Photo, PublishFieldKey, PublishResult, PublishSettings, SpecimenDetail, SpecimenRequest, SpecimenSortKey, SpecimenSummary } from './types';

// NEXT_PUBLIC_ variables are inlined into the browser bundle at build time
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

/** Error carrying the backend's message (or per-field validation messages). */
export class ApiError extends Error {
  constructor(message: string, readonly status: number, readonly fieldErrors: Record<string, string> = {}) {
    super(message);
  }
}

/** The API refuses changes without it, so other web sites can't make them through this browser. */
const APP_HEADER = { 'X-Rock-Collection': '1' };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const changes = init?.method !== undefined && init.method !== 'GET';
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      ...(changes ? APP_HEADER : {}),
      // JSON bodies are strings; FormData sets its own multipart Content-Type
      ...(typeof init?.body === 'string' ? { 'Content-Type': 'application/json' } : {}),
    },
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

export function fetchSpecimen(id: number): Promise<SpecimenDetail> {
  return request(`/api/specimens/${id}`);
}

export function createSpecimen(body: SpecimenRequest): Promise<SpecimenDetail> {
  return request('/api/specimens', { method: 'POST', body: JSON.stringify(body) });
}

/** Replaces every field of the specimen (send the full request, not a patch). */
export function updateSpecimen(id: number, body: SpecimenRequest): Promise<SpecimenDetail> {
  return request(`/api/specimens/${id}`, { method: 'PUT', body: JSON.stringify(body) });
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

/** A specimen's photos, cover first. */
export function fetchPhotos(specimenId: number): Promise<Photo[]> {
  return request(`/api/specimens/${specimenId}/photos`);
}

/** Uploads photos (resized and stripped of EXIF/GPS on the server, then pushed to the Pages repo); returns all photos. */
export function uploadPhotos(specimenId: number, files: File[]): Promise<Photo[]> {
  const body = new FormData();
  for (const file of files) body.append('files', file);
  return request(`/api/specimens/${specimenId}/photos`, { method: 'POST', body });
}

/** @param photoIds every photo id in the new order; the first becomes the cover */
export function reorderPhotos(specimenId: number, photoIds: number[]): Promise<Photo[]> {
  return request(`/api/specimens/${specimenId}/photos/order`, { method: 'PUT', body: JSON.stringify(photoIds) });
}

export function deletePhoto(specimenId: number, photoId: number): Promise<void> {
  return request(`/api/specimens/${specimenId}/photos/${photoId}`, { method: 'DELETE' });
}

/** URL of the table thumbnail; the version makes browsers fetch it again only when it changed. */
export function thumbnailUrl(specimenId: number, version: number): string {
  return `${API_BASE}/api/specimens/${specimenId}/thumbnail?v=${version}`;
}

export function fetchPublishSettings(): Promise<PublishSettings> {
  return request('/api/publish/settings');
}

/** Saves the global publish checkboxes and the intro text of the public site. */
export function updatePublishSettings(fields: PublishFieldKey[], intro: string): Promise<PublishSettings> {
  return request('/api/publish/settings', { method: 'PUT', body: JSON.stringify({ fields, intro }) });
}

/** Marks every specimen to show on the public site. */
export function publishAllSpecimens(): Promise<PublishSettings> {
  return request('/api/publish/all-specimens', { method: 'POST' });
}

/** Regenerates the public site and commits it to the Pages repo. */
export function publishSite(): Promise<PublishResult> {
  return request('/api/publish', { method: 'POST' });
}
