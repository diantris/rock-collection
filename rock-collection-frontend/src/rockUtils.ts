// rockUtils.ts - Utility functions for rock collection frontend
import { CollectedRock, RockGroup } from './CollectedRocksTable';

// Determine API base URL
const isDocker = process.env.REACT_APP_API_URL !== undefined;
const API_BASE = isDocker ? process.env.REACT_APP_API_URL : 'http://localhost:8080';

if (isDocker && !process.env.REACT_APP_API_URL) {
  throw new Error('REACT_APP_API_URL must be set when running in Docker.');
}

// Sort rocks by a given key and order
export function sortRocks(rocks: CollectedRock[], sortBy: keyof CollectedRock, order: 'asc' | 'desc'): CollectedRock[] {
  return [...rocks].sort((a, b) => {
    const aValue = a[sortBy]?.toString().toLowerCase() || '';
    const bValue = b[sortBy]?.toString().toLowerCase() || '';
    if (aValue < bValue) return order === 'asc' ? -1 : 1;
    if (aValue > bValue) return order === 'asc' ? 1 : -1;
    return 0;
  });
}

// Fetch all collected rocks
export async function fetchRocks(): Promise<CollectedRock[]> {
  const res = await fetch(`${API_BASE}/api/rocks`);
  if (!res.ok) throw new Error('Failed to fetch');
  return await res.json();
}

// Fetch all rock groups
export async function fetchGroups(): Promise<RockGroup[]> {
  const res = await fetch(`${API_BASE}/api/groups`);
  if (!res.ok) throw new Error('Failed to fetch groups');
  return await res.json();
}

// Add a new rock
export async function addRock(form: { name: string; market_name: string; origin: string; group: RockGroup | null }): Promise<void> {
  if (!form.name || !form.group) throw new Error('Name and Group are required.');
  const res = await fetch(`${API_BASE}/api/rocks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      rockName: form.name,
      marketName: form.market_name,
      origin: form.origin,
      group: { id: form.group.id }
    })
  });
  if (!res.ok) throw new Error('Failed to add rock');
}

// Add a new rock group
export async function addGroup(groupForm: any): Promise<void> {
  if (!groupForm.groupName) throw new Error('Group Name is required.');
  const res = await fetch(`${API_BASE}/api/groups`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(groupForm)
  });
  if (!res.ok) throw new Error('Failed to add group');
}

// Delete a rock by id
export async function deleteRock(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/rocks/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete rock');
}
