// columns.tsx - Column definitions for the specimen table, and the persisted column choice and widths
import React from 'react';
import { Box, Chip, Stack, Tooltip, Typography } from '@mui/material';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import { thumbnailUrl } from './api';
import {
  ACQUISITION_LABELS, CERTAINTY_LABELS, Component, FAMILY_LABELS, FORM_LABELS, IDENTIFICATION_STATUS_LABELS,
  NATURE_TYPE_LABELS, NATURE_LABELS,
  ROLE_SHORT_LABELS, SpecimenSortKey, SpecimenSummary,
} from './types';

/** Muted placeholder for missing data. */
export const Unknown: React.FC<{ text?: string }> = ({ text = 'unknown' }) => (
  <Typography component="span" variant="body2" sx={{ color: 'text.disabled' }}>{text}</Typography>
);

/** Lets a chip's label wrap onto more lines when its column is narrow, instead of being cut off. */
export const wrappingChipSx = { height: 'auto', minHeight: 24, maxWidth: '100%', '& .MuiChip-label': { whiteSpace: 'normal', py: '2px' } };

/** Chip per material, e.g. "Garnet · inclusion" — outlined unless the identification is confirmed. */
export const ComponentChips: React.FC<{ components: Component[] }> = ({ components }) =>
  components.length === 0 ? <Unknown text="no materials" /> : (
    <Stack direction="row" sx={{ gap: 0.5, flexWrap: 'wrap' }}>
      {components.map((c, i) => (
        <Tooltip key={i} title={`${ROLE_SHORT_LABELS[c.role]} · ${CERTAINTY_LABELS[c.certainty]}`}>
          <Chip
            size="small"
            label={c.role === 'HOST' ? c.materialName : `${c.materialName} · ${ROLE_SHORT_LABELS[c.role].toLowerCase()}`}
            variant={c.certainty === 'CONFIRMED' ? 'filled' : 'outlined'}
            sx={wrappingChipSx}
          />
        </Tooltip>
      ))}
    </Stack>
  );

/** Marks a stone that's no longer in the collection; goes before its name. */
export const GoneChip: React.FC = () => <Chip size="small" variant="outlined" label="Gone" sx={{ mr: 1 }} />;

export interface ColumnDef {
  id: string;
  label: string;
  sortKey?: SpecimenSortKey;
  defaultVisible: boolean;
  /** Frozen on the left while scrolling sideways. */
  sticky?: boolean;
  /** Starting width in px; text and chips wrap within it. The user can drag it wider or narrower unless `fixedWidth`. */
  width: number;
  fixedWidth?: boolean;
  render: (s: SpecimenSummary) => React.ReactNode;
}

/** On-screen size of the table photo; the server makes 192px thumbnails, so they stay sharp on high-DPI screens. */
export const THUMBNAIL_SIZE = 48;

const orUnknown = (value: React.ReactNode) => (value === null || value === undefined || value === '' ? <Unknown /> : value);

export const COLUMNS: ColumnDef[] = [
  { id: 'id', label: '#', sortKey: 'id', defaultVisible: true, sticky: true, width: 80, fixedWidth: true, render: s => s.id },
  {
    id: 'photo', label: 'Photo', defaultVisible: true, sticky: true, width: 80, fixedWidth: true,
    // The table makes this cell open the gallery when there's a photo
    render: s => s.thumbnailVersion === null
      ? <ImageOutlinedIcon aria-label="No photo yet" sx={{ color: 'text.disabled', display: 'block', mx: '6px' }} />
      : <Box component="img" src={thumbnailUrl(s.id, s.thumbnailVersion)} alt="" width={THUMBNAIL_SIZE} height={THUMBNAIL_SIZE}
          sx={{ display: 'block', borderRadius: 2, objectFit: 'cover' }} />,
  },
  {
    id: 'name', label: 'Name', sortKey: 'name', defaultVisible: true, sticky: true, width: 220,
    // The chip goes first, so it's always at the start of the name. (The table itself makes the name a button.)
    render: s => s.gone ? <><GoneChip />{s.name}</> : s.name,
  },
  { id: 'whySpecial', label: 'Why it’s special', defaultVisible: false, width: 280, render: s => s.whySpecial ?? <Unknown text="—" /> },
  { id: 'marketName', label: 'Market name', sortKey: 'marketName', defaultVisible: true, width: 220, render: s => orUnknown(s.marketName) },
  {
    id: 'identificationStatus', label: 'Identification', sortKey: 'identificationStatus', defaultVisible: true, width: 160,
    // Sorted by certainty (unidentified first), not alphabetically
    render: s => IDENTIFICATION_STATUS_LABELS[s.identificationStatus],
  },
  { id: 'materials', label: 'Scientific identity', defaultVisible: false, width: 280, render: s => <ComponentChips components={s.components} /> },
  { id: 'type', label: 'Type', defaultVisible: true, width: 120, render: s => orUnknown(s.nature && NATURE_TYPE_LABELS[s.nature]) },
  { id: 'family', label: 'Family', defaultVisible: true, width: 150, render: s => orUnknown(s.family && FAMILY_LABELS[s.family]) },
  { id: 'acquiredFrom', label: 'Where I got it', sortKey: 'acquiredFrom', defaultVisible: true, width: 200, render: s => orUnknown(s.acquiredFrom) },
  { id: 'acquiredCountry', label: 'Country (where I got it)', sortKey: 'acquiredCountry', defaultVisible: false, width: 160, render: s => orUnknown(s.acquiredCountry) },
  { id: 'source', label: 'Source', sortKey: 'acquisitionType', defaultVisible: false, width: 120, render: s => orUnknown(s.acquisitionType && ACQUISITION_LABELS[s.acquisitionType]) },
  { id: 'acquiredYear', label: 'Acquired', sortKey: 'acquiredYear', defaultVisible: false, width: 110, render: s => orUnknown(s.acquiredYear) },
  { id: 'price', label: 'Price', sortKey: 'price', defaultVisible: false, width: 110, render: s => orUnknown(s.price !== null ? `${s.price} ${s.currency ?? ''}`.trim() : null) },
  { id: 'origin', label: 'Origin', sortKey: 'country', defaultVisible: false, width: 160, render: s => orUnknown(s.country) },
  { id: 'form', label: 'Form', sortKey: 'form', defaultVisible: false, width: 120, render: s => orUnknown(s.form && FORM_LABELS[s.form]) },
  { id: 'nature', label: 'Nature', sortKey: 'nature', defaultVisible: false, width: 170, render: s => orUnknown(s.nature && NATURE_LABELS[s.nature]) },
  {
    id: 'tags', label: 'Tags', defaultVisible: false, width: 200,
    render: s => s.tags.length === 0 ? <Unknown text="—" /> : (
      <Stack direction="row" sx={{ gap: 0.5, flexWrap: 'wrap' }}>{s.tags.map(t => <Chip key={t} size="small" label={t} sx={wrappingChipSx} />)}</Stack>
    ),
  },
  { id: 'published', label: 'Public', defaultVisible: false, width: 100, render: s => (s.gone ? 'No (gone)' : s.published ? 'Yes' : 'No') },
];

/** Narrowest a column can be dragged. */
export const MIN_COLUMN_WIDTH = 60;

const WIDTHS_KEY = 'specimenTable.columnWidths';

/** Column widths the user set in this browser, by column id; other columns use their starting width. */
export function loadColumnWidths(): Record<string, number> {
  try {
    const saved: unknown = JSON.parse(window.localStorage.getItem(WIDTHS_KEY) ?? 'null');
    if (saved && typeof saved === 'object') {
      return Object.fromEntries(Object.entries(saved).filter(([id, w]) =>
        COLUMNS.some(c => c.id === id && !c.fixedWidth) && typeof w === 'number' && w >= MIN_COLUMN_WIDTH));
    }
  } catch {
    // ignore: storage blocked or corrupt
  }
  return {};
}

export function saveColumnWidths(widths: Record<string, number>): void {
  try {
    window.localStorage.setItem(WIDTHS_KEY, JSON.stringify(widths));
  } catch {
    // ignore: storage blocked
  }
}

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
