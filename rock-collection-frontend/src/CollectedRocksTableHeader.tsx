// CollectedRocksTableHeader.tsx - Table header for CollectedRocksTable
import React from 'react';
import { TableHead, TableRow, TableCell, TableSortLabel } from '@mui/material';
import { SortKey, Order } from './CollectedRocksTable';

interface CollectedRocksTableHeaderProps {
  columns: { key: SortKey; label: string }[];
  sortBy: SortKey;
  order: Order;
  onSort: (column: SortKey) => void;
}

const CollectedRocksTableHeader: React.FC<CollectedRocksTableHeaderProps> = ({ columns, sortBy, order, onSort }) => (
  <TableHead>
    <TableRow sx={{ backgroundColor: '#1976d2' }}>
      {columns.map((col) => (
        <TableCell
          key={col.key}
          sx={{ color: 'white', fontWeight: 'bold', fontSize: '1.25rem' }}
          role="columnheader"
          aria-label={col.label}
        >
          <TableSortLabel
            active={sortBy === col.key}
            direction={sortBy === col.key ? order : 'asc'}
            onClick={() => onSort(col.key)}
            sx={{ color: 'white', '&.Mui-active': { color: 'white' }, fontSize: '1.25rem' }}
          >
            <span style={{ marginRight: 8 }}>{col.label}</span>
          </TableSortLabel>
        </TableCell>
      ))}
      <TableCell sx={{ backgroundColor: '#1976d2', width: 48 }} role="columnheader" aria-label="Actions" />
    </TableRow>
  </TableHead>
);

export default CollectedRocksTableHeader;
