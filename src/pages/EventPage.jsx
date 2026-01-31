import React from 'react';
import { Users, Info, ArrowLeft, Share2, Calendar, MapPin } from 'lucide-react';
export default function EventPage() {
  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Event Header Image */}
      <div className="h-[400px] w-full relative">
        <img 
          src="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=2000" 
          className="w-full h-full object-cover"
          alt="Environmental Volunteering"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <button className="absolute top-10 left-10 bg-white/20 backdrop-blur-md p-3 rounded-full text-white hover:bg-white/40">
          <ArrowLeft size={24} />
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-6 -mt-20 relative z-10">
        <div className="bg-white rounded-[3rem] shadow-2xl p-10 grid lg:grid-cols-3 gap-12">
          
          {/* Main Info */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase">Environment</span>
              <span className="text-slate-400 text-sm">• 4.8 Rating</span>
            </div>
            <h1 className="text-5xl font-black mb-6">Coastline Reforestation Project</h1>
            <p className="text-lg text-slate-600 leading-relaxed mb-8">
              Join us for a day of planting native mangroves along the coastline. This project helps prevent erosion and restores natural habitats for local wildlife. No experience needed—we provide all the tools!
            </p>
            
            <div className="flex gap-10 border-t border-slate-100 pt-8">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Impact</p>
                <p className="font-bold">500 Trees Target</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Volunteers</p>
                <p className="font-bold">24 / 40 Joined</p>
              </div>
            </div>
          </div>

          {/* Sidebar Action Card */}
          <div className="bg-slate-50 p-8 rounded-[2rem] h-fit border border-slate-100">
            <h3 className="font-bold text-xl mb-4 text-center">Ready to help?</h3>
            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <Calendar className="text-orange-500 mt-1" size={20} />
                <p className="text-sm"><strong>Feb 28, 2026</strong><br/>08:30 AM - 12:30 PM</p>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="text-orange-500 mt-1" size={20} />
                <p className="text-sm"><strong>Sunset Cove</strong><br/>Pacific Highway, CA</p>
              </div>
            </div>
            <button className="w-full bg-orange-500 text-white py-4 rounded-2xl font-black shadow-lg shadow-orange-100 hover:bg-orange-600 transition-all mb-4">
              Join This Event
            </button>
            <button className="w-full flex items-center justify-center gap-2 font-bold text-slate-500 hover:text-slate-900 transition-colors">
              <Share2 size={18} /> Share Event
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}