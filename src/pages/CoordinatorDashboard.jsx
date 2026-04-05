import React, { useMemo, useState } from 'react';
import StatusBadge from '../components/StatusBadge';

const blankForm = {
  id: null,
  title: '',
  date: '',
  location: '',
  neededVolunteers: '',
  imageUrl: '',
  category: '',
  summary: '',
  details: '',
};

export default function CoordinatorDashboard({ currentUser, myEvents = [], applications = [], onCreateOrUpdateEvent, onDecision, onAssignment }) {
  const [form, setForm] = useState(blankForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState('');
  const [assignmentDrafts, setAssignmentDrafts] = useState({});

  const isApproved = Boolean(currentUser?.coordinatorApproved);

  const visibleApplicants = useMemo(
    () => applications.filter((application) => application.status !== 'Rejected'),
    [applications],
  );

  const todayKey = useMemo(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const currentEvents = useMemo(() => myEvents.filter((event) => event.date >= todayKey), [myEvents, todayKey]);
  const pastEvents = useMemo(() => myEvents.filter((event) => event.date < todayKey), [myEvents, todayKey]);

  function validate() {
    const nextErrors = {};
    if (!form.title.trim()) nextErrors.title = 'Title is required.';
    if (!form.date.trim()) nextErrors.date = 'Date is required.';
    if (!form.location.trim()) nextErrors.location = 'Location is required.';
    const needed = Number(form.neededVolunteers);
    if (!Number.isInteger(needed) || needed < 1) {
      nextErrors.neededVolunteers = 'Volunteers needed must be at least 1.';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function toDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Could not read image file.'));
      reader.readAsDataURL(file);
    });
  }

  async function saveEvent(e) {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    setActionError('');
    const payload = {
      ...form,
      neededVolunteers: Number(form.neededVolunteers),
    };
    const result = await onCreateOrUpdateEvent(payload);
    setSaving(false);

    if (!result?.ok) {
      setActionError(result?.error || 'Could not save event.');
      return;
    }

    setForm(blankForm);
    setErrors({});
  }

  function openEditEvent(event) {
    setForm({
      id: event.id,
      title: event.title || '',
      date: event.date || '',
      location: event.location || '',
      neededVolunteers: Number(event.needed_volunteers || event.neededVolunteers || 1),
      imageUrl: event.image_url || event.imageUrl || '',
      category: event.category || '',
      summary: event.summary || '',
      details: event.details || '',
    });
    setErrors({});
    setActionError('');
  }

  async function decide(applicationId, status) {
    setActionError('');
    const result = await onDecision(applicationId, status);
    if (!result?.ok) setActionError(result?.error || 'Could not update decision.');
  }

  async function updateAssignment(application) {
    setActionError('');
    const draft = assignmentDrafts[application.id] || '';
    if (!draft.trim()) return;
    const result = await onAssignment(application.id, { addTask: draft.trim() });
    if (result?.ok) {
      setAssignmentDrafts((prev) => ({ ...prev, [application.id]: '' }));
    }
    if (!result?.ok) setActionError(result?.error || 'Could not save assignment.');
  }

  async function toggleAttendance(application) {
    setActionError('');
    const result = await onAssignment(application.id, { attendance: !application.attendance });
    if (!result?.ok) setActionError(result?.error || 'Could not update attendance.');
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6 rounded-2xl border border-amber-100 bg-white p-5">
        <h1 className="text-3xl font-black text-slate-900">Coordinator Dashboard</h1>
        <p className="mt-2 text-slate-600">Create your club events, review applicants, assign tasks, and track completion.</p>
      </header>

      {!isApproved && (
        <section className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="text-xl font-black text-amber-800">Waiting For Admin Approval</h2>
          <p className="mt-2 text-sm text-amber-700">
            Your coordinator account is pending admin approval. You can view this page, but event management is locked until approved.
          </p>
        </section>
      )}

      {actionError && (
        <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{actionError}</p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-amber-100 bg-white p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-black text-slate-900">{form.id ? 'Edit Event' : 'Create Event'}</h2>
            {form.id && (
              <button
                onClick={() => setForm(blankForm)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-bold text-slate-700"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <form
            onSubmit={saveEvent}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
                e.preventDefault();
              }
            }}
            className="space-y-3"
          >
            <div>
              <label className="mb-1 block text-sm font-bold text-slate-700">Club</label>
              <input
                value={currentUser?.club || ''}
                disabled
                className="w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-slate-600"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-bold text-slate-700">Title *</label>
              <input
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                disabled={!isApproved || saving}
              />
              {errors.title && <p className="mt-1 text-xs font-semibold text-red-600">{errors.title}</p>}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-bold text-slate-700">Date *</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  disabled={!isApproved || saving}
                />
                {errors.date && <p className="mt-1 text-xs font-semibold text-red-600">{errors.date}</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-bold text-slate-700">Location *</label>
                <input
                  value={form.location}
                  onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  disabled={!isApproved || saving}
                />
                {errors.location && <p className="mt-1 text-xs font-semibold text-red-600">{errors.location}</p>}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-bold text-slate-700">Volunteers Needed *</label>
              <input
                type="number"
                min={1}
                value={form.neededVolunteers}
                onChange={(e) => setForm((prev) => ({ ...prev, neededVolunteers: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                disabled={!isApproved || saving}
              />
              {errors.neededVolunteers && <p className="mt-1 text-xs font-semibold text-red-600">{errors.neededVolunteers}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-bold text-slate-700">Background Image (optional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    const imageUrl = await toDataUrl(file);
                    setForm((prev) => ({ ...prev, imageUrl }));
                  } catch (err) {
                    setActionError(err.message || 'Image upload failed.');
                  }
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                disabled={!isApproved || saving}
              />
              {form.imageUrl && <p className="mt-1 text-xs text-slate-600">Image ready.</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-bold text-slate-700">Category</label>
              <input
                value={form.category}
                onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                disabled={!isApproved || saving}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-bold text-slate-700">Summary</label>
              <textarea
                value={form.summary}
                onChange={(e) => setForm((prev) => ({ ...prev, summary: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                rows={2}
                disabled={!isApproved || saving}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-bold text-slate-700">Details</label>
              <textarea
                value={form.details}
                onChange={(e) => setForm((prev) => ({ ...prev, details: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                rows={3}
                disabled={!isApproved || saving}
              />
            </div>

            <button
              type="submit"
              disabled={!isApproved || saving}
              className="rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-orange-300"
            >
              {saving ? 'Saving...' : form.id ? 'Save Changes' : 'Create Event'}
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-amber-100 bg-white p-5">
          <h2 className="mb-4 text-xl font-black text-slate-900">Manage Applicants</h2>
          <div className="space-y-3">
            {visibleApplicants.length === 0 && (
              <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-600">
                No active applicants for your events.
              </p>
            )}

            {visibleApplicants.map((application) => (
              <div key={application.id} className="rounded-xl border border-slate-200 p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-black text-slate-900">{application.volunteerName}</p>
                    <p className="text-sm text-slate-600">{application.eventTitle}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={application.status} />
                    {application.status === 'Approved' && Array.isArray(application.assignedTasks) && application.assignedTasks.length > 0 && (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-700">Task Assigned</span>
                    )}
                  </div>
                </div>

                <p className="text-xs font-semibold text-slate-600">Task completion: {application.taskCompleted ? 'Completed by volunteer' : 'Not completed yet'}</p>

                {application.status === 'Applied' && isApproved && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => decide(application.id, 'Approved')}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-bold text-white"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => decide(application.id, 'Rejected')}
                      className="rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-bold text-white"
                    >
                      Reject
                    </button>
                  </div>
                )}

                {application.status === 'Approved' && isApproved && (
                  <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
                    <input
                      value={assignmentDrafts[application.id] ?? ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        setAssignmentDrafts((prev) => ({ ...prev, [application.id]: value }));
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          updateAssignment(application);
                        }
                      }}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      placeholder="Type task and press Enter"
                    />
                    <button
                      onClick={() => toggleAttendance(application)}
                      className={`rounded-lg px-3 py-2 text-sm font-bold ${application.attendance ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-900 text-white'}`}
                    >
                      {application.attendance ? 'Attendance Marked' : 'Mark Attendance'}
                    </button>
                  </div>
                )}

                {application.status === 'Approved' && Array.isArray(application.assignedTasks) && application.assignedTasks.length > 0 && (
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                    {application.assignedTasks.map((task, idx) => (
                      <li key={`${application.id}-${idx}`} className="flex items-center justify-between gap-2">
                        <span>{task}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${application.taskCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                          {application.taskCompleted ? 'Completed' : 'Pending'}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="mt-6 rounded-2xl border border-amber-100 bg-white p-5">
        <h2 className="mb-3 text-xl font-black text-slate-900">My Current Events</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2 font-bold">Event</th>
                <th className="py-2 font-bold">Club</th>
                <th className="py-2 font-bold">Date</th>
                <th className="py-2 font-bold">Location</th>
                <th className="py-2 font-bold">Action</th>
              </tr>
            </thead>
            <tbody>
              {currentEvents.map((event) => (
                <tr key={event.id} className="border-b border-slate-100">
                  <td className="py-2 font-semibold text-slate-900">{event.title}</td>
                  <td className="py-2 text-slate-700">{event.club}</td>
                  <td className="py-2 text-slate-700">{event.date}</td>
                  <td className="py-2 text-slate-700">{event.location}</td>
                  <td className="py-2">
                    <button
                      onClick={() => openEditEvent(event)}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 font-bold text-slate-700"
                      disabled={!isApproved}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
              {currentEvents.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-slate-500">No events created by you yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-amber-100 bg-white p-5">
        <h2 className="mb-3 text-xl font-black text-slate-900">My Past Events</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2 font-bold">Event</th>
                <th className="py-2 font-bold">Club</th>
                <th className="py-2 font-bold">Date</th>
                <th className="py-2 font-bold">Location</th>
              </tr>
            </thead>
            <tbody>
              {pastEvents.map((event) => (
                <tr key={event.id} className="border-b border-slate-100">
                  <td className="py-2 font-semibold text-slate-900">{event.title}</td>
                  <td className="py-2 text-slate-700">{event.club}</td>
                  <td className="py-2 text-slate-700">{event.date}</td>
                  <td className="py-2 text-slate-700">{event.location}</td>
                </tr>
              ))}
              {pastEvents.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-slate-500">No past events yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
