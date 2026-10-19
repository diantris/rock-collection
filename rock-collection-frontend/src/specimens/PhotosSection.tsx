// PhotosSection.tsx - A specimen's photos in the detail view: add (button or drag & drop), open, make cover, delete
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert, Box, Button, ButtonBase, Chip, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton,
  LinearProgress, Stack, Tooltip, Typography,
} from '@mui/material';
import AddPhotoAlternateOutlinedIcon from '@mui/icons-material/AddPhotoAlternateOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import { deletePhoto, fetchPhotos, reorderPhotos, uploadPhotos } from './api';
import PhotoGallery from './PhotoGallery';
import { Photo } from './types';

interface Props {
  specimenId: number;
  specimenName: string;
  /** Called after photos were added, removed or reordered (the table thumbnail may have changed). */
  onChanged: () => void;
}

/** File types the server can read; HEIC (iPhone) isn't one of them. */
export const PHOTO_TYPES = 'image/jpeg,image/png';
const TILE = 112;

const PhotosSection: React.FC<Props> = ({ specimenId, specimenName, onChanged }) => {
  const [photos, setPhotos] = useState<Photo[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null); // what's happening, shown under the progress bar
  const [error, setError] = useState<string | null>(null);
  // Reminder after a deletion: the public site keeps showing the photo (broken) until the next publish
  const [notice, setNotice] = useState<string | null>(null);
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);
  const [toDelete, setToDelete] = useState<Photo | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPhotos(null);
    fetchPhotos(specimenId).then(setPhotos).catch(e => setError((e as Error).message));
  }, [specimenId]);

  /** Runs a change, then shows the resulting photos (or the error); true if it worked. */
  const change = useCallback(async (label: string, action: () => Promise<Photo[]>) => {
    setBusy(label);
    setError(null);
    setNotice(null);
    try {
      setPhotos(await action());
      onChanged();
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setBusy(null);
    }
  }, [onChanged]);

  const upload = (files: File[]) => {
    if (files.length === 0) return;
    void change(`Uploading ${files.length === 1 ? 'photo' : `${files.length} photos`}…`, () => uploadPhotos(specimenId, files));
  };

  const makeCover = (photo: Photo) => {
    const order = [photo.id, ...photos!.filter(p => p.id !== photo.id).map(p => p.id)];
    void change('Changing the cover photo…', () => reorderPhotos(specimenId, order));
  };

  const confirmDelete = () => {
    const photo = toDelete!;
    setToDelete(null);
    void change('Deleting photo…', async () => {
      await deletePhoto(specimenId, photo.id);
      return fetchPhotos(specimenId);
    }).then(deleted => {
      if (deleted) setNotice('Photo deleted. If this specimen is on the public site, publish again to update it.');
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    upload(Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/')));
  };

  return (
    <Box component="section" aria-label="Photos" sx={{ mb: 3, borderRadius: 3, outline: dragOver ? '2px dashed' : 'none',
      outlineColor: 'primary.main', outlineOffset: 4 }}
      onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop}>
      <Stack direction="row" sx={{ alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle1" component="h3" sx={{ color: 'primary.main', flexGrow: 1 }}>Photos</Typography>
        <Button size="small" startIcon={<AddPhotoAlternateOutlinedIcon />} disabled={busy !== null} onClick={() => input.current?.click()}>
          Add photos
        </Button>
        <input ref={input} type="file" accept={PHOTO_TYPES} multiple hidden aria-label="Photo files"
          onChange={e => { upload(Array.from(e.target.files ?? [])); e.target.value = ''; }} />
      </Stack>

      {busy && <Box sx={{ mb: 1 }}><LinearProgress /><Typography variant="caption" sx={{ color: 'text.secondary' }}>{busy}</Typography></Box>}
      {error && <Alert severity="error" sx={{ mb: 1 }} onClose={() => setError(null)}>{error}</Alert>}
      {notice && <Alert severity="info" sx={{ mb: 1 }} onClose={() => setNotice(null)}>{notice}</Alert>}

      {photos?.length === 0 && (
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          No photos yet. Drop them here or use “Add photos”. They’re resized, location data is removed, and they’re
          stored in the public site’s repo; the first one becomes the table photo.
        </Typography>
      )}

      {photos && photos.length > 0 && (
        <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
          {photos.map((p, i) => (
            <Box key={p.id} sx={{ position: 'relative', width: TILE, height: TILE }}>
              <ButtonBase aria-label={`Open photo ${i + 1}`} onClick={() => setGalleryIndex(i)}
                sx={{ width: '100%', height: '100%', borderRadius: 2, overflow: 'hidden', bgcolor: t => t.vars?.palette.m3.surfaceContainerHighest }}>
                <Box component="img" src={p.smallUrl} alt="" loading="lazy" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </ButtonBase>
              {i === 0 ? (
                <Chip label="Cover" size="small" color="primary" sx={{ position: 'absolute', left: 4, bottom: 4, height: 20 }} />
              ) : (
                <Tooltip title="Make this the cover (table photo)">
                  <IconButton size="small" aria-label={`Make photo ${i + 1} the cover`} disabled={busy !== null}
                    onClick={() => makeCover(p)} sx={overlayButton({ left: 4 })}>
                    <StarBorderIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              <Tooltip title="Delete photo">
                <IconButton size="small" aria-label={`Delete photo ${i + 1}`} disabled={busy !== null}
                  onClick={() => setToDelete(p)} sx={overlayButton({ right: 4 })}>
                  <DeleteOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          ))}
        </Stack>
      )}

      <PhotoGallery photos={photos ?? []} startIndex={galleryIndex} title={specimenName} onClose={() => setGalleryIndex(null)} />

      <Dialog open={toDelete !== null} onClose={() => setToDelete(null)} aria-labelledby="delete-photo-title">
        <DialogTitle id="delete-photo-title">Delete this photo?</DialogTitle>
        <DialogContent>
          <DialogContentText>It’s also removed from the public site’s repo.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setToDelete(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={confirmDelete}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

/** Small round button on top of a photo tile, readable on any photo. */
const overlayButton = (position: { left?: number; right?: number }) => ({
  position: 'absolute', bottom: 4, ...position, width: 28, height: 28, color: 'common.white',
  bgcolor: 'rgba(0, 0, 0, 0.45)', '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.65)' },
}) as const;

export default PhotosSection;
