// MaterialsDialog.tsx - The shared list of materials (the "Materials" button): search it, add one, or open one to edit
// or delete it. Each row says how many specimens use the material.
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, InputAdornment, List,
  ListItemButton, ListItemText, Stack, TextField, Typography, useMediaQuery, useTheme,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { fetchMaterials } from './api';
import MaterialFormDialog from './MaterialFormDialog';
import { CRYSTAL_SYSTEM_LABELS, FAMILY_LABELS, Material, MATERIAL_CATEGORY_LABELS } from './types';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Called after a material was edited or deleted, so the table can show the change. */
  onChanged: () => void;
}

/** E.g. "Mineral · Silicate · Quartz group · Trigonal". */
const classification = (m: Material) =>
  [MATERIAL_CATEGORY_LABELS[m.category], m.family && FAMILY_LABELS[m.family], m.mineralGroup && `${m.mineralGroup} group`,
    m.crystalSystem && CRYSTAL_SYSTEM_LABELS[m.crystalSystem]].filter(Boolean).join(' · ');

const MaterialsDialog: React.FC<Props> = ({ open, onClose, onChanged }) => {
  const fullScreen = useMediaQuery(useTheme().breakpoints.down('sm'));
  const [materials, setMaterials] = useState<Material[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  /** The material being edited, 'new' while adding one, or null. */
  const [editing, setEditing] = useState<Material | 'new' | null>(null);

  const load = () => fetchMaterials().then(setMaterials).catch(e => setError((e as Error).message));

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setError(null);
    void load();
  }, [open]);

  // Name, formula, group or family; ignoring case
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!materials || !q) return materials ?? [];
    return materials.filter(m => [m.name, m.formula, classification(m)].some(v => v?.toLowerCase().includes(q)));
  }, [materials, query]);

  const afterChange = () => {
    setEditing(null);
    void load();
    onChanged();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth fullScreen={fullScreen} aria-labelledby="materials-title">
      <DialogTitle id="materials-title">Materials</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
          What specimens are made of, shared by every specimen with that material. Click one to edit it.
        </Typography>
        <Stack direction="row" sx={{ gap: 2, mb: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField type="search" size="small" placeholder="Name, formula or group" value={query} sx={{ flex: '1 1 220px' }}
            onChange={e => setQuery(e.target.value)}
            slotProps={{
              htmlInput: { 'aria-label': 'Search materials' },
              input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> },
            }} />
          <Button variant="contained" onClick={() => setEditing('new')}>Add a material</Button>
        </Stack>
        {error && <Alert severity="error" sx={{ my: 1 }}>{error}</Alert>}
        {!materials && !error && <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>}
        {materials && (
          <>
            <Typography variant="caption" component="p" sx={{ color: 'text.secondary', mb: 0.5 }}>
              {shown.length === materials.length ? `${materials.length} materials` : `${shown.length} of ${materials.length} materials`}
            </Typography>
            <List dense aria-label="Materials" sx={{ mx: -1 }}>
              {shown.map(m => (
                <ListItemButton key={m.id} onClick={() => setEditing(m)} sx={{ borderRadius: 2, alignItems: 'flex-start' }}>
                  <ListItemText
                    primary={<>{m.name}{m.formula && <Box component="span" sx={{ color: 'text.secondary', ml: 1 }}>{m.formula}</Box>}</>}
                    secondary={classification(m)} />
                  <Typography variant="body2" sx={{ color: m.specimenCount ? 'text.secondary' : 'text.disabled', ml: 2, mt: 0.75, whiteSpace: 'nowrap' }}>
                    {m.specimenCount === 0 ? 'unused' : `${m.specimenCount} specimen${m.specimenCount === 1 ? '' : 's'}`}
                  </Typography>
                </ListItemButton>
              ))}
            </List>
            {shown.length === 0 && (
              <Typography variant="body2" sx={{ color: 'text.secondary', py: 2 }}>No material matches “{query.trim()}”.</Typography>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>

      <MaterialFormDialog
        open={editing !== null}
        material={editing === 'new' ? null : editing}
        initialName={editing === 'new' ? query.trim() : ''}
        onClose={() => setEditing(null)}
        onSaved={afterChange}
        onDeleted={afterChange}
      />
    </Dialog>
  );
};

export default MaterialsDialog;
