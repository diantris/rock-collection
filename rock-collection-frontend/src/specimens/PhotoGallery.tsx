// PhotoGallery.tsx - Full-size photo viewer with mobile-style dots, arrows, swipe and keyboard navigation
import React, { useEffect, useRef, useState } from 'react';
import { Box, ButtonBase, Dialog, IconButton, Stack, Typography, useMediaQuery, useTheme } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CloseIcon from '@mui/icons-material/Close';
import { Photo } from './types';

interface Props {
  photos: Photo[];
  /** Photo shown first; the gallery is open while non-null. */
  startIndex: number | null;
  /** Specimen name, for the dialog's accessible name and the photos' alt text. */
  title: string;
  onClose: () => void;
}

/** Horizontal finger movement (px) that counts as a swipe. */
const SWIPE_DISTANCE = 50;

// Photos are shown on near-black regardless of light/dark mode, like any photo viewer
const VIEWER_BG = '#0f0d13';

const PhotoGallery: React.FC<Props> = ({ photos, startIndex, title, onClose }) => {
  const fullScreen = useMediaQuery(useTheme().breakpoints.down('sm'));
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    if (startIndex !== null) setIndex(startIndex);
  }, [startIndex]);

  const count = photos.length;
  const go = (delta: number) => setIndex(i => (i + delta + count) % count); // wraps around
  const photo = photos[Math.min(index, count - 1)];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') go(-1);
    if (e.key === 'ArrowRight') go(1);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > SWIPE_DISTANCE) go(dx < 0 ? 1 : -1);
    touchStartX.current = null;
  };

  const arrow = (side: 'left' | 'right') => (
    <IconButton aria-label={side === 'left' ? 'Previous photo' : 'Next photo'} onClick={() => go(side === 'left' ? -1 : 1)}
      sx={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', [side]: 8, color: 'common.white',
        bgcolor: 'rgba(0, 0, 0, 0.35)', '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.55)' } }}>
      {side === 'left' ? <ChevronLeftIcon /> : <ChevronRightIcon />}
    </IconButton>
  );

  return (
    <Dialog open={startIndex !== null && count > 0} onClose={onClose} onKeyDown={handleKeyDown} maxWidth="lg" fullWidth
      fullScreen={fullScreen}
      // MUI only forwards aria-labelledby to the paper (the element with role="dialog"), so the label goes there directly
      slotProps={{ paper: { 'aria-label': `${title} photos`, sx: { bgcolor: VIEWER_BG, color: 'common.white', overflow: 'hidden' } } }}>
      {photo && (
        <Box sx={{ position: 'relative', display: 'flex', flexDirection: 'column', height: fullScreen ? '100%' : '88vh' }}>
          <Stack direction="row" sx={{ alignItems: 'center', px: 2, py: 1 }}>
            <Typography variant="subtitle1" component="h2" sx={{ flexGrow: 1 }} noWrap>{title}</Typography>
            {count > 1 && <Typography variant="body2" sx={{ opacity: 0.7, mr: 1 }}>{index + 1} / {count}</Typography>}
            <IconButton aria-label="Close gallery" onClick={onClose} sx={{ color: 'common.white' }}><CloseIcon /></IconButton>
          </Stack>

          <Box sx={{ position: 'relative', flexGrow: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onTouchStart={e => { touchStartX.current = e.touches[0].clientX; }} onTouchEnd={handleTouchEnd}>
            <Box component="img" key={photo.id} src={photo.url} alt={`${title}, photo ${index + 1} of ${count}`}
              sx={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', userSelect: 'none' }} />
            {count > 1 && <>{arrow('left')}{arrow('right')}</>}
          </Box>

          {photo.caption && <Typography variant="body2" sx={{ textAlign: 'center', px: 2, pt: 1 }}>{photo.caption}</Typography>}
          {count > 1 && (
            <Stack direction="row" role="group" aria-label="Choose a photo" sx={{ justifyContent: 'center', gap: 1, py: 2 }}>
              {photos.map((p, i) => (
                <ButtonBase key={p.id} aria-label={`Photo ${i + 1}`} aria-current={i === index ? 'true' : undefined}
                  onClick={() => setIndex(i)}
                  // 28×24px touch target around a small dot; the current one is wider, like on phones
                  sx={{ width: 28, height: 24, borderRadius: 12 }}>
                  <Box sx={{ width: i === index ? 20 : 8, height: 8, borderRadius: 4, transition: 'width 150ms',
                    bgcolor: i === index ? 'common.white' : 'rgba(255, 255, 255, 0.4)' }} />
                </ButtonBase>
              ))}
            </Stack>
          )}
        </Box>
      )}
    </Dialog>
  );
};

export default PhotoGallery;
