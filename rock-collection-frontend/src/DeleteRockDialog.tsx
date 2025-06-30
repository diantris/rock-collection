// DeleteRockDialog.tsx - Dialog for confirming rock deletion
import React from 'react';
import { Dialog, DialogTitle, DialogActions, Button, Alert } from '@mui/material';

interface DeleteRockDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  deleting: boolean;
  error: string | null;
}

const DeleteRockDialog: React.FC<DeleteRockDialogProps> = ({ open, onClose, onConfirm, deleting, error }) => (
  <Dialog open={open} onClose={onClose}>
    <DialogTitle>Are you sure you want to delete this rock?</DialogTitle>
    {error && <Alert severity="error">{error}</Alert>}
    <DialogActions>
      <Button onClick={onClose} disabled={deleting}>No</Button>
      <Button onClick={onConfirm} disabled={deleting} color="error">Yes</Button>
    </DialogActions>
  </Dialog>
);

export default DeleteRockDialog;

