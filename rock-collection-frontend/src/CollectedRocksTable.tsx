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

// TypeScript interface for a collected rock object
interface CollectedRock {
  name: string;
  market_name: string;
  group_name: string;
  origin: string;
}

interface RockGroup {
  id: number;
  groupName: string;
}

type Order = 'asc' | 'desc';

type SortKey = keyof CollectedRock;

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

  useEffect(() => {
    // Fetch the list of collected rocks from the backend API
    fetch('/api/rocks')
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to fetch');
        return await res.json();
      })
      .then(setRocks)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Fetch groups for combobox
  useEffect(() => {
    if (open) {
      fetch('/api/groups')
        .then(res => res.json())
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

  const sortedRocks = [...rocks].sort((a, b) => {
    const aValue = a[sortBy]?.toString().toLowerCase() || '';
    const bValue = b[sortBy]?.toString().toLowerCase() || '';
    if (aValue < bValue) return order === 'asc' ? -1 : 1;
    if (aValue > bValue) return order === 'asc' ? 1 : -1;
    return 0;
  });

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
    if (!form.name || !form.group) {
      setAddError('Name and Group are required.');
      return;
    }
    setAdding(true);
    setAddError(null);
    try {
      const res = await fetch('/api/rocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rockName: form.name,
          marketName: form.market_name,
          origin: form.origin,
          group: { id: form.group.id }
        })
      });
      if (!res.ok) throw new Error('Failed to add rock');
      setOpen(false);
      setForm({ name: '', market_name: '', origin: '', group: null });
      // Refresh rocks
      setLoading(true);
      fetch('/api/rocks')
        .then(async (res) => {
          if (!res.ok) throw new Error('Failed to fetch');
          return await res.json();
        })
        .then(setRocks)
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    } catch (e: any) {
      setAddError(e.message);
    } finally {
      setAdding(false);
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
      <TableContainer component={Paper} sx={{ mt: 2, boxShadow: 3, borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#1976d2' }}>
              {columns.map((col) => (
                <TableCell key={col.key} sx={{ color: 'white', fontWeight: 'bold', fontSize: '1.25rem' }}>
                  <TableSortLabel
                    active={sortBy === col.key}
                    direction={sortBy === col.key ? order : 'asc'}
                    onClick={() => handleSort(col.key)}
                    sx={{ color: 'white', '&.Mui-active': { color: 'white' }, fontSize: '1.25rem' }}
                    IconComponent={() => (
                      <>
                        <span style={{ fontSize: 18, verticalAlign: 'middle' }}>▲</span>
                        <span style={{ fontSize: 18, verticalAlign: 'middle', marginLeft: -4 }}>▼</span>
                      </>
                    )}
                    componentsProps={{ label: { style: { marginRight: 8 } } }}
                  >
                    <span style={{ marginRight: 8 }}>{col.label}</span>
                  </TableSortLabel>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedRocks.map((rock, idx) => (
              <TableRow key={rock.name + rock.origin + idx} hover>
                <TableCell>{rock.name}</TableCell>
                <TableCell>{rock.market_name}</TableCell>
                <TableCell>{rock.group_name}</TableCell>
                <TableCell>{rock.origin}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Button variant="contained" color="primary" sx={{ mt: 3 }} onClick={handleOpen}>
        + Add a rock
      </Button>
      <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
        <DialogTitle>Add a new rock</DialogTitle>
        <DialogContent>
          <TextField
            label="Name"
            value={form.name}
            onChange={e => handleFormChange('name', e.target.value)}
            fullWidth
            margin="normal"
            required
          />
          <TextField
            label="Market Name"
            value={form.market_name}
            onChange={e => handleFormChange('market_name', e.target.value)}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Origin"
            value={form.origin}
            onChange={e => handleFormChange('origin', e.target.value)}
            fullWidth
            margin="normal"
          />
          <Autocomplete
            options={groups}
            getOptionLabel={option => option.groupName}
            value={form.group}
            onChange={(_, value) => handleFormChange('group', value)}
            renderInput={params => (
              <TextField {...params} label="Group Name" margin="normal" required />
            )}
            isOptionEqualToValue={(option, value) => option.id === value.id}
          />
          {addError && <Alert severity="error" sx={{ mt: 2 }}>{addError}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={adding}>Cancel</Button>
          <Button onClick={handleAdd} variant="contained" disabled={adding}>
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CollectedRocksTable;
// End of CollectedRocksTable.tsx
