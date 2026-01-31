import React from 'react';
import { Calendar, Clock, Award, MapPin } from 'lucide-react';

export default function VolunteerDashboard() {
  const stats = [
    { label: 'Hours Logged', value: '42', icon: Clock, color: 'text-blue-600' },
    { label: 'Events Joined', value: '12', icon: Calendar, color: 'text-orange-500' },
    { label: 'Impact Badges', value: '5', icon: Award, color: 'text-purple-600' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-8 pt-24">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10">
          <h1 className="text-3xl font-black">Welcome back, Sajjad! 👋</h1>
          <p className="text-slate-500 font-medium">You're 8 hours away from your next milestone badge.</p>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
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

        {/* Upcoming Section */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8">
          <h2 className="text-xl font-bold mb-6">Your Upcoming Shifts</h2>
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:border-orange-200 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="bg-white p-3 rounded-xl shadow-sm text-center min-w-[60px]">
                    <span className="block text-xs font-bold text-orange-500 uppercase">Feb</span>
                    <span className="text-xl font-black">{14 + i}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Central Park Cleanup</h3>
                    <p className="text-slate-500 text-sm flex items-center gap-1">
                      <MapPin size={14} /> New York, NY • 09:00 AM
                    </p>
                  </div>
                </div>
                <button className="mt-4 md:mt-0 px-6 py-2 bg-white border border-slate-200 rounded-full font-bold text-sm hover:bg-slate-900 hover:text-white transition-all">
                  View Details
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}