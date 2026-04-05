import React, { useMemo, useState } from 'react';
import StatusBadge from '../components/StatusBadge';

export default function AdminPanel({
  currentUser,
  users = [],
  pendingCoordinators = [],
  events = [],
  totalUsers = 0,
  totalEvents = 0,
  onApproveCoordinator,
  onRemoveUser,
  onRemoveEvent,
}) {
  const [actionError, setActionError] = useState('');

  const reports = useMemo(
    () => [
      { label: 'Total Users', value: totalUsers || users.filter((u) => u.role !== 'admin').length },
      { label: 'Total Events', value: totalEvents || events.length },
      { label: 'Active Volunteers', value: users.filter((u) => u.role === 'volunteer').length },
      { label: 'Coordinators', value: users.filter((u) => u.role === 'coordinator').length },
    ],
    [users, events, totalUsers, totalEvents],
  );

  async function approveCoordinator(user) {
    setActionError('');
    const result = await onApproveCoordinator(user.id);
    if (!result?.ok) {
      setActionError(result?.error || 'Could not approve coordinator.');
    }
  }

  async function removeUser(user) {
    if (currentUser?.id === user.id) {
      setActionError('You cannot remove your own admin account.');
      return;
    }
    const confirmed = window.confirm(`Remove ${user.email} from the site?`);
    if (!confirmed) return;

    setActionError('');
    const result = await onRemoveUser(user.id);
    if (!result?.ok) {
      setActionError(result?.error || 'Could not remove user.');
    }
  }

  async function removeEvent(event) {
    const confirmed = window.confirm(`Remove event: ${event.title}?`);
    if (!confirmed) return;

    setActionError('');
    const result = await onRemoveEvent(event.id);
    if (!result?.ok) {
      setActionError(result?.error || 'Could not remove event.');
    }
  }

  function statusForUser(user) {
    if (user.role === 'coordinator' && !user.coordinatorApproved) return 'Applied';
    return 'Approved';
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6 rounded-2xl border border-amber-100 bg-white p-5">
        <h1 className="text-3xl font-black text-slate-900">Admin Panel</h1>
        <p className="mt-2 text-slate-600">Manage users and review high-level reports for CUET club volunteer operations.</p>
      </header>

      {actionError && <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{actionError}</p>}

      <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {reports.map((report) => (
          <article key={report.label} className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{report.label}</p>
            <p className="mt-2 text-3xl font-black text-slate-900">{report.value}</p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-amber-100 bg-white p-5">
        <h2 className="mb-3 text-xl font-black text-slate-900">Coordinator Requests</h2>
        <div className="overflow-x-auto mb-8">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2 font-bold">Name</th>
                <th className="py-2 font-bold">Email</th>
                <th className="py-2 font-bold">Club</th>
                <th className="py-2 font-bold">Status</th>
                <th className="py-2 font-bold">Action</th>
              </tr>
            </thead>
            <tbody>
              {pendingCoordinators.map((user) => (
                <tr key={user.id} className="border-b border-slate-100">
                  <td className="py-2 font-semibold text-slate-900">{user.name}</td>
                  <td className="py-2 text-slate-700">{user.email}</td>
                  <td className="py-2 text-slate-700">{user.club}</td>
                  <td className="py-2"><StatusBadge status="Applied" /></td>
                  <td className="py-2">
                    <button
                      onClick={() => approveCoordinator(user)}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 font-bold text-white"
                    >
                      Approve
                    </button>
                  </td>
                </tr>
              ))}
              {pendingCoordinators.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-slate-500">No pending coordinator requests.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <h2 className="mb-3 text-xl font-black text-slate-900">User Management</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2 font-bold">Name</th>
                <th className="py-2 font-bold">Email</th>
                <th className="py-2 font-bold">Role</th>
                <th className="py-2 font-bold">Club/Department</th>
                <th className="py-2 font-bold">Status</th>
                <th className="py-2 font-bold">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-slate-100">
                  <td className="py-2 font-semibold text-slate-900">{user.name}</td>
                  <td className="py-2 text-slate-700">{user.email}</td>
                  <td className="py-2 text-slate-700">{user.role}</td>
                  <td className="py-2 text-slate-700">{user.role === 'coordinator' ? (user.club || 'N/A') : (user.department || 'N/A')}</td>
                  <td className="py-2"><StatusBadge status={statusForUser(user)} /></td>
                  <td className="py-2">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => removeUser(user)}
                        disabled={currentUser?.id === user.id}
                        className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-1.5 font-bold text-rose-700"
                      >
                        {currentUser?.id === user.id ? 'Current Admin' : 'Remove'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-slate-500">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <h2 className="mb-3 mt-8 text-xl font-black text-slate-900">All Events (Past and Current)</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2 font-bold">Title</th>
                <th className="py-2 font-bold">Club</th>
                <th className="py-2 font-bold">Date</th>
                <th className="py-2 font-bold">Location</th>
                <th className="py-2 font-bold">Creator</th>
                <th className="py-2 font-bold">Action</th>
              </tr>
            </thead>
            <tbody>
              {[...events]
                .sort((a, b) => (a.date < b.date ? 1 : -1))
                .map((event) => (
                  <tr key={event.id} className="border-b border-slate-100">
                    <td className="py-2 font-semibold text-slate-900">{event.title}</td>
                    <td className="py-2 text-slate-700">{event.club}</td>
                    <td className="py-2 text-slate-700">{event.date}</td>
                    <td className="py-2 text-slate-700">{event.location}</td>
                    <td className="py-2 text-slate-700">{event.createdByEmail || 'N/A'}</td>
                    <td className="py-2">
                      <button
                        onClick={() => removeEvent(event)}
                        className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-1.5 font-bold text-rose-700"
                      >
                        Remove Event
                      </button>
                    </td>
                  </tr>
                ))}
              {events.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-slate-500">No events found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
