import React from 'react';
import { RecoilRoot } from 'recoil';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import CompareProfiles from './pages/CompareProfiles';
import UserInput from './pages/UserInput';
import Navbar from './components/Navbar';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RecoilRoot>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="container mx-auto px-4 py-8">
              <Routes>
                <Route path="/" element={<UserInput />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/compare" element={<CompareProfiles />} />
              </Routes>
            </div>
          </div>
        </Router>
      </RecoilRoot>
    </QueryClientProvider>
  );
}

export default App;