import React from 'react';

export default function App() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-orange-100">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-10 py-6 sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-500 rounded-lg shadow-lg shadow-orange-200" />
          <span className="text-xl font-bold tracking-tighter uppercase">Impact</span>
        </div>
        <div className="hidden md:flex gap-8 font-medium">
          <a href="#" className="hover:text-orange-500 transition">Causes</a>
          <a href="#" className="hover:text-orange-500 transition">For Nonprofits</a>
          <button className="bg-slate-900 text-white px-6 py-2 rounded-full font-semibold hover:bg-orange-600 transition">Get Started</button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 px-10 pt-20 pb-32 items-center">
        <div>
          <span className="text-orange-600 font-bold tracking-widest text-sm uppercase">The World is Waiting</span>
          <h1 className="text-7xl font-black leading-[1.1] mt-4 mb-8">
            Volunteering <br /><span className="text-orange-500">Simplified.</span>
          </h1>
          <p className="text-xl text-slate-500 leading-relaxed max-w-lg mb-10">
            Find local causes that match your skills. Join thousands making a real-world impact every single day.
          </p>
          <div className="flex gap-4">
            <button className="bg-orange-500 text-white px-10 py-4 rounded-2xl text-lg font-bold shadow-xl shadow-orange-100 hover:scale-105 transition-all">Find Opportunities</button>
            <button className="border-2 border-slate-200 px-10 py-4 rounded-2xl text-lg font-bold hover:bg-slate-50 transition-all">Learn More</button>
          </div>
        </div>
        <div className="relative">
          <img 
  src="https://plus.unsplash.com/premium_photo-1678132566297-0c5255de1de1?q=80&w=2000&auto=format&fit=crop" 
  className="rounded-[3rem] shadow-2xl border-8 border-white transform rotate-2 hover:rotate-0 transition-all duration-500"
  alt="Volunteer in orange vest"
/>
        </div>
      </header>

      {/* Social Proof */}
      <section className="bg-slate-50 py-20 px-10 text-center">
        <h2 className="text-slate-400 font-semibold uppercase tracking-[0.2em] text-sm mb-10">Trusted by Local Leaders</h2>
        <div className="flex flex-wrap justify-center gap-16 grayscale opacity-50">
          <span className="text-3xl font-bold italic">Unicef</span>
          <span className="text-3xl font-bold italic">Red Cross</span>
          <span className="text-3xl font-bold italic">Habitat</span>
          <span className="text-3xl font-bold italic">GreenPeace</span>
        </div>
      </section>
    </div>
  );
}