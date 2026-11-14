// ColumnResizer.tsx - Drag handle on the right edge of a table header cell that changes the column's width.
// Also works from the keyboard (focus it, then the left / right arrows); a double-click goes back to the starting width.
import React, { useRef } from 'react';
import { Box } from '@mui/material';
import { MIN_COLUMN_WIDTH } from './columns';

interface Props {
  label: string;
  width: number;
  /** Called while dragging; `done` is true once, when the drag or key press ends, so the width can be saved. */
  onResize: (width: number, done: boolean) => void;
  onReset: () => void;
}

const KEY_STEP = 20;

const ColumnResizer: React.FC<Props> = ({ label, width, onResize, onReset }) => {
  const drag = useRef<{ startX: number; startWidth: number } | null>(null);
  const widthAt = (clientX: number) =>
    Math.max(MIN_COLUMN_WIDTH, Math.round(drag.current!.startWidth + clientX - drag.current!.startX));

  return (
    <Box
      role="separator"
      aria-orientation="vertical"
      aria-label={`Resize ${label} column`}
      aria-valuenow={width}
      aria-valuemin={MIN_COLUMN_WIDTH}
      tabIndex={0}
      title="Drag to resize; double-click to reset"
      // Never let a resize click also sort by the column
      onClick={e => e.stopPropagation()}
      onDoubleClick={e => { e.stopPropagation(); onReset(); }}
      onPointerDown={e => {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.setPointerCapture(e.pointerId);
        drag.current = { startX: e.clientX, startWidth: width };
      }}
      onPointerMove={e => { if (drag.current) onResize(widthAt(e.clientX), false); }}
      onPointerUp={e => {
        if (!drag.current) return;
        onResize(widthAt(e.clientX), true);
        drag.current = null;
      }}
      onKeyDown={e => {
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
        e.preventDefault();
        onResize(Math.max(MIN_COLUMN_WIDTH, width + (e.key === 'ArrowRight' ? KEY_STEP : -KEY_STEP)), true);
      }}
      sx={{
        position: 'absolute', top: 0, right: 0, bottom: 0, width: 10, cursor: 'col-resize', touchAction: 'none',
        outline: 'none', zIndex: 1,
        // A thin line shows where the edge is, on hover and keyboard focus
        '&::after': { content: '""', position: 'absolute', top: 8, bottom: 8, right: 3, width: 2, borderRadius: 1, bgcolor: 'divider' },
        '&:hover::after, &:focus-visible::after': { bgcolor: 'primary.main', top: 0, bottom: 0 },
      }}
    />
  );
};

export default ColumnResizer;
