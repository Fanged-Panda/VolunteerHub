import React, { useState } from 'react';
import Home from './pages/Home';
import VolunteerDashboard from './pages/VolunteerDashboard';
import EventPage from './pages/EventPage';

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedEventId, setSelectedEventId] = useState(null);

  function navClass(page) {
    return `px-4 py-2 text-xs font-bold uppercase relative transition-all duration-300 ${currentPage === page ? 'bg-white text-black rounded-full' : 'text-white'}`;
  }

  return (
    <div>
      {/* Navigation */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 flex gap-4 bg-black/80 backdrop-blur-md p-2 rounded-full z-[100]">
        <button onClick={() => setCurrentPage('home')} className={navClass('home')}>Home</button>
        <button onClick={() => setCurrentPage('dashboard')} className={navClass('dashboard')}>Dash</button>
        <button onClick={() => setCurrentPage('event')} className={navClass('event')}>Event</button>
      </div>

      {/* Page container with smooth transitions by toggling visibility */}
      <div className="relative min-h-screen">
        <div className={`transition-all duration-500 ${currentPage === 'home' ? 'relative opacity-100 translate-y-0' : 'absolute inset-0 opacity-0 -translate-y-4 pointer-events-none'}`}>
          <Home setCurrentPage={setCurrentPage} setSelectedEvent={setSelectedEventId} />
        </div>

        <div className={`transition-all duration-500 ${currentPage === 'dashboard' ? 'relative opacity-100 translate-y-0' : 'absolute inset-0 opacity-0 -translate-y-4 pointer-events-none'}`}>
          <VolunteerDashboard setCurrentPage={setCurrentPage} setSelectedEvent={setSelectedEventId} />
        </div>

        <div className={`transition-all duration-500 ${currentPage === 'event' ? 'relative opacity-100 translate-y-0' : 'absolute inset-0 opacity-0 -translate-y-4 pointer-events-none'}`}>
          <EventPage selectedEventId={selectedEventId} setSelectedEvent={setSelectedEventId} />
        </div>
      </div>
    </div>
  );
}