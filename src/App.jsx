import React, { useEffect, useState } from 'react';
import Home from './pages/Home';
import VolunteerDashboard from './pages/VolunteerDashboard';
import EventPage from './pages/EventPage';
import CoordinatorDashboard from './pages/CoordinatorDashboard';
import AdminPanel from './pages/AdminPanel';
import AuthPage from './pages/AuthPage';
import TopNav from './components/TopNav';

const DEFAULT_EVENTS = [
  { id: 1, title: 'CP Workshop: Graph Theory', club: 'CUET Computer Club', category: 'Workshop', date: 'Feb 10, 2026', location: 'Central Lab', summary: 'Master complex algorithms with top competitive programmers.', details: 'Bring a laptop. Hands-on sessions with problem sets.' },
  { id: 2, title: 'Robotics 101: Arduino', club: 'ASRRO', category: 'Workshop', date: 'Feb 15, 2026', location: 'WRE Workshop', summary: 'Basics of hardware integration and sensor control.', details: 'Tools and boards provided; limited seats.' },
  { id: 3, title: 'Basanta Utsav Rehearsal', club: 'Joydhoni', category: 'Cultural', date: 'Feb 20, 2026', location: 'Gol Chattar', summary: 'Cultural rehearsal and preparation for spring festival.', details: 'Open to performers and helpers; costume briefing included.' },
  { id: 4, title: 'IEEE Seminar: AI in Power', club: 'IEEE CUET SB', category: 'Seminar', date: 'Feb 25, 2026', location: 'ECE Seminar Hall', summary: 'Exploring AI applications in modern power grids.', details: 'Includes guest speakers from industry and research.' },
];

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const raw = localStorage.getItem('currentUser');
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  });
  const [registeredUsers, setRegisteredUsers] = useState(() => {
    try {
      const raw = localStorage.getItem('registeredUsers');
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) return parsed;
      return [];
    } catch (e) {
      return [];
    }
  });
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

  useEffect(() => {
    try { localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers)); } catch (e) {}
  }, [registeredUsers]);

  useEffect(() => {
    if (!currentUser) {
      try { localStorage.removeItem('currentUser'); } catch (e) {}
      return;
    }
    try { localStorage.setItem('currentUser', JSON.stringify(currentUser)); } catch (e) {}
  }, [currentUser]);

  function openEvents(eventId = null) {
    setSelectedEventId(eventId);
    setCurrentPage('events');
  }

  function openDashboard() {
    if (!currentUser) {
      setCurrentPage('auth');
      return;
    }
    if (currentUser.role === 'coordinator') setCurrentPage('coordinator');
    else if (currentUser.role === 'admin') setCurrentPage('admin');
    else setCurrentPage('volunteer');
  }

  function handleLogin(user) {
    setCurrentUser(user);
    if (user.role === 'coordinator') setCurrentPage('coordinator');
    else if (user.role === 'admin') setCurrentPage('admin');
    else setCurrentPage('volunteer');
  }

  function handleRegister(user) {
    setRegisteredUsers((prev) => [...prev, user]);
    setCurrentUser(user);
    if (user.role === 'coordinator') setCurrentPage('coordinator');
    else setCurrentPage('volunteer');
  }

  function handleLogout() {
    setCurrentUser(null);
    setCurrentPage('home');
  }

  function canAccess(page) {
    if (page === 'volunteer') return currentUser?.role === 'volunteer';
    if (page === 'coordinator') return currentUser?.role === 'coordinator';
    if (page === 'admin') return currentUser?.role === 'admin';
    return true;
  }

  return (
    <div className="min-h-screen bg-amber-50 text-slate-900">
      <TopNav
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        openDashboard={openDashboard}
        currentUser={currentUser}
        onLoginClick={() => setCurrentPage('auth')}
        onLogout={handleLogout}
      />

      {currentPage === 'home' && (
        <Home
          events={events}
          setSelectedEvent={setSelectedEventId}
          openEvents={openEvents}
        />
      )}

      {currentPage === 'events' && (
        <EventPage
          events={events}
          setEvents={setEvents}
          selectedEventId={selectedEventId}
          setSelectedEvent={setSelectedEventId}
        />
      )}

      {currentPage === 'auth' && (
        <AuthPage
          users={registeredUsers}
          onLogin={handleLogin}
          onRegister={handleRegister}
        />
      )}

      {currentPage === 'volunteer' && canAccess('volunteer') && (
        <VolunteerDashboard
          events={events}
          onBrowseEvents={() => setCurrentPage('events')}
          onOpenEvent={openEvents}
        />
      )}

      {currentPage === 'coordinator' && canAccess('coordinator') && (
        <CoordinatorDashboard
          events={events}
          setEvents={setEvents}
          onOpenEvent={openEvents}
        />
      )}

      {currentPage === 'admin' && canAccess('admin') && <AdminPanel events={events} />}

      {((currentPage === 'volunteer' && !canAccess('volunteer')) ||
        (currentPage === 'coordinator' && !canAccess('coordinator')) ||
        (currentPage === 'admin' && !canAccess('admin'))) && (
        <AuthPage users={registeredUsers} onLogin={handleLogin} onRegister={handleRegister} />
      )}
    </div>
  );
}