import React, { useMemo, useState } from 'react';
import StatusBadge from '../components/StatusBadge';

function normalizeAssignedTasks(tasks, fallbackCompleted = false) {
  if (!Array.isArray(tasks)) return [];

  return tasks
    .map((task) => {
      if (task && typeof task === 'object') {
        const title = String(task.title ?? task.task ?? '').trim();
        if (!title) return null;
        return {
          title,
          completed: Boolean(task.completed),
        };
      }

      const title = String(task || '').trim();
      if (!title) return null;
      return {
        title,
        completed: Boolean(fallbackCompleted),
      };
    })
    .filter(Boolean);
}

export default function VolunteerDashboard({ events = [], currentUser, applications = [], onBrowseEvents, onOpenEvent, onToggleTaskComplete }) {
  const [actionError, setActionError] = useState('');
  const [openTaskMenuEventId, setOpenTaskMenuEventId] = useState(null);
  const [viewMode, setViewMode] = useState('applied');

  const todayKey = useMemo(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const myApplications = useMemo(
    () => applications,
    [applications],
  );

  const appliedEvents = useMemo(() => {
    const myEventIds = myApplications.map((application) => application.eventId);
    return events.filter((event) => myEventIds.includes(event.id) && event.date >= todayKey);
  }, [events, myApplications, todayKey]);

  const pastEvents = useMemo(() => {
    const myEventIds = myApplications
      .filter((application) => application.attendance)
      .map((application) => application.eventId);
    return events.filter((event) => myEventIds.includes(event.id) && event.date < todayKey);
  }, [events, myApplications, todayKey]);

  const assignedTasksByEvent = useMemo(() => {
    const byEvent = new Map();
    myApplications.forEach((application) => {
      const normalizedTasks = normalizeAssignedTasks(application.assignedTasks, Boolean(application.taskCompleted));
      if (normalizedTasks.length) {
        byEvent.set(application.eventId, normalizedTasks);
      }
    });
    return byEvent;
  }, [myApplications]);

  const tasks = useMemo(() => {
    return myApplications
      .filter((application) => application.status === 'Approved')
      .flatMap((application) => {
        const normalizedTasks = normalizeAssignedTasks(application.assignedTasks, Boolean(application.taskCompleted));
        return normalizedTasks.map((task, idx) => ({
          id: application.id,
          key: `${application.id}-${idx}`,
          taskIndex: idx,
          title: task.title,
          done: task.completed,
        }));
      });
  }, [myApplications]);

  const notifications = useMemo(() => {
    const notes = [];
    myApplications.forEach((application) => {
      if (application.status === 'Approved') {
        notes.push({
          text: `You were approved for ${application.eventTitle || 'an event'}.`,
          time: application.decisionAt || application.appliedAt,
        });
      }
      if (Array.isArray(application.assignedTasks) && application.assignedTasks.length) {
        notes.push({
          text: `Task assigned for ${application.eventTitle || 'an event'}.`,
          time: application.decisionAt || application.appliedAt,
        });
      }
      if (application.attendance) {
        notes.push({
          text: `Attendance marked for ${application.eventTitle || 'an event'}.`,
          time: application.decisionAt || application.appliedAt,
        });
      }
      if (application.status === 'Rejected') {
        notes.push({
          text: `Application rejected for ${application.eventTitle || 'an event'}.`,
          time: application.decisionAt || application.appliedAt,
        });
      }
    });

    return notes
      .sort((a, b) => new Date(b.time || 0).getTime() - new Date(a.time || 0).getTime())
      .slice(0, 6);
  }, [myApplications]);
  function getApplicationStatusLabel(application) {
    if (application.status === 'Rejected') return 'Rejected';
    if (application.status === 'Applied') return 'Applied';
    if (application.status === 'Approved') {
      const normalizedTasks = normalizeAssignedTasks(application.assignedTasks, Boolean(application.taskCompleted));
      const allTasksCompleted = normalizedTasks.length > 0 && normalizedTasks.every((task) => task.completed);
      if (application.eventDate < todayKey) return 'Done';
      if (allTasksCompleted || application.taskCompleted) return 'Completed';
      if (normalizedTasks.length) return 'Task Assigned';
      return 'Approved';
    }
    return application.status;
  }


  const hours = useMemo(
    () => myApplications.filter((application) => application.attendance).length * 3,
    [myApplications],
  );

  async function toggleTask(taskId, taskIndex, currentDone) {
    setActionError('');
    const result = await onToggleTaskComplete(taskId, taskIndex, !currentDone);
    if (!result?.ok) {
      setActionError(result?.error || 'Could not update task completion.');
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6 rounded-2xl border border-amber-100 bg-white p-5">
        <h1 className="text-3xl font-black text-slate-900">Volunteer Dashboard</h1>
        <p className="mt-2 text-slate-600">Track your applications, assigned tasks, notifications, and total hours from CUET club events.</p>
      </header>

      {actionError && <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{actionError}</p>}

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
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Past Events</p>
          <p className="mt-2 text-3xl font-black text-slate-900">{pastEvents.length}</p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <article className="rounded-2xl border border-amber-100 bg-white p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-900">{viewMode === 'applied' ? 'Applied Events' : 'Past Events'}</h2>
            <button onClick={() => setViewMode(viewMode === 'applied' ? 'past' : 'applied')} className="text-sm font-bold text-orange-600 hover:text-orange-700">{viewMode === 'applied' ? 'Past Events' : 'Applied Events'}</button>
          </div>

          {(viewMode === 'applied' ? appliedEvents : pastEvents).length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-600">
              {viewMode === 'applied' ? 'You have not applied to any event yet.' : 'You have no past events to show.'}
            </p>
          ) : (
            <div className="space-y-3">
              {(viewMode === 'applied' ? appliedEvents : pastEvents).map((event) => {
                const application = myApplications.find((item) => item.eventId === event.id) || null;
                const statusApplication = application || { status: 'Applied', eventDate: event.date };
                const eventTasks = assignedTasksByEvent.get(event.id) || [];
                const isTaskMenuOpen = openTaskMenuEventId === event.id;

                return (
                  <div key={event.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="font-black text-slate-900">{event.title}</h3>
                        <p className="text-sm text-slate-600">{event.date} • {event.location}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusBadge status={getApplicationStatusLabel(statusApplication)} />
                        {eventTasks.length > 0 && (
                          <button
                            onClick={() => setOpenTaskMenuEventId((current) => (current === event.id ? null : event.id))}
                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-bold text-slate-700"
                          >
                            {isTaskMenuOpen ? 'Hide' : 'View'}
                          </button>
                        )}
                      </div>
                    </div>

                    {isTaskMenuOpen && eventTasks.length > 0 && (
                      <div className="mt-3 space-y-3 border-t border-slate-200 pt-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Assigned Tasks</p>
                        {eventTasks.map((task, taskIndex) => (
                          <div key={`${event.id}-${task.title}-${taskIndex}`} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-3">
                            <div>
                              <p className={`font-semibold ${task.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{task.title}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <StatusBadge status={task.completed ? 'Completed' : 'Assigned'} />
                              <button
                                onClick={() => {
                                  if (!application?.id) return;
                                  toggleTask(application.id, taskIndex, task.completed);
                                }}
                                className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-bold text-white"
                              >
                                {task.completed ? 'Mark Not Done' : 'Mark Done'}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </article>

        <aside className="rounded-2xl border border-amber-100 bg-white p-5">
          <h2 className="text-xl font-black text-slate-900">Notifications</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            {notifications.length === 0 && <li className="rounded-lg bg-slate-50 p-3">No updates yet.</li>}
            {notifications.map((note) => (
              <li key={`${note.text}-${note.time || 'n/a'}`} className="rounded-lg bg-slate-50 p-3">{note.text}</li>
            ))}
          </ul>
        </aside>
      </section>
    </main>
  );
}
