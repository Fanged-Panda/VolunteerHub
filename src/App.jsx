import React, { useEffect, useMemo, useState } from 'react';
import Home from './pages/Home';
import About from './pages/About';
import Gallery from './pages/GalleryAlt';
import VolunteerDashboard from './pages/VolunteerDashboard';
import EventPage from './pages/EventPage';
import CoordinatorDashboard from './pages/CoordinatorDashboard';
import AdminPanel from './pages/AdminPanel';
import AuthPage from './pages/AuthPage';
import TopNav from './components/TopNav';
import ChatbotWidget from './components/ChatbotWidget';
import { apiRequest, clearStoredToken, getStoredToken, setStoredToken } from './lib/api';

const PAGE_SET = new Set(['home', 'about', 'gallery', 'events', 'auth', 'login', 'register', 'volunteer', 'coordinator', 'admin']);
const THEME_STORAGE_KEY = 'vh_theme';

function normalizePathname(pathname) {
  if (!pathname || pathname === '/') return '/';
  return pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
}

function readInitialTheme() {
  const storedTheme = String(localStorage.getItem(THEME_STORAGE_KEY) || '').trim();
  if (storedTheme === 'day' || storedTheme === 'night') return storedTheme;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'night' : 'day';
}

function parseRouteFromLocation() {
  const pathname = normalizePathname(window.location.pathname);
  if (pathname === '/about') {
    return { page: 'about', selectedEventId: null };
  }
  if (pathname === '/gallery') {
    return { page: 'gallery', selectedEventId: null };
  }

  const params = new URLSearchParams(window.location.search);
  const page = params.get('page');
  const selectedEventRaw = params.get('eventId');
  const selectedEventId = selectedEventRaw ? Number(selectedEventRaw) : null;
  const normalizedPage = page === 'auth' ? 'login' : page;

  return {
    page: PAGE_SET.has(normalizedPage) ? normalizedPage : 'home',
    selectedEventId: Number.isFinite(selectedEventId) ? selectedEventId : null,
  };
}

function buildRoute(page, eventId) {
  if (page === 'about') return '/about';
  if (page === 'gallery') return '/gallery';

  const params = new URLSearchParams();
  params.set('page', page);
  if (eventId) params.set('eventId', String(eventId));
  return `/?${params.toString()}`;
}

export default function App() {
  const initialRoute = useMemo(() => parseRouteFromLocation(), []);

  const [currentPage, setCurrentPage] = useState(initialRoute.page);
  const [selectedEventId, setSelectedEventId] = useState(initialRoute.selectedEventId);
  const [postAuthTarget, setPostAuthTarget] = useState(null);

  const [token, setToken] = useState(() => getStoredToken());
  const [currentUser, setCurrentUser] = useState(null);

  const [clubs, setClubs] = useState([]);
  const [events, setEvents] = useState([]);
  const [applications, setApplications] = useState([]);
  const [coordinatorApplications, setCoordinatorApplications] = useState([]);
  const [myEvents, setMyEvents] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  const [pendingCoordinators, setPendingCoordinators] = useState([]);
  const [adminTotalUsers, setAdminTotalUsers] = useState(0);
  const [adminTotalEvents, setAdminTotalEvents] = useState(0);

  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState(() => readInitialTheme());
  const [authFormKey, setAuthFormKey] = useState(0);

  const isNight = theme === 'night';

  const appThemeClass = isNight
    ? 'bg-slate-950 text-slate-100'
    : 'bg-amber-50 text-slate-900';

  function syncRoute(page, eventId, replace = false) {
    const url = buildRoute(page, eventId);
    if (replace) {
      window.history.replaceState({ page, eventId }, '', url);
      return;
    }
    window.history.pushState({ page, eventId }, '', url);
  }

  function navigateTo(page, options = {}) {
    const { eventId, replaceHistory = false, fromPop = false } = options;
    const nextEventId = typeof eventId === 'undefined' ? selectedEventId : eventId;
    setCurrentPage(page);
    setSelectedEventId(nextEventId ?? null);
    if (!fromPop) {
      syncRoute(page, nextEventId, replaceHistory);
    }
  }

  function openEvents(eventId = null) {
    navigateTo('events', { eventId });
  }

  function openDashboard() {
    if (!currentUser) {
      navigateTo('login');
      return;
    }
    if (currentUser.role === 'coordinator') navigateTo('coordinator');
    else if (currentUser.role === 'admin') navigateTo('admin');
    else navigateTo('volunteer');
  }

  async function refreshEvents() {
    const data = await apiRequest('/api/events');
    setEvents(data.events || []);
  }

  async function refreshRoleData(user = currentUser, authToken = token) {
    if (!user) {
      setApplications([]);
      setCoordinatorApplications([]);
      setMyEvents([]);
      setAdminUsers([]);
      setPendingCoordinators([]);
      setAdminTotalUsers(0);
      setAdminTotalEvents(0);
      return;
    }

    if (user.role === 'volunteer') {
      const data = await apiRequest('/api/applications/my', { token: authToken });
      setApplications(data.applications || []);
      setCoordinatorApplications([]);
      setMyEvents([]);
      setAdminUsers([]);
      setPendingCoordinators([]);
      setAdminTotalUsers(0);
      setAdminTotalEvents(0);
      return;
    }

    if (user.role === 'coordinator') {
      const [eventsData, applicationsData] = await Promise.all([
        apiRequest('/api/coordinator/events', { token: authToken }),
        apiRequest('/api/coordinator/applications', { token: authToken }),
      ]);
      setMyEvents(eventsData.events || []);
      setCoordinatorApplications(applicationsData.applications || []);
      setApplications([]);
      setAdminUsers([]);
      setPendingCoordinators([]);
      setAdminTotalUsers(0);
      setAdminTotalEvents(0);
      return;
    }

    if (user.role === 'admin') {
      const data = await apiRequest('/api/admin/users', { token: authToken });
      setAdminUsers(data.users || []);
      setPendingCoordinators(data.pendingCoordinators || []);
      setAdminTotalUsers(data.totalUsers || 0);
      setAdminTotalEvents(data.totalEvents || 0);
      setApplications([]);
      setCoordinatorApplications([]);
      setMyEvents([]);
    }
  }

  async function bootstrap() {
    setLoading(true);
    try {
      try {
        const clubsData = await apiRequest('/api/meta/clubs', { token: '' });
        const allClubs = Array.isArray(clubsData.clubs) ? clubsData.clubs : [];
        const availableCoordinatorClubs = Array.isArray(clubsData.availableCoordinatorClubs)
          ? clubsData.availableCoordinatorClubs
          : allClubs;
        setClubs(availableCoordinatorClubs);
      } catch {
        setClubs([]);
      }

      try {
        await refreshEvents();
      } catch {
        setEvents([]);
      }

      if (!token) {
        setCurrentUser(null);
        await refreshRoleData(null, '');
        return;
      }

      try {
        const me = await apiRequest('/api/auth/me', { token });
        setCurrentUser(me.user);
        await refreshRoleData(me.user, token);
      } catch {
        clearStoredToken();
        setToken('');
        setCurrentUser(null);
        await refreshRoleData(null, '');
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    bootstrap();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    syncRoute(currentPage, selectedEventId, true);
  }, []);

  useEffect(() => {
    const onPopState = () => {
      const parsed = parseRouteFromLocation();
      navigateTo(parsed.page, {
        eventId: parsed.selectedEventId,
        fromPop: true,
      });
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [selectedEventId]);

  async function handleLogin({ email, password, remember }) {
    try {
      const data = await apiRequest('/api/auth/login', {
        method: 'POST',
        token: '',
        body: { email, password, remember },
      });

      setStoredToken(data.token, remember);
      setToken(data.token);
      setCurrentUser(data.user);
      await refreshEvents();
      await refreshRoleData(data.user, data.token);

      if (postAuthTarget?.page === 'events') {
        navigateTo('events', { eventId: postAuthTarget.eventId, replaceHistory: true });
        setPostAuthTarget(null);
        return { ok: true };
      }

      setPostAuthTarget(null);
      if (data.user.role === 'coordinator') navigateTo('coordinator', { replaceHistory: true });
      else if (data.user.role === 'admin') navigateTo('admin', { replaceHistory: true });
      else navigateTo('volunteer', { replaceHistory: true });
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  async function handleRequestVerification(payload) {
    try {
      const data = await apiRequest('/api/auth/request-verification', {
        method: 'POST',
        token: '',
        body: payload,
      });
      return { ok: true, message: data.message, debugCode: data.debugCode };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  async function handleRegister(payload) {
    try {
      const data = await apiRequest('/api/auth/register', {
        method: 'POST',
        token: '',
        body: payload,
      });

      if (data.token && data.user) {
        setStoredToken(data.token, true);
        setToken(data.token);
        setCurrentUser(data.user);
        await refreshEvents();
        await refreshRoleData(data.user, data.token);

        if (data.user.role === 'coordinator') navigateTo('coordinator', { replaceHistory: true });
        else if (data.user.role === 'admin') navigateTo('admin', { replaceHistory: true });
        else navigateTo('volunteer', { replaceHistory: true });
      }

      return { ok: true, user: data.user, token: data.token };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  async function handleForgotPasswordRequest(payload) {
    try {
      const data = await apiRequest('/api/auth/forgot-password/request', {
        method: 'POST',
        token: '',
        body: payload,
      });
      return { ok: true, message: data.message };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  async function handleForgotPasswordReset(payload) {
    try {
      const data = await apiRequest('/api/auth/forgot-password/reset', {
        method: 'POST',
        token: '',
        body: payload,
      });
      return { ok: true, message: data.message };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  function handleLogout() {
    clearStoredToken();
    setToken('');
    setCurrentUser(null);
    setPostAuthTarget(null);
    setAuthFormKey((prev) => prev + 1);
    setApplications([]);
    setCoordinatorApplications([]);
    setMyEvents([]);
    setAdminUsers([]);
    setPendingCoordinators([]);
    setAdminTotalUsers(0);
    navigateTo('home', { replaceHistory: true });
  }

  function requireLogin(target) {
    setPostAuthTarget(target);
    navigateTo('login');
  }

  function canAccess(page) {
    if (page === 'volunteer') return currentUser?.role === 'volunteer';
    if (page === 'coordinator') return currentUser?.role === 'coordinator';
    if (page === 'admin') return currentUser?.role === 'admin';
    return true;
  }

  async function handleApply(eventId) {
    try {
      await apiRequest(`/api/events/${eventId}/apply`, { method: 'POST', token });
      await refreshEvents();
      await refreshRoleData();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  async function handleCancelApplication(eventId) {
    try {
      await apiRequest(`/api/events/${eventId}/application`, { method: 'DELETE', token });
      await refreshEvents();
      await refreshRoleData();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  async function handleCreateOrUpdateEvent(payload) {
    try {
      if (payload.id) {
        await apiRequest(`/api/events/${payload.id}`, { method: 'PUT', token, body: payload });
      } else {
        await apiRequest('/api/events', { method: 'POST', token, body: payload });
      }
      await refreshEvents();
      await refreshRoleData();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  async function handleDecision(applicationId, status) {
    try {
      await apiRequest(`/api/applications/${applicationId}/status`, {
        method: 'PATCH',
        token,
        body: { status },
      });
      await refreshRoleData();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  async function handleAssignment(applicationId, payload) {
    try {
      await apiRequest(`/api/applications/${applicationId}/assignment`, {
        method: 'PATCH',
        token,
        body: payload,
      });
      await refreshRoleData();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  async function handleVolunteerTaskComplete(applicationId, taskIndex, taskCompleted) {
    try {
      await apiRequest(`/api/applications/${applicationId}/task-completion`, {
        method: 'PATCH',
        token,
        body: { taskIndex, taskCompleted },
      });
      await refreshRoleData();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  async function handleApproveCoordinator(userId) {
    try {
      await apiRequest(`/api/admin/users/${userId}/approve-coordinator`, { method: 'PATCH', token });
      await refreshRoleData();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  async function handleRejectCoordinator(userId) {
    try {
      await apiRequest(`/api/admin/users/${userId}/reject-coordinator`, { method: 'DELETE', token });
      await refreshRoleData();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  async function handleRemoveUser(userId) {
    try {
      await apiRequest(`/api/admin/users/${userId}`, { method: 'DELETE', token });
      await refreshRoleData();
      await refreshEvents();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  async function handleRemoveEvent(eventId) {
    try {
      await apiRequest(`/api/admin/events/${eventId}`, { method: 'DELETE', token });
      await refreshEvents();
      await refreshRoleData();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  function toggleTheme() {
    setTheme((prev) => (prev === 'night' ? 'day' : 'night'));
  }

  function renderCapsuleLoader() {
    return (
      <div className={`vh-loader-screen ${isNight ? 'vh-loader-night' : 'vh-loader-day'}`}>
        <div className="vh-loader-circle" aria-hidden="true">
          <div className="vh-loader-capsule" style={{ '--medicineCount': 8 }}>
            {Array.from({ length: 8 }).map((_, index) => (
              <i key={index + 1} style={{ '--order': index + 1 }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return renderCapsuleLoader();
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${appThemeClass}`}>
      <TopNav
        currentPage={currentPage}
        navigateTo={navigateTo}
        openDashboard={openDashboard}
        currentUser={currentUser}
        theme={theme}
        onToggleTheme={toggleTheme}
        onLoginClick={() => navigateTo('login')}
        onLogout={handleLogout}
      />

      {currentPage === 'home' && (
        <Home
          events={events}
          setSelectedEvent={setSelectedEventId}
          openEvents={openEvents}
          openGallery={() => navigateTo('gallery')}
        />
      )}

      {currentPage === 'about' && <About theme={theme} />}

      {currentPage === 'gallery' && <Gallery theme={theme} />}

      {currentPage === 'events' && (
        <EventPage
          events={events}
          currentUser={currentUser}
          applications={applications}
          selectedEventId={selectedEventId}
          setSelectedEvent={setSelectedEventId}
          onRequireLogin={(eventId) => requireLogin({ page: 'events', eventId })}
          onApply={handleApply}
          onCancelApplication={handleCancelApplication}
        />
      )}

      {(currentPage === 'auth' || currentPage === 'login' || currentPage === 'register') && (
        <AuthPage
          key={`auth-main-${currentPage}-${authFormKey}`}
          mode={currentPage === 'register' ? 'register' : 'login'}
          clubs={clubs}
          onLogin={handleLogin}
          onRequestVerification={handleRequestVerification}
          onRegister={handleRegister}
          onForgotPasswordRequest={handleForgotPasswordRequest}
          onForgotPasswordReset={handleForgotPasswordReset}
          onGoLogin={() => navigateTo('login')}
          onGoRegister={() => navigateTo('register')}
        />
      )}

      {currentPage === 'volunteer' && canAccess('volunteer') && (
        <VolunteerDashboard
          events={events}
          currentUser={currentUser}
          applications={applications}
          onBrowseEvents={() => navigateTo('events')}
          onOpenEvent={openEvents}
          onToggleTaskComplete={handleVolunteerTaskComplete}
        />
      )}

      {currentPage === 'coordinator' && canAccess('coordinator') && (
        <CoordinatorDashboard
          currentUser={currentUser}
          myEvents={myEvents}
          applications={coordinatorApplications}
          onCreateOrUpdateEvent={handleCreateOrUpdateEvent}
          onDecision={handleDecision}
          onAssignment={handleAssignment}
        />
      )}

      {currentPage === 'admin' && canAccess('admin') && (
        <AdminPanel
          currentUser={currentUser}
          users={adminUsers}
          pendingCoordinators={pendingCoordinators}
          events={events}
          totalUsers={adminTotalUsers}
          totalEvents={adminTotalEvents}
          onApproveCoordinator={handleApproveCoordinator}
          onRejectCoordinator={handleRejectCoordinator}
          onRemoveUser={handleRemoveUser}
          onRemoveEvent={handleRemoveEvent}
        />
      )}

      {((currentPage === 'volunteer' && !canAccess('volunteer')) ||
        (currentPage === 'coordinator' && !canAccess('coordinator')) ||
        (currentPage === 'admin' && !canAccess('admin'))) && (
        <AuthPage
          key={`auth-guard-${authFormKey}`}
          mode="login"
          clubs={clubs}
          onLogin={handleLogin}
          onRequestVerification={handleRequestVerification}
          onRegister={handleRegister}
          onForgotPasswordRequest={handleForgotPasswordRequest}
          onForgotPasswordReset={handleForgotPasswordReset}
          onGoLogin={() => navigateTo('login')}
          onGoRegister={() => navigateTo('register')}
        />
      )}

      <ChatbotWidget />
    </div>
  );
}
