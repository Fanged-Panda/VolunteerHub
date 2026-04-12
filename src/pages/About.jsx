import React, { useEffect, useMemo, useRef, useState } from 'react';

const PREVIEW_SCALE = 0.14;

const INTRO_PARAGRAPHS = [
  'We built Volunteer Hub to bridge the gap between passionate individuals and the communities that need them most. Whether you are looking to lead a local drive, join a university club, or simply lend a hand for a weekend, this is where action meets impact.',
  'We make it effortless to discover events, track volunteer needs, and make a real difference in your community.',
];

const DETAIL_SECTIONS = [
  {
    title: 'What We Do',
    tone: 'large',
    items: [
      { primary: 'Community Outreach', secondary: 'Local Drives & Support' },
      { primary: 'Event Coordination', secondary: 'Logistics & Planning' },
      { primary: 'Skill-Based Volunteering', secondary: 'Tech & Education' },
      { primary: 'Club Networking', secondary: 'University & City Chapters' },
    ],
  },
  {
    title: 'Our Vision',
    tone: 'compact',
    items: [
      { primary: "We believe that doing good shouldn't be complicated. Our vision is to build a world where community action is completely frictionless—where anyone, anywhere, can instantly connect with a cause they care about and make a measurable impact." },
    ],
  },
  {
    title: 'Clubs We Worked With',
    tone: 'compact',
    items: [
      { primary: 'CUET Computer Club' },
      { primary: 'ASRRO' },
      { primary: 'CUET Career Club' },
      { primary: 'IEEE CUET SB' },
      { primary: 'CUET Debating Society' },
      { primary: 'RMA' },
      { primary: 'Joyodhoni' },
    ],
  },
  {
    title: 'Get In Touch',
    tone: 'compact',
    items: [
      { primary: 'Email', href: 'mailto:volunteerhub.cuet@gmail.com' },
      { primary: 'Facebook', href: 'https://www.facebook.com/' },
      { primary: 'Whatsapp', href: 'https://wa.me/?text=Hi%20VolunteerHub' },
      { primary: 'Twitter', href: 'https://x.com/' },
    ],
  },
];

function AboutScrollableContent({ isNight, mini = false }) {
  const introClass = isNight ? 'text-slate-200' : 'text-slate-900';
  const sectionTitleClass = isNight ? 'text-slate-200' : 'text-slate-900';
  const itemPrimaryClass = isNight ? 'text-slate-300' : 'text-slate-900';
  const itemSecondaryClass = isNight ? 'text-slate-500' : 'text-slate-500';

  return (
    <div className="mx-auto max-w-[42rem] space-y-20 px-2 pb-24 pt-8 sm:space-y-24 sm:px-3 sm:pt-10">
      <section className="space-y-12">
        {INTRO_PARAGRAPHS.map((paragraph) => (
          <p
            key={paragraph}
            className={`text-[2.15rem] font-medium leading-[1.15] tracking-[-0.01em] sm:text-[3.25rem] ${introClass}`}
          >
            {paragraph}
          </p>
        ))}
      </section>

      {DETAIL_SECTIONS.map((section) => (
        <section key={section.title} className="space-y-8">
          <h2 className={`text-[2rem] font-semibold leading-tight sm:text-[3.35rem] ${sectionTitleClass}`}>
            {section.title}
          </h2>

          <div className="space-y-7">
            {section.items.map((item) => (
              <article key={`${section.title}-${item.primary}`}>
                {item.href ? (
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className={`${section.tone === 'large'
                      ? 'max-w-xl text-[2rem] font-medium leading-[1.15] sm:text-[3.1rem]'
                      : 'text-[1.4rem] font-medium leading-[1.2] sm:text-[2rem]'} ${itemPrimaryClass} inline-flex no-underline transition hover:opacity-75`}
                  >
                    {item.primary}
                  </a>
                ) : (
                  <p
                    className={`${section.tone === 'large'
                      ? 'max-w-xl text-[2rem] font-medium leading-[1.15] sm:text-[3.1rem]'
                      : 'text-[1.4rem] font-medium leading-[1.2] sm:text-[2rem]'} ${itemPrimaryClass}`}
                  >
                    {item.primary}
                  </p>
                )}

                {item.secondary && (
                  <p className={`mt-2 text-base leading-tight sm:text-[1.8rem] ${itemSecondaryClass}`}>
                    {item.secondary}
                  </p>
                )}
              </article>
            ))}
          </div>
          {!mini && <div className="pt-2" />}
        </section>
      ))}

      <div className="h-8" />
    </div>
  );
}

export default function About({ theme = 'day' }) {
  const isNight = theme === 'night';
  const contentRef = useRef(null);
  const mapRef = useRef(null);
  const previewRef = useRef(null);
  const [scrollState, setScrollState] = useState({ scrollTop: 0, scrollHeight: 1, clientHeight: 1 });
  const [mapMetrics, setMapMetrics] = useState({ containerHeight: 1, previewScaledHeight: 1 });

  useEffect(() => {
    const panel = contentRef.current;
    const map = mapRef.current;
    const preview = previewRef.current;
    if (!panel || !map || !preview) return undefined;

    const syncGeometry = () => {
      setScrollState({
        scrollTop: panel.scrollTop,
        scrollHeight: panel.scrollHeight || 1,
        clientHeight: panel.clientHeight || 1,
      });

      setMapMetrics({
        containerHeight: map.clientHeight || 1,
        previewScaledHeight: Math.max((preview.offsetHeight || 1) * PREVIEW_SCALE, 1),
      });
    };

    syncGeometry();
    panel.addEventListener('scroll', syncGeometry, { passive: true });
    window.addEventListener('resize', syncGeometry);

    return () => {
      panel.removeEventListener('scroll', syncGeometry);
      window.removeEventListener('resize', syncGeometry);
    };
  }, []);

  const minimapFrame = useMemo(() => {
    const scrollHeight = Math.max(scrollState.scrollHeight, 1);
    const clientHeight = Math.max(scrollState.clientHeight, 1);
    const maxScroll = Math.max(scrollHeight - clientHeight, 0);
    const containerHeight = Math.max(mapMetrics.containerHeight, 1);
    const previewHeight = Math.min(Math.max(mapMetrics.previewScaledHeight, 1), containerHeight);

    const frameHeightPx = Math.min(previewHeight, (clientHeight / scrollHeight) * previewHeight);
    const maxTopPx = Math.max(previewHeight - frameHeightPx, 0);
    const topPx = maxScroll > 0 ? (scrollState.scrollTop / maxScroll) * maxTopPx : 0;

    const height = (frameHeightPx / containerHeight) * 100;
    const top = (topPx / containerHeight) * 100;

    return {
      top,
      height,
    };
  }, [scrollState, mapMetrics]);

  function jumpToScrollPosition(event) {
    const map = mapRef.current;
    const panel = contentRef.current;
    if (!map || !panel) return;

    const bounds = map.getBoundingClientRect();
    const ratio = (event.clientY - bounds.top) / Math.max(bounds.height, 1);
    const clampedRatio = Math.max(0, Math.min(1, ratio));
    const targetTop = clampedRatio * Math.max(panel.scrollHeight - panel.clientHeight, 0);

    panel.scrollTo({ top: targetTop, behavior: 'smooth' });
  }

  const pageClass = isNight ? 'text-slate-300' : 'text-slate-900';
  const frameClass = isNight ? 'border-slate-500/80' : 'border-slate-500/80';

  return (
    <main className={`min-h-[calc(100vh-4rem)] px-4 py-8 sm:px-6 lg:px-8 ${pageClass}`}>
      <div className="mx-auto grid max-w-[1100px] grid-cols-[minmax(105px,20vw)_minmax(0,1fr)] gap-6 justify-center sm:grid-cols-[minmax(120px,18vw)_minmax(0,1fr)] lg:grid-cols-[minmax(140px,15%)_minmax(0,680px)] lg:gap-8">
        <aside className="self-start">
          <div
            ref={mapRef}
            onClick={jumpToScrollPosition}
            className="relative h-[72vh] min-h-[26rem] overflow-hidden lg:fixed lg:left-[1%] lg:top-24 lg:h-[calc(100vh-8rem)] lg:w-[140px]"
            aria-label="About minimap"
          >
            <div
              ref={previewRef}
              className="pointer-events-none absolute left-0 top-0"
              style={{
                transform: `scale(${PREVIEW_SCALE})`,
                transformOrigin: 'top left',
                width: `${100 / PREVIEW_SCALE}%`,
              }}
              aria-hidden="true"
            >
              <AboutScrollableContent isNight={isNight} mini />
            </div>

            <div
              className={`pointer-events-none absolute inset-x-0 border ${frameClass}`}
              style={{
                top: `${minimapFrame.top}%`,
                height: `${minimapFrame.height}%`,
              }}
              aria-hidden="true"
            />
          </div>
        </aside>

        <section
          ref={contentRef}
          className="vh-hide-scrollbar h-[calc(100vh-7rem)] overflow-y-auto pr-1 sm:pr-2"
        >
          <AboutScrollableContent isNight={isNight} />
        </section>
      </div>
    </main>
  );
}
