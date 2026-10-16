// AddSpecimenDialog.tsx - Quick-add dialog for a specimen (names, form, nature, materials, provenance basics, tags)
import React, { useEffect, useState } from 'react';
import {
  Alert, Autocomplete, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, MenuItem, Stack, TextField,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { createSpecimen, fetchMaterials, fetchTags } from './api';
import {
  ACQUISITION_LABELS, AcquisitionType, CERTAINTY_LABELS, ComponentRole, FORM_LABELS, IdentificationCertainty, Material,
  NATURE_LABELS, ROLE_LABELS, SpecimenForm, SpecimenNature,
} from './types';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

interface ComponentDraft {
  material: Material | null;
  role: ComponentRole;
  certainty: IdentificationCertainty;
}

const emptyForm = {
  name: '',
  marketName: '',
  form: '' as SpecimenForm | '',
  nature: '' as SpecimenNature | '',
  acquisitionType: '' as AcquisitionType | '',
  acquiredFrom: '',
  tags: [] as string[],
};

/** Select over an enum's label map, with an empty "unknown" option. */
function EnumSelect<T extends string>(props: { label: string; value: T | ''; labels: Record<T, string>; onChange: (v: T | '') => void }) {
  return (
    <TextField select fullWidth label={props.label} value={props.value} onChange={e => props.onChange(e.target.value as T | '')}>
      <MenuItem value=""><em>unknown</em></MenuItem>
      {(Object.keys(props.labels) as T[]).map(k => <MenuItem key={k} value={k}>{props.labels[k]}</MenuItem>)}
    </TextField>
  );
}

const AddSpecimenDialog: React.FC<Props> = ({ open, onClose, onCreated }) => {
  const [form, setForm] = useState(emptyForm);
  const [components, setComponents] = useState<ComponentDraft[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [knownTags, setKnownTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset and (re)load suggestions each time the dialog opens, so newly added materials and tags appear
  useEffect(() => {
    if (!open) return;
    setForm(emptyForm);
    setComponents([]);
    setError(null);
    fetchMaterials().then(setMaterials).catch(() => setMaterials([]));
    fetchTags().then(setKnownTags).catch(() => setKnownTags([]));
  }, [open]);

  const set = <K extends keyof typeof emptyForm>(field: K, value: (typeof emptyForm)[K]) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const updateComponent = (index: number, patch: Partial<ComponentDraft>) =>
    setComponents(prev => prev.map((c, i) => (i === index ? { ...c, ...patch } : c)));

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await createSpecimen({
        name: form.name,
        marketName: form.marketName,
        form: form.form || null,
        nature: form.nature || null,
        acquisitionType: form.acquisitionType || null,
        acquiredFrom: form.acquiredFrom,
        tags: form.tags,
        components: components
          .filter(c => c.material !== null)
          .map(c => ({ materialId: c.material!.id, role: c.role, certainty: c.certainty })),
      });
      onCreated();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add a specimen</DialogTitle>
      <DialogContent>
        <Stack sx={{ gap: 2, pt: 1 }}>
          <TextField label="Name" required autoFocus value={form.name} onChange={e => set('name', e.target.value)}
            helperText="What you call it, e.g. “Dalmatian Stone” or “green thing from the scrap bin”" />
          <TextField label="Market name" value={form.marketName} onChange={e => set('marketName', e.target.value)}
            helperText="What it was sold as, e.g. “Dalmatian Jasper”" />
          <Stack direction="row" sx={{ gap: 2 }}>
            <EnumSelect label="Form" value={form.form} labels={FORM_LABELS} onChange={v => set('form', v)} />
            <EnumSelect label="Nature" value={form.nature} labels={NATURE_LABELS} onChange={v => set('nature', v)} />
          </Stack>

          {components.map((c, i) => (
            <Stack key={i} direction="row" sx={{ gap: 1, alignItems: 'center' }}>
              <Autocomplete
                sx={{ flex: 2 }}
                options={materials}
                getOptionLabel={m => m.name}
                isOptionEqualToValue={(a, b) => a.id === b.id}
                value={c.material}
                onChange={(_, m) => updateComponent(i, { material: m })}
                renderInput={params => <TextField {...params} label="Scientific identity" />}
              />
              <TextField select sx={{ flex: 1 }} label="Role" value={c.role}
                onChange={e => updateComponent(i, { role: e.target.value as ComponentRole })}>
                {(Object.keys(ROLE_LABELS) as ComponentRole[]).map(k => <MenuItem key={k} value={k}>{ROLE_LABELS[k]}</MenuItem>)}
              </TextField>
              <TextField select sx={{ flex: 1 }} label="Certainty" value={c.certainty}
                onChange={e => updateComponent(i, { certainty: e.target.value as IdentificationCertainty })}>
                {(Object.keys(CERTAINTY_LABELS) as IdentificationCertainty[]).map(k => <MenuItem key={k} value={k}>{CERTAINTY_LABELS[k]}</MenuItem>)}
              </TextField>
              <IconButton aria-label="Remove material" onClick={() => setComponents(prev => prev.filter((_, j) => j !== i))}>
                <CloseIcon />
              </IconButton>
            </Stack>
          ))}
          <Button sx={{ alignSelf: 'flex-start' }}
            onClick={() => setComponents(prev => [...prev, { material: null, role: prev.length ? 'INCLUSION' : 'HOST', certainty: 'TENTATIVE' }])}>
            + Add scientific identity
          </Button>

          <Stack direction="row" sx={{ gap: 2 }}>
            <EnumSelect label="Source" value={form.acquisitionType} labels={ACQUISITION_LABELS} onChange={v => set('acquisitionType', v)} />
            <TextField fullWidth label="Where I got it" value={form.acquiredFrom} onChange={e => set('acquiredFrom', e.target.value)} />
          </Stack>
          <Autocomplete
            multiple
            freeSolo
            options={knownTags}
            value={form.tags}
            onChange={(_, tags) => set('tags', tags)}
            renderValue={(tags, getItemProps) =>
              tags.map((tag, index) => <Chip size="small" label={tag} {...getItemProps({ index })} key={tag} />)}
            renderInput={params => <TextField {...params} label="Tags" helperText="Type and press Enter, e.g. combo, inclusions, weird" />}
          />
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

export default AddSpecimenDialog;
