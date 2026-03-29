import React, { useEffect, useMemo, useState } from 'react';
import cuetEgg from '../assets/cuet with egg.jpeg';
import rasel from '../assets/rasel.jpg';
import tsc from '../assets/tsc.jpg';
import asrro from '../assets/asrro.jpg';
import work from '../assets/work.jpg';

export default function Home({ events = [], setSelectedEvent, openEvents }) {
  const [activeSlide, setActiveSlide] = useState(0);

  const slides = useMemo(
    () => [
      { src: cuetEgg, alt: 'CUET iconic building', label: 'CUET with Egg' },
      { src: rasel, alt: 'Rasel', label: 'Rasel Hall' },
      { src: tsc, alt: 'TSC cafeteria', label: 'TSC Cafeteria' },
      { src: asrro, alt: 'ASRRO', label: 'ASRRO' },
      { src: work, alt: 'ASRRO', label: 'Workshop' },
    ],
    [],
  );

  const upcoming = useMemo(() => events.slice(0, 4), [events]);

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

  return (
    <main>
      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8">
        <div>
          <p className="mb-4 inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-amber-800">
            Official CUET Club Events
          </p>
          <h1 className="text-4xl font-black leading-tight text-slate-900 sm:text-5xl">
            Volunteer for CUET Clubs,
            <span className="block text-orange-500">One Event at a Time</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
            Discover CUET-only events, apply quickly, track tasks, and contribute to your campus community with a modern volunteer workflow.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              onClick={() => openEvents()}
              className="rounded-xl bg-orange-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-orange-200 transition hover:bg-orange-600"
            >
              Explore Events
            </button>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-3xl shadow-2xl">
          {slides.map((slide, index) => (
            <img
              key={slide.label}
              src={slide.src}
              alt={slide.alt}
              className={`absolute left-0 top-0 h-[420px] w-full object-cover transition-opacity duration-700 ${
                index === activeSlide ? 'opacity-100' : 'opacity-0'
              }`}
            />
          ))}

          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

          <div className="relative flex h-[420px] items-end justify-between p-4">
            <div className="rounded-full bg-black/50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
              {slides[activeSlide].label}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={goPrev}
                className="rounded-full bg-white/90 px-3 py-2 text-sm font-bold text-slate-900 shadow"
                aria-label="Previous image"
              >
                Prev
              </button>
              <button
                onClick={goNext}
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
                onClick={() => setActiveSlide(index)}
                className={`h-2.5 rounded-full transition-all ${index === activeSlide ? 'w-7 bg-orange-500' : 'w-2.5 bg-white/80'}`}
                aria-label={`Go to ${slide.label}`}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl font-black text-slate-900">Upcoming Events</h2>
          <button onClick={() => openEvents()} className="text-sm font-bold text-orange-600 hover:text-orange-700">View all</button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {upcoming.map((event) => (
            <article key={event.id} className="flex h-full flex-col rounded-2xl border border-amber-100 bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-amber-700">{event.club}</p>
              <h3 className="mt-2 text-lg font-black text-slate-900">{event.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{event.date} • {event.location}</p>
              <p className="mt-4 flex-1 text-sm leading-relaxed text-slate-600">{event.summary}</p>
              <button
                className="mt-5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-800"
                onClick={() => {
                  setSelectedEvent(event.id);
                  openEvents(event.id);
                }}
              >
                Details & Apply
              </button>
            </article>
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
          <span className="text-3xl font-bold italic">Joyodhoni</span>
        </div>
      </section>
    </main>
  );
}
