import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import {
  FiArrowUp,
  FiArrowRight,
  FiLayers,
  FiColumns,
  FiUsers,
  FiClock,
  FiDollarSign,
  FiMessageCircle,
  FiZap,
  FiShuffle,
  FiEyeOff,
  FiAlertTriangle,
  FiShield,
  FiBriefcase,
  FiCode,
  FiPenTool,
  FiTrendingUp,
  FiCpu,
  FiUserPlus,
  FiFolderPlus,
  FiBarChart2
} from 'react-icons/fi';
import { APP_NAME, CREATOR_NAME } from '../../constants/app';
import Logo from '../../components/Logo';
import 'lenis/dist/lenis.css';
import './Landing.scss';

gsap.registerPlugin(ScrollTrigger);

const FEATURES = [
  {
    num: '01',
    title: 'Project Management',
    desc: 'Create projects, assign teams, set priorities, and track status from a single command surface.',
    icon: FiLayers
  },
  {
    num: '02',
    title: 'Kanban Boards',
    desc: 'Move work through Todo, In Progress, In Review, and Done with live updates for everyone involved.',
    icon: FiColumns
  },
  {
    num: '03',
    title: 'Role-Based Access',
    desc: 'Super Managers, Managers, Designers, Developers, and BD each see exactly what they need.',
    icon: FiShield
  },
  {
    num: '04',
    title: 'Time & Performance',
    desc: 'Track hours, estimates, and employee performance so delivery stays measurable.',
    icon: FiClock
  },
  {
    num: '05',
    title: 'Finance & Commissions',
    desc: 'Budgets, payments, and commission tracking stay connected to the work that earns them.',
    icon: FiDollarSign
  },
  {
    num: '06',
    title: 'AI Workspace Assistant',
    desc: 'Ask questions, navigate faster, and take actions through a permission-aware chatbot.',
    icon: FiMessageCircle
  }
];

const PROBLEMS = [
  {
    icon: FiShuffle,
    title: 'Scattered tools',
    text: 'Tasks in one app, people in another, money somewhere else — context dies in the gaps.'
  },
  {
    icon: FiEyeOff,
    title: 'No shared visibility',
    text: 'Managers chase updates while teams wait for clarity. Progress becomes guesswork.'
  },
  {
    icon: FiAlertTriangle,
    title: 'Permissions afterthought',
    text: 'Without clear roles, either everyone sees too much — or the wrong people are blocked.'
  }
];

const ROLES = [
  {
    icon: FiBriefcase,
    title: 'Super Manager',
    text: 'Full control over users, finance, performance, and every project in the system.'
  },
  {
    icon: FiUsers,
    title: 'Manager',
    text: 'Lead teams, assign work, review delivery, and keep projects moving.'
  },
  {
    icon: FiPenTool,
    title: 'Designer',
    text: 'Own design tasks, update status, and collaborate with clear deadlines.'
  },
  {
    icon: FiCode,
    title: 'Developer',
    text: 'Ship assigned work on the board with time tracking built into the flow.'
  },
  {
    icon: FiTrendingUp,
    title: 'Business Developer',
    text: 'Stay close to project momentum and budget visibility where it matters.'
  },
  {
    icon: FiCpu,
    title: 'AI Assistant',
    text: 'A co-pilot that respects your role and helps you act inside the product.'
  }
];

const STEPS = [
  {
    title: 'Invite your team',
    text: 'Add people with the right roles. They set a password and land inside a workspace built for them.',
    icon: FiUserPlus,
    tag: 'People'
  },
  {
    title: 'Build projects & boards',
    text: 'Spin up projects, drop tasks on the Kanban, assign owners, and watch progress update live.',
    icon: FiFolderPlus,
    tag: 'Delivery'
  },
  {
    title: 'Measure what matters',
    text: 'Use analytics, performance, and finance views to steer delivery — not just react to it.',
    icon: FiBarChart2,
    tag: 'Insight'
  }
];

const MARQUEE = [
  'Projects',
  'Kanban',
  'Teams',
  'Analytics',
  'Budgets',
  'Commissions',
  'Time Tracking',
  'AI Chat',
  'Notifications',
  'Role Access'
];

const HeroVisual = () => (
  <svg viewBox="40 40 560 420" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <rect x="40" y="40" width="560" height="420" rx="28" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
    <rect className="lp-v-bar" x="64" y="68" width="120" height="14" rx="7" fill="#6366f1" opacity="0.95" />
    <circle className="lp-v-dot" cx="520" cy="75" r="7" fill="#818cf8" />
    <circle className="lp-v-dot" cx="548" cy="75" r="7" fill="#8b5cf6" opacity="0.85" />
    <circle className="lp-v-dot" cx="576" cy="75" r="7" fill="#f8fafc" opacity="0.35" />

    <g className="lp-v-col">
      <rect x="64" y="110" width="120" height="18" rx="6" fill="#334155" />
      <rect className="lp-v-card" x="64" y="142" width="120" height="64" rx="12" fill="#475569" />
      <rect className="lp-v-card" x="64" y="218" width="120" height="52" rx="12" fill="#6366f1" />
      <rect className="lp-v-card" x="64" y="282" width="120" height="70" rx="12" fill="#475569" />
    </g>
    <g className="lp-v-col">
      <rect x="204" y="110" width="120" height="18" rx="6" fill="#334155" />
      <rect className="lp-v-card" x="204" y="142" width="120" height="78" rx="12" fill="#4f46e5" />
      <rect className="lp-v-card" x="204" y="232" width="120" height="58" rx="12" fill="#475569" />
      <rect className="lp-v-card" x="204" y="302" width="120" height="48" rx="12" fill="#475569" />
    </g>
    <g className="lp-v-col">
      <rect x="344" y="110" width="120" height="18" rx="6" fill="#334155" />
      <rect className="lp-v-card" x="344" y="142" width="120" height="54" rx="12" fill="#475569" />
      <rect className="lp-v-card" x="344" y="208" width="120" height="84" rx="12" fill="#818cf8" />
      <rect className="lp-v-card" x="344" y="304" width="120" height="56" rx="12" fill="#475569" />
    </g>
    <g className="lp-v-col">
      <rect x="484" y="110" width="92" height="18" rx="6" fill="#334155" />
      <rect className="lp-v-card" x="484" y="142" width="92" height="66" rx="12" fill="#475569" />
      <rect className="lp-v-card" x="484" y="220" width="92" height="46" rx="12" fill="#8b5cf6" opacity="0.95" />
      <rect className="lp-v-card" x="484" y="278" width="92" height="72" rx="12" fill="#475569" />
    </g>

    <path
      className="lp-v-orbit"
      d="M80 450c80-70 180-110 280-90s180 70 220 40"
      stroke="#818cf8"
      strokeWidth="2"
      strokeDasharray="6 10"
      opacity="0.55"
    />
  </svg>
);

const Landing = () => {
  const BOARD_POINTS = [
    'Assignees & deadlines on every card',
    'Estimates and logged hours in one place',
    'Reviews and comments without leaving the board'
  ];

  const rootRef = useRef(null);
  const cursorRef = useRef(null);
  const progressRef = useRef(null);
  const lenisRef = useRef(null);
  const [navSolid, setNavSolid] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const touch =
      window.matchMedia('(pointer: coarse)').matches ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setIsTouch(touch);
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let lenis;
    let rafId;
    const ctx = gsap.context(() => {
      if (!reduced) {
        lenis = new Lenis({
          duration: 1.15,
          easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)),
          smoothWheel: true
        });
        lenisRef.current = lenis;

        lenis.on('scroll', ScrollTrigger.update);
        const ticker = (time) => {
          lenis.raf(time * 1000);
        };
        gsap.ticker.add(ticker);
        gsap.ticker.lagSmoothing(0);

        root._lpTicker = ticker;
      }

      const onScrollUi = () => {
        const y = lenis ? lenis.scroll : window.scrollY;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const p = max > 0 ? y / max : 0;
        if (progressRef.current) {
          progressRef.current.style.transform = `scaleX(${p})`;
        }
        setNavSolid(y > 40);
        setShowTop(y > 600);
      };

      if (lenis) {
        lenis.on('scroll', onScrollUi);
      } else {
        window.addEventListener('scroll', onScrollUi, { passive: true });
        root._lpScroll = onScrollUi;
      }
      onScrollUi();

      gsap.from('.lp-hero__content > *, .lp-hero__scroll', {
        y: 32,
        opacity: 0,
        duration: reduced ? 0.01 : 0.85,
        stagger: reduced ? 0 : 0.09,
        ease: 'power3.out',
        delay: reduced ? 0 : 0.12
      });

      gsap.from('.lp-hero__visual', {
        x: 48,
        opacity: 0,
        duration: reduced ? 0.01 : 1.1,
        ease: 'power3.out',
        delay: reduced ? 0 : 0.2
      });

      if (!reduced) {
        gsap.to('.lp-v-card', {
          y: -10,
          duration: 2.2,
          ease: 'sine.inOut',
          stagger: { each: 0.12, repeat: -1, yoyo: true }
        });

        gsap.to('.lp-v-orbit', {
          strokeDashoffset: -80,
          duration: 6,
          ease: 'none',
          repeat: -1
        });
      }

      gsap.utils.toArray('.lp-reveal').forEach((el) => {
        gsap.from(el, {
          y: 48,
          opacity: 0,
          duration: reduced ? 0.01 : 0.85,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 88%',
            toggleActions: 'play none none none'
          }
        });
      });

      gsap.utils.toArray('.lp-features__card').forEach((card, i) => {
        gsap.from(card, {
          y: 40,
          opacity: 0,
          duration: reduced ? 0.01 : 0.7,
          delay: reduced ? 0 : i * 0.05,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: card,
            start: 'top 90%',
            toggleActions: 'play none none none'
          }
        });
      });

      gsap.from('.lp-board__card', {
        y: 28,
        opacity: 0,
        stagger: reduced ? 0 : 0.06,
        duration: reduced ? 0.01 : 0.55,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '.lp-board__mock',
          start: 'top 80%',
          toggleActions: 'play none none none'
        }
      });

      gsap.from('.lp-roles__item', {
        y: 36,
        opacity: 0,
        stagger: reduced ? 0 : 0.08,
        duration: reduced ? 0.01 : 0.65,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.lp-roles__grid',
          start: 'top 85%',
          toggleActions: 'play none none none'
        }
      });

      gsap.from('.lp-steps__card', {
        y: 40,
        opacity: 0,
        stagger: reduced ? 0 : 0.12,
        duration: reduced ? 0.01 : 0.7,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.lp-steps__track',
          start: 'top 85%',
          toggleActions: 'play none none none'
        }
      });

      if (!reduced && document.querySelector('.lp-steps__line-fill')) {
        gsap.fromTo(
          '.lp-steps__line-fill',
          { scaleX: 0 },
          {
            scaleX: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: '.lp-steps__progress',
              start: 'top 75%',
              end: 'top 35%',
              scrub: true
            }
          }
        );
      }

      gsap.from('.lp-promise__stat', {
        y: 30,
        opacity: 0,
        stagger: reduced ? 0 : 0.1,
        duration: reduced ? 0.01 : 0.7,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.lp-promise__stats',
          start: 'top 85%',
          toggleActions: 'play none none none'
        }
      });

      gsap.from('.lp-problem__item', {
        x: 36,
        opacity: 0,
        stagger: reduced ? 0 : 0.1,
        duration: reduced ? 0.01 : 0.65,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.lp-problem__list',
          start: 'top 88%',
          toggleActions: 'play none none none'
        }
      });
    }, root);

    return () => {
      lenisRef.current = null;
      if (lenis) {
        if (root._lpTicker) gsap.ticker.remove(root._lpTicker);
        lenis.destroy();
      }
      if (root._lpScroll) {
        window.removeEventListener('scroll', root._lpScroll);
      }
      ctx.revert();
      ScrollTrigger.getAll().forEach((t) => t.kill());
      cancelAnimationFrame(rafId);
    };
  }, []);

  useEffect(() => {
    if (isTouch) return undefined;

    const cursor = cursorRef.current;
    if (!cursor) return undefined;

    const pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const mouse = { x: pos.x, y: pos.y };
    let raf;

    const onMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const onOver = (e) => {
      const target = e.target.closest('a, button, .lp-interactive');
      cursor.classList.toggle('is-hover', Boolean(target));
    };

    const onDown = () => cursor.classList.add('is-click');
    const onUp = () => cursor.classList.remove('is-click');

    const loop = () => {
      pos.x += (mouse.x - pos.x) * 0.22;
      pos.y += (mouse.y - pos.y) * 0.22;
      cursor.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
      raf = requestAnimationFrame(loop);
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mouseover', onOver, { passive: true });
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseover', onOver);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isTouch]);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (lenisRef.current) {
      lenisRef.current.scrollTo(el, { offset: -72 });
      return;
    }
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollTop = () => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0);
      return;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div ref={rootRef} className={`landing${isTouch ? ' landing--touch' : ''}`}>
      <div ref={cursorRef} className="lp-cursor" aria-hidden>
        <div className="lp-cursor__inner">
          <span className="lp-cursor__glow" />
          <svg className="lp-cursor__pointer" viewBox="0 0 18 22" fill="none">
            <path
              d="M2.2 1.4 15.5 10.1c.55.36.4 1.2-.25 1.35l-5.2 1.2-2.2 5.35c-.28.68-1.25.55-1.35-.2L2.2 1.4Z"
              fill="#0f172a"
            />
            <path
              d="M3.1 3.1 12.8 10.4 8.4 11.4 6.5 15.9 3.1 3.1Z"
              fill="#6366f1"
            />
          </svg>
        </div>
      </div>
      <div ref={progressRef} className="lp-progress" aria-hidden />

      <header className={`lp-nav${navSolid ? ' is-solid' : ' lp-nav--hero'}`}>
        <div className="lp-nav__inner">
          <a href="#top" className="lp-nav__brand" onClick={(e) => { e.preventDefault(); scrollTop(); }}>
            <Logo size="md" variant={navSolid ? 'default' : 'light'} />
          </a>

          <nav className="lp-nav__links" aria-label="Landing">
            <a href="#story" onClick={(e) => { e.preventDefault(); scrollTo('story'); }}>Story</a>
            <a href="#features" onClick={(e) => { e.preventDefault(); scrollTo('features'); }}>Features</a>
            <a href="#roles" onClick={(e) => { e.preventDefault(); scrollTo('roles'); }}>Roles</a>
            <a href="#flow" onClick={(e) => { e.preventDefault(); scrollTo('flow'); }}>How it works</a>
          </nav>

          <div className="lp-nav__actions">
            <Link to="/login" className="lp-btn lp-btn--solid">
              Open app <FiArrowRight />
            </Link>
          </div>
        </div>
      </header>

      <main id="top">
        <section className="lp-hero">
          <div className="lp-hero__bg" aria-hidden />
          <div className="lp-hero__grid" aria-hidden />
          <div className="lp-hero__visual">
            <HeroVisual />
          </div>
          <div className="lp-hero__shell">
            <div className="lp-hero__content">
              <h1 className="lp-hero__brand">
                <span className="lp-hero__brand-accent">{APP_NAME}</span>
              </h1>
              <p className="lp-hero__headline">Manage your entire workforce in one place.</p>
              <p className="lp-hero__sub">
                Streamline employees, projects, finances, and performance with one intelligent platform built to simplify your business operations.
              </p>
              <div className="lp-hero__cta">
                <Link to="/login" className="lp-btn lp-btn--accent lp-btn--xl">
                  Get Started <FiArrowRight />
                </Link>
                <button type="button" className="lp-btn lp-btn--ghost lp-btn--xl" onClick={() => scrollTo('story')}>
                  Explore Features
                </button>
              </div>
            </div>
            <div className="lp-hero__scroll-wrap">
              <a
                href="#story"
                className="lp-hero__scroll"
                onClick={(e) => { e.preventDefault(); scrollTo('story'); }}
              >
                Scroll
                <span aria-hidden />
              </a>
            </div>
          </div>
        </section>

        <section id="story" className="lp-band lp-band--light">
          <div className="lp-section lp-problem">
            <div className="lp-problem__intro lp-reveal">
              <div className="lp-problem__watermark" aria-hidden>01</div>
              <div className="lp-problem__intro-inner">
                <span className="lp-section__label">The problem</span>
                <h2 className="lp-section__title">Work falls apart between tools.</h2>
                <p className="lp-section__text">
                  {APP_NAME} exists because growing teams need one place where delivery, people, and money stay connected.
                </p>
              </div>
            </div>
            <ul className="lp-problem__list">
              {PROBLEMS.map((item, index) => {
                const Icon = item.icon;
                return (
                  <li key={item.title} className="lp-problem__item lp-interactive">
                    <span className="lp-problem__icon"><Icon /></span>
                    <div>
                      <h3>{item.title}</h3>
                      <p>{item.text}</p>
                    </div>
                    <span className="lp-problem__idx">0{index + 1}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        <section className="lp-band lp-band--dark lp-promise">
          <div className="lp-promise__glow lp-promise__glow--a" aria-hidden />
          <div className="lp-promise__glow lp-promise__glow--b" aria-hidden />
          <div className="lp-promise__inner">
            <div className="lp-reveal">
              <span className="lp-section__label">The promise</span>
              <h2 className="lp-section__title">Everything your team runs on — in one rhythm.</h2>
              <p className="lp-section__text">
                Projects, boards, roles, analytics, budgets, and an AI assistant that understands permissions.
                Not another disconnected dashboard — an operating system for your workforce.
              </p>
            </div>
            <div className="lp-promise__stats">
              <div className="lp-promise__stat lp-interactive">
                <strong>Live</strong>
                <span>Realtime boards & notifications</span>
              </div>
              <div className="lp-promise__stat lp-interactive">
                <strong>5</strong>
                <span>Role types with precise access</span>
              </div>
              <div className="lp-promise__stat lp-interactive">
                <strong>AI</strong>
                <span>Permission-aware assistant</span>
              </div>
              <div className="lp-promise__stat lp-interactive">
                <strong>Fin</strong>
                <span>Finance tied to delivery</span>
              </div>
            </div>
          </div>
        </section>

        <div className="lp-marquee" aria-hidden>
          <div className="lp-marquee__track">
            {[...MARQUEE, ...MARQUEE].map((label, i) => (
              <span key={`${label}-${i}`} className="lp-marquee__item">
                <FiZap /> {label}
              </span>
            ))}
          </div>
        </div>

        <section id="features" className="lp-band lp-band--light lp-features">
          <div className="lp-features__head lp-reveal">
            <span className="lp-section__label">Capabilities</span>
            <h2 className="lp-section__title">Built for how serious teams actually work.</h2>
            <p className="lp-section__text">
              Every module maps to a real operating need — assign, ship, review, measure, and pay.
            </p>
          </div>
          <div className="lp-features__bento">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <article key={feature.num} className="lp-features__card lp-interactive">
                  <div className="lp-features__top">
                    <span className="lp-features__num">{feature.num}</span>
                    <span className="lp-features__icon"><Icon /></span>
                  </div>
                  <h3 className="lp-features__title">{feature.title}</h3>
                  <p className="lp-features__desc">{feature.desc}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="lp-band lp-band--dark lp-board">
          <div className="lp-board__inner">
            <div className="lp-reveal">
              <span className="lp-section__label">Boards</span>
              <h2 className="lp-section__title">Kanban that stays honest.</h2>
              <p className="lp-section__text">
                Tasks move with assignees, deadlines, estimates, reviews, and comments — so status is never a mystery.
              </p>
              <ul className="lp-board__points">
                {BOARD_POINTS.map((point) => (
                  <li key={point} className="lp-board__point">
                    <span aria-hidden />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
            <div className="lp-board__stage">
              <div className="lp-board__mock" aria-hidden>
                {[
                  { title: 'Todo', cards: ['Brief intake', 'Scope check', null] },
                  { title: 'In Progress', cards: ['UI system', 'API hooks', 'QA prep'] },
                  { title: 'In Review', cards: ['Design pass', 'Code review', null] },
                  { title: 'Done', cards: ['Launch checklist', null, null] }
                ].map((col) => (
                  <div key={col.title} className="lp-board__col">
                    <div className="lp-board__col-title">{col.title}</div>
                    {col.cards.map((card, idx) => (
                      card ? (
                        <div
                          key={card}
                          className={`lp-board__card${idx === 0 && col.title === 'In Progress' ? ' lp-board__card--accent' : ''}${idx === 0 && col.title === 'In Review' ? ' lp-board__card--soft' : ''}`}
                        >
                          {card}
                        </div>
                      ) : (
                        <div key={`empty-${col.title}-${idx}`} style={{ minHeight: '0.5rem' }} />
                      )
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="roles" className="lp-band lp-band--light lp-roles">
          <div className="lp-roles__inner">
            <div className="lp-reveal">
              <span className="lp-section__label">Who it serves</span>
              <h2 className="lp-section__title">Clear roles. Clear power.</h2>
              <p className="lp-section__text">
                Access is intentional. Everyone works in the same product — without seeing the wrong things.
              </p>
            </div>
            <div className="lp-roles__grid">
              {ROLES.map((role, index) => {
                const Icon = role.icon;
                return (
                  <article
                    key={role.title}
                    className="lp-roles__item lp-interactive"
                    data-index={`0${index + 1}`}
                  >
                    <span className="lp-roles__icon"><Icon /></span>
                    <h3>{role.title}</h3>
                    <p>{role.text}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="flow" className="lp-band lp-band--dark lp-steps">
          <div className="lp-steps__glow" aria-hidden />
          <div className="lp-steps__inner">
            <div className="lp-steps__head lp-reveal">
              <span className="lp-section__label">How it works</span>
              <h2 className="lp-section__title">Three moves to a living system.</h2>
              <p className="lp-section__text">
                From first invite to measurable delivery — a clear path your whole team can follow.
              </p>
            </div>

            <div className="lp-steps__progress" aria-hidden>
              <div className="lp-steps__line">
                <span className="lp-steps__line-fill" />
              </div>
              {STEPS.map((step) => (
                <div key={step.tag} className="lp-steps__node">
                  <span className="lp-steps__dot" />
                  <span className="lp-steps__node-label">{step.tag}</span>
                </div>
              ))}
            </div>

            <div className="lp-steps__track">
              {STEPS.map((step, index) => {
                const Icon = step.icon;
                return (
                  <article key={step.title} className="lp-steps__card lp-interactive">
                    <div className="lp-steps__card-top">
                      <span className="lp-steps__badge">Step 0{index + 1}</span>
                      <span className="lp-steps__tag">{step.tag}</span>
                    </div>
                    <div className="lp-steps__icon"><Icon /></div>
                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                    <div className="lp-steps__footer">
                      <span className="lp-steps__big">{`0${index + 1}`}</span>
                      {index < STEPS.length - 1 && (
                        <span className="lp-steps__next" aria-hidden>
                          <FiArrowRight />
                        </span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="lp-band lp-band--light lp-cta">
          <div className="lp-cta__panel lp-reveal">
            <div className="lp-cta__orb lp-cta__orb--a" aria-hidden />
            <div className="lp-cta__orb lp-cta__orb--b" aria-hidden />
            <h2 className="lp-cta__title">Ready to run the team properly?</h2>
            <p className="lp-cta__text">
              Step into {APP_NAME} — projects, people, performance, and finance in one continuous flow.
            </p>
            <div className="lp-cta__actions">
              <Link to="/login" className="lp-btn lp-btn--accent lp-btn--xl">
                Open app <FiArrowRight />
              </Link>
              <button type="button" className="lp-btn lp-btn--ghost-light lp-btn--xl" onClick={scrollTop}>
                Back to top
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="lp-footer">
        <div className="lp-footer__inner">
          <p className="lp-footer__copy">
            © {new Date().getFullYear()} {APP_NAME}. Crafted by {CREATOR_NAME}.
          </p>
          <div className="lp-footer__links">
            <Link to="/login">Open app</Link>
            <a href="#features" onClick={(e) => { e.preventDefault(); scrollTo('features'); }}>Features</a>
          </div>
        </div>
      </footer>

      <button
        type="button"
        className={`lp-top${showTop ? ' is-visible' : ''}`}
        onClick={scrollTop}
        aria-label="Back to top"
      >
        <FiArrowUp />
      </button>
    </div>
  );
};

export default Landing;
