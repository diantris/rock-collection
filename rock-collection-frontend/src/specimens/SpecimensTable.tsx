// SpecimensTable.tsx - Paginated, server-sorted specimen table with selectable columns, pins and add/delete actions.
// Unsorted, pinned specimens come first, then by name; clicking a column sorts by it (a third click goes back).
// The search box filters by part of the name or market name, or by number, on the server, so paging still works.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert, Box, Button, ButtonBase, CircularProgress, IconButton, InputAdornment, Link, Paper, Stack, SxProps, Table, TableBody,
  TableCell, TableContainer, TableHead, TablePagination, TableRow, TableSortLabel, TextField, Theme, Tooltip, Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import PushPinIcon from '@mui/icons-material/PushPin';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';
import { deleteSpecimen, fetchPhotos, fetchSpecimens, setSpecimenPinned } from './api';
import PhotoGallery from './PhotoGallery';
import SpecimenFormDialog from './SpecimenFormDialog';
import SpecimenDetailDialog from './SpecimenDetailDialog';
import MaterialsDialog from './MaterialsDialog';
import PublishDialog from './PublishDialog';
import DeleteSpecimenDialog from './DeleteSpecimenDialog';
import ColumnPicker from './ColumnPicker';
import ColumnResizer from './ColumnResizer';
import { COLUMNS, ColumnDef, GoneChip, loadColumnWidths, loadVisibleColumns, saveColumnWidths, saveVisibleColumns } from './columns';
import { Order, Page, Photo, SpecimenSortKey, SpecimenSummary } from './types';

/** How long typing must pause before the table searches. */
const SEARCH_DELAY_MS = 300;

/** Width of the pin column, always the first one, frozen on the left. */
const PIN_WIDTH = 48;

/** Width of the actions (delete) column, always the last one. */
const ACTIONS_WIDTH = 56;

/**
 * Cell styles: text and chips wrap within the column's width. A frozen column (`left` given) stays on the left while
 * the rest scrolls sideways. Header cells also stick to the top (the table's `stickyHeader`), so they need an opaque
 * background; frozen header cells sit above everything.
 */
function cellSx(width: number | undefined, left: number | undefined, header: boolean): SxProps<Theme> {
  return {
    width, minWidth: width, maxWidth: width, whiteSpace: 'normal', overflowWrap: 'anywhere',
    ...(header && { bgcolor: 'background.paper' }),
    ...(left !== undefined && { position: 'sticky', left, zIndex: header ? 3 : 1, bgcolor: 'background.paper' }),
  };
}

const SpecimensTable: React.FC = () => {
  const [data, setData] = useState<Page<SpecimenSummary> | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Dismissible warning that survives reloads, e.g. photos that failed to upload
  const [notice, setNotice] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  // null: the default order (pinned first, then by name)
  const [sortBy, setSortBy] = useState<SpecimenSortKey | null>(null);
  const [order, setOrder] = useState<Order>('asc');
  // What's typed in the search box, and what the table last searched for (after a short pause in typing)
  const [searchText, setSearchText] = useState('');
  const [query, setQuery] = useState('');
  const requestNo = useRef(0);
  // Defaults on first render (matches server rendering), then the saved choice from this browser
  const [visibleIds, setVisibleIds] = useState(() => COLUMNS.filter(c => c.defaultVisible).map(c => c.id));
  // Form dialog: closed (null), adding ('new') or editing a specimen id
  const [formTarget, setFormTarget] = useState<number | 'new' | null>(null);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [detailRefresh, setDetailRefresh] = useState(0);
  const [materialsOpen, setMaterialsOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [toDelete, setToDelete] = useState<{ id: number; name: string; published: boolean } | null>(null);
  // Gallery opened straight from a table photo
  const [gallery, setGallery] = useState<{ name: string; photos: Photo[] } | null>(null);

  // Widths the user dragged, by column id (the rest use their starting width); saved in this browser
  const [widths, setWidths] = useState<Record<string, number>>({});

  useEffect(() => {
    setVisibleIds(loadVisibleColumns());
    setWidths(loadColumnWidths());
  }, []);

  const widthOf = useCallback((col: ColumnDef) => widths[col.id] ?? col.width, [widths]);
  const resize = (col: ColumnDef, width: number | null, save: boolean) => {
    setWidths(prev => {
      const next = { ...prev };
      if (width === null) delete next[col.id]; else next[col.id] = width;
      if (save) saveColumnWidths(next);
      return next;
    });
  };

  const load = useCallback(() => {
    // Only the latest request counts, so a slow answer for an older search can't overwrite a newer one
    const no = ++requestNo.current;
    fetchSpecimens(page, rowsPerPage, sortBy, order, query)
      .then(result => { if (no === requestNo.current) { setData(result); setError(null); } })
      .catch(err => { if (no === requestNo.current) setError(err.message); });
  }, [page, rowsPerPage, sortBy, order, query]);

  useEffect(load, [load]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchText.trim() === query) return;
      setQuery(searchText.trim());
      setPage(0);
    }, SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [searchText, query]);

  const columns = useMemo(() => COLUMNS.filter(c => visibleIds.includes(c.id)), [visibleIds]);

  // Left offset of each visible sticky column = sum of the widths of the sticky columns before it
  const stickyLeft = useMemo(() => {
    const offsets: Record<string, number> = {};
    let left = PIN_WIDTH;
    for (const col of columns) {
      if (!col.sticky) continue;
      offsets[col.id] = left;
      left += widthOf(col);
    }
    return offsets;
  }, [columns, widthOf]);
  const tableWidth = PIN_WIDTH + columns.reduce((sum, col) => sum + widthOf(col), 0) + ACTIONS_WIDTH;

  const handleColumnsChange = (ids: string[]) => {
    setVisibleIds(ids);
    saveVisibleColumns(ids);
  };

  const openGallery = (s: SpecimenSummary) => {
    fetchPhotos(s.id).then(photos => setGallery({ name: s.name, photos })).catch(err => setNotice(err.message));
  };

  /** A stone no longer in the collection: faded text and a faded, grey photo (cells stay opaque for sticky columns). */
  const goneRowSx = { '& td': { color: 'text.disabled' }, '& img': { filter: 'grayscale(1)', opacity: 0.5 } };

  /**
   * Cell content; a table photo opens the gallery instead of the details. The name is a button that opens the
   * details: clicking anywhere on a row does that too, but a keyboard or a screen reader needs a real control.
   */
  const cell = (col: ColumnDef, s: SpecimenSummary) => {
    if (col.id === 'name') {
      return (
        <>
          {s.gone && <GoneChip />}
          <Link component="button" type="button" underline="hover" color="inherit"
            onClick={e => { e.stopPropagation(); setDetailId(s.id); }}
            sx={{ font: 'inherit', textAlign: 'left', verticalAlign: 'baseline', userSelect: 'text', overflowWrap: 'anywhere' }}>
            {s.name}
          </Link>
        </>
      );
    }
    if (col.id !== 'photo' || s.thumbnailVersion === null) return col.render(s);
    return (
      <ButtonBase aria-label={`Photos of ${s.name}`} onClick={e => { e.stopPropagation(); openGallery(s); }} sx={{ borderRadius: 2 }}>
        {col.render(s)}
      </ButtonBase>
    );
  };

  /** Ascending, then descending, then back to the default order. */
  const handleSort = (key: SpecimenSortKey) => {
    if (sortBy === key && order === 'desc') {
      setSortBy(null);
      setOrder('asc');
    } else {
      setOrder(sortBy === key ? 'desc' : 'asc');
      setSortBy(key);
    }
    setPage(0);
  };

  const togglePin = (s: SpecimenSummary) => {
    setSpecimenPinned(s.id, !s.pinned).then(load).catch(err => setNotice(err.message));
  };

  return (
    // The page fills the window and only the table scrolls, so its header row stays in view
    <Box sx={{ p: 3, height: '100dvh', minHeight: 480, boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 2 }}>
        Rock Collection
      </Typography>
      <Stack direction="row" sx={{ gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <Button variant="contained" onClick={() => setFormTarget('new')}>Add a specimen</Button>
        <Button variant="outlined" onClick={() => setMaterialsOpen(true)}>Materials</Button>
        <TextField
          type="search" size="small" placeholder="Name or number" value={searchText}
          onChange={e => setSearchText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Escape') setSearchText(''); }}
          sx={{ width: { xs: '100%', sm: 280 }, '& input::-webkit-search-cancel-button': { display: 'none' } }}
          slotProps={{
            htmlInput: { 'aria-label': 'Search specimens' },
            input: {
              sx: { borderRadius: 5 },
              startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
              endAdornment: searchText && (
                <InputAdornment position="end">
                  <IconButton size="small" edge="end" aria-label="Clear search" onClick={() => setSearchText('')}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />
        <Box sx={{ flexGrow: 1 }} />
        <Button variant="outlined" onClick={() => setPublishOpen(true)}>Publish</Button>
        <ColumnPicker visible={visibleIds} onChange={handleColumnsChange} />
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>Error: {error}</Alert>}
      {notice && <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setNotice(null)}>{notice}</Alert>}

      <Paper variant="outlined" sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Scrolls both ways; the header row and the frozen columns stay put */}
        <TableContainer sx={{ flex: 1, overflow: 'auto' }}>
          {/* Fixed layout: columns are exactly as wide as set; the actions column takes up any room left over */}
          <Table aria-label="Specimens" size="small" stickyHeader sx={{ tableLayout: 'fixed', width: tableWidth, minWidth: '100%' }}>
            <TableHead>
              <TableRow>
                <TableCell aria-label="Pinned" sx={cellSx(PIN_WIDTH, 0, true)}>
                  <Tooltip title="Pinned stones come first, until you sort by a column">
                    <PushPinOutlinedIcon fontSize="small" sx={{ display: 'block', mx: 'auto' }} />
                  </Tooltip>
                </TableCell>
                {columns.map(col => (
                  // Its own label, or the resize handle's name would become part of the header's name
                  <TableCell key={col.id} aria-label={col.label} sx={cellSx(widthOf(col), stickyLeft[col.id], true)}
                    sortDirection={col.sortKey && sortBy === col.sortKey ? order : false}>
                    {col.sortKey ? (
                      <TableSortLabel
                        active={sortBy === col.sortKey}
                        direction={sortBy === col.sortKey ? order : 'asc'}
                        onClick={() => handleSort(col.sortKey!)}
                      >
                        {col.label}
                      </TableSortLabel>
                    ) : col.label}
                    {!col.fixedWidth && (
                      <ColumnResizer label={col.label} width={widthOf(col)}
                        onResize={(w, done) => resize(col, w, done)} onReset={() => resize(col, null, true)} />
                    )}
                  </TableCell>
                ))}
                <TableCell aria-label="Actions" sx={{ minWidth: ACTIONS_WIDTH, bgcolor: 'background.paper' }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {data === null && !error && (
                <TableRow>
                  <TableCell colSpan={columns.length + 2} align="center"><CircularProgress size={24} /></TableCell>
                </TableRow>
              )}
              {data?.content.length === 0 && (
                <TableRow>
                  <TableCell colSpan={columns.length + 2} align="center">
                    {query ? `No specimens match “${query}”.` : 'No specimens yet.'}
                  </TableCell>
                </TableRow>
              )}
              {data?.content.map(s => (
                <TableRow key={s.id} hover onClick={() => setDetailId(s.id)} sx={[{ cursor: 'pointer' }, s.gone && goneRowSx]}>
                  <TableCell padding="none" align="center" sx={cellSx(PIN_WIDTH, 0, false)}>
                    <Tooltip title={s.pinned ? 'Unpin' : 'Pin to the top'}>
                      <IconButton aria-label={`Pin ${s.name}`} aria-pressed={s.pinned} size="small"
                        onClick={e => { e.stopPropagation(); togglePin(s); }}
                        sx={{ color: s.pinned ? 'primary.main' : 'text.disabled' }}>
                        {s.pinned ? <PushPinIcon fontSize="small" /> : <PushPinOutlinedIcon fontSize="small" />}
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                  {columns.map(col => (
                    <TableCell key={col.id} sx={cellSx(widthOf(col), stickyLeft[col.id], false)}>
                      {cell(col, s)}
                    </TableCell>
                  ))}
                  <TableCell align="right">
                    <IconButton aria-label={`Delete ${s.name}`} onClick={e => { e.stopPropagation(); setToDelete(s); }} size="small">
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={data?.totalElements ?? 0}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[25, 50, 100]}
        />
      </Paper>

      <SpecimenFormDialog
        open={formTarget !== null}
        specimenId={typeof formTarget === 'number' ? formTarget : null}
        onClose={() => setFormTarget(null)}
        onAdded={load}
        onSaved={(saved, photoError) => {
          if (photoError) setNotice(`“${saved.name}” was added, but its photos weren’t: ${photoError} You can add them from its details.`);
          // After editing, return to the (refreshed) details; after adding, just show the updated table
          if (typeof formTarget === 'number') {
            setDetailId(saved.id);
            setDetailRefresh(n => n + 1);
          }
          setFormTarget(null);
          load();
        }}
      />
      <SpecimenDetailDialog
        specimenId={formTarget === null ? detailId : null}
        refreshKey={detailRefresh}
        onClose={() => setDetailId(null)}
        onEdit={id => setFormTarget(id)}
        onDelete={s => setToDelete(s)}
        onPhotosChanged={load}
      />
      <PhotoGallery photos={gallery?.photos ?? []} startIndex={gallery ? 0 : null} title={gallery?.name ?? ''}
        onClose={() => setGallery(null)} />
      <PublishDialog open={publishOpen} onClose={() => setPublishOpen(false)} onSpecimensChanged={load} />
      <MaterialsDialog open={materialsOpen} onClose={() => setMaterialsOpen(false)} onChanged={load} />
      <DeleteSpecimenDialog
        specimen={toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={async () => {
          await deleteSpecimen(toDelete!.id);
          // Its page and photos stay on the public site (photos broken) until the next publish
          if (toDelete!.published) setNotice(`“${toDelete!.name}” was deleted. Publish again to remove it from the public site.`);
          setToDelete(null);
          setDetailId(null);
          load();
        }}
      />
    </Box>
  );
};

export default SpecimensTable;
