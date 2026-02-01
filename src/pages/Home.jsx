import React, { useState } from 'react';

export default function App({ events = [], setEvents, setCurrentPage, setSelectedEvent }) {
  const [authMode, setAuthMode] = useState(null); // 'login' | 'register' | null

  const upcoming = events.slice(0, 4);

  return (
    <div className="min-h-full bg-white text-slate-900 font-sans selection:bg-orange-100">
      {/* Navbar */}
      <nav className="h-16 flex items-center justify-between px-10 sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-500 rounded-lg shadow-lg shadow-orange-200" />
          <span className="text-xl font-bold tracking-tighter uppercase">VolunteerHub</span>
        </div>
        <div className="hidden md:flex gap-8 font-medium items-center">
          <a href="#" className="hover:text-orange-500 transition">Causes</a>
          <a href="#" className="hover:text-orange-500 transition">For Nonprofits</a>
          <button onClick={() => setAuthMode('register')} className="px-4 py-2 rounded-full font-semibold hover:text-orange-500 transition">Register</button>
          <button onClick={() => setAuthMode('login')} className="bg-orange-500 text-white px-4 py-2 rounded-full font-semibold hover:bg-orange-600 transition">Login</button>

        </div>
      </nav>

      {/* Hero Section */}
      <header className="h-[calc(100vh-4rem)] w-full max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 px-10 items-center overflow-visible">
            <div>
          <span className="text-orange-600 font-bold tracking-widest text-sm uppercase">The World is Waiting</span>
          <h1 className="text-7xl font-black leading-[1.1] mt-4 mb-8">
            Volunteering <br /><span className="text-orange-500">Simplified.</span>
          </h1>
          <p className="text-xl text-slate-500 leading-relaxed max-w-lg mb-10">
            Find local causes that match your skills. Join thousands making a real-world impact every single day.
          </p>
          <div className="flex gap-4">
            <button onClick={() => { setSelectedEvent?.(null); setCurrentPage?.('event'); }} className="bg-orange-500 text-white px-10 py-4 rounded-2xl text-lg font-bold shadow-xl shadow-orange-100 hover:scale-105 transition-all">Are you a Volunteer?</button>
            <button className="border-2 border-slate-200 px-10 py-4 rounded-2xl text-lg font-bold hover:bg-slate-50 transition-all">Learn More</button>
          </div>
        </div>
        <div className="relative h-full flex items-center justify-center">
          <img
            src="https://plus.unsplash.com/premium_photo-1678132566297-0c5255de1de1?q=80&w=2000&auto=format&fit=crop"
            className="max-h-[80%] w-auto rounded-[2rem] shadow-2xl drop-shadow-2xl border-8 border-white transform rotate-2 hover:rotate-0 transition-all duration-500 object-cover"
            alt="Volunteer in orange vest"
          />
        </div>
      </header>


{/* Upcoming events preview */}
<section className="max-w-6xl mx-auto px-10 pb-20 mt-12 md:mt-16 lg:mt-24">
  <h2 className="text-2xl font-bold mb-6">Upcoming Events</h2>
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {upcoming.map((e) => (
      <div key={e.id} className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col justify-between h-full">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[10px] text-orange-600 font-black uppercase tracking-widest mb-1">{e.club}</p>
              <p className="text-sm text-slate-400 uppercase font-bold">{e.date}</p>
              <h3 className="font-bold text-lg">{e.title}</h3>
            </div>
          </div>
          <p className="text-sm text-slate-500 mb-4">{e.summary || e.desc || `Join ${e.club} for ${e.title} at ${e.location}.`}</p>
        </div>

        <div className="flex gap-3 mt-auto">
          <button 
            onClick={() => { setSelectedEvent?.(e.id); setCurrentPage?.('event'); }} 
            className="px-4 py-2 bg-white border border-slate-200 rounded-full text-sm font-bold hover:bg-slate-900 hover:text-white transition"
          >
            Details
          </button>
          <button 
            onClick={() => { setSelectedEvent?.(e.id); setCurrentPage?.('event'); }} 
            className="px-4 py-2 bg-orange-500 text-white rounded-full text-sm font-bold hover:bg-orange-600 transition"
          >
            Join
          </button>
        </div>
      </div>
    ))}
  </div>
</section>

      {/* Trusted Clubs */}
      <section className="bg-slate-50 py-20 px-10 text-center">
        <h2 className="text-slate-400 font-semibold uppercase tracking-[0.2em] text-sm mb-10">Trusted by Clubs</h2>
        <div className="flex flex-wrap justify-center gap-16 grayscale opacity-50">
          <span className="text-3xl font-bold italic">Cuet Computer Club</span>
          <span className="text-3xl font-bold italic">ASRRO</span>
          <span className="text-3xl font-bold italic">IEEE</span>
          <span className="text-3xl font-bold italic">Joydhoni</span>
        </div>
      </section>

      {/* Auth modal (simple) */}
      {authMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">{authMode === 'login' ? 'Login' : 'Create account'}</h3>
              <button onClick={() => setAuthMode(null)} className="text-slate-400">✕</button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); setAuthMode(null); }} className="space-y-4">
              <input required placeholder="Email" type="email" className="w-full border border-slate-200 p-3 rounded-lg" />
              <input required placeholder="Password" type="password" className="w-full border border-slate-200 p-3 rounded-lg" />
              {authMode === 'register' && <input placeholder="Full name" className="w-full border border-slate-200 p-3 rounded-lg" />}
              <div className="flex justify-end">
                <button type="submit" className="px-6 py-2 bg-orange-500 text-white rounded-full font-bold">{authMode === 'login' ? 'Login' : 'Register'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}