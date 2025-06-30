// CollectedRockRow.tsx - Table row for a single collected rock
import React from 'react';
import { TableRow, TableCell } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { CollectedRock } from './CollectedRocksTable';

interface CollectedRockRowProps {
  rock: CollectedRock;
  onDelete: () => void;
}

const CollectedRockRow: React.FC<CollectedRockRowProps> = ({ rock, onDelete }) => (
  <TableRow hover>
    <TableCell>{rock.name}</TableCell>
    <TableCell>{rock.market_name}</TableCell>
    <TableCell>{rock.group_name}</TableCell>
    <TableCell>{rock.origin}</TableCell>
    <TableCell align="center">
      <FontAwesomeIcon
        icon={faTrash}
        style={{ cursor: 'pointer', color: '#8B0000' }}
        title="Delete rock"
        onClick={onDelete}
      />
    </TableCell>
  </TableRow>
);

export default CollectedRockRow;

