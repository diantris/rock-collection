// columns.tsx - Column definitions for the specimen table, and the column picker's persisted selection
import React from 'react';
import { Box, Chip, Stack, Tooltip, Typography } from '@mui/material';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import { thumbnailUrl } from './api';
import {
  ACQUISITION_LABELS, CERTAINTY_LABELS, Component, FAMILY_LABELS, FORM_LABELS, MATERIAL_CATEGORY_LABELS, NATURE_LABELS,
  ROLE_LABELS, SpecimenSortKey, SpecimenSummary,
} from './types';

/** Muted placeholder for missing data. */
export const Unknown: React.FC<{ text?: string }> = ({ text = 'unknown' }) => (
  <Typography component="span" variant="body2" sx={{ color: 'text.disabled' }}>{text}</Typography>
);

/** Chip per material, e.g. "Garnet · inclusion" — outlined unless the identification is confirmed. */
export const ComponentChips: React.FC<{ components: Component[] }> = ({ components }) =>
  components.length === 0 ? <Unknown text="unidentified" /> : (
    <Stack direction="row" sx={{ gap: 0.5, flexWrap: 'wrap' }}>
      {components.map((c, i) => (
        <Tooltip key={i} title={`${ROLE_LABELS[c.role]} · ${CERTAINTY_LABELS[c.certainty]}`}>
          <Chip
            size="small"
            label={c.role === 'HOST' ? c.materialName : `${c.materialName} · ${ROLE_LABELS[c.role].toLowerCase()}`}
            variant={c.certainty === 'CONFIRMED' ? 'filled' : 'outlined'}
          />
        </Tooltip>
      ))}
    </Stack>
  );

export interface ColumnDef {
  id: string;
  label: string;
  sortKey?: SpecimenSortKey;
  defaultVisible: boolean;
  /** Frozen on the left while scrolling sideways; needs a fixed width. */
  sticky?: boolean;
  width?: number;
  render: (s: SpecimenSummary) => React.ReactNode;
}

/** On-screen size of the table photo; the server makes 192px thumbnails, so they stay sharp on high-DPI screens. */
export const THUMBNAIL_SIZE = 48;

const orUnknown = (value: React.ReactNode) => (value === null || value === undefined || value === '' ? <Unknown /> : value);

export const COLUMNS: ColumnDef[] = [
  { id: 'id', label: '#', sortKey: 'id', defaultVisible: true, sticky: true, width: 80, render: s => s.id },
  {
    id: 'photo', label: 'Photo', defaultVisible: true, sticky: true, width: 80,
    // The table makes this cell open the gallery when there's a photo
    render: s => s.thumbnailVersion === null
      ? <ImageOutlinedIcon aria-label="No photo yet" sx={{ color: 'text.disabled', display: 'block', mx: '6px' }} />
      : <Box component="img" src={thumbnailUrl(s.id, s.thumbnailVersion)} alt="" width={THUMBNAIL_SIZE} height={THUMBNAIL_SIZE}
          sx={{ display: 'block', borderRadius: 2, objectFit: 'cover' }} />,
  },
  { id: 'name', label: 'Name', sortKey: 'name', defaultVisible: true, sticky: true, width: 220, render: s => s.name },
  { id: 'marketName', label: 'Market name', sortKey: 'marketName', defaultVisible: true, render: s => orUnknown(s.marketName) },
  { id: 'materials', label: 'Scientific identity', defaultVisible: false, render: s => <ComponentChips components={s.components} /> },
  { id: 'type', label: 'Type', defaultVisible: true, render: s => orUnknown(s.type && MATERIAL_CATEGORY_LABELS[s.type]) },
  { id: 'family', label: 'Family', defaultVisible: true, render: s => orUnknown(s.family && FAMILY_LABELS[s.family]) },
  { id: 'acquiredFrom', label: 'Where I got it', sortKey: 'acquiredFrom', defaultVisible: true, render: s => orUnknown(s.acquiredFrom) },
  { id: 'acquiredCountry', label: 'Country (where I got it)', sortKey: 'acquiredCountry', defaultVisible: false, render: s => orUnknown(s.acquiredCountry) },
  { id: 'source', label: 'Source', sortKey: 'acquisitionType', defaultVisible: false, render: s => orUnknown(s.acquisitionType && ACQUISITION_LABELS[s.acquisitionType]) },
  { id: 'acquiredYear', label: 'Acquired', sortKey: 'acquiredYear', defaultVisible: false, render: s => orUnknown(s.acquiredYear) },
  { id: 'price', label: 'Price', sortKey: 'price', defaultVisible: false, render: s => orUnknown(s.price !== null ? `${s.price} ${s.currency ?? ''}`.trim() : null) },
  { id: 'origin', label: 'Origin', sortKey: 'country', defaultVisible: false, render: s => orUnknown(s.country) },
  { id: 'form', label: 'Form', sortKey: 'form', defaultVisible: false, render: s => orUnknown(s.form && FORM_LABELS[s.form]) },
  { id: 'nature', label: 'Nature', sortKey: 'nature', defaultVisible: false, render: s => orUnknown(s.nature && NATURE_LABELS[s.nature]) },
  {
    id: 'tags', label: 'Tags', defaultVisible: false,
    render: s => s.tags.length === 0 ? <Unknown text="—" /> : (
      <Stack direction="row" sx={{ gap: 0.5, flexWrap: 'wrap' }}>{s.tags.map(t => <Chip key={t} size="small" label={t} />)}</Stack>
    ),
  },
  { id: 'published', label: 'Public', defaultVisible: false, render: s => (s.published ? 'Yes' : 'No') },
];

const STORAGE_KEY = 'specimenTable.visibleColumns';

/** Visible column ids from the last session, or the defaults. Browser storage may be unavailable, so failures fall back. */
export function loadVisibleColumns(): string[] {
  const defaults = COLUMNS.filter(c => c.defaultVisible).map(c => c.id);
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? 'null');
    if (Array.isArray(saved)) {
      const known = saved.filter((id: unknown) => COLUMNS.some(c => c.id === id));
      if (known.length > 0) return known;
    }
  } catch {
    // ignore: storage blocked or corrupt
  }
  return defaults;
}

export function saveVisibleColumns(ids: string[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // ignore: storage blocked
  }
}
