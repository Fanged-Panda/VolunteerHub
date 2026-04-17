import React from 'react';

export default function Preloader({ theme = 'day' }) {
  const isNight = theme === 'night';

  return (
    <div className={`vh-preloader-screen ${isNight ? 'vh-preloader-screen--night' : 'vh-preloader-screen--day'}`}>
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