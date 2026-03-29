import React, { useState } from 'react';
import StatusBadge from '../components/StatusBadge';

const sampleApplicants = [
  { id: 'a1', name: 'Sajjad Karim', event: 'CP Workshop: Graph Theory', status: 'Applied', role: 'Volunteer', attendance: false },
  { id: 'a2', name: 'Farhana Islam', event: 'Robotics 101: Arduino', status: 'Approved', role: 'Logistics', attendance: true },
  { id: 'a3', name: 'Mehedi Hasan', event: 'IEEE Seminar: AI in Power', status: 'Assigned', role: 'Registration', attendance: false },
];

const blankForm = {
  title: '',
  club: '',
  category: '',
  date: '',
  location: '',
  summary: '',
  details: '',
};

export default function CoordinatorDashboard({ events, setEvents, onOpenEvent }) {
  const [form, setForm] = useState(blankForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [applicants, setApplicants] = useState(sampleApplicants);

  function validate() {
    const nextErrors = {};
    if (form.title.trim().length < 5) nextErrors.title = 'Title must be at least 5 characters.';
    if (!form.club.trim()) nextErrors.club = 'Club is required.';
    if (!form.category.trim()) nextErrors.category = 'Category is required.';
    if (!form.date.trim()) nextErrors.date = 'Date is required.';
    if (!form.location.trim()) nextErrors.location = 'Location is required.';
    if (form.summary.trim().length < 12) nextErrors.summary = 'Summary should be more descriptive.';
    if (form.details.trim().length < 20) nextErrors.details = 'Details should be at least 20 characters.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function createEvent(e) {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    window.setTimeout(() => {
      const newEvent = {
        id: Date.now(),
        ...form,
      };
      setEvents((prev) => [newEvent, ...prev]);
      setForm(blankForm);
      setSaving(false);
      onOpenEvent(newEvent.id);
    }, 700);
  }

  function updateApplicant(applicantId, patch) {
    setApplicants((prev) => prev.map((applicant) => (applicant.id === applicantId ? { ...applicant, ...patch } : applicant)));
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6 rounded-2xl border border-amber-100 bg-white p-5">
        <h1 className="text-3xl font-black text-slate-900">Coordinator Dashboard</h1>
        <p className="mt-2 text-slate-600">Create events, review applicants, assign roles, and mark attendance.</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-amber-100 bg-white p-5">
          <h2 className="mb-4 text-xl font-black text-slate-900">Create Event</h2>
          <form onSubmit={createEvent} className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-bold text-slate-700">Title</label>
              <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
              {errors.title && <p className="mt-1 text-xs font-semibold text-red-600">{errors.title}</p>}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-bold text-slate-700">Club</label>
                <input value={form.club} onChange={(e) => setForm((p) => ({ ...p, club: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
                {errors.club && <p className="mt-1 text-xs font-semibold text-red-600">{errors.club}</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-bold text-slate-700">Category</label>
                <input value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
                {errors.category && <p className="mt-1 text-xs font-semibold text-red-600">{errors.category}</p>}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-bold text-slate-700">Date</label>
                <input value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
                {errors.date && <p className="mt-1 text-xs font-semibold text-red-600">{errors.date}</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-bold text-slate-700">Location</label>
                <input value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
                {errors.location && <p className="mt-1 text-xs font-semibold text-red-600">{errors.location}</p>}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-bold text-slate-700">Summary</label>
              <textarea value={form.summary} onChange={(e) => setForm((p) => ({ ...p, summary: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2" rows={2} />
              {errors.summary && <p className="mt-1 text-xs font-semibold text-red-600">{errors.summary}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-bold text-slate-700">Details</label>
              <textarea value={form.details} onChange={(e) => setForm((p) => ({ ...p, details: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2" rows={3} />
              {errors.details && <p className="mt-1 text-xs font-semibold text-red-600">{errors.details}</p>}
            </div>

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-orange-300"
            >
              {saving ? 'Saving...' : 'Create Event'}
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-amber-100 bg-white p-5">
          <h2 className="mb-4 text-xl font-black text-slate-900">Manage Applicants</h2>
          <div className="space-y-3">
            {applicants.map((applicant) => (
              <div key={applicant.id} className="rounded-xl border border-slate-200 p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-black text-slate-900">{applicant.name}</p>
                    <p className="text-sm text-slate-600">{applicant.event}</p>
                  </div>
                  <StatusBadge status={applicant.status} />
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <select
                    value={applicant.status}
                    onChange={(e) => updateApplicant(applicant.id, { status: e.target.value })}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option>Applied</option>
                    <option>Approved</option>
                    <option>Assigned</option>
                    <option>Completed</option>
                  </select>

                  <input
                    value={applicant.role}
                    onChange={(e) => updateApplicant(applicant.id, { role: e.target.value })}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="Assigned role"
                  />
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <p className="text-sm text-slate-600">Role: <span className="font-bold">{applicant.role}</span></p>
                  <button
                    onClick={() => updateApplicant(applicant.id, { attendance: !applicant.attendance })}
                    className={`rounded-lg px-3 py-1.5 text-sm font-bold ${applicant.attendance ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-900 text-white'}`}
                  >
                    {applicant.attendance ? 'Attendance Marked' : 'Mark Attendance'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="mt-6 rounded-2xl border border-amber-100 bg-white p-5">
        <h2 className="mb-3 text-xl font-black text-slate-900">Current Events Snapshot</h2>
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
              {events.slice(0, 6).map((event) => (
                <tr key={event.id} className="border-b border-slate-100">
                  <td className="py-2 font-semibold text-slate-900">{event.title}</td>
                  <td className="py-2 text-slate-700">{event.club}</td>
                  <td className="py-2 text-slate-700">{event.date}</td>
                  <td className="py-2 text-slate-700">{event.location}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
