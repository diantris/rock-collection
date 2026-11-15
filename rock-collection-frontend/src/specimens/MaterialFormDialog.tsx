// MaterialFormDialog.tsx - Adding a material (mineral, mineraloid, organic, man-made) to the shared list, or editing or
// deleting one. A material is shared by every specimen made of it, so an edit shows on all of them at once.
import React, { useEffect, useState } from 'react';
import {
  Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField, Typography,
} from '@mui/material';
import { createMaterial, deleteMaterial, updateMaterial } from './api';
import {
  CRYSTAL_SYSTEM_LABELS, CrystalSystem, FAMILIES_BY_CATEGORY, FAMILY_LABELS, Material, MATERIAL_CATEGORY_LABELS, MaterialCategory, MaterialFamily,
} from './types';

interface Props {
  open: boolean;
  /** The material to edit; without it, a new one is added. */
  material?: Material | null;
  /** Pre-filled scientific name for a new material, e.g. what was typed into a material search box. */
  initialName?: string;
  onClose: () => void;
  /** Called with the new or edited material. */
  onSaved: (material: Material) => void;
  /** Called after the material was deleted (edit only). */
  onDeleted?: (material: Material) => void;
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

const fromMaterial = (m: Material): typeof emptyForm => ({
  name: m.name, category: m.category, family: m.family ?? '', mineralGroup: m.mineralGroup ?? '',
  crystalSystem: m.crystalSystem ?? '', formula: m.formula ?? '', mindatUrl: m.mindatUrl ?? '', description: m.description ?? '',
});

const SUBSCRIPTS = '₀₁₂₃₄₅₆₇₈₉';
const SUPERSCRIPTS: Record<string, string> = {
  0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹', '+': '⁺', '-': '⁻',
};

/**
 * Typed formulas made readable: numbers after an element or a bracket become subscripts ("SiO2" → "SiO₂",
 * "(Mg,Fe)2SiO4" → "(Mg,Fe)₂SiO₄"), and a charge after an element becomes superscript ("Fe2+" → "Fe²⁺").
 * Numbers at the start or after "·" are left alone, since they're amounts ("CaSO4·2H2O" → "CaSO₄·2H₂O").
 */
export function formatFormula(formula: string): string {
  return formula
    .replace(/([A-Z][a-z]?)(\d*[+-])(?![\w(])/g, (_, element: string, charge: string) =>
      element + [...charge].map(c => SUPERSCRIPTS[c]).join(''))
    .replace(/([A-Za-z)\]])(\d+)/g, (_, before: string, digits: string) =>
      before + [...digits].map(d => SUBSCRIPTS[Number(d)]).join(''));
}

const MaterialFormDialog: React.FC<Props> = ({ open, material = null, initialName = '', onClose, onSaved, onDeleted }) => {
  const isEdit = material !== null;
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setForm(material ? fromMaterial(material) : { ...emptyForm, name: initialName });
    setError(null);
    setConfirmDelete(false);
  }, [open, material, initialName]);

  const set = <K extends keyof typeof emptyForm>(field: K, value: (typeof emptyForm)[K]) =>
    setForm(prev => ({ ...prev, [field]: value }));

  /**
   * Only the new type's families fit. Mineraloids never have a crystal structure, so they start as amorphous;
   * a mineral always has one, so switching to Mineral clears "amorphous" again.
   */
  const setCategory = (category: MaterialCategory) => setForm(prev => ({
    ...prev, category,
    family: prev.family && FAMILIES_BY_CATEGORY[category].includes(prev.family) ? prev.family : '',
    crystalSystem: category === 'MINERALOID' && !prev.crystalSystem ? 'AMORPHOUS'
      : category === 'MINERAL' && prev.crystalSystem === 'AMORPHOUS' ? '' : prev.crystalSystem,
  }));

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const body = { ...form, formula: formatFormula(form.formula), family: form.family || null, crystalSystem: form.crystalSystem || null };
      onSaved(await (material ? updateMaterial(material.id, body) : createMaterial(body)));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!material) return;
    setSaving(true);
    setError(null);
    try {
      await deleteMaterial(material.id);
      onDeleted?.(material);
    } catch (e) {
      setError((e as Error).message);
      setConfirmDelete(false);
    } finally {
      setSaving(false);
    }
  };

  const usedBy = material?.specimenCount ?? 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth aria-labelledby="material-form-title">
      <DialogTitle id="material-form-title">{isEdit ? `Edit ${material.name}` : 'Add a material'}</DialogTitle>
      <DialogContent>
        <Stack sx={{ gap: 2, pt: 1 }}>
          {isEdit && usedBy > 0 && (
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Used by {usedBy} specimen{usedBy === 1 ? '' : 's'}; changes show on all of them.
            </Typography>
          )}
          <TextField label="Scientific name" required autoFocus={!isEdit} value={form.name} onChange={e => set('name', e.target.value)}
            helperText="e.g. Kosmochlor, Orthoclase. Never a rock: a rock is a specimen made of materials" />
          <Stack direction="row" sx={{ gap: 2 }}>
            <TextField select fullWidth label="Type" value={form.category} onChange={e => setCategory(e.target.value as MaterialCategory)}>
              {(Object.keys(MATERIAL_CATEGORY_LABELS) as MaterialCategory[]).map(k =>
                <MenuItem key={k} value={k}>{MATERIAL_CATEGORY_LABELS[k]}</MenuItem>)}
            </TextField>
            <TextField select fullWidth label="Family" value={form.family} onChange={e => set('family', e.target.value as MaterialFamily | '')}>
              <MenuItem value=""><em>unknown</em></MenuItem>
              {FAMILIES_BY_CATEGORY[form.category].map(k => <MenuItem key={k} value={k}>{FAMILY_LABELS[k]}</MenuItem>)}
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
          <TextField label="Chemical formula" value={form.formula} onChange={e => set('formula', e.target.value)}
            onBlur={() => set('formula', formatFormula(form.formula))}
            helperText="Type plain numbers: SiO2 becomes SiO₂, Fe2+ becomes Fe²⁺" />
          <TextField label="mindat.org link" value={form.mindatUrl} onChange={e => set('mindatUrl', e.target.value)} />
          <TextField label="Description" multiline minRows={2} value={form.description} onChange={e => set('description', e.target.value)}
            helperText="e.g. the mindat definition" />
          {confirmDelete && material && (
            <Alert severity="warning" action={<>
              <Button color="inherit" size="small" onClick={() => setConfirmDelete(false)} disabled={saving}>Keep it</Button>
              <Button color="inherit" size="small" onClick={handleDelete} disabled={saving}>Delete</Button>
            </>}>
              Delete “{material.name}”? No specimen uses it.
            </Alert>
          )}
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        {isEdit && (
          usedBy === 0
            ? <Button color="error" onClick={() => setConfirmDelete(true)} disabled={saving || confirmDelete} sx={{ mr: 'auto' }}>
                Delete material
              </Button>
            : <Typography variant="caption" sx={{ color: 'text.secondary', mr: 'auto', ml: 1 }}>
                Can be deleted once no specimen uses it
              </Typography>
        )}
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" disabled={saving || !form.name.trim()}>{isEdit ? 'Save' : 'Add'}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default MaterialFormDialog;
