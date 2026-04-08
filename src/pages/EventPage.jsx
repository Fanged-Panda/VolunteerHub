import React, { useMemo, useState } from 'react';
import StatusBadge from '../components/StatusBadge';

export default function EventPage({
  events = [],
  currentUser,
  applications = [],
  selectedEventId,
  setSelectedEvent,
  onRequireLogin,
  onApply,
  onCancelApplication,
}) {
  const [query, setQuery] = useState('');
  const [clubFilter, setClubFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');
  const [showPastEvents, setShowPastEvents] = useState(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');

  const clubs = useMemo(() => ['All', ...Array.from(new Set(events.map((event) => event.club || 'Unknown Club')))], [events]);

  const todayKey = useMemo(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const hasUpcomingEvents = useMemo(
    () => events.some((event) => event.date >= todayKey),
    [events, todayKey],
  );

  const filteredEvents = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events.filter((event) => {
      const dateActive = showPastEvents || !hasUpcomingEvents || event.date >= todayKey;
      const queryMatch =
        q === '' ||
        event.title.toLowerCase().includes(q) ||
        (event.summary || '').toLowerCase().includes(q) ||
        (event.details || '').toLowerCase().includes(q) ||
        (event.club || '').toLowerCase().includes(q);
      const clubMatch = clubFilter === 'All' || (event.club || 'Unknown Club') === clubFilter;
      const dateMatch = !dateFilter || event.date === dateFilter;
      return dateActive && queryMatch && clubMatch && dateMatch;
    });
  }, [events, query, clubFilter, dateFilter, showPastEvents, hasUpcomingEvents, todayKey]);

  const eventStats = useMemo(() => {
    const openSlots = filteredEvents.reduce(
      (sum, event) => sum + Math.max((event.neededVolunteers || 1) - (event.registeredVolunteers || 0), 0),
      0,
    );

    return {
      visible: filteredEvents.length,
      clubs: new Set(filteredEvents.map((event) => event.club || 'Unknown Club')).size,
      openSlots,
    };
  }, [filteredEvents]);

  // Compute the selected event from the current filters and selectedEventId.
  // If there are no filtered events, `selected` will be null so the details
  // panel hides instead of showing an out-of-filter event.
  const selected = useMemo(() => {
    if (selectedEventId) {
      const found = events.find((event) => event.id === selectedEventId);
      if (found) return found;
    }
    return filteredEvents.length ? filteredEvents[0] : null;
  }, [selectedEventId, events, filteredEvents]);

  function getApplicationForEvent(eventId) {
    if (!currentUser || currentUser.role !== 'volunteer') return null;
    return applications.find((application) => application.eventId === eventId) || null;
  }

  function getApplyButtonLabel(application) {
    if (!currentUser) return 'Login to Apply';
    if (currentUser.role !== 'volunteer') return 'Volunteers Only';
    if (!application) return 'Apply';
    if (application.status === 'Approved') return 'Approved';
    if (application.status === 'Rejected') return 'Reapply';
    return 'Applied';
  }

  function getShareLinks(event) {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`${event.title} at ${event.location} on ${event.date}`);
    return {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      whatsapp: `https://wa.me/?text=${text}%20${url}`,
      messenger: `https://www.messenger.com/new?link=${url}`,
    };
  }

  async function applyToEvent(eventId) {
    if (!currentUser) {
      onRequireLogin(eventId);
      return;
    }
    if (currentUser.role !== 'volunteer') return;

    setError('');
    setWorking(true);
    const result = await onApply(eventId);
    setWorking(false);
    if (!result?.ok) setError(result?.error || 'Could not apply.');
  }

  async function cancelApplication(eventId) {
    setError('');
    setWorking(true);
    const result = await onCancelApplication(eventId);
    setWorking(false);
    if (!result?.ok) setError(result?.error || 'Could not cancel application.');
  }

  const [openShareFor, setOpenShareFor] = useState(null);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-end gap-3">
        <div className="min-w-[220px] flex-1">
          <label className="mb-1 block text-sm font-bold text-slate-700">Search events</label>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, club, or details"
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
          />
        </div>
        <div className="min-w-[180px]">
          <label className="mb-1 block text-sm font-bold text-slate-700">Club</label>
          <select
            value={clubFilter}
            onChange={(e) => setClubFilter(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
          >
            {clubs.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </div>
        <div className="min-w-[180px]">
          <label className="mb-1 block text-sm font-bold text-slate-700">Date</label>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
          />
        </div>
        <button
          type="button"
          onClick={() => setShowPastEvents((prev) => !prev)}
          className={`rounded-xl px-4 py-2 text-sm font-bold ${showPastEvents ? 'bg-slate-900 text-white' : 'border border-slate-300 bg-white text-slate-700'}`}
        >
          {showPastEvents ? 'Showing All Dates' : hasUpcomingEvents ? 'Upcoming Only' : 'No Upcoming (Showing All)'}
        </button>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <article className="rounded-xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Visible Events</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{eventStats.visible}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Clubs in View</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{eventStats.clubs}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Open Slots</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{eventStats.openSlots}</p>
        </article>
      </div>

      {error && <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700">{error}</p>}

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-amber-100 bg-white p-4 lg:col-span-1">
          <h2 className="mb-3 text-lg font-black text-slate-900">Event List</h2>
          <div className="space-y-3">
            {filteredEvents.map((event) => {
              const active = selected?.id === event.id;
              const userApplication = getApplicationForEvent(event.id);
              return (
                <button
                  key={event.id}
                  onClick={() => setSelectedEvent(event.id)}
                  className={`w-full rounded-xl border p-3 text-left transition ${active ? 'border-orange-400 bg-orange-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                >
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-amber-700">{event.club}</p>
                  <h3 className="mt-1 font-black text-slate-900">{event.title}</h3>
                  <p className="mt-1 text-xs text-slate-600">{event.date} • {event.location}</p>
                  <p className="mt-1 text-xs text-slate-600">{event.registeredVolunteers || 0}/{event.neededVolunteers || 1} volunteers</p>
                  {currentUser && userApplication && (
                    <div className="mt-2"><StatusBadge status={userApplication.status} /></div>
                  )}
                </button>
              );
            })}
            {filteredEvents.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                <p>No events match your current filters.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('');
                      setClubFilter('All');
                      setDateFilter('');
                      setShowPastEvents(true);
                    }}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700"
                  >
                    Reset Filters
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        <section
          className="relative min-h-[26rem] overflow-hidden rounded-2xl border border-amber-100 p-5 lg:col-span-2"
          style={
            (selected?.imageUrl || selected?.image_url)
              ? {
                  backgroundImage: `linear-gradient(rgba(255,255,255,0.88), rgba(255,255,255,0.92)), url(${selected.imageUrl || selected.image_url})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                }
              : { backgroundColor: '#ffffff' }
          }
        >
          {!selected ? (
            <div className="space-y-3">
              <h2 className="text-2xl font-black text-slate-900">No Event Selected</h2>
              <p className="text-slate-600">Choose an event from the left list to view full details, volunteer slots, and apply status.</p>
              <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
                Tip: if the list is empty, use "Reset Filters" and enable all dates to include past events.
              </div>
            </div>
          ) : (
            <>
              {(() => {
                const selectedApplication = getApplicationForEvent(selected.id);
                return (
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                    {currentUser && selectedApplication && <StatusBadge status={selectedApplication.status} />}
                      <p className="text-sm text-slate-600">{selected.date} • {selected.location}</p>
                    </div>
                    <p className="rounded-full bg-slate-900 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-white">
                      {selected.registeredVolunteers || 0}/{selected.neededVolunteers || 1} Volunteers
                    </p>
                  </div>
                );
              })()}

              <h1 className="text-3xl font-black text-slate-900">{selected.title}</h1>
              {selected.summary && <p className="mt-2 text-slate-600">{selected.summary}</p>}
              {selected.createdByEmail && (
                <p className="mt-2 text-sm text-slate-600">Contact creator: <span className="font-semibold">{selected.createdByEmail}</span></p>
              )}
              <div className="mt-4 rounded-xl bg-white/80 p-4 text-sm leading-relaxed text-slate-800 backdrop-blur-[1px]">
                {selected.details || 'No additional details provided.'}
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                {(() => {
                  const selectedApplication = getApplicationForEvent(selected.id);
                  const canCancel = selectedApplication?.status === 'Applied';
                  const shouldHideShare = Boolean(selectedApplication);
                  const isFull = (selected.registeredVolunteers || 0) >= (selected.neededVolunteers || 1);
                  const shouldDisableApply =
                    working ||
                    isFull ||
                    (currentUser?.role === 'volunteer' && selectedApplication && selectedApplication.status !== 'Rejected') ||
                    (currentUser && currentUser.role !== 'volunteer');
                  return (
                    <>
                      <button
                        onClick={() => applyToEvent(selected.id)}
                        disabled={shouldDisableApply}
                        className="rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-orange-300"
                      >
                        {working ? 'Please wait...' : getApplyButtonLabel(selectedApplication)}
                      </button>

                      {canCancel && (
                        <button
                          onClick={() => cancelApplication(selected.id)}
                          disabled={working}
                          className="rounded-lg border border-rose-300 bg-rose-50 px-5 py-2.5 text-sm font-bold text-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Cancel Application
                        </button>
                      )}

                      {!shouldHideShare && (
                        <button
                          onClick={() => setOpenShareFor(openShareFor === selected.id ? null : selected.id)}
                          className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-700"
                        >
                          Share
                        </button>
                      )}
                    </>
                  );
                })()}
              </div>

              {openShareFor === selected.id && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {(() => {
                    const links = getShareLinks(selected);
                    return (
                      <>
                        <a className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white" href={links.facebook} target="_blank" rel="noreferrer">Facebook</a>
                        <a className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-bold text-white" href={links.whatsapp} target="_blank" rel="noreferrer">WhatsApp</a>
                        <a className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-bold text-white" href={links.messenger} target="_blank" rel="noreferrer">Messenger</a>
                      </>
                    );
                  })()}
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
