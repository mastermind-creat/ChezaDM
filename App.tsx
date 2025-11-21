import React from 'react';
import { Layout } from './components/Layout';
import { Home } from './components/Home';
import { ChatRoom } from './components/ChatRoom';
import { AppProvider, useApp } from './context/AppContext';

const AppContent = () => {
  const { currentRoom } = useApp();

  return (
    <Layout>
      {currentRoom ? <ChatRoom /> : <Home />}
    </Layout>
  );
};

const App = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;