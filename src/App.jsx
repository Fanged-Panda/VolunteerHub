import React, { useState } from 'react';
import Home from './pages/Home'; // You imported it as 'Home'
import VolunteerDashboard from './pages/VolunteerDashboard';
import EventPage from './pages/EventPage';

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');

  return (
    <div>
      {/* Navigation */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 flex gap-4 bg-black/80 backdrop-blur-md p-2 rounded-full z-[100]">
        <button onClick={() => setCurrentPage('home')} className="px-4 py-2 text-white text-xs font-bold uppercase">Home</button>
        <button onClick={() => setCurrentPage('dashboard')} className="px-4 py-2 text-white text-xs font-bold uppercase">Dash</button>
        <button onClick={() => setCurrentPage('event')} className="px-4 py-2 text-white text-xs font-bold uppercase">Event</button>
      </div>

      {/* Logic - Use <Home /> here because that is what you imported above */}
      {currentPage === 'home' && <Home />} 
      {currentPage === 'dashboard' && <VolunteerDashboard />}
      {currentPage === 'event' && <EventPage />}
    </div>
  );
}