import React, { useEffect, useMemo, useState } from 'react';
import cuetEgg from '../assets/cuet with egg.jpeg';
import asif from '../assets/asif.jpg';
import tsc from '../assets/tsc.jpg';
import asrro from '../assets/z.jpg';
import workshop from '../assets/workshop.jpg';
import pulak from '../assets/pulak.jpg';

const WORKFLOW_STEPS = [
  {
    title: 'Discover Events',
    text: 'Browse live CUET club activities and compare roles, dates, and required volunteer counts before applying.',
    accent: 'bg-orange-100 text-orange-700',
  },
  {
    title: 'Apply Instantly',
    text: 'Apply in one tap and track your status in real-time from the volunteer dashboard.',
    accent: 'bg-emerald-100 text-emerald-700',
  },
  {
    title: 'Get Assigned Tasks',
    text: 'Coordinators assign work and attendance directly, keeping all updates in one consistent flow.',
    accent: 'bg-sky-100 text-sky-700',
  },
  {
    title: 'Complete and Grow',
    text: 'Mark tasks done, accumulate hours, and build your impact record across CUET clubs.',
    accent: 'bg-violet-100 text-violet-700',
  },
];

const VOLUNTEER_TRACKS = [
  {
    name: 'Technical Events',
    subtitle: 'Workshops, hackathons, coding contests, robotics sessions',
    badge: 'Hands-on',
    palette: 'from-slate-900 via-slate-800 to-slate-700',
  },
  {
    name: 'Community Outreach',
    subtitle: 'Awareness campaigns, social drives, campus support initiatives',
    badge: 'Field Work',
    palette: 'from-orange-600 via-amber-600 to-yellow-500',
  },
  {
    name: 'Operations & Logistics',
    subtitle: 'Check-ins, attendee guidance, venue setup, coordination support',
    badge: 'Leadership',
    palette: 'from-emerald-700 via-teal-700 to-cyan-700',
  },
];

const IMPACT_QUOTES = [
  {
    text: 'The dashboard made it easy to know exactly what I had to do before every club event.',
    person: 'Volunteer - CSE 21',
  },
  {
    text: 'Applicant management is now much cleaner. We approve, assign, and track everything in one place.',
    person: 'Coordinator - CUET Computer Club',
  },
  {
    text: 'A centralized workflow keeps event participation consistent across all clubs.',
    person: 'Campus Admin Team',
  },
];

export default function Home({ events = [], topContributors = [], setSelectedEvent, openEvents, openGallery }) {
  const [activeSlide, setActiveSlide] = useState(0);

  const slides = useMemo(
    () => [
      { src: cuetEgg, alt: 'CUET iconic building', label: 'CUET with Egg' },
      { src: asif, alt: 'asif', label: 'computer club reception' },
      { src: tsc, alt: 'TSC cafeteria', label: 'TSC Cafeteria' },
      { src: asrro, alt: 'ASRRO', label: 'ASRRO' },
      { src: workshop, alt: 'ASRRO', label: 'Workshop' },
      { src: pulak, alt: 'pulak', label: 'pulak' },
    ],
    [],
  );

  const todayKey = useMemo(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const upcomingEvents = useMemo(() => events.filter((event) => event.date >= todayKey), [events, todayKey]);
  const hasUpcomingEvents = upcomingEvents.length > 0;

  const activeEvents = useMemo(() => {
    if (hasUpcomingEvents) return upcomingEvents.slice(0, 8);
    return [...events]
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .slice(0, 8);
  }, [events, hasUpcomingEvents, upcomingEvents]);

  const marqueeEvents = useMemo(() => (activeEvents.length ? [...activeEvents, ...activeEvents] : []), [activeEvents]);
  const timelineEvents = useMemo(() => activeEvents.slice(0, 5), [activeEvents]);
  const contributorCards = useMemo(
    () => [...topContributors]
      .map((person) => ({
        ...person,
        score: Number(person.score || 0),
        approvedApplications: Number(person.approvedApplications || 0),
        attendanceCount: Number(person.attendanceCount || 0),
        completedTasks: Number(person.completedTasks || 0),
        eventsParticipated: Number(person.eventsParticipated || 0),
      }))
      .sort((a, b) => {
        if (b.approvedApplications !== a.approvedApplications) return b.approvedApplications - a.approvedApplications;
        if (b.eventsParticipated !== a.eventsParticipated) return b.eventsParticipated - a.eventsParticipated;
        return b.attendanceCount - a.attendanceCount;
      })
      .slice(0, 2)
      .map((person, index) => ({ ...person, rank: index + 1 })),
    [topContributors],
  );

  const quickStats = useMemo(() => {
    const activeClubs = new Set(activeEvents.map((event) => String(event.club || '').trim()).filter(Boolean)).size;
    const registered = activeEvents.reduce((sum, event) => sum + Number(event.registeredVolunteers || 0), 0);
    const slots = activeEvents.reduce(
      (sum, event) => sum + Number(event.neededVolunteers || event.needed_volunteers || 0),
      0,
    );

    return [
      {
        label: hasUpcomingEvents ? 'Upcoming Events' : 'Recent Events',
        value: activeEvents.length,
        hint: hasUpcomingEvents ? 'Live now' : 'Latest listed',
      },
      { label: 'Active Clubs', value: activeClubs, hint: 'Campus-wide' },
      { label: 'Registered Volunteers', value: registered, hint: 'Current records' },
      { label: 'Open Slots', value: Math.max(slots - registered, 0), hint: 'Still available' },
    ];
  }, [activeEvents, hasUpcomingEvents]);

  const clubMomentum = useMemo(() => {
    const counts = {};
    activeEvents.forEach((event) => {
      const club = String(event.club || 'Unknown Club');
      counts[club] = (counts[club] || 0) + 1;
    });

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([club, count], index) => ({
        club,
        count,
        tone:
          index % 3 === 0
            ? 'bg-orange-100 text-orange-700'
            : index % 3 === 1
              ? 'bg-sky-100 text-sky-700'
              : 'bg-emerald-100 text-emerald-700',
      }));
  }, [activeEvents]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 3500);

    return () => window.clearInterval(timer);
  }, [slides.length]);

  function goPrev() {
    setActiveSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }

  function goNext() {
    setActiveSlide((prev) => (prev + 1) % slides.length);
  }

  function openEventDetails(eventId) {
    setSelectedEvent(eventId);
    openEvents(eventId);
  }

  return (
    <main className="relative overflow-hidden">
      <section className="relative overflow-hidden">
        <div className="vh-grid-pattern absolute inset-0 opacity-40" />
        <div className="vh-float-slow absolute -left-24 top-12 h-56 w-56 rounded-full bg-orange-300/30 blur-3xl" />
        <div className="vh-float-slow vh-float-delay absolute -right-16 top-32 h-64 w-64 rounded-full bg-amber-300/30 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-12 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8 lg:py-16">
          <div>
            <p className="mb-4 inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-amber-800">
              Official CUET Club Events
            </p>
            <h1 className="text-4xl font-black leading-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Volunteering 
              <span className="block text-orange-500" style={{ fontFamily: '"Kaushan Script", cursive' }}>Simplified</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
              Discover CUET-only opportunities, apply faster, coordinate better, and track every contribution from one unified platform.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={() => openEvents()}
                className="rounded-xl bg-orange-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-orange-200 transition hover:bg-orange-600"
              >
                Explore Events
              </button>
              <a
                href="#campus-timeline"
                className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                View Campus Timeline
              </a>
            </div>
          </div>

          <div
            className="relative cursor-pointer overflow-hidden rounded-3xl border border-amber-200/80 shadow-2xl"
            onClick={() => openGallery?.()}
          >
            {slides.map((slide, index) => (
              <img
                key={slide.label}
                src={slide.src}
                alt={slide.alt}
                  className={`absolute left-0 top-0 h-[320px] w-full object-cover transition-opacity duration-700 sm:h-[460px] ${
                  index === activeSlide ? 'opacity-100' : 'opacity-0'
                }`}
              />
            ))}

            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/5 to-transparent" />

            <div className="relative flex h-[320px] items-end justify-between p-4 sm:h-[460px]">
              <div className="rounded-full bg-black/55 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
                {slides[activeSlide].label}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    goPrev();
                  }}
                  className="rounded-full bg-white/90 px-3 py-2 text-sm font-bold text-slate-900 shadow"
                  aria-label="Previous image"
                >
                  Prev
                </button>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    goNext();
                  }}
                  className="rounded-full bg-white/90 px-3 py-2 text-sm font-bold text-slate-900 shadow"
                  aria-label="Next image"
                >
                  Next
                </button>
              </div>
            </div>

            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2">
              {slides.map((slide, index) => (
                <button
                  key={slide.label + '-dot'}
                  onClick={(event) => {
                    event.stopPropagation();
                    setActiveSlide(index);
                  }}
                  className={`h-2.5 rounded-full transition-all ${index === activeSlide ? 'w-7 bg-orange-500' : 'w-2.5 bg-white/80'}`}
                  aria-label={`Go to ${slide.label}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickStats.map((stat) => (
            <article key={stat.label} className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{stat.label}</p>
              <p className="mt-2 text-3xl font-black text-slate-900">{stat.value}</p>
              <p className="mt-1 text-xs font-semibold text-orange-600">{stat.hint}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl font-black text-slate-900">{hasUpcomingEvents ? 'Upcoming Events' : 'Recent Events'}</h2>
          {!hasUpcomingEvents && events.length > 0 && (
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-amber-700">No future dates found</p>
          )}
        </div>

        {activeEvents.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">No events available right now.</p>
        ) : (
          <div className="vh-marquee">
            <div className="vh-marquee-track">
              {marqueeEvents.map((event, index) => (
                <article
                  key={`${event.id}-${index}`}
                  className="mr-4 flex h-[19rem] w-[19rem] shrink-0 flex-col rounded-2xl border border-amber-100 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-amber-700">{event.club}</p>
                    <p className="text-sm font-black text-slate-800">{event.registeredVolunteers || 0}/{event.neededVolunteers || 1}</p>
                  </div>
                  <h3 className="vh-line-clamp-2 mt-2 text-lg font-black text-slate-900">{event.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{event.date} • {event.location}</p>
                  <p className="mt-4 flex-1 overflow-hidden text-sm leading-relaxed text-slate-600">{event.details || event.summary || 'Details will be announced soon.'}</p>
                  <button
                    className="mt-5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-800"
                    onClick={() => openEventDetails(event.id)}
                  >
                    Details & Apply
                  </button>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">Volunteer Tracks</p>
            <h2 className="mt-2 text-3xl font-black text-slate-900">Different Ways To Contribute</h2>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {VOLUNTEER_TRACKS.map((track) => (
            <article
              key={track.name}
              className={`overflow-hidden rounded-3xl bg-gradient-to-br p-[1px] shadow-lg ${track.palette}`}
            >
              <div className="h-full rounded-[calc(1.5rem-1px)] bg-white p-5">
                <p className="inline-block rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white">{track.badge}</p>
                <h3 className="mt-3 text-2xl font-black text-slate-900">{track.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{track.subtitle}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
        {/* <div className="absolute inset-y-0 right-0 hidden w-2/5 rounded-3xl bg-gradient-to-b from-amber-100/40 to-orange-100/30 lg:block" /> */}
        <div className="relative grid gap-6 lg:grid-cols-2">
          <article className="rounded-3xl border border-amber-100 bg-white p-6">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">How It Works</p>
            <h2 className="mt-2 text-3xl font-black text-slate-900">From Application To Impact</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              VolunteerHub keeps registration, approval, assignment, and completion in one connected workflow so clubs and volunteers stay aligned.
            </p>

            <div className="mt-6 space-y-3">
              {WORKFLOW_STEPS.map((step, index) => (
                <div key={step.title} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-black ${step.accent}`}>{String(index + 1).padStart(2, '0')}</span>
                    <p className="text-base font-black text-slate-900">{step.title}</p>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.text}</p>
                </div>
              ))}
            </div>
          </article>

          <article id="campus-timeline" className="rounded-3xl border border-amber-100 bg-white p-6">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-orange-700">Campus Timeline</p>
            <h2 className="mt-2 text-3xl font-black text-slate-900">What Happens Next</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              Track the next set of opportunities and jump directly into any event details.
            </p>

            <div className="mt-6 space-y-3">
              {timelineEvents.length === 0 && (
                <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">No upcoming events in the timeline yet.</p>
              )}

              {timelineEvents.map((event, index) => (
                <button
                  key={event.id}
                  onClick={() => openEventDetails(event.id)}
                  className="group w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-orange-300 hover:bg-orange-50"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-amber-700">{event.club}</p>
                    <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-slate-600">Stop {index + 1}</span>
                  </div>
                  <p className="mt-1 text-base font-black text-slate-900 group-hover:text-orange-700">{event.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{event.date} • {event.location}</p>
                </button>
              ))}
            </div>
          </article>
        </div>
      </section>



      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-orange-700">Club Momentum</p>
            <h2 className="mt-2 text-3xl font-black text-slate-900">Which Clubs Are Most Active</h2>
          </div>
        </div>

        {clubMomentum.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">Add events to see club momentum cards.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {clubMomentum.map((item) => (
              <article key={item.club} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-base font-black text-slate-900">{item.club}</p>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-black ${item.tone}`}>{item.count} upcoming</span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-orange-400 to-amber-500"
                    style={{ width: `${Math.min(item.count * 22, 100)}%` }}
                  />
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
        <div className="mb-6">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">Top Contributors</p>
          <h2 className="mt-2 text-3xl font-black text-slate-900">People Carrying The Load</h2>
        </div>

        {contributorCards.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">No contributor data available yet.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {contributorCards.map((person) => (
              <article
                key={`${person.id}-${person.email}`}
                className="rounded-3xl border border-amber-100 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-orange-700">Rank #{String(person.rank).padStart(2, '0')}</p>
                    <h3 className="mt-2 text-2xl font-black text-slate-900">{person.name}</h3>
                    <p className="mt-1 text-sm text-slate-600">{person.club || person.department || 'Campus volunteer'}</p>
                  </div>
                  <div className="rounded-2xl bg-amber-50 px-3 py-2 text-right">
                    <p className="text-xs font-bold uppercase tracking-wide text-amber-700">Participations</p>
                    <p className="text-2xl font-black text-slate-900">{person.approvedApplications}</p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Approved</p>
                    <p className="mt-1 text-lg font-black text-slate-900">{person.approvedApplications}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Attendance</p>
                    <p className="mt-1 text-lg font-black text-slate-900">{person.attendanceCount}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Tasks Done</p>
                    <p className="mt-1 text-lg font-black text-slate-900">{person.completedTasks}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Events</p>
                    <p className="mt-1 text-lg font-black text-slate-900">{person.eventsParticipated}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-6">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-orange-700">Impact Wall</p>
          <h2 className="mt-2 text-3xl font-black text-slate-900">What People Are Saying</h2>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {IMPACT_QUOTES.map((quote, index) => (
              <article key={quote.person} className="rounded-2xl border border-white/70 bg-white/90 p-4 shadow-sm">
                <p className="text-sm leading-relaxed text-slate-700">"{quote.text}"</p>
                <p className="mt-4 text-xs font-black uppercase tracking-[0.12em] text-slate-500">{quote.person}</p>
                <p className="mt-1 text-[10px] font-bold text-orange-600">Card #{String(index + 1).padStart(2, '0')}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Trusted Clubs */}
      <section className="bg-slate-50 px-6 py-20 text-center sm:px-10">
        <h2 className="mb-4 text-slate-400 text-sm font-semibold uppercase tracking-[0.2em]">Trusted by Clubs</h2>
        
        <div className="flex flex-wrap justify-center gap-16 grayscale opacity-60">
          <span className="text-3xl font-bold italic">CUET Computer Club</span>
          <span className="text-3xl font-bold italic">ASRRO</span>
          <span className="text-3xl font-bold italic">IEEE CUET SB</span>
          <span className="text-3xl font-bold italic">Joydhoni</span>
        </div>
      </section>
    </main>
  );
}
