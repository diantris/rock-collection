// DeleteSpecimenDialog.tsx - Confirmation dialog before deleting a specimen
import React, { useEffect, useState } from 'react';
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';

interface Props {
  specimen: { id: number; name: string } | null; // dialog is open while non-null
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

const DeleteSpecimenDialog: React.FC<Props> = ({ specimen, onClose, onConfirm }) => {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setError(null), [specimen]);

  const handleConfirm = async () => {
    setDeleting(true);
    try {
      await onConfirm();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={specimen !== null} onClose={onClose}>
      <DialogTitle>Delete #{specimen?.id} “{specimen?.name}”?</DialogTitle>
      <DialogContent>
        This can't be undone.
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={deleting}>Cancel</Button>
        <Button onClick={handleConfirm} disabled={deleting} color="error">Delete</Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteSpecimenDialog;
