import React, { useEffect, useMemo, useRef, useState } from 'react';
import logo from '/logo.avif';

const roleItems = {
  volunteer: { page: 'volunteer', label: 'Volunteer' },
  coordinator: { page: 'coordinator', label: 'Coordinator' },
  admin: { page: 'admin', label: 'Admin' },
};

function cleanDisplayName(name) {
  const cleaned = String(name || '').replace(/\bstudent\b/gi, '').replace(/\s{2,}/g, ' ').trim();
  return cleaned || String(name || '').trim();
}

function userContextLine(user) {
  if (!user) return '';
  if (user.role === 'coordinator') return user.club ? `Coordinator (${user.club})` : 'Coordinator';
  if (user.role === 'volunteer') return user.department ? `Volunteer (${user.department})` : 'Volunteer';
  return 'Admin';
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
  onUpdateProfileImage,
  onLoginClick,
  onLogout,
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [profileImage, setProfileImage] = useState('');
  const [profileTextTone, setProfileTextTone] = useState('auto');
  const imageInputRef = useRef(null);
  const profileMenuDesktopRef = useRef(null);
  const profileMenuMobileRef = useRef(null);
  const activeRoleItem = currentUser ? roleItems[currentUser.role] : null;
  const isRolePageActive = Boolean(activeRoleItem && currentPage === activeRoleItem.page);
  const isNight = theme === 'night';
  const displayName = cleanDisplayName(currentUser?.name || '');
  const contextLine = userContextLine(currentUser);
  const initials = useMemo(() => displayName.slice(0, 1).toUpperCase() || '?', [displayName]);

  useEffect(() => {
    if (!currentUser?.id) {
      setProfileImage('');
      setProfileTextTone('auto');
      return;
    }

    setProfileImage(String(currentUser.profileImage || ''));
  }, [currentUser?.id, currentUser?.profileImage]);

  useEffect(() => {
    if (!profileImage) {
      setProfileTextTone('auto');
      return;
    }

    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const context = canvas.getContext('2d');
      if (!context) {
        setProfileTextTone('auto');
        return;
      }

      context.drawImage(image, 0, 0, 1, 1);
      const pixel = context.getImageData(0, 0, 1, 1).data;
      const luminance = 0.2126 * pixel[0] + 0.7152 * pixel[1] + 0.0722 * pixel[2];
      setProfileTextTone(luminance > 150 ? 'dark' : 'light');
    };
    image.onerror = () => setProfileTextTone('auto');
    image.src = profileImage;
  }, [profileImage]);

  function openImagePicker() {
    if (!currentUser) return;
    imageInputRef.current?.click();
  }

  function openProfileMenu() {
    if (!currentUser) return;
    setProfileMenuOpen((value) => !value);
  }

  async function onPickImage(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Lazy-load image utilities only when user picks an image
      const { toDataUrl } = await import('../lib/imageUtils');
      const value = await toDataUrl(file);
      const previousImage = profileImage;
      setProfileImage(value);
      const result = await onUpdateProfileImage(value);
      if (!result?.ok) {
        setProfileImage(previousImage);
      }
    } catch {
      // Keep previous photo when file cannot be processed.
    }
    event.target.value = '';
  }

  useEffect(() => {
    function closeMenus(event) {
      const insideDesktop = profileMenuDesktopRef.current?.contains(event.target);
      const insideMobile = profileMenuMobileRef.current?.contains(event.target);
      if (!insideDesktop && !insideMobile) {
        setProfileMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', closeMenus);
    document.addEventListener('touchstart', closeMenus);
    return () => {
      document.removeEventListener('mousedown', closeMenus);
      document.removeEventListener('touchstart', closeMenus);
    };
  }, []);

  const headerClass = isNight
    ? 'border-slate-800/70 bg-slate-950/95'
    : 'border-amber-200/70 bg-amber-50/95';

  const logoutButtonClass = isNight
    ? 'border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800'
    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50';

  const profileCardButtonStyle = profileImage
    ? {
      backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.22), rgba(15, 23, 42, 0.22)), url(${profileImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }
    : undefined;

  const profileNameClass = profileTextTone === 'dark'
    ? 'text-slate-900 drop-shadow-[0_1px_1px_rgba(255,255,255,0.55)]'
    : profileTextTone === 'light'
      ? 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.75)]'
      : (isNight ? 'text-slate-100' : 'text-slate-900');

  const profileContextClass = profileTextTone === 'dark'
    ? 'text-slate-800 drop-shadow-[0_1px_1px_rgba(255,255,255,0.5)]'
    : profileTextTone === 'light'
      ? 'text-slate-100 drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)]'
      : (isNight ? 'text-slate-400' : 'text-slate-500');

  const navButtonClass = (active) => {
    if (active) return 'bg-slate-900 text-white';
    return isNight ? 'text-slate-200 hover:bg-slate-800' : 'text-slate-700 hover:bg-amber-100';
  };

  return (
    <header className={`sticky top-0 z-40 border-b backdrop-blur-md ${headerClass}`} style={{ viewTransitionName: 'nav-bar' }}>
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onPickImage}
      />

      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <button className="flex items-center gap-3" onClick={() => navigateTo('home')}>
          <img src={logo} alt="CUET" className="h-10 w-10 rounded-lg object-cover" />
          <p className={`hidden text-base font-black leading-none sm:block ${isNight ? 'text-slate-100' : 'text-slate-900'}`}>VolunteerHub</p>
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
              <div className="pl-2">
                <ThemeToggle isNight={isNight} onToggle={onToggleTheme} />
              </div>
            </div>
          ) : (
            <div ref={profileMenuDesktopRef} className="relative flex items-center gap-2">
              <button
                type="button"
                onClick={openProfileMenu}
                className={`flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border text-sm font-black ${isNight ? 'border-slate-700 bg-slate-900 text-slate-100' : 'border-slate-300 bg-white text-slate-800'}`}
                title="Open profile"
              >
                {profileImage ? (
                  <img src={profileImage} alt={displayName || 'Profile'} className="h-full w-full object-cover" />
                ) : (
                  <span>{initials}</span>
                )}
              </button>

              {profileMenuOpen && (
                <div className={`absolute right-0 top-full z-50 mt-3 w-72 rounded-2xl border p-5 shadow-2xl ${isNight ? 'border-slate-700 bg-slate-950' : 'border-slate-200 bg-white'}`}>
                  <button
                    type="button"
                    onClick={openImagePicker}
                    className={`flex w-full flex-col items-center gap-3 rounded-xl border p-4 text-center transition ${isNight ? 'border-slate-700 hover:bg-slate-900' : 'border-slate-200 hover:bg-slate-50'}`}
                    style={profileCardButtonStyle}
                    title="Change profile photo"
                  >
                    <span className={`flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border text-lg font-black ${isNight ? 'border-slate-700 bg-slate-900 text-slate-100' : 'border-slate-300 bg-slate-100 text-slate-800'}`}>
                      {profileImage ? <img src={profileImage} alt={displayName || 'Profile'} className="h-full w-full object-cover" /> : <span>{initials}</span>}
                    </span>
                    <span>
                      <span className={`block text-sm font-black ${profileNameClass}`}>{displayName}</span>
                      <span className={`block text-xs font-semibold ${profileContextClass}`}>{contextLine}</span>
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      setProfileMenuOpen(false);
                      onLogout();
                    }}
                    className={`mt-3 w-full rounded-xl border px-4 py-2.5 text-sm font-bold transition ${logoutButtonClass}`}
                  >
                    Logout
                  </button>
                </div>
              )}

              <div className="pl-2">
                <ThemeToggle isNight={isNight} onToggle={onToggleTheme} />
              </div>
            </div>
          )}
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          {currentUser && (
            <div ref={profileMenuMobileRef} className="relative">
              <button
                type="button"
                onClick={openProfileMenu}
                className={`flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border text-sm font-black ${isNight ? 'border-slate-700 bg-slate-900 text-slate-100' : 'border-slate-300 bg-white text-slate-800'}`}
                title="Open profile"
              >
                {profileImage ? (
                  <img src={profileImage} alt={displayName || 'Profile'} className="h-full w-full object-cover" />
                ) : (
                  <span>{initials}</span>
                )}
              </button>

              {profileMenuOpen && (
                <div className={`absolute right-0 top-full z-50 mt-3 w-[min(18rem,calc(100vw-2rem))] rounded-2xl border p-5 shadow-2xl ${isNight ? 'border-slate-700 bg-slate-950' : 'border-slate-200 bg-white'}`}>
                  <button
                    type="button"
                    onClick={openImagePicker}
                    className={`flex w-full flex-col items-center gap-3 rounded-xl border p-4 text-center transition ${isNight ? 'border-slate-700 hover:bg-slate-900' : 'border-slate-200 hover:bg-slate-50'}`}
                    style={profileCardButtonStyle}
                    title="Change profile photo"
                  >
                    <span className={`flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border text-lg font-black ${isNight ? 'border-slate-700 bg-slate-900 text-slate-100' : 'border-slate-300 bg-slate-100 text-slate-800'}`}>
                      {profileImage ? <img src={profileImage} alt={displayName || 'Profile'} className="h-full w-full object-cover" /> : <span>{initials}</span>}
                    </span>
                    <span>
                      <span className={`block text-sm font-black ${profileNameClass}`}>{displayName}</span>
                      <span className={`block text-xs font-semibold ${profileContextClass}`}>{contextLine}</span>
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      setProfileMenuOpen(false);
                      onLogout();
                      setMobileOpen(false);
                    }}
                    className={`mt-3 w-full rounded-xl border px-4 py-2.5 text-sm font-bold transition ${logoutButtonClass}`}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}

          {!currentUser && (
            <button
              onClick={onLoginClick}
              className="rounded-lg bg-orange-500 px-3 py-2 text-sm font-bold text-white transition hover:bg-orange-600"
            >
              Login
            </button>
          )}

          <button
            className={`rounded-lg border px-3 py-2 text-sm font-bold ${isNight ? 'border-slate-700 text-slate-200' : 'border-amber-300 text-slate-700'}`}
            onClick={() => setMobileOpen((v) => !v)}
          >
            Menu
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className={`border-t px-4 py-3 md:hidden ${isNight ? 'border-slate-800 bg-slate-950' : 'border-amber-200 bg-amber-50'}`}>
          <div className="grid grid-cols-1 gap-2">
            <button onClick={() => { navigateTo('home'); setMobileOpen(false); }} className={`w-full rounded-lg px-3 py-2 text-left text-sm font-semibold ${isNight ? 'bg-slate-900 text-slate-200' : 'bg-white text-slate-800'}`}>Home</button>
            <button
              onClick={() => { navigateTo('about'); setMobileOpen(false); }}
              className={`w-full rounded-lg px-3 py-2 text-left text-sm font-semibold ${isNight ? 'bg-slate-900 text-slate-200' : 'bg-white text-slate-800'}`}
            >
              About
            </button>
            <button
              onClick={() => { navigateTo('events'); setMobileOpen(false); }}
              className={`w-full rounded-lg px-3 py-2 text-left text-sm font-semibold ${isNight ? 'bg-slate-900 text-slate-200' : 'bg-white text-slate-800'}`}
            >
              Events
            </button>
            <button
              onClick={() => { navigateTo('gallery'); setMobileOpen(false); }}
              className={`w-full rounded-lg px-3 py-2 text-left text-sm font-semibold ${isNight ? 'bg-slate-900 text-slate-200' : 'bg-white text-slate-800'}`}
            >
              Gallery
            </button>
            {activeRoleItem && (
              <button
                onClick={() => { openDashboard(); setMobileOpen(false); }}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm font-semibold ${isNight ? 'bg-slate-900 text-slate-200' : 'bg-white text-slate-800'}`}
              >
                {activeRoleItem.label}
              </button>
            )}
            {!currentUser ? (
              <>
                <button
                  onClick={() => { onLoginClick(); setMobileOpen(false); }}
                  className="w-full rounded-lg bg-orange-500 px-3 py-2 text-left text-sm font-semibold text-white"
                >
                  Login
                </button>
                <div className={`flex items-center justify-center rounded-lg px-2 py-2 ${isNight ? 'bg-slate-900' : 'bg-white'}`}>
                  <ThemeToggle isNight={isNight} onToggle={onToggleTheme} />
                </div>
              </>
            ) : (
              <>
                <div className={`flex items-center justify-center rounded-lg px-2 py-2 ${isNight ? 'bg-slate-900' : 'bg-white'}`}>
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
