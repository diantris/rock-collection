// CollectedRocksTable.tsx - React component for displaying a table of collected rocks
import React, { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Typography,
  Box,
  TableSortLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Autocomplete
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import CollectedRocksTableHeader from './CollectedRocksTableHeader';
import CollectedRockRow from './CollectedRockRow';
import DeleteRockDialog from './DeleteRockDialog';
import AddRockDialog from './AddRockDialog';
import AddGroupDialog from './AddGroupDialog';
import { sortRocks, fetchRocks, fetchGroups, addRock, addGroup, deleteRock } from './rockUtils';

// TypeScript interface for a collected rock object
export interface CollectedRock {
  id: number; // Now required, always present from backend
  name: string;
  market_name: string;
  group_name: string;
  origin: string;
}

export interface RockGroup {
  id: number;
  groupName: string;
}

export type Order = 'asc' | 'desc';

export type SortKey = keyof CollectedRock;

const columns: { key: SortKey; label: string }[] = [
  { key: 'name', label: 'Name' },
  { key: 'market_name', label: 'Market Name' },
  { key: 'group_name', label: 'Rock Type' },
  { key: 'origin', label: 'Origin' },
];

const CollectedRocksTable: React.FC = () => {
  // State for rocks, loading, and error
  const [rocks, setRocks] = useState<CollectedRock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>('name');
  const [order, setOrder] = useState<Order>('asc');
  const [open, setOpen] = useState(false);
  const [groups, setGroups] = useState<RockGroup[]>([]);
  const [form, setForm] = useState({
    name: '',
    market_name: '',
    origin: '',
    group: null as RockGroup | null
  });
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [openGroup, setOpenGroup] = useState(false);
  const [groupForm, setGroupForm] = useState({ groupName: '', family: '', type: '', mohsHardness: '', color: '', streak: '', luster: '', cleavageFracture: '', crystalForm: '', density: '', transparency: '', magnetism: '', notableCharacteristics: '' });
  const [addingGroup, setAddingGroup] = useState(false);
  const [addGroupError, setAddGroupError] = useState<string | null>(null);
  const [selectedRockIdx, setSelectedRockIdx] = useState<number | null>(null);
  const [showDeleteAction, setShowDeleteAction] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    fetchRocks()
      .then(setRocks)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Fetch groups for combobox
  useEffect(() => {
    if (open) {
      fetchGroups()
        .then(setGroups)
        .catch(() => setGroups([]));
    }
  }, [open]);

  const handleSort = (column: SortKey) => {
    if (sortBy === column) {
      setOrder(order === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setOrder('asc');
    }
  };

  const sortedRocks = sortRocks(rocks, sortBy, order);

  const handleOpen = () => {
    setForm({ name: '', market_name: '', origin: '', group: null });
    setAddError(null);
    setOpen(true);
  };
  const handleClose = () => setOpen(false);

  const handleFormChange = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAdd = async () => {
    try {
      setAdding(true);
      setAddError(null);
      await addRock(form);
      setOpen(false);
      setForm({ name: '', market_name: '', origin: '', group: null });
      setLoading(true);
      fetchRocks()
        .then(setRocks)
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    } catch (e: any) {
      setAddError(e.message);
    } finally {
      setAdding(false);
    }
  };

  const handleOpenGroup = () => {
    setGroupForm({ groupName: '', family: '', type: '', mohsHardness: '', color: '', streak: '', luster: '', cleavageFracture: '', crystalForm: '', density: '', transparency: '', magnetism: '', notableCharacteristics: '' });
    setAddGroupError(null);
    setOpenGroup(true);
  };
  const handleCloseGroup = () => setOpenGroup(false);
  const handleGroupFormChange = (field: string, value: any) => {
    setGroupForm((prev) => ({ ...prev, [field]: value }));
  };
  const handleAddGroup = async () => {
    try {
      setAddingGroup(true);
      setAddGroupError(null);
      await addGroup(groupForm);
      setOpenGroup(false);
      setGroupForm({ groupName: '', family: '', type: '', mohsHardness: '', color: '', streak: '', luster: '', cleavageFracture: '', crystalForm: '', density: '', transparency: '', magnetism: '', notableCharacteristics: '' });
      if (open) {
        fetchGroups()
          .then(setGroups)
          .catch(() => setGroups([]));
      }
    } catch (e: any) {
      setAddGroupError(e.message);
    } finally {
      setAddingGroup(false);
    }
  };

  if (loading) return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
      <CircularProgress />
    </Box>
  );
  if (error) return <Alert severity="error">Error: {error}</Alert>;

  return (
    <>
      {/* Header */}
      <Typography
        variant="h4"
        sx={{ fontWeight: 'bold', mb: 2 }}
        role="heading"
        aria-level={1}
        aria-label="Collected Rocks"
      >
        Collected Rocks
      </Typography>
      {/* Action buttons below header, left-aligned */}
      <Box display="flex" flexDirection="row" gap={2} mb={2}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleOpen}
          sx={{ textTransform: 'none', fontWeight: 600 }}
          role="button"
          aria-label="Add a rock"
        >
          Add a rock
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleOpenGroup}
          sx={{ textTransform: 'none', fontWeight: 600 }}
          role="button"
          aria-label="Add a group"
        >
          Add a group
        </Button>
      </Box>
      <TableContainer component={Paper} sx={{ mt: 2, boxShadow: 3, borderRadius: 2 }}>
        <Table role="table" aria-label="Collected Rocks Table">
          <CollectedRocksTableHeader
            columns={columns}
            sortBy={sortBy}
            order={order}
            onSort={handleSort}
          />
          <TableBody>
            {sortedRocks.map((rock, idx) => (
              <CollectedRockRow
                key={rock.id}
                rock={rock}
                onDelete={() => {
                  setSelectedRockIdx(idx);
                  setShowDeleteAction(true);
                  setDeleteDialogOpen(true);
                }}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {/* Delete confirmation dialog */}
      <DeleteRockDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={async () => {
          if (selectedRockIdx === null) return;
          setDeleting(true);
          setDeleteError(null);
          try {
            const rock = sortedRocks[selectedRockIdx];
            if (!rock.id) throw new Error('Rock ID not found');
            await deleteRock(rock.id);
            setLoading(true);
            fetchRocks()
              .then(setRocks)
              .catch((err) => setError(err.message))
              .finally(() => setLoading(false));
            setSelectedRockIdx(null);
            setShowDeleteAction(false);
            setDeleteDialogOpen(false);
          } catch (e: any) {
            setDeleteError(e.message);
          } finally {
            setDeleting(false);
          }
        }}
        deleting={deleting}
        error={deleteError}
      />
      <AddRockDialog
        open={open}
        onClose={handleClose}
        onAdd={handleAdd}
        form={form}
        onFormChange={handleFormChange}
        groups={groups}
        adding={adding}
        addError={addError}
      />
      <AddGroupDialog
        open={openGroup}
        onClose={handleCloseGroup}
        onAdd={handleAddGroup}
        form={groupForm}
        onFormChange={handleGroupFormChange}
        adding={addingGroup}
        addError={addGroupError}
      />
    </>
    );
}

export default CollectedRocksTable;
// End of CollectedRocksTable.tsx
