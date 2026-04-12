import React, { useEffect, useRef, useState } from 'react';
import logo from '../../public/logo.png';

const roleItems = {
  volunteer: { page: 'volunteer', label: 'Volunteer Dashboard' },
  coordinator: { page: 'coordinator', label: 'Coordinator Dashboard' },
  admin: { page: 'admin', label: 'Admin Panel' },
};

function cleanDisplayName(name) {
  const cleaned = String(name || '').replace(/\bstudent\b/gi, '').replace(/\s{2,}/g, ' ').trim();
  return cleaned || String(name || '').trim();
}

function ThemeToggle({ isNight, onToggle }) {
  return (
    <button
      type="button"
      aria-pressed={isNight}
      aria-label={isNight ? 'Switch to day mode' : 'Switch to night mode'}
      title={isNight ? 'Switch to day mode' : 'Switch to night mode'}
      className="vh-theme-switch"
      onClick={onToggle}
    >
      <span className="vh-theme-switch__content" aria-hidden="true">
        <span className="vh-theme-switch__clouds" />
        <span className="vh-theme-switch__stars">
          <span />
          <span />
          <span />
          <span />
          <span />
        </span>
      </span>

      <span className="vh-theme-switch__indicator-wrapper" aria-hidden="true">
        <span className="vh-theme-switch__indicator">
          <span className="vh-theme-switch__star">
            <span className="vh-theme-switch__sun">
              <span className="vh-theme-switch__moon">
                <span className="vh-theme-switch__crater" />
                <span className="vh-theme-switch__crater" />
                <span className="vh-theme-switch__crater" />
              </span>
            </span>
          </span>
        </span>
      </span>
    </button>
  );
}

export default function TopNav({
  currentPage,
  navigateTo,
  openDashboard,
  currentUser,
  theme,
  onToggleTheme,
  onLoginClick,
  onLogout,
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const desktopAccountRef = useRef(null);
  const activeRoleItem = currentUser ? roleItems[currentUser.role] : null;
  const isRolePageActive = Boolean(activeRoleItem && currentPage === activeRoleItem.page);
  const isNight = theme === 'night';
  const displayName = cleanDisplayName(currentUser?.name || '');

  useEffect(() => {
    setShowLogout(false);
  }, [currentUser, mobileOpen]);

  useEffect(() => {
    if (!showLogout) return undefined;

    const closeIfOutside = (event) => {
      if (desktopAccountRef.current && !desktopAccountRef.current.contains(event.target)) {
        setShowLogout(false);
      }
    };

    document.addEventListener('mousedown', closeIfOutside);
    document.addEventListener('touchstart', closeIfOutside);
    return () => {
      document.removeEventListener('mousedown', closeIfOutside);
      document.removeEventListener('touchstart', closeIfOutside);
    };
  }, [showLogout]);

  const headerClass = isNight
    ? 'border-slate-800/70 bg-slate-950/95'
    : 'border-amber-200/70 bg-amber-50/95';

  const roleBadgeClass = isNight
    ? 'bg-slate-800 text-slate-200'
    : 'bg-slate-100 text-slate-600';

  const logoutButtonClass = isNight
    ? 'border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800'
    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50';

  const navButtonClass = (active) => {
    if (active) return 'bg-slate-900 text-white';
    return isNight ? 'text-slate-200 hover:bg-slate-800' : 'text-slate-700 hover:bg-amber-100';
  };

  return (
    <header className={`sticky top-0 z-40 border-b backdrop-blur-md ${headerClass}`}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <button className="flex items-center gap-3" onClick={() => navigateTo('home')}>
          <img src={logo} alt="CUET" className="h-10 w-10 rounded-lg object-cover" />
          <p className={`text-base font-black leading-none ${isNight ? 'text-slate-100' : 'text-slate-900'}`}>VolunteerHub</p>
        </button>

        <nav className="hidden items-center gap-2 md:flex">
          <button
            onClick={() => navigateTo('home')}
            className={`rounded-full px-4 py-2 text-sm font-bold ${navButtonClass(currentPage === 'home')}`}
          >
            Home
          </button>
          <button
            onClick={() => navigateTo('about')}
            className={`rounded-full px-4 py-2 text-sm font-bold ${navButtonClass(currentPage === 'about')}`}
          >
            About
          </button>
          <button
            onClick={() => navigateTo('events')}
            className={`rounded-full px-4 py-2 text-sm font-bold ${navButtonClass(currentPage === 'events')}`}
          >
            Events
          </button>
          <button
            onClick={() => navigateTo('gallery')}
            className={`rounded-full px-4 py-2 text-sm font-bold ${navButtonClass(currentPage === 'gallery')}`}
          >
            Gallery
          </button>
          {activeRoleItem && (
            <button
              onClick={() => openDashboard()}
              className={`rounded-full px-4 py-2 text-sm font-bold ${navButtonClass(isRolePageActive)}`}
            >
              {activeRoleItem.label}
            </button>
          )}

          {!currentUser ? (
            <div className="flex items-center gap-2">
              <button
                onClick={onLoginClick}
                className="rounded-full bg-orange-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-orange-600"
              >
                Login
              </button>
              <ThemeToggle isNight={isNight} onToggle={onToggleTheme} />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div ref={desktopAccountRef} className="relative">
                <button
                  type="button"
                  onClick={() => setShowLogout((prev) => !prev)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${roleBadgeClass}`}
                >
                  Signed in as {displayName}
                </button>
                {showLogout && (
                  <button
                    onClick={() => {
                      setShowLogout(false);
                      onLogout();
                    }}
                    className={`absolute right-0 top-full z-50 mt-2 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-bold shadow-lg transition ${logoutButtonClass}`}
                  >
                    Logout
                  </button>
                )}
              </div>
              <ThemeToggle isNight={isNight} onToggle={onToggleTheme} />
            </div>
          )}
        </nav>

        <button
          className={`rounded-lg border px-3 py-2 text-sm font-bold md:hidden ${isNight ? 'border-slate-700 text-slate-200' : 'border-amber-300 text-slate-700'}`}
          onClick={() => setMobileOpen((v) => !v)}
        >
          Menu
        </button>
      </div>

      {mobileOpen && (
        <div className={`border-t px-4 py-3 md:hidden ${isNight ? 'border-slate-800 bg-slate-950' : 'border-amber-200 bg-amber-50'}`}>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => { navigateTo('home'); setMobileOpen(false); }}
              className={`rounded-lg px-3 py-2 text-sm font-semibold ${isNight ? 'bg-slate-900 text-slate-200' : 'bg-white text-slate-800'}`}
            >
              Home
            </button>
            <button
              onClick={() => { navigateTo('about'); setMobileOpen(false); }}
              className={`rounded-lg px-3 py-2 text-sm font-semibold ${isNight ? 'bg-slate-900 text-slate-200' : 'bg-white text-slate-800'}`}
            >
              About
            </button>
            <button
              onClick={() => { navigateTo('events'); setMobileOpen(false); }}
              className={`rounded-lg px-3 py-2 text-sm font-semibold ${isNight ? 'bg-slate-900 text-slate-200' : 'bg-white text-slate-800'}`}
            >
              Events
            </button>
            <button
              onClick={() => { navigateTo('gallery'); setMobileOpen(false); }}
              className={`rounded-lg px-3 py-2 text-sm font-semibold ${isNight ? 'bg-slate-900 text-slate-200' : 'bg-white text-slate-800'}`}
            >
              Gallery
            </button>
            {activeRoleItem && (
              <button
                onClick={() => { openDashboard(); setMobileOpen(false); }}
                className={`rounded-lg px-3 py-2 text-sm font-semibold ${isNight ? 'bg-slate-900 text-slate-200' : 'bg-white text-slate-800'}`}
              >
                {activeRoleItem.label}
              </button>
            )}
            {!currentUser ? (
              <>
                <button
                  onClick={() => { onLoginClick(); setMobileOpen(false); }}
                  className="rounded-lg bg-orange-500 px-3 py-2 text-sm font-semibold text-white"
                >
                  Login
                </button>
                <div className={`flex items-center justify-center rounded-lg px-2 py-2 ${isNight ? 'bg-slate-900' : 'bg-white'}`}>
                  <ThemeToggle isNight={isNight} onToggle={onToggleTheme} />
                </div>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setShowLogout((prev) => !prev)}
                  className={`col-span-2 rounded-lg px-3 py-2 text-left text-xs font-semibold ${isNight ? 'bg-slate-900 text-slate-300' : 'bg-white text-slate-600'}`}
                >
                  Signed in as {displayName}
                </button>
                {showLogout && (
                  <button
                    onClick={() => {
                      setShowLogout(false);
                      onLogout();
                      setMobileOpen(false);
                    }}
                    className={`col-span-2 rounded-lg px-3 py-2 text-sm font-semibold ${isNight ? 'bg-slate-900 text-slate-200' : 'bg-white text-slate-700'}`}
                  >
                    Logout
                  </button>
                )}
                <div className={`col-span-2 flex items-center justify-center rounded-lg px-2 py-2 ${isNight ? 'bg-slate-900' : 'bg-white'}`}>
                  <ThemeToggle isNight={isNight} onToggle={onToggleTheme} />
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
