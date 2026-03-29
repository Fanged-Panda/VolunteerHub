import React, { useEffect, useMemo, useState } from 'react';
import StatusBadge from '../components/StatusBadge';

export default function EventPage({ events = [], setEvents, selectedEventId, setSelectedEvent }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [selected, setSelected] = useState(events[0] || null);
  const [appliedIds, setAppliedIds] = useState([]);
  const [applyingId, setApplyingId] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('appliedEvents');
      const parsed = raw ? JSON.parse(raw) : [];
      setAppliedIds(parsed);
    } catch (e) {
      setAppliedIds([]);
    }
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      const found = events.find((event) => event.id === selectedEventId);
      if (found) setSelected(found);
      return;
    }
    if (!selected && events.length) setSelected(events[0]);
  }, [selectedEventId, events, selected]);

  const categories = useMemo(() => ['All', ...Array.from(new Set(events.map((event) => event.category || 'General')))], [events]);

  const filteredEvents = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events.filter((event) => {
      const queryMatch =
        q === '' ||
        event.title.toLowerCase().includes(q) ||
        (event.summary || '').toLowerCase().includes(q) ||
        (event.club || '').toLowerCase().includes(q);
      const categoryMatch = category === 'All' || (event.category || 'General') === category;
      return queryMatch && categoryMatch;
    });
  }, [events, query, category]);

  function applyToEvent(id) {
    setApplyingId(id);
    window.setTimeout(() => {
      const next = Array.from(new Set([...appliedIds, id]));
      setAppliedIds(next);
      localStorage.setItem('appliedEvents', JSON.stringify(next));
      setApplyingId(null);
    }, 700);
  }

  function upsertSelectedField(field, value) {
    if (!selected) return;
    const updated = { ...selected, [field]: value };
    setSelected(updated);
    setEvents((prev) => prev.map((event) => (event.id === updated.id ? updated : event)));
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-end gap-3">
        <div className="min-w-[220px] flex-1">
          <label className="mb-1 block text-sm font-bold text-slate-700">Search events</label>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, club, or summary"
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
          />
        </div>
        <div className="min-w-[180px]">
          <label className="mb-1 block text-sm font-bold text-slate-700">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
          >
            {categories.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-amber-100 bg-white p-4 lg:col-span-1">
          <h2 className="mb-3 text-lg font-black text-slate-900">Event List</h2>
          <div className="space-y-3">
            {filteredEvents.map((event) => {
              const active = selected?.id === event.id;
              const applied = appliedIds.includes(event.id);
              return (
                <button
                  key={event.id}
                  onClick={() => {
                    setSelected(event);
                    setSelectedEvent(event.id);
                  }}
                  className={`w-full rounded-xl border p-3 text-left transition ${active ? 'border-orange-400 bg-orange-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                >
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-amber-700">{event.club}</p>
                  <h3 className="mt-1 font-black text-slate-900">{event.title}</h3>
                  <p className="mt-1 text-xs text-slate-600">{event.date} • {event.location}</p>
                  <div className="mt-2">{applied ? <StatusBadge status="Applied" /> : <StatusBadge status="Approved" />}</div>
                </button>
              );
            })}
            {filteredEvents.length === 0 && (
              <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">No events match your filter.</p>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-amber-100 bg-white p-5 lg:col-span-2">
          {!selected ? (
            <p className="text-slate-600">Select an event to view details.</p>
          ) : (
            <>
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <StatusBadge status={appliedIds.includes(selected.id) ? 'Applied' : 'Approved'} />
                <p className="text-sm text-slate-600">{selected.date} • {selected.location}</p>
              </div>

              <h1 className="text-3xl font-black text-slate-900">{selected.title}</h1>
              <p className="mt-2 text-slate-600">{selected.summary}</p>
              <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm leading-relaxed text-slate-700">{selected.details}</p>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  onClick={() => applyToEvent(selected.id)}
                  disabled={appliedIds.includes(selected.id) || applyingId === selected.id}
                  className="rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-orange-300"
                >
                  {applyingId === selected.id ? 'Applying...' : appliedIds.includes(selected.id) ? 'Applied' : 'Apply'}
                </button>
                <button className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-700">Share</button>
              </div>

              <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="mb-3 text-base font-black text-slate-800">Quick Edit (Coordinator)</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Event title</label>
                    <input
                      value={selected.title}
                      onChange={(e) => upsertSelectedField('title', e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Location</label>
                    <input
                      value={selected.location}
                      onChange={(e) => upsertSelectedField('location', e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
