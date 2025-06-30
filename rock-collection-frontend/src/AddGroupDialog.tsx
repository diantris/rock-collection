// AddGroupDialog.tsx - Dialog for adding a new rock group
import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box, Alert } from '@mui/material';

interface AddGroupDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: () => void;
  form: {
    groupName: string;
    family: string;
    type: string;
    mohsHardness: string;
    color: string;
    streak: string;
    luster: string;
    cleavageFracture: string;
    crystalForm: string;
    density: string;
    transparency: string;
    magnetism: string;
    notableCharacteristics: string;
  };
  onFormChange: (field: string, value: any) => void;
  adding: boolean;
  addError: string | null;
}

const AddGroupDialog: React.FC<AddGroupDialogProps> = ({ open, onClose, onAdd, form, onFormChange, adding, addError }) => (
  <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
    <DialogTitle>Add a new rock group</DialogTitle>
    <DialogContent>
      <TextField label="Group Name" value={form.groupName} onChange={e => onFormChange('groupName', e.target.value)} fullWidth margin="normal" required />
      <TextField label="Family" value={form.family} onChange={e => onFormChange('family', e.target.value)} fullWidth margin="normal" />
      <TextField label="Type" value={form.type} onChange={e => onFormChange('type', e.target.value)} fullWidth margin="normal" />
      <TextField label="Mohs Hardness" value={form.mohsHardness} onChange={e => onFormChange('mohsHardness', e.target.value)} fullWidth margin="normal" />
      <TextField label="Color" value={form.color} onChange={e => onFormChange('color', e.target.value)} fullWidth margin="normal" />
      <TextField label="Streak" value={form.streak} onChange={e => onFormChange('streak', e.target.value)} fullWidth margin="normal" />
      <TextField label="Luster" value={form.luster} onChange={e => onFormChange('luster', e.target.value)} fullWidth margin="normal" />
      <TextField label="Cleavage/Fracture" value={form.cleavageFracture} onChange={e => onFormChange('cleavageFracture', e.target.value)} fullWidth margin="normal" />
      <TextField label="Crystal Form" value={form.crystalForm} onChange={e => onFormChange('crystalForm', e.target.value)} fullWidth margin="normal" />
      <TextField label="Density" value={form.density} onChange={e => onFormChange('density', e.target.value)} fullWidth margin="normal" />
      <TextField label="Transparency" value={form.transparency} onChange={e => onFormChange('transparency', e.target.value)} fullWidth margin="normal" />
      <Box display="flex" alignItems="center" sx={{ mt: 2, mb: 1 }}>
        <input
          type="checkbox"
          id="magnetism-checkbox"
          checked={Boolean(form.magnetism)}
          onChange={e => onFormChange('magnetism', e.target.checked)}
          style={{ marginRight: 8 }}
        />
        <label htmlFor="magnetism-checkbox" style={{ fontSize: '1rem' }}>Magnetism</label>
      </Box>
      <TextField label="Notable Characteristics" value={form.notableCharacteristics} onChange={e => onFormChange('notableCharacteristics', e.target.value)} fullWidth margin="normal" />
      {addError && <Alert severity="error" sx={{ mt: 2 }}>{addError}</Alert>}
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} disabled={adding}>Cancel</Button>
      <Button onClick={onAdd} variant="contained" disabled={adding}>
        Add
      </Button>
    </DialogActions>
  </Dialog>
);

export default AddGroupDialog;

