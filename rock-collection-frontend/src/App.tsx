// App.tsx - Main entry point for the React application
import React from 'react';
import CollectedRocksTable from './CollectedRocksTable'; // Table component for displaying collected rocks

const App: React.FC = () => {
  return (
    <div>
      {/* Render the table of collected rocks (header is inside the table component) */}
      <CollectedRocksTable />
    </div>
  );
};

export default App;
// End of App.tsx
