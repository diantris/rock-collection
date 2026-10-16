// ColumnPicker.tsx - "Columns" button with a checkbox menu choosing which table columns are shown
import React, { useState } from 'react';
import { Button, Checkbox, Divider, ListItemIcon, ListItemText, Menu, MenuItem } from '@mui/material';
import ViewColumnOutlinedIcon from '@mui/icons-material/ViewColumnOutlined';
import { COLUMNS } from './columns';

interface Props {
  visible: string[];
  onChange: (visible: string[]) => void;
}

const ColumnPicker: React.FC<Props> = ({ visible, onChange }) => {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  const toggle = (id: string) => {
    const next = visible.includes(id) ? visible.filter(v => v !== id) : [...visible, id];
    // Keep table order stable regardless of click order, and never hide every column
    if (next.length > 0) onChange(COLUMNS.map(c => c.id).filter(c => next.includes(c)));
  };

  return (
    <>
      <Button variant="outlined" startIcon={<ViewColumnOutlinedIcon />} onClick={e => setAnchor(e.currentTarget)}>
        Columns
      </Button>
      <Menu anchorEl={anchor} open={anchor !== null} onClose={() => setAnchor(null)}>
        {COLUMNS.map(c => (
          <MenuItem key={c.id} onClick={() => toggle(c.id)} dense>
            <ListItemIcon>
              <Checkbox edge="start" size="small" checked={visible.includes(c.id)} tabIndex={-1} disableRipple
                slotProps={{ input: { 'aria-label': c.label } }} />
            </ListItemIcon>
            <ListItemText>{c.label}</ListItemText>
          </MenuItem>
        ))}
        <Divider />
        <MenuItem dense onClick={() => onChange(COLUMNS.filter(c => c.defaultVisible).map(c => c.id))}>
          <ListItemText inset>Reset to default</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};

export default ColumnPicker;
