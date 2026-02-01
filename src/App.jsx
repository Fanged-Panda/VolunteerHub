import React, { useEffect, useState } from 'react';
import Home from './pages/Home';
import VolunteerDashboard from './pages/VolunteerDashboard';
import EventPage from './pages/EventPage';

const DEFAULT_EVENTS = [
  { id: 1, title: 'CP Workshop: Graph Theory', club: 'CUET Computer Club', category: 'Workshop', date: 'Feb 10, 2026', location: 'Central Lab', summary: 'Master complex algorithms with top competitive programmers.', details: 'Bring a laptop. Hands-on sessions with problem sets.' },
  { id: 2, title: 'Robotics 101: Arduino', club: 'ASRRO', category: 'Workshop', date: 'Feb 15, 2026', location: 'WRE Workshop', summary: 'Basics of hardware integration and sensor control.', details: 'Tools and boards provided; limited seats.' },
  { id: 3, title: 'Basanta Utsav Rehearsal', club: 'Joydhoni', category: 'Cultural', date: 'Feb 20, 2026', location: 'Gol Chattar', summary: 'Cultural rehearsal and preparation for spring festival.', details: 'Open to performers and helpers; costume briefing included.' },
  { id: 4, title: 'IEEE Seminar: AI in Power', club: 'IEEE CUET SB', category: 'Seminar', date: 'Feb 25, 2026', location: 'ECE Seminar Hall', summary: 'Exploring AI applications in modern power grids.', details: 'Includes guest speakers from industry and research.' },
];

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [events, setEvents] = useState(() => {
    try {
      const raw = localStorage.getItem('events');
      return raw ? JSON.parse(raw) : DEFAULT_EVENTS;
    } catch (e) {
      return DEFAULT_EVENTS;
    }
  });

  useEffect(() => {
    try { localStorage.setItem('events', JSON.stringify(events)); } catch (e) {}
  }, [events]);

  return (
    <div>
      {/* Navigation */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 flex gap-4 bg-black/80 backdrop-blur-md p-2 rounded-full z-[100]">
        <button onClick={() => setCurrentPage('home')} className={`px-4 py-2 text-xs font-bold uppercase ${currentPage === 'home' ? 'bg-white text-black rounded-full' : 'text-white'}`}>Home</button>
        <button onClick={() => setCurrentPage('dashboard')} className={`px-4 py-2 text-xs font-bold uppercase ${currentPage === 'dashboard' ? 'bg-white text-black rounded-full' : 'text-white'}`}>Dashboard</button>
        <button onClick={() => setCurrentPage('event')} className={`px-4 py-2 text-xs font-bold uppercase ${currentPage === 'event' ? 'bg-white text-black rounded-full' : 'text-white'}`}>Event</button>
      </div>

      {/* Pages */}
      {currentPage === 'home' && <Home events={events} setEvents={setEvents} setCurrentPage={setCurrentPage} setSelectedEvent={setSelectedEventId} />}
      {currentPage === 'dashboard' && <VolunteerDashboard setCurrentPage={setCurrentPage} setSelectedEvent={setSelectedEventId} events={events} />}
      {currentPage === 'event' && <EventPage events={events} setEvents={setEvents} selectedEventId={selectedEventId} setSelectedEvent={setSelectedEventId} setCurrentPage={setCurrentPage} />}
    </div>
  );
}