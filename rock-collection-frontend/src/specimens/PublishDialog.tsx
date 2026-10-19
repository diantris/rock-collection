// PublishDialog.tsx - Global publish settings (which fields, intro text) and the Publish button for the public site.
// Settings are saved as they change; there is no per-specimen field choice, only each specimen's "public" switch.
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert, Box, Button, Checkbox, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel,
  Link, Stack, TextField, Typography, useMediaQuery, useTheme,
} from '@mui/material';
import { fetchPublishSettings, publishAllSpecimens, publishSite, updatePublishSettings } from './api';
import { PublishResult, PublishSettings } from './types';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Called when specimens were marked public, so the table can refresh. */
  onSpecimensChanged: () => void;
}

const formatTime = (iso: string) => new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

const PublishDialog: React.FC<Props> = ({ open, onClose, onSpecimensChanged }) => {
  const fullScreen = useMediaQuery(useTheme().breakpoints.down('sm'));
  const [settings, setSettings] = useState<PublishSettings | null>(null);
  const [intro, setIntro] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [result, setResult] = useState<PublishResult | null>(null);

  useEffect(() => {
    if (!open) return;
    setResult(null);
    setError(null);
    setSettings(null);
    fetchPublishSettings()
      .then(s => { setSettings(s); setIntro(s.intro ?? ''); })
      .catch(e => setError((e as Error).message));
  }, [open]);

  // Checkboxes grouped under their headings, in the server's order
  const groups = useMemo(() => {
    const byGroup = new Map<string, PublishSettings['fields']>();
    for (const f of settings?.fields ?? []) byGroup.set(f.group, [...(byGroup.get(f.group) ?? []), f]);
    return [...byGroup.entries()];
  }, [settings]);

  const save = async (fields: string[], introText: string) => {
    try {
      setSettings(await updatePublishSettings(fields, introText));
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const included = (s: PublishSettings) => s.fields.filter(f => f.included).map(f => f.key);

  const toggle = (key: string, checked: boolean) => {
    if (!settings) return;
    // Show the tick straight away, then save
    const fields = settings.fields.map(f => (f.key === key ? { ...f, included: checked } : f));
    setSettings({ ...settings, fields });
    void save(fields.filter(f => f.included).map(f => f.key), intro);
  };

  const showAll = async () => {
    try {
      setSettings(await publishAllSpecimens());
      onSpecimensChanged();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const publish = async () => {
    setPublishing(true);
    setError(null);
    setResult(null);
    try {
      const r = await publishSite();
      setResult(r);
      setSettings(s => (s ? { ...s, lastPublishedAt: r.publishedAt } : s));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth fullScreen={fullScreen} aria-labelledby="publish-title">
      <DialogTitle id="publish-title">Publish the public site</DialogTitle>
      <DialogContent>
        {!settings && !error && <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>}
        {settings && (
          <Stack sx={{ gap: 3 }}>
            {!settings.gitHubConfigured && (
              <Alert severity="warning">
                Publishing needs the GitHub token: put it in the <code>.env</code> file as <code>GITHUB_TOKEN=…</code> and restart.
              </Alert>
            )}

            <Box component="section" aria-label="Specimens on the site">
              <Typography variant="subtitle1" component="h3" sx={{ color: 'primary.main', mb: 0.5 }}>Specimens</Typography>
              <Stack direction="row" sx={{ gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                <Typography variant="body2">
                  {settings.publicCount} of {settings.totalCount} specimens are shown on the site.
                </Typography>
                {settings.publicCount < settings.totalCount && (
                  <Button size="small" variant="outlined" onClick={showAll}>Show all specimens</Button>
                )}
              </Stack>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Each specimen’s “Show on the public site” switch (in its form) hides it.
              </Typography>
            </Box>

            <Box component="section" aria-label="Fields to publish">
              <Typography variant="subtitle1" component="h3" sx={{ color: 'primary.main', mb: 0.5 }}>Fields to publish</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>
                The same for every specimen. The number, name and photos are always shown; private notes never are.
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
                {groups.map(([group, fields]) => (
                  <Box key={group} role="group" aria-label={group}>
                    <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>{group}</Typography>
                    {fields.map(f => (
                      <FormControlLabel key={f.key} sx={{ display: 'flex', mr: 0 }}
                        control={<Checkbox size="small" checked={f.included} onChange={e => toggle(f.key, e.target.checked)} />}
                        label={<Typography variant="body2">{f.label}</Typography>} />
                    ))}
                  </Box>
                ))}
              </Box>
            </Box>

            <TextField label="Introduction on the site’s front page" multiline minRows={3} value={intro}
              onChange={e => setIntro(e.target.value)}
              onBlur={() => { if (intro !== (settings.intro ?? '')) void save(included(settings), intro); }}
              helperText="A blank line starts a new paragraph" />

            {settings.siteUrl && (
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {settings.lastPublishedAt ? `Last published ${formatTime(settings.lastPublishedAt)}. ` : 'Not published yet. '}
                The site: <Link href={settings.siteUrl} target="_blank" rel="noopener">{settings.siteUrl}</Link>
              </Typography>
            )}
          </Stack>
        )}
        {result && (
          <Alert severity={result.changed ? 'success' : 'info'} sx={{ mt: 2 }}>
            {result.changed
              ? <>Published {result.specimenCount} specimen{result.specimenCount === 1 ? '' : 's'}. GitHub needs about a minute to update <Link href={result.siteUrl} target="_blank" rel="noopener">the site</Link>.</>
              : 'The site was already up to date; nothing changed.'}
          </Alert>
        )}
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button variant="contained" onClick={publish} disabled={!settings?.gitHubConfigured || publishing}
          startIcon={publishing ? <CircularProgress size={16} color="inherit" /> : undefined}>
          {publishing ? 'Publishing…' : 'Publish'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PublishDialog;
