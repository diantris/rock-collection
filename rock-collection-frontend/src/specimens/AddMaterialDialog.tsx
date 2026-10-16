// AddMaterialDialog.tsx - Dialog for adding a scientific identity (mineral, rock, ...) to the reference list
import React, { useEffect, useState } from 'react';
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField } from '@mui/material';
import { createMaterial } from './api';
import {
  CRYSTAL_SYSTEM_LABELS, CrystalSystem, FAMILY_LABELS, MATERIAL_CATEGORY_LABELS, MaterialCategory, MaterialFamily,
} from './types';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const emptyForm = {
  name: '',
  category: 'MINERAL' as MaterialCategory,
  family: '' as MaterialFamily | '',
  mineralGroup: '',
  crystalSystem: '' as CrystalSystem | '',
  formula: '',
  mindatUrl: '',
  description: '',
};

const AddMaterialDialog: React.FC<Props> = ({ open, onClose, onCreated }) => {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) { setForm(emptyForm); setError(null); }
  }, [open]);

  const set = <K extends keyof typeof emptyForm>(field: K, value: (typeof emptyForm)[K]) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await createMaterial({ ...form, family: form.family || null, crystalSystem: form.crystalSystem || null });
      onCreated();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add a material</DialogTitle>
      <DialogContent>
        <Stack sx={{ gap: 2, pt: 1 }}>
          <TextField label="Scientific name" required autoFocus value={form.name} onChange={e => set('name', e.target.value)}
            helperText="e.g. Kosmochlor, Rhyolite" />
          <Stack direction="row" sx={{ gap: 2 }}>
            <TextField select fullWidth label="Type" value={form.category} onChange={e => set('category', e.target.value as MaterialCategory)}>
              {(Object.keys(MATERIAL_CATEGORY_LABELS) as MaterialCategory[]).map(k =>
                <MenuItem key={k} value={k}>{MATERIAL_CATEGORY_LABELS[k]}</MenuItem>)}
            </TextField>
            <TextField select fullWidth label="Family" value={form.family} onChange={e => set('family', e.target.value as MaterialFamily | '')}>
              <MenuItem value=""><em>unknown</em></MenuItem>
              {(Object.keys(FAMILY_LABELS) as MaterialFamily[]).map(k => <MenuItem key={k} value={k}>{FAMILY_LABELS[k]}</MenuItem>)}
            </TextField>
          </Stack>
          <Stack direction="row" sx={{ gap: 2 }}>
            <TextField fullWidth label="Mineral group" value={form.mineralGroup} onChange={e => set('mineralGroup', e.target.value)}
              helperText="e.g. Quartz, Feldspar, Pyroxene" />
            <TextField select fullWidth label="Crystal system" value={form.crystalSystem}
              onChange={e => set('crystalSystem', e.target.value as CrystalSystem | '')}>
              <MenuItem value=""><em>unknown</em></MenuItem>
              {(Object.keys(CRYSTAL_SYSTEM_LABELS) as CrystalSystem[]).map(k => <MenuItem key={k} value={k}>{CRYSTAL_SYSTEM_LABELS[k]}</MenuItem>)}
            </TextField>
          </Stack>
          <TextField label="Chemical formula" value={form.formula} onChange={e => set('formula', e.target.value)} />
          <TextField label="mindat.org link" value={form.mindatUrl} onChange={e => set('mindatUrl', e.target.value)} />
          <TextField label="Description" multiline minRows={2} value={form.description} onChange={e => set('description', e.target.value)}
            helperText="e.g. the mindat definition" />
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" disabled={saving || !form.name.trim()}>Add</Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddMaterialDialog;
