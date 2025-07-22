// RocksCollectedCounter.tsx
// React component to display the number of rocks collected so far
import React from 'react';
import { useRocksCollectedWebSocket } from './hooks/useRocksCollectedWebSocket';

/**
 * Displays the number of rocks collected so far, updating in real time from the WebSocket.
 */
const RocksCollectedCounter: React.FC = () => {
  const rocksCollected = useRocksCollectedWebSocket();

  return (
    <div
      style={{
        width: '100%',
        textAlign: 'center',
        margin: '24px 0',
        fontSize: '1.5rem',
        fontWeight: 'bold',
      }}
      data-testid="rocks-collected-counter"
      role="status"
      aria-live="polite"
    >
      Rocks collected so far: {rocksCollected !== null ? rocksCollected : '...'}
    </div>
  );
};

export default RocksCollectedCounter;

