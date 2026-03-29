import React from 'react';
import StatusBadge from '../components/StatusBadge';

const users = [
  { id: 1, name: 'Sajjad Karim', role: 'Volunteer', email: 'sajjad@cuet.ac.bd', status: 'Approved' },
  { id: 2, name: 'Nafisa Rahman', role: 'Coordinator', email: 'nafisa@cuet.ac.bd', status: 'Assigned' },
  { id: 3, name: 'Irfan Ahmed', role: 'Volunteer', email: 'irfan@cuet.ac.bd', status: 'Applied' },
  { id: 4, name: 'Admin User', role: 'Admin', email: 'admin@cuet.ac.bd', status: 'Completed' },
];

export default function AdminPanel({ events = [] }) {
  const reports = [
    { label: 'Total Users', value: users.length },
    { label: 'Total Events', value: events.length },
    { label: 'Active Volunteers', value: users.filter((u) => u.role === 'Volunteer').length },
    { label: 'Coordinators', value: users.filter((u) => u.role === 'Coordinator').length },
  ];

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6 rounded-2xl border border-amber-100 bg-white p-5">
        <h1 className="text-3xl font-black text-slate-900">Admin Panel</h1>
        <p className="mt-2 text-slate-600">Manage users and review high-level reports for CUET club volunteer operations.</p>
      </header>

      <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {reports.map((report) => (
          <article key={report.label} className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{report.label}</p>
            <p className="mt-2 text-3xl font-black text-slate-900">{report.value}</p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-amber-100 bg-white p-5">
        <h2 className="mb-3 text-xl font-black text-slate-900">User Management</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2 font-bold">Name</th>
                <th className="py-2 font-bold">Email</th>
                <th className="py-2 font-bold">Role</th>
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
                  <td className="py-2"><StatusBadge status={user.status} /></td>
                  <td className="py-2">
                    <button className="rounded-lg border border-slate-300 px-3 py-1.5 font-bold text-slate-700">Manage</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-amber-100 bg-white p-5">
        <h2 className="mb-3 text-xl font-black text-slate-900">Reports Overview</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-amber-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-amber-700">Event Completion</p>
            <p className="mt-2 text-sm text-slate-700">Most event records currently remain in active statuses; use this panel to monitor full completion trends.</p>
          </div>
          <div className="rounded-xl bg-slate-100 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-700">Participation Trend</p>
            <p className="mt-2 text-sm text-slate-700">Volunteer participation is healthy across CUET clubs with strong approval flow by coordinators.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
