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
  FiShield,
  FiBriefcase,
  FiCode,
  FiPenTool,
  FiTrendingUp,
  FiCpu
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
    title: 'Scattered tools',
    text: 'Tasks in one app, people in another, money somewhere else — context dies in the gaps.'
  },
  {
    title: 'No shared visibility',
    text: 'Managers chase updates while teams wait for clarity. Progress becomes guesswork.'
  },
  {
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
    tag: 'People'
  },
  {
    title: 'Build projects & boards',
    text: 'Spin up projects, drop tasks on the Kanban, assign owners, and watch progress update live.',
    tag: 'Delivery'
  },
  {
    title: 'Measure what matters',
    text: 'Use analytics, performance, and finance views to steer delivery — not just react to it.',
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

const CTA_RAIL = [
  'One workspace',
  'Clear ownership',
  'Live status',
  'Measured delivery',
  'Permission-aware AI',
  'Finance connected',
  'Faster handoffs',
  'Less tool switching',
  'Roles that scale',
  'Ship with clarity'
];

const PREVIEW_COLUMNS = [
  {
    title: 'Todo',
    count: 2,
    cards: [
      { name: 'Brief intake', meta: 'Ayesha · 2h' },
      { name: 'Scope check', meta: 'Omar · 4h' }
    ]
  },
  {
    title: 'In progress',
    count: 2,
    cards: [
      { name: 'UI system', meta: 'Zain · 6h', tone: 'accent' },
      { name: 'API hooks', meta: 'Hira · 3h' }
    ]
  },
  {
    title: 'Review',
    count: 1,
    cards: [
      { name: 'Design pass', meta: 'Ready', tone: 'soft' }
    ]
  }
];

const HeroPreview = () => (
  <div className="lp-preview">
    <div className="lp-preview__bar">
      <span className="lp-preview__dots" aria-hidden>
        <i /><i /><i />
      </span>
      <span className="lp-preview__name">Northwind · Board</span>
      <span className="lp-preview__live">Live</span>
    </div>
    <div className="lp-preview__body">
      <aside className="lp-preview__nav">
        <strong>Workspace</strong>
        <span className="is-on">Board</span>
        <span>People</span>
        <span>Finance</span>
        <span>Analytics</span>
      </aside>
      <div className="lp-preview__main">
        <div className="lp-preview__stats">
          <div><b>12</b><span>Open</span></div>
          <div><b>4</b><span>Review</span></div>
          <div><b>86%</b><span>On time</span></div>
        </div>
        <div className="lp-preview__cols">
          {PREVIEW_COLUMNS.map((column) => (
            <div key={column.title} className="lp-preview__col">
              <header>
                {column.title}
                <em>{column.count}</em>
              </header>
              {column.cards.map((card) => (
                <article key={card.name} className={card.tone ? `is-${card.tone}` : undefined}>
                  <strong>{card.name}</strong>
                  <span>{card.meta}</span>
                </article>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const Landing = () => {
  const BOARD_POINTS = [
    'Assignees & deadlines on every card',
    'Estimates and logged hours in one place',
    'Reviews and comments without leaving the board'
  ];

  const rootRef = useRef(null);
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
    }, root);

    let motionObserver;
    if (!reduced) {
      const motionNodes = [...root.querySelectorAll('.lp-hero, .lp-band, .lp-marquee')];
      motionObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-seen');
            entry.target.classList.add('is-inview');
            const idx = motionNodes.indexOf(entry.target);
            for (let i = 0; i < idx; i += 1) {
              motionNodes[i].classList.add('is-seen');
            }
          } else {
            entry.target.classList.remove('is-inview');
          }
        });
      }, { rootMargin: '120px 0px', threshold: 0.1 });
      motionNodes.forEach((node) => motionObserver.observe(node));
    } else {
      root.querySelectorAll('.lp-hero, .lp-band, .lp-marquee').forEach((node) => {
        node.classList.add('is-seen');
      });
    }

    return () => {
      motionObserver?.disconnect();
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
      <div ref={progressRef} className="lp-progress" aria-hidden />

      <header className={`lp-nav${navSolid ? ' is-solid' : ' lp-nav--hero'}`}>
        <div className="lp-nav__inner">
          <a href="#top" className="lp-nav__brand" onClick={(e) => { e.preventDefault(); scrollTop(); }}>
            <Logo size="md" />
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
          <div className="lp-hero__shell">
            <div className="lp-hero__content">
              <h1 className="lp-hero__headline">Manage your entire workforce in one place.</h1>
              <p className="lp-hero__sub">
                Projects, people, time, and finance stay on one board, with access that matches each role.
              </p>
              <div className="lp-hero__cta">
                <Link to="/login" className="lp-btn lp-btn--accent lp-btn--xl">
                  Get Started <FiArrowRight />
                </Link>
                <button type="button" className="lp-btn lp-btn--ghost lp-btn--xl" onClick={() => scrollTo('features')}>
                  See the product
                </button>
              </div>
              <ul className="lp-hero__facts">
                <li><strong>5</strong> roles</li>
                <li><strong>Live</strong> boards</li>
                <li><strong>AI</strong> that respects access</li>
              </ul>
            </div>
            <div className="lp-hero__visual">
              <HeroPreview />
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

        <section id="story" className="lp-band lp-band--dark">
          <div className="lp-section lp-problem">
            <div className="lp-problem__intro lp-reveal">
              <div className="lp-problem__intro-inner">
                <span className="lp-section__label">The problem</span>
                <h2 className="lp-section__title">Work falls apart between tools.</h2>
                <p className="lp-section__text">
                  {APP_NAME} exists because growing teams need one place where delivery, people, and money stay connected.
                </p>
              </div>
            </div>
            <ol className="lp-problem__list">
              {PROBLEMS.map((item, index) => (
                <li key={item.title} className="lp-problem__item">
                  <span className="lp-problem__idx">0{index + 1}</span>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="lp-band lp-band--light lp-promise">
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

        <section id="features" className="lp-band lp-band--dark lp-features">
          <div className="lp-features__layout">
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
                  <article
                    key={feature.num}
                    className={`lp-features__card lp-interactive${feature.num === '01' ? ' is-lead' : ''}`}
                  >
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
          </div>
        </section>

        <section className="lp-band lp-band--light lp-board">
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

        <section id="roles" className="lp-band lp-band--dark lp-roles">
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

        <section id="flow" className="lp-band lp-band--light lp-steps">
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
              {STEPS.map((step, index) => (
                <article key={step.title} className="lp-steps__card">
                  <span className="lp-steps__badge">0{index + 1}</span>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="lp-band lp-band--dark lp-cta">
          <div className="lp-cta__glow" aria-hidden />
          <div className="lp-cta__inner">
            <div className="lp-cta__copy">
              <span className="lp-section__label">Start now</span>
              <h2 className="lp-cta__title">Ready to run the team properly?</h2>
              <p className="lp-cta__text">
                Step into {APP_NAME} — projects, people, performance, and finance in one continuous flow.
              </p>
              <div className="lp-cta__actions">
                <Link to="/login" className="lp-btn lp-btn--accent lp-btn--xl lp-cta__primary">
                  Open app <FiArrowRight />
                </Link>
                <button type="button" className="lp-btn lp-btn--ghost-light lp-btn--xl" onClick={() => scrollTo('features')}>
                  See capabilities
                </button>
              </div>
            </div>
            <ul className="lp-cta__list">
              <li><span>01</span> Role-based access from day one</li>
              <li><span>02</span> Live boards for every project</li>
              <li><span>03</span> Finance tied to delivery</li>
              <li><span>04</span> AI that respects permissions</li>
            </ul>
          </div>
          <div className="lp-cta__rail" aria-hidden>
            <div className="lp-cta__rail-track">
              {[...CTA_RAIL, ...CTA_RAIL].map((label, i) => (
                <span key={`cta-${label}-${i}`}>{label}</span>
              ))}
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
