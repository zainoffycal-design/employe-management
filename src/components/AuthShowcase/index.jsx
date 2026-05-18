import { memo, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  FiFolder,
  FiLayout,
  FiClock,
  FiPackage,
  FiDollarSign,
  FiBarChart2
} from 'react-icons/fi';
import logo from '../../assets/logo.svg';
import './AuthShowcase.scss';

const SLIDES = [
  {
    id: 'projects',
    icon: FiFolder,
    label: 'Projects',
    title: 'Project Management',
    description: 'Create projects, assign teams, set budgets, and track delivery from one hub.'
  },
  {
    id: 'board',
    icon: FiLayout,
    label: 'Kanban',
    title: 'Kanban Boards',
    description: 'Move work through todo, in progress, and review with a clear board per project.'
  },
  {
    id: 'time',
    icon: FiClock,
    label: 'Time',
    title: 'Time Tracking',
    description: 'Log hours on tasks and compare estimated vs actual time across projects.'
  },
  {
    id: 'assets',
    icon: FiPackage,
    label: 'Assets',
    title: 'Asset Manager',
    description: 'Request, approve, and assign company assets with a full audit trail.'
  },
  {
    id: 'finance',
    icon: FiDollarSign,
    label: 'Finance',
    title: 'Finance & Commissions',
    description: 'Manage budgets, payments, and team commissions in one finance workspace.'
  },
  {
    id: 'performance',
    icon: FiBarChart2,
    label: 'Analytics',
    title: 'Team Performance',
    description: 'Role-based dashboards and insights to see how your team delivers.'
  }
];

const INTERVAL_MS = 6000;

const RINGS = [
  { className: 'auth-showcase__ring--1', duration: 5.5, drift: 90 },
  { className: 'auth-showcase__ring--2', duration: 7, drift: 70 },
  { className: 'auth-showcase__ring--3', duration: 6.2, drift: 55 }
];

const randomOffset = (range) => ({
  x: Math.round((Math.random() - 0.5) * range * 2),
  y: Math.round((Math.random() - 0.5) * range * 2)
});

const FloatingRing = ({ className, drift, duration, disabled }) => {
  const [target, setTarget] = useState(() => randomOffset(drift));

  useEffect(() => {
    if (disabled) return undefined;

    const tick = () => setTarget(randomOffset(drift));
    const delay = duration * 1000;
    const id = setInterval(tick, delay);
    return () => clearInterval(id);
  }, [drift, duration, disabled]);

  if (disabled) {
    return <div className={`auth-showcase__ring ${className}`} aria-hidden />;
  }

  return (
    <motion.div
      className={`auth-showcase__ring ${className}`}
      aria-hidden
      animate={{ x: target.x, y: target.y }}
      transition={{ duration, ease: 'easeInOut' }}
    />
  );
};

const AuthShowcase = () => {
  const prefersReducedMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const goTo = useCallback((i) => setIndex(i), []);

  const next = useCallback(() => {
    setIndex((prev) => (prev + 1) % SLIDES.length);
  }, []);

  useEffect(() => {
    if (paused || prefersReducedMotion) return undefined;
    const id = setInterval(next, INTERVAL_MS);
    return () => clearInterval(id);
  }, [paused, next, prefersReducedMotion]);

  const slide = SLIDES[index];
  const Icon = slide.icon;

  const transition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.45, ease: [0.22, 1, 0.36, 1] };

  return (
    <div
      className="auth-showcase"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="auth-showcase__mesh" aria-hidden />
      {RINGS.map((ring) => (
        <FloatingRing
          key={ring.className}
          className={ring.className}
          drift={ring.drift}
          duration={ring.duration}
          disabled={prefersReducedMotion}
        />
      ))}

      <div
        key={index}
        className={`auth-showcase__timer${paused ? ' auth-showcase__timer--paused' : ''}`}
        style={{ '--auth-slide-ms': `${INTERVAL_MS}ms` }}
        aria-hidden
      />

      <header className="auth-showcase__header">
        <img src={logo} alt="" className="auth-showcase__logo" />
        <p className="auth-showcase__eyebrow">Fixelcloud · Pi Management</p>
      </header>

      <nav className="auth-showcase__nav" aria-label="Product features">
        {SLIDES.map((item, i) => {
          const TabIcon = item.icon;
          const isActive = i === index;
          return (
            <button
              key={item.id}
              type="button"
              className={`auth-showcase__tab${isActive ? ' auth-showcase__tab--active' : ''}`}
              onClick={() => goTo(i)}
              aria-current={isActive}
            >
              <TabIcon size={16} aria-hidden />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="auth-showcase__stage">
        <AnimatePresence mode="wait">
          <motion.article
            key={slide.id}
            className="auth-showcase__slide"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={transition}
          >
            <div className="auth-showcase__icon">
              <Icon size={32} aria-hidden />
            </div>
            <div className="auth-showcase__copy">
              <span className="auth-showcase__index">
                {String(index + 1).padStart(2, '0')} / {String(SLIDES.length).padStart(2, '0')}
              </span>
              <h2>{slide.title}</h2>
              <p>{slide.description}</p>
            </div>
          </motion.article>
        </AnimatePresence>
      </div>

      <footer className="auth-showcase__footer">
        <div className="auth-showcase__dots">
          {SLIDES.map((item, i) => (
            <button
              key={item.id}
              type="button"
              className={`auth-showcase__dot${i === index ? ' auth-showcase__dot--active' : ''}`}
              onClick={() => goTo(i)}
              aria-label={item.title}
            />
          ))}
        </div>
      </footer>
    </div>
  );
};

export default memo(AuthShowcase);
