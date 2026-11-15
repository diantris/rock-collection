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

/**
 * One page of specimens; `page` is zero-based. Without a sort key: pinned specimens first, then by name.
 * `query` keeps only specimens whose name or market name contains it, or whose number it is ("142" or "#142").
 */
export function fetchSpecimens(
  page: number, size: number, sort: SpecimenSortKey | null, direction: Order, query = '',
): Promise<Page<SpecimenSummary>> {
  const params = new URLSearchParams({ page: String(page), size: String(size), direction });
  if (sort) params.set('sort', sort);
  if (query.trim()) params.set('q', query.trim());
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

/** Pins the specimen to the top of the table, or unpins it; nothing else changes. */
export function setSpecimenPinned(id: number, pinned: boolean): Promise<void> {
  return request(`/api/specimens/${id}/pinned`, { method: 'PUT', body: JSON.stringify({ pinned }) });
}

export function deleteSpecimen(id: number): Promise<void> {
  return request(`/api/specimens/${id}`, { method: 'DELETE' });
}

/** All tags in use, for autocomplete. */
export function fetchTags(): Promise<string[]> {
  return request('/api/specimens/tags');
}

/** Every "where I got it" already used, most recently used first, for the form's suggestions. */
export function fetchAcquiredFrom(): Promise<string[]> {
  return request('/api/specimens/acquired-from');
}

export function fetchMaterials(): Promise<Material[]> {
  return request('/api/materials');
}

export function createMaterial(body: MaterialRequest): Promise<Material> {
  return request('/api/materials', { method: 'POST', body: JSON.stringify(body) });
}

/** Replaces every field of a material; the specimens using it show the change at once. */
export function updateMaterial(id: number, body: MaterialRequest): Promise<Material> {
  return request(`/api/materials/${id}`, { method: 'PUT', body: JSON.stringify(body) });
}

/** Refused (409) while any specimen still uses the material. */
export function deleteMaterial(id: number): Promise<void> {
  return request(`/api/materials/${id}`, { method: 'DELETE' });
}

/** A specimen's photos, cover first. */
export function fetchPhotos(specimenId: number): Promise<Photo[]> {
  return request(`/api/specimens/${specimenId}/photos`);
}

/**
 * Uploads photos (resized and stripped of EXIF/GPS on the server, then pushed to the Pages repo); returns all photos.
 * They're sent in file-name order, because browsers don't reliably keep it: numbered names set the photos' order,
 * and the first of a specimen's photos becomes its cover. "2-back" comes before "10-macro".
 */
export function uploadPhotos(specimenId: number, files: File[]): Promise<Photo[]> {
  const body = new FormData();
  const byName = [...files].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  for (const file of byName) body.append('files', file);
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

/** Saves the global publish checkboxes, the intro text of the public site and the message box address. */
export function updatePublishSettings(
  settings: { fields: PublishFieldKey[]; intro: string; messageUrl: string },
): Promise<PublishSettings> {
  return request('/api/publish/settings', { method: 'PUT', body: JSON.stringify(settings) });
}

/** Marks every specimen to show on the public site. */
export function publishAllSpecimens(): Promise<PublishSettings> {
  return request('/api/publish/all-specimens', { method: 'POST' });
}

/** Regenerates the public site and commits it to the Pages repo. */
export function publishSite(): Promise<PublishResult> {
  return request('/api/publish', { method: 'POST' });
}
