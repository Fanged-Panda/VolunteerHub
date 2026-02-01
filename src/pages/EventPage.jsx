import React, { useEffect, useState } from 'react';
import { Users, Info, ArrowLeft, Share2, Calendar, MapPin } from 'lucide-react';

const SAMPLE_EVENTS = [
  { id: 1, title: 'CP Workshop: Graph Theory', category: 'Workshop', date: 'Feb 10, 2026', location: 'Central Lab', summary: 'Master complex algorithms with top competitive programmers.', details: 'Bring a laptop. Hands-on sessions with problem sets.' },
  { id: 2, title: 'Robotics 101: Arduino', category: 'Workshop', date: 'Feb 15, 2026', location: 'WRE Workshop', summary: 'Basics of hardware integration and sensor control.', details: 'Tools and boards provided; limited seats.' },
  { id: 3, title: 'Basanta Utsav Rehearsal', category: 'Cultural', date: 'Feb 20, 2026', location: 'Gol Chattar', summary: 'Cultural rehearsal and preparation for spring festival.', details: 'Open to performers and helpers; costume briefing included.' },
  { id: 4, title: 'IEEE Seminar: AI in Power', category: 'Seminar', date: 'Feb 25, 2026', location: 'ECE Seminar Hall', summary: 'Exploring AI applications in modern power grids.', details: 'Includes guest speakers from industry and research.' },
];

export default function EventPage({ events = SAMPLE_EVENTS, setEvents = () => {}, selectedEventId, setSelectedEvent, setCurrentPage }) {
  const [query, setQuery] = useState('');
  const [club, setClub] = useState('All');
  const [filtered, setFiltered] = useState(events);
  const [selected, setSelected] = useState(events[0] || null);
  const [appliedIds, setAppliedIds] = useState(new Set());
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ title: '', date: '', location: '', club: '', details: '' });

  useEffect(() => {
    const raw = localStorage.getItem('appliedEvents');
    try {
      const parsed = raw ? JSON.parse(raw) : [];
      setAppliedIds(new Set(parsed));
    } catch (e) {
      setAppliedIds(new Set());
    }
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      const found = events.find((ev) => ev.id === selectedEventId);
      if (found) setSelected(found);
    }
    else if (events.length > 0 && !selected) setSelected(events[0]);
  }, [selectedEventId, events]);

  useEffect(() => {
    const q = query.toLowerCase().trim();
    setFiltered(events.filter((ev) => {
      const matchQ = q === '' || ev.title.toLowerCase().includes(q) || (ev.summary || '').toLowerCase().includes(q);
      const matchClub = club === 'All' || (ev.club || 'Unspecified') === club;
      return matchQ && matchClub;
    }));
  }, [query, club, events]);

  // prevent background scroll when add form modal is open
  useEffect(() => {
    if (showAddForm) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showAddForm]);

  function toggleApply(id) {
    const setCopy = new Set(appliedIds);
    if (setCopy.has(id)) setCopy.delete(id);
    else setCopy.add(id);
    setAppliedIds(setCopy);
    localStorage.setItem('appliedEvents', JSON.stringify(Array.from(setCopy)));
  }

  function startEdit(ev) {
    // If already editing the same event, toggle off
    if (isEditing && editForm && editForm.id === ev.id) {
      setIsEditing(false);
      setEditForm(null);
      return;
    }
    setShowAddForm(false);
    setEditForm({ ...ev });
    setIsEditing(true);
  }

  function saveEdit() {
    setEvents((prev) => prev.map((p) => (p.id === editForm.id ? { ...editForm } : p)));
    setIsEditing(false);
    setSelected(editForm);
    setEditForm(null);
  }

  function cancelEdit() {
    setIsEditing(false);
    setEditForm(null);
  }

  const clubs = ['All', ...Array.from(new Set(events.map((e) => e.club || 'Unspecified')))];

  return (
    <div className="min-h-full bg-white pb-20">
      {/* Event Header Image */}
      <div className="h-[300px] w-full relative">
        <img
          src="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=2000"
          className="w-full h-full object-cover"
          alt="Environmental Volunteering"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <button onClick={() => { setCurrentPage?.('home'); setSelectedEvent?.(null); }} className="absolute top-6 left-6 bg-white/20 backdrop-blur-md p-3 rounded-full text-white hover:bg-white/40">
          <ArrowLeft size={20} />
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-20 relative z-10">
        <div className="bg-white rounded-[1.5rem] shadow-2xl p-6 grid lg:grid-cols-3 gap-6">
          {/* List / Filters */}
          <div className="lg:col-span-1 p-4 border-r hidden lg:block">
            <div className="mb-4">
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search events" className="w-full border border-slate-200 p-2 rounded-lg" />
            </div>
            <div className="mb-4">
              <label className="text-sm font-bold text-slate-500">Club</label>
              <select value={club} onChange={(e) => setClub(e.target.value)} className="w-full mt-2 border border-slate-200 p-2 rounded-lg">
                {clubs.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="mb-4">
              <button onClick={() => { setShowAddForm(true); setAddForm({ title: '', date: '', location: '', club: '', category: '', summary: '', details: '' }); }} className="w-full px-3 py-2 bg-orange-500 text-white rounded-lg font-bold">Add Event</button>
            </div>
            <div className="space-y-3 overflow-auto max-h-[420px]">
              {filtered.map((ev) => (
                <button key={ev.id} onClick={() => { setSelected(ev); setSelectedEvent?.(ev.id); }} className="w-full text-left p-3 rounded-lg hover:bg-slate-50 transition flex items-start gap-3">
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold">{ev.title}</h4>
                      <span className="text-sm text-slate-400">{ev.date}</span>
                    </div>
                    <p className="text-sm text-slate-500">{ev.summary}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Details */}
          <div className="lg:col-span-2 p-6">
            {selected && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase">{selected.club || selected.category}</span>
                  <span className="text-slate-400 text-sm">• {selected.date} • {selected.location}</span>
                  {/* <button onClick={() => { setShowAddForm(true); setAddForm({ title: '', date: '', location: '', club: '', category: '', summary: '', details: '' }); setIsEditing(false); }} className="ml-auto px-3 py-1 bg-orange-500 text-white rounded-full text-sm">Add Event</button> */}
                </div>
                <h1 className="text-3xl font-black mb-4">{selected.title}</h1>
                <p className="text-slate-600 mb-6">{selected.details}</p>

                <div className="flex gap-3 mb-4">
                  <button onClick={() => startEdit(selected)} className="px-3 py-2 bg-white border rounded">Edit Event</button>
                  {/* <button onClick={() => { setCurrentPage?.('home'); setSelectedEvent?.(null); }} className="px-3 py-2 bg-white border rounded">Back to Home</button> */}
                </div>

                <div className="flex gap-4 items-center">
                  <button onClick={() => toggleApply(selected.id)} className={`px-6 py-3 rounded-2xl font-bold ${appliedIds.has(selected.id) ? 'bg-slate-900 text-white' : 'bg-orange-500 text-white'}`}>
                    {appliedIds.has(selected.id) ? 'Withdraw Application' : 'Apply to This Event'}
                  </button>
                  <button className="px-4 py-2 border border-slate-200 rounded-full flex items-center gap-2">
                    <Share2 size={16} /> Share
                  </button>
                </div>

                {isEditing && editForm && (
                  <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-100">
                    <h3 className="font-bold mb-3">Edit Event</h3>
                    <div className="grid grid-cols-1 gap-3">
                      <label className="text-sm font-medium">Title</label>
                      <input placeholder="Title" className="p-2 border" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />

                      <label className="text-sm font-medium">Date</label>
                      <input placeholder="Date" className="p-2 border" value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} />

                      <label className="text-sm font-medium">Location</label>
                      <input placeholder="Location" className="p-2 border" value={editForm.location} onChange={(e) => setEditForm({ ...editForm, location: e.target.value })} />

                      <label className="text-sm font-medium">Club</label>
                      <input placeholder="Club" className="p-2 border" value={editForm.club || ''} onChange={(e) => setEditForm({ ...editForm, club: e.target.value })} />



                      <label className="text-sm font-medium">Details</label>
                      <textarea placeholder="Details" className="p-2 border" value={editForm.details} onChange={(e) => setEditForm({ ...editForm, details: e.target.value })} />

                      <div className="flex gap-2">
                        <button onClick={saveEdit} className="px-3 py-2 bg-orange-500 text-white rounded">Save</button>
                        <button onClick={cancelEdit} className="px-3 py-2 bg-white border rounded">Cancel</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* (removed inline add form; modal version renders at root when active) */}

                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase">Volunteers</p>
                    <p className="font-bold">24 / 40 Joined</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase">Impact</p>
                    <p className="font-bold">500 Trees Target</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        </div>

        {/* Add Event Modal (overlays entire page) */}
        {showAddForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-lg mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Add New Event</h3>
                <button onClick={() => setShowAddForm(false)} className="text-slate-400">✕</button>
              </div>
              <div className="grid grid-cols-1 gap-3">
                <label className="text-sm font-medium">Title</label>
                <input placeholder="Title" className="p-2 border" value={addForm.title} onChange={(e) => setAddForm({ ...addForm, title: e.target.value })} />

                <label className="text-sm font-medium">Date</label>
                <input placeholder="Date" className="p-2 border" value={addForm.date} onChange={(e) => setAddForm({ ...addForm, date: e.target.value })} />

                <label className="text-sm font-medium">Location</label>
                <input placeholder="Location" className="p-2 border" value={addForm.location} onChange={(e) => setAddForm({ ...addForm, location: e.target.value })} />

                <label className="text-sm font-medium">Club</label>
                <input placeholder="Club" className="p-2 border" value={addForm.club} onChange={(e) => setAddForm({ ...addForm, club: e.target.value })} />

                <label className="text-sm font-medium">Details</label>
                <textarea placeholder="Details" className="p-2 border" value={addForm.details} onChange={(e) => setAddForm({ ...addForm, details: e.target.value })} />

                <div className="flex justify-end gap-2 mt-2">
                  <button onClick={() => setShowAddForm(false)} className="px-3 py-2 bg-white border rounded">Cancel</button>
                  <button onClick={() => {
                    const newId = Date.now();
                    const newEvent = {
                      id: newId,
                      title: addForm.title || 'Untitled',
                      date: addForm.date || '',
                      location: addForm.location || '',
                      club: addForm.club || 'Unspecified',
                      category: 'Other',
                      summary: '',
                      details: addForm.details || ''
                    };
                    setEvents((prev) => [newEvent, ...prev]);
                    setSelected(newEvent);
                    setSelectedEvent?.(newEvent.id);
                    setShowAddForm(false);
                    setAddForm({ title: '', date: '', location: '', club: '', details: '' });
                  }} className="px-4 py-2 bg-orange-500 text-white rounded">Save</button>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}