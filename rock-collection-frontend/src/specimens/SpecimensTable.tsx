// SpecimensTable.tsx - Paginated, server-sorted specimen table with selectable columns and add/delete actions
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert, Box, Button, CircularProgress, IconButton, Paper, Stack, SxProps, Table, TableBody, TableCell,
  TableContainer, TableHead, TablePagination, TableRow, TableSortLabel, Theme, Typography,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import { deleteSpecimen, fetchSpecimens } from './api';
import AddSpecimenDialog from './AddSpecimenDialog';
import AddMaterialDialog from './AddMaterialDialog';
import DeleteSpecimenDialog from './DeleteSpecimenDialog';
import ColumnPicker from './ColumnPicker';
import { COLUMNS, ColumnDef, loadVisibleColumns, saveVisibleColumns } from './columns';
import { Order, Page, SpecimenSortKey, SpecimenSummary } from './types';

/** Styles freezing a column on the left while the rest of the table scrolls sideways. */
function stickySx(col: ColumnDef, left: number | undefined, header: boolean): SxProps<Theme> {
  if (left === undefined) return { whiteSpace: 'nowrap' };
  return {
    position: 'sticky', left, zIndex: header ? 3 : 1, width: col.width, minWidth: col.width, maxWidth: col.width,
    bgcolor: 'background.paper', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  };
}

const SpecimensTable: React.FC = () => {
  const [data, setData] = useState<Page<SpecimenSummary> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [sortBy, setSortBy] = useState<SpecimenSortKey>('id');
  const [order, setOrder] = useState<Order>('asc');
  // Defaults on first render (matches server rendering), then the saved choice from this browser
  const [visibleIds, setVisibleIds] = useState(() => COLUMNS.filter(c => c.defaultVisible).map(c => c.id));
  const [addOpen, setAddOpen] = useState(false);
  const [addMaterialOpen, setAddMaterialOpen] = useState(false);
  const [toDelete, setToDelete] = useState<SpecimenSummary | null>(null);

  useEffect(() => setVisibleIds(loadVisibleColumns()), []);

  const load = useCallback(() => {
    fetchSpecimens(page, rowsPerPage, sortBy, order)
      .then(result => { setData(result); setError(null); })
      .catch(err => setError(err.message));
  }, [page, rowsPerPage, sortBy, order]);

  useEffect(load, [load]);

  const columns = useMemo(() => COLUMNS.filter(c => visibleIds.includes(c.id)), [visibleIds]);

  // Left offset of each visible sticky column = sum of the widths of the sticky columns before it
  const stickyLeft = useMemo(() => {
    const offsets: Record<string, number> = {};
    let left = 0;
    for (const col of columns) {
      if (!col.sticky) continue;
      offsets[col.id] = left;
      left += col.width ?? 0;
    }
    return offsets;
  }, [columns]);

  const handleColumnsChange = (ids: string[]) => {
    setVisibleIds(ids);
    saveVisibleColumns(ids);
  };

  const handleSort = (key: SpecimenSortKey) => {
    setOrder(sortBy === key && order === 'asc' ? 'desc' : 'asc');
    setSortBy(key);
    setPage(0);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 2 }}>
        Rock Collection
      </Typography>
      <Stack direction="row" sx={{ gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <Button variant="contained" onClick={() => setAddOpen(true)}>Add a specimen</Button>
        <Button variant="outlined" onClick={() => setAddMaterialOpen(true)}>Add a material</Button>
        <Box sx={{ flexGrow: 1 }} />
        <ColumnPicker visible={visibleIds} onChange={handleColumnsChange} />
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>Error: {error}</Alert>}

      <Paper variant="outlined">
        {/* Scrolls sideways when the chosen columns don't fit; sticky columns stay put */}
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table aria-label="Specimens" size="small">
            <TableHead>
              <TableRow>
                {columns.map(col => (
                  <TableCell key={col.id} sx={stickySx(col, stickyLeft[col.id], true)}
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
                  </TableCell>
                ))}
                <TableCell aria-label="Actions" />
              </TableRow>
            </TableHead>
            <TableBody>
              {data === null && !error && (
                <TableRow>
                  <TableCell colSpan={columns.length + 1} align="center"><CircularProgress size={24} /></TableCell>
                </TableRow>
              )}
              {data?.content.length === 0 && (
                <TableRow>
                  <TableCell colSpan={columns.length + 1} align="center">No specimens yet.</TableCell>
                </TableRow>
              )}
              {data?.content.map(s => (
                <TableRow key={s.id} hover>
                  {columns.map(col => (
                    <TableCell key={col.id} sx={stickySx(col, stickyLeft[col.id], false)}
                      title={col.id === 'name' ? s.name : undefined}>
                      {col.render(s)}
                    </TableCell>
                  ))}
                  <TableCell align="right">
                    <IconButton aria-label={`Delete ${s.name}`} onClick={() => setToDelete(s)} size="small">
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

      <AddSpecimenDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={() => { setAddOpen(false); load(); }}
      />
      <AddMaterialDialog open={addMaterialOpen} onClose={() => setAddMaterialOpen(false)} onCreated={() => setAddMaterialOpen(false)} />
      <DeleteSpecimenDialog
        specimen={toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={async () => {
          await deleteSpecimen(toDelete!.id);
          setToDelete(null);
          load();
        }}
      />
    </Box>
  );
};

export default SpecimensTable;
