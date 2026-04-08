import React, { useEffect, useMemo, useState } from 'react';
import Home from './pages/Home';
import VolunteerDashboard from './pages/VolunteerDashboard';
import EventPage from './pages/EventPage';
import CoordinatorDashboard from './pages/CoordinatorDashboard';
import AdminPanel from './pages/AdminPanel';
import AuthPage from './pages/AuthPage';
import TopNav from './components/TopNav';
import ChatbotWidget from './components/ChatbotWidget';
import { apiRequest, clearStoredToken, getStoredToken, setStoredToken } from './lib/api';

const PAGE_SET = new Set(['home', 'events', 'auth', 'volunteer', 'coordinator', 'admin']);

function parseRouteFromLocation() {
  const params = new URLSearchParams(window.location.search);
  const page = params.get('page');
  const selectedEventRaw = params.get('eventId');
  const selectedEventId = selectedEventRaw ? Number(selectedEventRaw) : null;

  return {
    page: PAGE_SET.has(page) ? page : 'home',
    selectedEventId: Number.isFinite(selectedEventId) ? selectedEventId : null,
  };
}

function buildRoute(page, eventId) {
  const params = new URLSearchParams();
  params.set('page', page);
  if (eventId) params.set('eventId', String(eventId));
  return `?${params.toString()}`;
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
      navigateTo('auth');
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
      const clubsData = await apiRequest('/api/meta/clubs', { token: '' });
      setClubs(clubsData.clubs || []);
      await refreshEvents();

      if (token) {
        const me = await apiRequest('/api/auth/me', { token });
        setCurrentUser(me.user);
        await refreshRoleData(me.user, token);
      } else {
        setCurrentUser(null);
      }
    } catch {
      clearStoredToken();
      setToken('');
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    bootstrap();
  }, []);

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
    navigateTo('auth');
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

  async function handleVolunteerTaskComplete(applicationId, taskCompleted) {
    try {
      await apiRequest(`/api/applications/${applicationId}/task-completion`, {
        method: 'PATCH',
        token,
        body: { taskCompleted },
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

  return (
    <div className="min-h-screen bg-amber-50 text-slate-900">
      <TopNav
        currentPage={currentPage}
        navigateTo={navigateTo}
        openDashboard={openDashboard}
        currentUser={currentUser}
        onLoginClick={() => navigateTo('auth')}
        onLogout={handleLogout}
      />

      {loading && (
        <div className="mx-auto max-w-7xl px-4 py-4 text-sm font-semibold text-slate-600">Loading data...</div>
      )}

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
          currentUser={currentUser}
          applications={applications}
          selectedEventId={selectedEventId}
          setSelectedEvent={setSelectedEventId}
          onRequireLogin={(eventId) => requireLogin({ page: 'events', eventId })}
          onApply={handleApply}
          onCancelApplication={handleCancelApplication}
        />
      )}

      {currentPage === 'auth' && (
        <AuthPage
          clubs={clubs}
          onLogin={handleLogin}
          onRequestVerification={handleRequestVerification}
          onRegister={handleRegister}
          onForgotPasswordRequest={handleForgotPasswordRequest}
          onForgotPasswordReset={handleForgotPasswordReset}
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
          onRemoveUser={handleRemoveUser}
          onRemoveEvent={handleRemoveEvent}
        />
      )}

      {((currentPage === 'volunteer' && !canAccess('volunteer')) ||
        (currentPage === 'coordinator' && !canAccess('coordinator')) ||
        (currentPage === 'admin' && !canAccess('admin'))) && (
        <AuthPage
          clubs={clubs}
          onLogin={handleLogin}
          onRequestVerification={handleRequestVerification}
          onRegister={handleRegister}
          onForgotPasswordRequest={handleForgotPasswordRequest}
          onForgotPasswordReset={handleForgotPasswordReset}
        />
      )}

      <ChatbotWidget />
    </div>
  );
}
