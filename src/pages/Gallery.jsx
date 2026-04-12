import React, { useMemo } from 'react';

const HEIGHT_CLASSES = ['h-64', 'h-72', 'h-80', 'h-96', 'h-[28rem]'];

const ASSET_IMAGES = import.meta.glob('../assets/*.{png,jpg,jpeg,webp,gif,avif,svg}', {
  eager: true,
  import: 'default',
});

function labelFromPath(pathname, index) {
  const filename = pathname.split('/').pop() || `image-${index + 1}`;
  return filename
    .replace(/\.[^.]+$/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export default function Gallery({ theme = 'day' }) {
  const isNight = theme === 'night';

  const images = useMemo(() => {
    return Object.entries(ASSET_IMAGES)
      .sort(([pathA], [pathB]) => pathA.localeCompare(pathB))
      .map(([path, src], index) => ({
        key: path,
        src,
        alt: labelFromPath(path, index),
      }))
      .filter((image) => typeof image.src === 'string' && image.src.length > 0);
  }, []);

  const pageClass = isNight ? 'bg-slate-950' : 'bg-amber-50';
  const cardClass = isNight ? 'border-slate-800 bg-slate-900/70' : 'border-amber-200 bg-white';

  return (
    <main className={`min-h-[calc(100vh-4rem)] px-4 py-8 sm:px-6 lg:px-8 ${pageClass}`}>
      <section className="mx-auto max-w-7xl columns-1 gap-4 sm:columns-2 xl:columns-3">
        {images.map((image, index) => (
          <figure
            key={image.key}
            className={`mb-4 break-inside-avoid overflow-hidden rounded-2xl border ${cardClass}`}
          >
            <img
              src={image.src}
              alt={image.alt}
              className={`w-full object-cover ${HEIGHT_CLASSES[index % HEIGHT_CLASSES.length]}`}
              loading="lazy"
            />
          </figure>
        ))}

        {images.length === 0 && (
          <p className={`text-sm ${isNight ? 'text-slate-300' : 'text-slate-600'}`}>
            No images found in src/assets.
          </p>
        )}
      </section>
    </main>
  );
}
