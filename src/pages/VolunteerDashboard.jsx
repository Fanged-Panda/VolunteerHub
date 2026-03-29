import React, { useMemo, useState } from 'react';
import StatusBadge from '../components/StatusBadge';

export default function VolunteerDashboard({ events = [], onBrowseEvents, onOpenEvent }) {
  const [tasks, setTasks] = useState([
    { id: 't1', title: 'Attend briefing at TSC', status: 'Assigned', done: false },
    { id: 't2', title: 'Collect volunteer ID card', status: 'Applied', done: false },
    { id: 't3', title: 'Submit event feedback form', status: 'Completed', done: true },
  ]);
  const [notifications] = useState([
    'You were approved for Robotics 101: Arduino.',
    'New assigned task: Attend briefing at TSC.',
    'Your volunteer hour log was updated.',
  ]);
  const [hours] = useState(27);

  const appliedIds = useMemo(() => {
    try {
      const raw = localStorage.getItem('appliedEvents');
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }, []);

  const appliedEvents = useMemo(() => events.filter((event) => appliedIds.includes(event.id)), [events, appliedIds]);

  function toggleTask(taskId) {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? { ...task, done: !task.done, status: !task.done ? 'Completed' : 'Assigned' }
          : task,
      ),
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6 rounded-2xl border border-amber-100 bg-white p-5">
        <h1 className="text-3xl font-black text-slate-900">Volunteer Dashboard</h1>
        <p className="mt-2 text-slate-600">Track your applications, assigned tasks, notifications, and total hours from CUET club events.</p>
      </header>

      <section className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Applied Events</p>
          <p className="mt-2 text-3xl font-black text-slate-900">{appliedEvents.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Assigned Tasks</p>
          <p className="mt-2 text-3xl font-black text-slate-900">{tasks.filter((task) => !task.done).length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Volunteer Hours</p>
          <p className="mt-2 text-3xl font-black text-slate-900">{hours}</p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <article className="rounded-2xl border border-amber-100 bg-white p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-900">Applied Events</h2>
            <button onClick={onBrowseEvents} className="text-sm font-bold text-orange-600 hover:text-orange-700">Browse events</button>
          </div>

          {appliedEvents.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-600">
              You have not applied to any event yet.
            </p>
          ) : (
            <div className="space-y-3">
              {appliedEvents.map((event) => (
                <div key={event.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div>
                    <h3 className="font-black text-slate-900">{event.title}</h3>
                    <p className="text-sm text-slate-600">{event.date} • {event.location}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status="Applied" />
                    <button
                      onClick={() => onOpenEvent(event.id)}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-bold text-slate-700"
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-7">
            <h3 className="mb-3 text-lg font-black text-slate-900">Assigned Tasks</h3>
            <div className="space-y-3">
              {tasks.map((task) => (
                <div key={task.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-3">
                  <div>
                    <p className={`font-semibold ${task.done ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{task.title}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={task.status} />
                    <button
                      onClick={() => toggleTask(task.id)}
                      className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-bold text-white"
                    >
                      {task.done ? 'Undo' : 'Mark Done'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </article>

        <aside className="rounded-2xl border border-amber-100 bg-white p-5">
          <h2 className="text-xl font-black text-slate-900">Notifications</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            {notifications.map((note) => (
              <li key={note} className="rounded-lg bg-slate-50 p-3">{note}</li>
            ))}
          </ul>

          <div className="mt-6 rounded-xl bg-amber-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-amber-700">Volunteer Hours Summary</p>
            <p className="mt-2 text-2xl font-black text-slate-900">{hours} hrs</p>
            <p className="mt-1 text-sm text-slate-600">Great progress. Keep volunteering across CUET clubs.</p>
          </div>
        </aside>
      </section>
    </main>
  );
}
