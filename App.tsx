import React from 'react';
import { AppProvider, useAppStore } from './services/store';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';

const AppContent: React.FC = () => {
  const { state } = useAppStore();
  
  if (!state.currentUser) {
    return <Auth />;
  }

  return <Dashboard />;
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;