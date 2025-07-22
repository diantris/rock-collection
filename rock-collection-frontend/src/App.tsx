// App.tsx - Main entry point for the React application
import React from 'react';
import CollectedRocksTable from './CollectedRocksTable'; // Table component for displaying collected rocks
import RocksCollectedCounter from './RocksCollectedCounter'; // Component for displaying rocks collected counter

const App: React.FC = () => {
  return (
    <div>
      {/* Top center element for rocks collected */}
      <RocksCollectedCounter />
      {/* Render the table of collected rocks (header is inside the table component) */}
      <CollectedRocksTable />
    </div>
  );
};

export default App;
// End of App.tsx
