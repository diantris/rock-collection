// useRocksCollectedWebSocket.ts
// Custom React hook for subscribing to the rocks collected WebSocket
import { useEffect, useState } from 'react';

/**
 * Custom hook to subscribe to the rocks collected WebSocket.
 * @returns The latest number of rocks collected, or null if not yet received.
 */
export function useRocksCollectedWebSocket(): number | null {
  const [rocksCollected, setRocksCollected] = useState<number | null>(null);

  useEffect(() => {
    // Connect to the backend WebSocket
    const ws = new WebSocket('ws://localhost:8080/api/random-rocks/ws');
    ws.onmessage = (event) => {
      // Parse the number from the backend
      console.log('WebSocket message received:', event.data);
      const data = JSON.parse(event.data);
      console.log('Data contents:', data);
      if (!isNaN(data.rocks)) {
        setRocksCollected(data.rocks);
      }
      console.log('Rocks collected updated:', data.rocks);
    };
    ws.onerror = (err) => {
      // Optionally handle errors
      console.error('WebSocket error:', err);
    };
    return () => {
      ws.close();
    };
  }, []);

  return rocksCollected;
}

