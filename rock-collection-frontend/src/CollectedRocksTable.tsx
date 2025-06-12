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
  Box
} from '@mui/material';

// TypeScript interface for a collected rock object
interface CollectedRock {
  name: string;
  market_name: string;
  group_name: string;
  origin: string;
}

const CollectedRocksTable: React.FC = () => {
  // State for rocks, loading, and error
  const [rocks, setRocks] = useState<CollectedRock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (loading) return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
      <CircularProgress />
    </Box>
  );
  if (error) return <Alert severity="error">Error: {error}</Alert>;

  return (
    <TableContainer component={Paper} sx={{ mt: 2, boxShadow: 3, borderRadius: 2 }}>
      <Table>
        <TableHead>
          <TableRow sx={{ backgroundColor: '#1976d2' }}>
            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Name</TableCell>
            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Market Name</TableCell>
            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Rock Type</TableCell>
            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Origin</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rocks.map((rock, idx) => (
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
  );
};

export default CollectedRocksTable;
// End of CollectedRocksTable.tsx
