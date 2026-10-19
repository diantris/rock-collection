// SpecimenFormDialog.tsx - Full add/edit form for a specimen. Only the name is required; everything else
// lives in collapsible sections so quick entry stays short and measurements can be added later.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Accordion, AccordionDetails, AccordionSummary, Alert, Autocomplete, Box, Button, Chip, CircularProgress, Dialog,
  DialogActions, DialogContent, DialogTitle, FormControlLabel, IconButton, MenuItem, Stack, Switch, TextField, Typography,
  createFilterOptions, useMediaQuery, useTheme,
} from '@mui/material';
import AddPhotoAlternateOutlinedIcon from '@mui/icons-material/AddPhotoAlternateOutlined';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { ApiError, createSpecimen, fetchMaterials, fetchSpecimen, fetchTags, updateSpecimen, uploadPhotos } from './api';
import { PHOTO_TYPES } from './PhotosSection';
import AddMaterialDialog from './AddMaterialDialog';
import {
  ACQUISITION_LABELS, AcquisitionType, CERTAINTY_LABELS, ComponentRole, FORM_LABELS, IdentificationCertainty, Material,
  NATURE_LABELS, OPTICAL_EFFECT_LABELS, OpticalEffect, ROLE_LABELS, SPECIAL_PROPERTY_LABELS, SpecialProperty, SpecimenDetail,
  SpecimenForm, SpecimenNature, SpecimenRequest,
} from './types';
import {
  CLEAVAGE_SUGGESTIONS, FRACTURE_SUGGESTIONS, HABIT_SUGGESTIONS, LUSTER_SUGGESTIONS, SCRATCH_TEST_HINT, STREAK_SUGGESTIONS,
  TRANSPARENCY_SUGGESTIONS,
} from './suggestions';

interface Props {
  open: boolean;
  /** Edit this specimen; omit to add a new one. */
  specimenId?: number | null;
  onClose: () => void;
  /** @param photoError set when the specimen was added but its photos couldn't be uploaded */
  onSaved: (specimen: SpecimenDetail, photoError?: string) => void;
  /** Called after "Add & next" saved a specimen while the dialog stays open. */
  onAdded?: () => void;
}

interface ComponentDraft {
  material: Material | null;
  role: ComponentRole;
  certainty: IdentificationCertainty;
}

// Text and number inputs are kept as strings while editing; numbers are parsed on save
const TEXT_FIELDS = [
  'name', 'marketName', 'treatmentNotes', 'color', 'secondaryColor', 'luster', 'transparency', 'streak',
  'cleavage', 'fracture', 'crystalHabit', 'inclusions', 'otherObservations', 'locality', 'country', 'acquiredFrom',
  'acquiredCountry', 'currency', 'description', 'privateNotes',
] as const;
const NUMBER_FIELDS = [
  'hardnessMin', 'hardnessMax', 'specificGravity', 'weightG', 'lengthMm', 'widthMm', 'heightMm',
  'acquiredYear', 'acquiredMonth', 'acquiredDay', 'price',
] as const;
type TextField_ = (typeof TEXT_FIELDS)[number];
type NumberField = (typeof NUMBER_FIELDS)[number];

type FormState = Record<TextField_ | NumberField, string> & {
  form: SpecimenForm | '';
  nature: SpecimenNature | '';
  acquisitionType: AcquisitionType | '';
  specialProperties: SpecialProperty[];
  opticalEffects: OpticalEffect[];
  tags: string[];
  published: boolean;
};

const emptyForm = (): FormState => ({
  ...(Object.fromEntries([...TEXT_FIELDS, ...NUMBER_FIELDS].map(f => [f, ''])) as Record<TextField_ | NumberField, string>),
  form: '', nature: '', acquisitionType: '', specialProperties: [], opticalEffects: [], tags: [], published: true,
});

function fromDetail(d: SpecimenDetail): FormState {
  const f = emptyForm();
  for (const k of TEXT_FIELDS) f[k] = d[k] ?? '';
  for (const k of NUMBER_FIELDS) f[k] = d[k] === null ? '' : String(d[k]);
  return {
    ...f, form: d.form ?? '', nature: d.nature ?? '', acquisitionType: d.acquisitionType ?? '',
    specialProperties: d.specialProperties, opticalEffects: d.opticalEffects, tags: d.tags, published: d.published,
  };
}

/** Parses "2,65" as well as "2.65"; '' means unknown. Returns NaN for anything else. */
function parseNumber(value: string): number | null {
  const v = value.trim().replace(',', '.');
  return v === '' ? null : Number(v);
}

/** Section membership, used for the "n filled" counters in the section headers. */
const SECTIONS = {
  identity: ['inclusions'],
  appearance: ['color', 'secondaryColor', 'luster', 'transparency', 'opticalEffects'],
  physical: ['hardnessMin', 'streak', 'specificGravity', 'cleavage', 'fracture', 'crystalHabit', 'specialProperties', 'otherObservations'],
  size: ['weightG', 'lengthMm', 'widthMm', 'heightMm'],
  provenance: ['locality', 'country', 'acquisitionType', 'acquiredFrom', 'acquiredCountry', 'acquiredYear', 'price'],
  notes: ['description', 'privateNotes', 'treatmentNotes'],
} as const;

type NewMaterialOption = { newName: string };
const materialFilter = createFilterOptions<Material | NewMaterialOption>();

const SpecimenFormDialog: React.FC<Props> = ({ open, specimenId, onClose, onSaved, onAdded }) => {
  const isEdit = specimenId !== null && specimenId !== undefined;
  const fullScreen = useMediaQuery(useTheme().breakpoints.down('sm'));
  const [form, setForm] = useState<FormState>(emptyForm);
  const [components, setComponents] = useState<ComponentDraft[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [knownTags, setKnownTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  // Component row waiting for a material created via "Add … as a new material"
  const [newMaterial, setNewMaterial] = useState<{ index: number; name: string } | null>(null);
  // Name of the specimen just saved with "Add & next", shown as confirmation
  const [lastAdded, setLastAdded] = useState<string | null>(null);
  // Photos chosen while adding; uploaded once the specimen exists (in edit mode they're managed in the details)
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoWarning, setPhotoWarning] = useState<string | null>(null);
  const photoInput = useRef<HTMLInputElement>(null);

  // (Re)load everything each time the dialog opens
  useEffect(() => {
    if (!open) return;
    setError(null);
    setFieldErrors({});
    setLastAdded(null);
    setPhotoFiles([]);
    setPhotoWarning(null);
    fetchMaterials().then(setMaterials).catch(() => setMaterials([]));
    fetchTags().then(setKnownTags).catch(() => setKnownTags([]));
    if (!isEdit) {
      setForm(emptyForm());
      setComponents([]);
      return;
    }
    setLoading(true);
    fetchSpecimen(specimenId!)
      .then(d => {
        setForm(fromDetail(d));
        setComponents(d.components.map(c => ({
          material: { id: c.materialId, name: c.materialName, category: c.category, family: c.family, mineralGroup: c.mineralGroup,
            crystalSystem: c.crystalSystem, formula: null, mindatUrl: null, description: null },
          role: c.role, certainty: c.certainty,
        })));
      })
      .catch(e => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [open, isEdit, specimenId]);

  const set = <K extends keyof FormState>(field: K, value: FormState[K]) => setForm(prev => ({ ...prev, [field]: value }));
  const updateComponent = (index: number, patch: Partial<ComponentDraft>) =>
    setComponents(prev => prev.map((c, i) => (i === index ? { ...c, ...patch } : c)));

  const filledCount = (fields: readonly string[]) =>
    fields.filter(f => {
      const v = form[f as keyof FormState];
      return Array.isArray(v) ? v.length > 0 : typeof v === 'string' && v.trim() !== '';
    }).length;

  // Inline errors: from the server's field errors, or numbers that don't parse
  const numberErrors = useMemo(() => {
    const errors: Record<string, string> = {};
    for (const f of NUMBER_FIELDS) if (Number.isNaN(parseNumber(form[f]))) errors[f] = 'Not a number';
    return errors;
  }, [form]);
  const errorFor = (field: string) => numberErrors[field] ?? fieldErrors[field];
  const canSave = !saving && !loading && form.name.trim() !== '' && Object.keys(numberErrors).length === 0;

  const toRequest = (): SpecimenRequest => {
    const body: SpecimenRequest = { name: form.name };
    for (const k of TEXT_FIELDS) body[k] = form[k];
    for (const k of NUMBER_FIELDS) body[k] = parseNumber(form[k]);
    return {
      ...body,
      currency: form.currency.trim().toUpperCase(),
      form: form.form || null, nature: form.nature || null, acquisitionType: form.acquisitionType || null,
      specialProperties: form.specialProperties, opticalEffects: form.opticalEffects, tags: form.tags, published: form.published,
      components: components.filter(c => c.material !== null)
        .map(c => ({ materialId: c.material!.id, role: c.role, certainty: c.certainty })),
    };
  };

  /** @param addAnother keep the dialog open for the next specimen, keeping acquisition details and tags */
  const handleSave = async (addAnother = false) => {
    setSaving(true);
    setError(null);
    setFieldErrors({});
    setPhotoWarning(null);
    try {
      const saved = isEdit ? await updateSpecimen(specimenId!, toRequest()) : await createSpecimen(toRequest());
      // The specimen is saved by now; a failed upload is reported, but doesn't undo it
      let photoError: string | undefined;
      if (!isEdit && photoFiles.length > 0) {
        try {
          await uploadPhotos(saved.id, photoFiles);
        } catch (e) {
          photoError = (e as Error).message;
        }
      }
      if (addAnother) {
        setForm(prev => ({
          ...emptyForm(),
          acquisitionType: prev.acquisitionType, acquiredFrom: prev.acquiredFrom, acquiredCountry: prev.acquiredCountry,
          acquiredYear: prev.acquiredYear, acquiredMonth: prev.acquiredMonth, acquiredDay: prev.acquiredDay,
          currency: prev.currency, tags: prev.tags,
        }));
        setComponents([]);
        setPhotoFiles([]);
        setLastAdded(saved.name);
        if (photoError) setPhotoWarning(`“${saved.name}” was added, but its photos weren’t: ${photoError} You can add them from its details.`);
        onAdded?.();
      } else {
        onSaved(saved, photoError);
      }
    } catch (e) {
      if (e instanceof ApiError) setFieldErrors(e.fieldErrors);
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  // ---- small bound inputs -------------------------------------------------------------------------------------------

  const text = (field: TextField_ | NumberField, label: string, extra: Partial<React.ComponentProps<typeof TextField>> = {}) => {
    const { helperText, ...rest } = extra;
    return (
      <TextField key={field} fullWidth label={label} value={form[field]} onChange={e => set(field, e.target.value)}
        error={!!errorFor(field)} helperText={errorFor(field) ?? helperText}
        slotProps={NUMBER_FIELDS.includes(field as NumberField) ? { htmlInput: { inputMode: 'decimal' } } : undefined}
        {...rest} />
    );
  };

  const suggest = (field: TextField_, label: string, options: string[]) => (
    <Autocomplete key={field} freeSolo fullWidth options={options} value={form[field]} inputValue={form[field]}
      onInputChange={(_, v) => set(field, v)} onChange={(_, v) => set(field, v ?? '')}
      renderInput={params => <TextField {...params} label={label} />} />
  );

  function enumSelect<T extends string>(field: 'form' | 'nature' | 'acquisitionType', label: string, labels: Record<T, string>) {
    return (
      <TextField select fullWidth label={label} value={form[field]} onChange={e => set(field, e.target.value as FormState[typeof field])}>
        <MenuItem value=""><em>unknown</em></MenuItem>
        {(Object.keys(labels) as T[]).map(k => <MenuItem key={k} value={k}>{labels[k]}</MenuItem>)}
      </TextField>
    );
  }

  function enumMulti<T extends string>(field: 'specialProperties' | 'opticalEffects', label: string, labels: Record<T, string>) {
    return (
      <Autocomplete multiple fullWidth options={Object.keys(labels) as T[]} getOptionLabel={k => labels[k]}
        value={form[field] as T[]} onChange={(_, v) => set(field, v as never)}
        renderValue={(values, getItemProps) =>
          values.map((v, index) => <Chip size="small" label={labels[v]} {...getItemProps({ index })} key={v} />)}
        renderInput={params => <TextField {...params} label={label} />} />
    );
  }

  const section = (title: string, fields: readonly string[], children: React.ReactNode, defaultExpanded = false) => {
    const filled = filledCount(fields);
    return (
      <Accordion defaultExpanded={defaultExpanded} slotProps={{ transition: { unmountOnExit: true } }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>{title}</Typography>
          {filled > 0 && <Typography variant="body2" sx={{ color: 'text.secondary', mr: 1, alignSelf: 'center' }}>{filled} filled</Typography>}
        </AccordionSummary>
        <AccordionDetails><Stack sx={{ gap: 2 }}>{children}</Stack></AccordionDetails>
      </Accordion>
    );
  };

  // Children passed as separate arguments, so React doesn't expect keys on them
  const row = (...children: React.ReactNode[]) =>
    React.createElement(Stack, { direction: { xs: 'column', sm: 'row' }, sx: { gap: 2 } }, ...children);

  // ---- layout -------------------------------------------------------------------------------------------------------

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth fullScreen={fullScreen} aria-labelledby="specimen-form-title">
      <DialogTitle id="specimen-form-title">{isEdit ? `Edit #${specimenId}` : 'Add a specimen'}</DialogTitle>
      <DialogContent>
        {loading ? <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box> : (
          <Stack sx={{ gap: 2, pt: 1 }}>
            {photoWarning && <Alert severity="warning" onClose={() => setPhotoWarning(null)}>{photoWarning}</Alert>}
            {lastAdded && (
              <Alert severity="success" onClose={() => setLastAdded(null)}>
                Added “{lastAdded}”. Where you got it and the tags are kept for the next one.
              </Alert>
            )}
            {text('name', 'Name', { required: true, autoFocus: !isEdit,
              helperText: 'What you call it, e.g. “Dalmatian Stone” or “green thing from the scrap bin”' })}
            {row(
              text('marketName', 'Market name', { helperText: 'What it was sold as, e.g. “Dalmatian Jasper”' }),
              <Autocomplete key="tags" multiple freeSolo fullWidth options={knownTags} value={form.tags}
                onChange={(_, tags) => set('tags', tags)}
                renderValue={(tags, getItemProps) =>
                  tags.map((tag, index) => <Chip size="small" label={tag} {...getItemProps({ index })} key={tag} />)}
                renderInput={params => <TextField {...params} label="Tags" helperText="Type and press Enter" />} />,
            )}
            {row(enumSelect('form', 'Form', FORM_LABELS), enumSelect('nature', 'Nature', NATURE_LABELS))}
            {!isEdit && (
              <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                <Button variant="outlined" startIcon={<AddPhotoAlternateOutlinedIcon />} onClick={() => photoInput.current?.click()}>
                  Choose photos
                </Button>
                <input ref={photoInput} type="file" accept={PHOTO_TYPES} multiple hidden aria-label="Photo files"
                  onChange={e => { const chosen = Array.from(e.target.files ?? []); setPhotoFiles(prev => [...prev, ...chosen]); e.target.value = ''; }} />
                {photoFiles.length === 0 && (
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>Optional; the first becomes the table photo</Typography>
                )}
                {photoFiles.map((f, i) => (
                  <Chip key={`${f.name}-${i}`} size="small" label={f.name} onDelete={() => setPhotoFiles(prev => prev.filter((_, j) => j !== i))} />
                ))}
              </Stack>
            )}

            <Box>
              {section('Scientific identity', SECTIONS.identity, <>
                {components.length === 0 && (
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    No materials yet — the specimen counts as unidentified. Add your best guess as “tentative”.
                  </Typography>
                )}
                {components.map((c, i) => (
                  <Stack key={i} direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 1, alignItems: { sm: 'center' } }}>
                    <Autocomplete<Material | NewMaterialOption>
                      sx={{ flex: 2 }}
                      options={materials}
                      value={c.material}
                      filterOptions={(options, params) => {
                        const filtered = materialFilter(options, params);
                        const typed = params.inputValue.trim();
                        if (typed && !options.some(o => 'name' in o && o.name.toLowerCase() === typed.toLowerCase())) {
                          filtered.push({ newName: typed });
                        }
                        return filtered;
                      }}
                      getOptionLabel={o => ('newName' in o ? `Add “${o.newName}” as a new material` : o.name)}
                      isOptionEqualToValue={(a, b) => 'id' in a && 'id' in b && a.id === b.id}
                      onChange={(_, o) => {
                        if (o && 'newName' in o) setNewMaterial({ index: i, name: o.newName });
                        else updateComponent(i, { material: o });
                      }}
                      renderInput={params => <TextField {...params} label="Material" />}
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
                  + Add material
                </Button>
                {text('inclusions', 'Unidentified inclusions', { multiline: true, helperText: 'e.g. “tiny black needles”' })}
              </>, true)}

              {section('Appearance', SECTIONS.appearance, <>
                {row(text('color', 'Colour'), text('secondaryColor', 'Secondary colour'))}
                {row(suggest('luster', 'Luster', LUSTER_SUGGESTIONS), suggest('transparency', 'Transparency', TRANSPARENCY_SUGGESTIONS))}
                {enumMulti('opticalEffects', 'Optical effects', OPTICAL_EFFECT_LABELS)}
              </>)}

              {section('Physical properties', SECTIONS.physical, <>
                {row(
                  text('hardnessMin', 'Hardness from (Mohs)', { helperText: 'One value is fine' }),
                  text('hardnessMax', 'Hardness to (Mohs)'),
                )}
                <Typography variant="caption" sx={{ color: 'text.secondary', mt: -1 }}>{SCRATCH_TEST_HINT}</Typography>
                {row(suggest('streak', 'Streak', STREAK_SUGGESTIONS), text('specificGravity', 'Specific gravity'))}
                {row(suggest('cleavage', 'Cleavage', CLEAVAGE_SUGGESTIONS), suggest('fracture', 'Fracture', FRACTURE_SUGGESTIONS))}
                {suggest('crystalHabit', 'Crystal habit', HABIT_SUGGESTIONS)}
                {enumMulti('specialProperties', 'Special properties', SPECIAL_PROPERTY_LABELS)}
                {text('otherObservations', 'Other observations', { multiline: true })}
              </>)}

              {section('Size & weight', SECTIONS.size, <>
                {row(text('weightG', 'Weight (g)'), text('lengthMm', 'Length (mm)'), text('widthMm', 'Width (mm)'), text('heightMm', 'Height (mm)'))}
              </>)}

              {section('Origin & acquisition', SECTIONS.provenance, <>
                {row(text('locality', 'Locality', { helperText: 'Where it was (likely) mined' }), text('country', 'Country of origin'))}
                {row(
                  enumSelect('acquisitionType', 'Source', ACQUISITION_LABELS),
                  text('acquiredFrom', 'Where I got it', { helperText: 'Shop, fair, place or person' }),
                  text('acquiredCountry', 'Country (where I got it)'),
                )}
                {row(
                  text('acquiredYear', 'Year acquired'), text('acquiredMonth', 'Month'), text('acquiredDay', 'Day'),
                  text('price', 'Price'), text('currency', 'Currency', { placeholder: 'PLN' }),
                )}
              </>)}

              {section('Notes', SECTIONS.notes, <>
                {text('description', 'Public description', { multiline: true, minRows: 2, helperText: 'Can appear on the public page' })}
                {text('privateNotes', 'Private notes', { multiline: true, minRows: 2, helperText: 'Never published' })}
                {text('treatmentNotes', 'Treatment notes', { helperText: 'e.g. dyed, heated, stabilised' })}
              </>)}
            </Box>

            <FormControlLabel control={<Switch checked={form.published} onChange={e => set('published', e.target.checked)} />}
              label="Show on the public site" />
            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>{lastAdded ? 'Done' : 'Cancel'}</Button>
        {!isEdit && (
          <Button onClick={() => handleSave(true)} variant="outlined" disabled={!canSave}>Add & next</Button>
        )}
        <Button onClick={() => handleSave()} variant="contained" disabled={!canSave}>
          {isEdit ? 'Save' : 'Add'}
        </Button>
      </DialogActions>

      <AddMaterialDialog
        open={newMaterial !== null}
        initialName={newMaterial?.name}
        onClose={() => setNewMaterial(null)}
        onCreated={m => {
          setMaterials(prev => [...prev, m].sort((a, b) => a.name.localeCompare(b.name)));
          if (newMaterial) updateComponent(newMaterial.index, { material: m });
          setNewMaterial(null);
        }}
      />
    </Dialog>
  );
};

export default SpecimenFormDialog;
