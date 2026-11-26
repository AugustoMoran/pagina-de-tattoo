import React, { useEffect, useState } from 'react';
import Logo from './Logo';

const INTRO_KEY = 'mdfk-intro-seen';
let introClaimed = false;

function claimIntro() {
  if (introClaimed) return true;
  try {
    if (sessionStorage.getItem(INTRO_KEY) === '1') return false;
    sessionStorage.setItem(INTRO_KEY, '1');
  } catch {
    return false;
  }
  introClaimed = true;
  return true;
}

const DRIPS = [
  { left: '38%', delay: '0.45s', duration: '1.25s', height: 26, width: 5 },
  { left: '46%', delay: '0.8s', duration: '1.55s', height: 38, width: 8 },
  { left: '52%', delay: '0.55s', duration: '1.15s', height: 20, width: 4 },
  { left: '57%', delay: '1.05s', duration: '1.7s', height: 32, width: 6 },
  { left: '63%', delay: '0.7s', duration: '1.4s', height: 24, width: 5 },
  { left: '49%', delay: '1.35s', duration: '1.3s', height: 18, width: 4 },
];

const IntroSplash = () => {
  const [phase, setPhase] = useState(() => (claimIntro() ? 'in' : 'off'));

  useEffect(() => {
    if (phase === 'off') return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== 'in') return undefined;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = window.setTimeout(() => setPhase('out'), reduce ? 700 : 3200);
    const onKey = (event) => {
      if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        setPhase('out');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', onKey);
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== 'out') return undefined;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = window.setTimeout(() => setPhase('off'), reduce ? 280 : 720);
    return () => window.clearTimeout(timer);
  }, [phase]);

  if (phase === 'off') return null;

  return (
    <div
      className={`intro-splash ${phase === 'out' ? 'is-leaving' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="MDFK Tattoo"
      onClick={() => setPhase('out')}
    >
      <div className="intro-flash" />
      <div className="intro-vignette" />
      <div className="intro-grain" />
      <div className="intro-pulse" />

      <div className="intro-stage">
        <div className="intro-logo-wrap">
          <div className="intro-logo-frame">
            <Logo alt="MDFK Tattoo" className="intro-logo h-full w-full rounded-none shadow-none" />
            <div className="intro-sheen" />
          </div>
          {DRIPS.map((drip) => (
            <span
              key={drip.left}
              className="intro-drip"
              style={{
                left: drip.left,
                animationDelay: drip.delay,
                animationDuration: drip.duration,
                height: drip.height,
                width: drip.width,
              }}
            />
          ))}
        </div>

        <div className="intro-copy">
          <p className="intro-kicker">Estudio</p>
          <p className="intro-title">MDFK</p>
          <p className="intro-sub">Tattoo</p>
          <div className="intro-bloodline" />
        </div>
      </div>

      <button
        type="button"
        className="intro-skip"
        onClick={(event) => {
          event.stopPropagation();
          setPhase('out');
        }}
      >
        Entrar
      </button>
    </div>
  );
};

export default IntroSplash;
