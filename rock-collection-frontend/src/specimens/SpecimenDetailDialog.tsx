// SpecimenDetailDialog.tsx - Read-only view of every field of a specimen, grouped like the form, with Edit / Delete.
// Each section also lists what hasn't been recorded yet, as a nudge for measurements that would help identification.
import React, { useEffect, useState } from 'react';
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography,
  useMediaQuery, useTheme,
} from '@mui/material';
import { fetchSpecimen } from './api';
import {
  ACQUISITION_LABELS, CERTAINTY_LABELS, CRYSTAL_SYSTEM_LABELS, FAMILY_LABELS, FORM_LABELS, MATERIAL_CATEGORY_LABELS,
  NATURE_LABELS, OPTICAL_EFFECT_LABELS, ROLE_LABELS, SPECIAL_PROPERTY_LABELS, SpecimenDetail,
} from './types';

interface Props {
  specimenId: number | null; // dialog is open while non-null
  /** Bump to force a reload, e.g. after the specimen was edited. */
  refreshKey?: number;
  onClose: () => void;
  onEdit: (id: number) => void;
  onDelete: (specimen: SpecimenDetail) => void;
}

type Field = [label: string, value: React.ReactNode | null];

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const formatHardness = (min: number | null, max: number | null) =>
  min === null ? null : min === max ? `${min}` : `${min}–${max}`;

const formatSize = (l: number | null, w: number | null, h: number | null) => {
  const parts = [l, w, h].filter(v => v !== null);
  return parts.length === 0 ? null : `${parts.join(' × ')} mm`;
};

const formatDate = (y: number | null, m: number | null, d: number | null) =>
  [d, m !== null ? MONTHS[m - 1] : null, y].filter(v => v !== null).join(' ') || null;

const joinLabels = <T extends string>(values: T[], labels: Record<T, string>) =>
  values.length === 0 ? null : values.map(v => labels[v]).join(', ');

/** Titled block of label/value pairs; empty values are collected into a muted "Not recorded" line. */
const Section: React.FC<{ title: string; fields: Field[]; children?: React.ReactNode }> = ({ title, fields, children }) => {
  const filled = fields.filter(([, v]) => v !== null && v !== '');
  const missing = fields.filter(([, v]) => v === null || v === '').map(([label]) => label.toLowerCase());
  return (
    <Box component="section" aria-label={title} sx={{ mb: 3 }}>
      <Typography variant="subtitle1" component="h3" sx={{ color: 'primary.main', mb: 1 }}>{title}</Typography>
      {children}
      {filled.length > 0 && (
        <Box component="dl" sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '200px 1fr' }, columnGap: 2, rowGap: 0.5, m: 0 }}>
          {filled.map(([label, value]) => (
            <React.Fragment key={label}>
              <Typography component="dt" variant="body2" sx={{ color: 'text.secondary' }}>{label}</Typography>
              <Typography component="dd" variant="body2" sx={{ m: 0, mb: { xs: 1, sm: 0 }, whiteSpace: 'pre-wrap' }}>{value}</Typography>
            </React.Fragment>
          ))}
        </Box>
      )}
      {missing.length > 0 && (
        <Typography variant="caption" component="p" sx={{ color: 'text.disabled', mt: 1 }}>
          Not recorded: {missing.join(', ')}
        </Typography>
      )}
    </Box>
  );
};

const SpecimenDetailDialog: React.FC<Props> = ({ specimenId, refreshKey = 0, onClose, onEdit, onDelete }) => {
  const fullScreen = useMediaQuery(useTheme().breakpoints.down('sm'));
  const [specimen, setSpecimen] = useState<SpecimenDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (specimenId === null) return;
    setSpecimen(null);
    setError(null);
    fetchSpecimen(specimenId).then(setSpecimen).catch(e => setError((e as Error).message));
  }, [specimenId, refreshKey]);

  const s = specimen;
  return (
    <Dialog open={specimenId !== null} onClose={onClose} maxWidth="md" fullWidth fullScreen={fullScreen} aria-labelledby="specimen-detail-title">
      <DialogTitle id="specimen-detail-title">
        {s ? `#${s.id} ${s.name}` : `#${specimenId ?? ''}`}
        {s?.marketName && (
          <Typography component="span" variant="body2" sx={{ display: 'block', color: 'text.secondary' }}>Sold as “{s.marketName}”</Typography>
        )}
      </DialogTitle>
      <DialogContent>
        {error && <Alert severity="error">{error}</Alert>}
        {!s && !error && <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>}
        {s && (
          <>
            {s.tags.length > 0 && (
              <Stack direction="row" sx={{ gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
                {s.tags.map(t => <Chip key={t} size="small" label={t} />)}
              </Stack>
            )}

            <Section title="Scientific identity" fields={[
              ['Form', s.form && FORM_LABELS[s.form]],
              ['Nature', s.nature && NATURE_LABELS[s.nature]],
              ['Unidentified inclusions', s.inclusions],
            ]}>
              {s.components.length === 0 ? (
                <Typography variant="body2" sx={{ mb: 1 }}>Unidentified</Typography>
              ) : (
                <Stack sx={{ gap: 1, mb: 1.5 }}>
                  {s.components.map((c, i) => (
                    <Box key={i}>
                      <Stack direction="row" sx={{ gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>{c.materialName}</Typography>
                        <Chip size="small" variant="outlined" label={ROLE_LABELS[c.role]} />
                        <Chip size="small" variant={c.certainty === 'CONFIRMED' ? 'filled' : 'outlined'} label={CERTAINTY_LABELS[c.certainty]} />
                      </Stack>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {[MATERIAL_CATEGORY_LABELS[c.category], c.family && FAMILY_LABELS[c.family],
                          c.mineralGroup && `${c.mineralGroup} group`, c.crystalSystem && CRYSTAL_SYSTEM_LABELS[c.crystalSystem]]
                          .filter(Boolean).join(' · ')}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              )}
            </Section>

            <Section title="Appearance" fields={[
              ['Colour', [s.color, s.secondaryColor].filter(Boolean).join(', ') || null],
              ['Luster', s.luster],
              ['Transparency', s.transparency],
              ['Optical effects', joinLabels(s.opticalEffects, OPTICAL_EFFECT_LABELS)],
            ]} />

            <Section title="Physical properties" fields={[
              ['Hardness (Mohs)', formatHardness(s.hardnessMin, s.hardnessMax)],
              ['Streak', s.streak],
              ['Specific gravity', s.specificGravity],
              ['Cleavage', s.cleavage],
              ['Fracture', s.fracture],
              ['Crystal habit', s.crystalHabit],
              ['Special properties', joinLabels(s.specialProperties, SPECIAL_PROPERTY_LABELS)],
              ['Other observations', s.otherObservations],
            ]} />

            <Section title="Size & weight" fields={[
              ['Weight', s.weightG !== null ? `${s.weightG} g` : null],
              ['Size', formatSize(s.lengthMm, s.widthMm, s.heightMm)],
            ]} />

            <Section title="Origin & acquisition" fields={[
              ['Locality', [s.locality, s.country].filter(Boolean).join(', ') || null],
              ['Source', s.acquisitionType && ACQUISITION_LABELS[s.acquisitionType]],
              ['Where I got it', [s.acquiredFrom, s.acquiredCountry].filter(Boolean).join(', ') || null],
              ['Acquired', formatDate(s.acquiredYear, s.acquiredMonth, s.acquiredDay)],
              ['Price', s.price !== null ? `${s.price} ${s.currency ?? ''}`.trim() : null],
            ]} />

            <Section title="Notes" fields={[
              ['Public description', s.description],
              ['Private notes', s.privateNotes],
              ['Treatment', s.treatmentNotes],
              ['On the public site', s.published ? 'Yes' : 'No'],
            ]} />
          </>
        )}
      </DialogContent>
      <DialogActions>
        {s && <Button color="error" onClick={() => onDelete(s)} sx={{ mr: 'auto' }}>Delete</Button>}
        <Button onClick={onClose}>Close</Button>
        <Button variant="contained" disabled={!s} onClick={() => s && onEdit(s.id)}>Edit</Button>
      </DialogActions>
    </Dialog>
  );
};

export default SpecimenDetailDialog;
