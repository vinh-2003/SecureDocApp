import React from 'react';
import AppProviders from './providers/AppProviders';
import AppRoutes from './routes/AppRoutes';

/**
 * Root component của ứng dụng
 */
function App() {
  return (
    <AppProviders>
      <div className="App font-sans">
        <AppRoutes />
      </div>
    </AppProviders>
  );
}

export default App;