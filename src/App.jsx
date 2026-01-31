import React, { useState } from 'react';
import Home from './pages/Home';
import VolunteerDashboard from './pages/VolunteerDashboard';
import EventPage from './pages/EventPage';

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedEventId, setSelectedEventId] = useState(null);

  return (
    <div>
      {/* Navigation */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 flex gap-4 bg-black/80 backdrop-blur-md p-2 rounded-full z-[100]">
        <button onClick={() => setCurrentPage('home')} className={`px-4 py-2 text-xs font-bold uppercase ${currentPage === 'home' ? 'bg-white text-black rounded-full' : 'text-white'}`}>Home</button>
        <button onClick={() => setCurrentPage('dashboard')} className={`px-4 py-2 text-xs font-bold uppercase ${currentPage === 'dashboard' ? 'bg-white text-black rounded-full' : 'text-white'}`}>Dash</button>
        <button onClick={() => setCurrentPage('event')} className={`px-4 py-2 text-xs font-bold uppercase ${currentPage === 'event' ? 'bg-white text-black rounded-full' : 'text-white'}`}>Event</button>
      </div>

      {/* Pages */}
      {currentPage === 'home' && <Home setCurrentPage={setCurrentPage} setSelectedEvent={setSelectedEventId} />}
      {currentPage === 'dashboard' && <VolunteerDashboard setCurrentPage={setCurrentPage} setSelectedEvent={setSelectedEventId} />}
      {currentPage === 'event' && <EventPage selectedEventId={selectedEventId} setSelectedEvent={setSelectedEventId} setCurrentPage={setCurrentPage} />}
    </div>
  );
}