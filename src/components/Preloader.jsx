import React from 'react';

export default function Preloader({ theme = 'day', overlay = false }) {
  const isNight = theme === 'night';
  const baseClass = overlay ? 'vh-preloader-overlay' : 'vh-preloader-screen';

  return (
    <div className={`${baseClass} ${isNight ? `${baseClass}--night` : `${baseClass}--day`}`}>
      <div className="vh-preloader" aria-hidden="true">
        <i style={{ '--order': 1 }} />
        <i style={{ '--order': 2 }} />
        <i style={{ '--order': 3 }} />
        <i style={{ '--order': 4 }} />
        <i style={{ '--order': 5 }} />
      </div>
    </div>
  );
}