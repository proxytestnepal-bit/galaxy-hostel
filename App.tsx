import React from 'react';
import { AppProvider, useAppStore } from './services/store';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import { HotelFeedbackPortal } from './components/roles/internships/HotelFeedbackPortal';

const AppContent: React.FC = () => {
  const { state } = useAppStore();
  
  const params = new URLSearchParams(window.location.search);
  const hotelToken = params.get('hotel_token');

  if (hotelToken) {
    return <HotelFeedbackPortal token={hotelToken} />;
  }

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