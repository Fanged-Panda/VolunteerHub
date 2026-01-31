import React, { useEffect, useState } from 'react';
import { Calendar, Clock, Award, MapPin, ArrowLeft } from 'lucide-react';

const SAMPLE_EVENTS = [
  { id: 'e1', title: 'Coastline Reforestation', date: 'Feb 28', location: 'Sunset Cove' },
  { id: 'e2', title: 'Community Garden Build', date: 'Mar 5', location: 'Downtown' },
  { id: 'e3', title: 'Beach Cleanup', date: 'Feb 21', location: 'North Beach' },
];

export default function VolunteerDashboard({ setCurrentPage, setSelectedEvent }) {
  const [appliedIds, setAppliedIds] = useState([]);
  const [tasks, setTasks] = useState([
    { id: 't1', title: 'Collect gloves', eventId: 'e1', completed: false },
    { id: 't2', title: 'Sign waivers', eventId: 'e2', completed: true },
  ]);
  const [notifications, setNotifications] = useState([
    { id: 'n1', text: 'Your application for Coastline Reforestation was confirmed.' },
    { id: 'n2', text: 'New task assigned: Bring rakes.' },
  ]);
  const [hours, setHours] = useState(42);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('appliedEvents');
      const parsed = raw ? JSON.parse(raw) : [];
      setAppliedIds(parsed);
    } catch (e) {
      setAppliedIds([]);
    }
  }, []);

  function toggleTask(id) {
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, completed: !t.completed } : t));
  }

  const appliedEvents = SAMPLE_EVENTS.filter((ev) => appliedIds.includes(ev.id));

  const stats = [
    { label: 'Hours Logged', value: String(hours), icon: Clock, color: 'text-blue-600' },
    { label: 'Events Applied', value: String(appliedEvents.length), icon: Calendar, color: 'text-orange-500' },
    { label: 'Impact Badges', value: '5', icon: Award, color: 'text-purple-600' },
  ];

  return (
    <div className="min-h-full bg-slate-50 p-8 pt-24">
      <div className="max-w-6xl mx-auto">
        <header className="mb-6 flex items-start justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setCurrentPage?.('home')} className="bg-white/20 backdrop-blur-md p-2 rounded-full text-slate-700 hover:bg-white/40">
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-3xl font-black">Welcome back, Sajjad! 👋</h1>
              <p className="text-slate-500 font-medium">You're {Math.max(0, 10 - hours % 10)} hours away from your next milestone badge.</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500">Notifications</p>
            <p className="font-bold">{notifications.length}</p>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
              <div className={`p-4 rounded-2xl bg-slate-50 ${stat.color}`}>
                <stat.icon size={28} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                <p className="text-3xl font-black">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Applied Events */}
          <div className="md:col-span-2 bg-white rounded-[1.5rem] p-6 border border-slate-100">
            <h2 className="font-bold text-xl mb-4">Applied Events</h2>
            {appliedEvents.length === 0 ? (
              <p className="text-slate-500">You haven't applied to any events yet. Browse events to apply.</p>
            ) : (
              <div className="space-y-4">
                {appliedEvents.map((ev) => (
                  <div key={ev.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div>
                      <h3 className="font-bold">{ev.title}</h3>
                      <p className="text-sm text-slate-500">{ev.date} • {ev.location}</p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-2">
                      <p className="text-sm text-slate-400">Status</p>
                      <div className="flex gap-2">
                        <button onClick={() => { setSelectedEvent?.(ev.id); setCurrentPage?.('event'); }} className="px-3 py-1 bg-white border rounded-full text-sm font-bold">View</button>
                        <p className="font-bold">Applied</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Assigned Tasks */}
            <div className="mt-8">
              <h3 className="font-bold mb-3">Assigned Tasks</h3>
              <div className="space-y-3">
                {tasks.map((t) => (
                  <div key={t.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div>
                      <p className={`font-medium ${t.completed ? 'line-through text-slate-400' : ''}`}>{t.title}</p>
                      <p className="text-xs text-slate-400">For: {SAMPLE_EVENTS.find(ev => ev.id === t.eventId)?.title || '—'}</p>
                    </div>
                    <div>
                      <button onClick={() => toggleTask(t.id)} className={`px-3 py-1 rounded-full font-bold ${t.completed ? 'bg-green-100 text-green-700' : 'bg-white border'}`}>
                        {t.completed ? 'Completed' : 'Mark Done'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Notifications + Hours Summary */}
          <aside className="bg-white rounded-[1.5rem] p-6 border border-slate-100">
            <div className="mb-6">
              <h3 className="font-bold">Notifications</h3>
              <ul className="mt-3 space-y-2">
                {notifications.map((n) => (
                  <li key={n.id} className="text-sm text-slate-600">{n.text}</li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-bold">Volunteer Hours</h3>
              <p className="text-3xl font-black mt-2">{hours}</p>
              <p className="text-sm text-slate-500 mt-1">Last logged: 5 days ago</p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}