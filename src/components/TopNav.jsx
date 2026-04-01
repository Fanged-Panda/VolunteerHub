import React, { useState } from 'react';
import logo from '../assets/logo.png';

const roleItems = {
  volunteer: { page: 'volunteer', label: 'Volunteer Dashboard' },
  coordinator: { page: 'coordinator', label: 'Coordinator Dashboard' },
  admin: { page: 'admin', label: 'Admin Panel' },
};

export default function TopNav({ currentPage, setCurrentPage, openDashboard, currentUser, onLoginClick, onLogout }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const activeRoleItem = currentUser ? roleItems[currentUser.role] : null;
  const isRolePageActive = Boolean(activeRoleItem && currentPage === activeRoleItem.page);

  return (
    <header className="sticky top-0 z-40 border-b border-amber-200/70 bg-amber-50/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <button className="flex items-center gap-3" onClick={() => setCurrentPage('home')}>
          <img src={logo} alt="CUET" className="h-10 w-10 rounded-lg border border-amber-200 object-cover" />
          <p className="text-base font-black leading-none text-slate-900">VolunteerHub</p>
        </button>

        <nav className="hidden items-center gap-2 md:flex">
          <button
            onClick={() => setCurrentPage('home')}
            className={`rounded-full px-4 py-2 text-sm font-bold ${currentPage === 'home' ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-amber-100'}`}
          >
            Home
          </button>
          <button
            onClick={() => setCurrentPage('events')}
            className={`rounded-full px-4 py-2 text-sm font-bold ${currentPage === 'events' ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-amber-100'}`}
          >
            Events
          </button>
          {activeRoleItem && (
            <button
              onClick={() => openDashboard()}
              className={`rounded-full px-4 py-2 text-sm font-bold ${isRolePageActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-amber-100'}`}
            >
              {activeRoleItem.label}
            </button>
          )}

          {!currentUser ? (
            <button
              onClick={onLoginClick}
              className="rounded-full bg-orange-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-orange-600"
            >
              Login
            </button>
          ) : (
            <button
              onClick={onLogout}
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Logout
            </button>
          )}
        </nav>

        <button
          className="rounded-lg border border-amber-300 px-3 py-2 text-sm font-bold text-slate-700 md:hidden"
          onClick={() => setMobileOpen((v) => !v)}
        >
          Menu
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-amber-200 bg-amber-50 px-4 py-3 md:hidden">
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => { setCurrentPage('home'); setMobileOpen(false); }} className="rounded-lg bg-white px-3 py-2 text-sm font-semibold">Home</button>
            <button onClick={() => { setCurrentPage('events'); setMobileOpen(false); }} className="rounded-lg bg-white px-3 py-2 text-sm font-semibold">Events</button>
            {activeRoleItem && (
              <button
                onClick={() => { openDashboard(); setMobileOpen(false); }}
                className="rounded-lg bg-white px-3 py-2 text-sm font-semibold"
              >
                {activeRoleItem.label}
              </button>
            )}
            {!currentUser ? (
              <button
                onClick={() => { onLoginClick(); setMobileOpen(false); }}
                className="rounded-lg bg-orange-500 px-3 py-2 text-sm font-semibold text-white"
              >
                Login
              </button>
            ) : (
              <button
                onClick={() => { onLogout(); setMobileOpen(false); }}
                className="rounded-lg bg-white px-3 py-2 text-sm font-semibold"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
