// AddRockDialog.tsx - Dialog for adding a new rock
import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Autocomplete, Alert } from '@mui/material';
import { RockGroup } from './CollectedRocksTable';

interface AddRockDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: () => void;
  form: {
    name: string;
    market_name: string;
    origin: string;
    group: RockGroup | null;
  };
  onFormChange: (field: string, value: any) => void;
  groups: RockGroup[];
  adding: boolean;
  addError: string | null;
}

const AddRockDialog: React.FC<AddRockDialogProps> = ({ open, onClose, onAdd, form, onFormChange, groups, adding, addError }) => (
  <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
    <DialogTitle>Add a new rock</DialogTitle>
    <DialogContent>
      <TextField
        label="Name"
        value={form.name}
        onChange={e => onFormChange('name', e.target.value)}
        fullWidth
        margin="normal"
        required
      />
      <TextField
        label="Market Name"
        value={form.market_name}
        onChange={e => onFormChange('market_name', e.target.value)}
        fullWidth
        margin="normal"
      />
      <TextField
        label="Origin"
        value={form.origin}
        onChange={e => onFormChange('origin', e.target.value)}
        fullWidth
        margin="normal"
      />
      <Autocomplete
        options={groups}
        getOptionLabel={option => option.groupName}
        value={form.group}
        onChange={(_, value) => onFormChange('group', value)}
        renderInput={params => (
          <TextField {...params} label="Group Name" margin="normal" required />
        )}
        isOptionEqualToValue={(option, value) => option.id === value.id}
      />
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

export default AddRockDialog;

