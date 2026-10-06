import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import {
  FiArrowUp,
  FiArrowRight,
  FiMenu,
  FiX,
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
  FiCpu,
  FiUserPlus,
  FiFolderPlus,
  FiBarChart2,
  FiCheck,
  FiMinus,
  FiPlus
} from 'react-icons/fi';
import { APP_NAME, CREATOR_NAME } from '../../constants/app';
import Logo from '../../components/Logo';
import 'lenis/dist/lenis.css';
import './Landing.scss';

gsap.registerPlugin(ScrollTrigger);

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
    title: 'Permissions as an afterthought',
    text: 'Without clear roles, either everyone sees too much, or the wrong people get blocked.'
  }
];

const FEATURES = [
  {
    title: 'Project Management',
    desc: 'Create projects, assign teams, set priorities, and track status from a single command surface.',
    icon: FiLayers,
    mock: 'projects'
  },
  {
    title: 'Kanban Boards',
    desc: 'Move work through Todo, In Progress, In Review, and Done with live updates for everyone involved.',
    icon: FiColumns,
    mock: 'kanban'
  },
  {
    title: 'Role-Based Access',
    desc: 'Super Managers, Managers, Designers, Developers, and BD each see exactly what they need — nothing more.',
    icon: FiShield,
    mock: 'roles'
  },
  {
    title: 'Time & Performance',
    desc: 'Hours logged against estimates, budget burn against delivery, and overdue work surfaced early — per person, per project.',
    icon: FiClock,
    mock: 'chart'
  },
  {
    title: 'Finance & Commissions',
    desc: 'Budgets, payments, and commission tracking stay connected to the work that earns them.',
    icon: FiDollarSign,
    mock: 'finance'
  },
  {
    title: 'AI Workspace Assistant',
    desc: 'Ask questions, navigate faster, and take actions through a permission-aware chatbot that respects every role boundary.',
    icon: FiMessageCircle,
    mock: 'chat'
  }
];

const ROLES = [
  {
    icon: FiBriefcase,
    title: 'Super Manager',
    text: 'Full control over users, finance, performance, and every project in the system.',
    scope: 100,
    access: ['Projects', 'Users', 'Finance', 'Performance', 'AI Assistant']
  },
  {
    icon: FiUsers,
    title: 'Manager',
    text: 'Lead teams, assign work, review delivery, and keep projects moving.',
    scope: 72,
    access: ['Projects', 'Users', 'Performance', 'AI Assistant']
  },
  {
    icon: FiTrendingUp,
    title: 'Business Developer',
    text: 'Stay close to project momentum and budget visibility where it matters.',
    scope: 52,
    access: ['Projects', 'Performance', 'AI Assistant']
  },
  {
    icon: FiPenTool,
    title: 'Designer',
    text: 'Own design tasks, update status, and collaborate with clear deadlines.',
    scope: 38,
    access: ['Assigned projects', 'AI Assistant']
  },
  {
    icon: FiCode,
    title: 'Developer',
    text: 'Ship assigned work on the board with time tracking built into the flow.',
    scope: 38,
    access: ['Assigned projects', 'Time tracking', 'AI Assistant']
  },
  {
    icon: FiCpu,
    title: 'AI Assistant',
    text: 'A co-pilot that respects whoever is asking and helps them act inside the product.',
    scope: 28,
    access: ['Read-only context', 'Permission-aware actions']
  }
];

const STEPS = [
  {
    title: 'Invite your team',
    text: 'Add people with the right roles. They set a password and land inside a workspace built for them.',
    icon: FiUserPlus
  },
  {
    title: 'Build projects & boards',
    text: 'Spin up projects, drop tasks on the Kanban, assign owners, and watch progress update live.',
    icon: FiFolderPlus
  },
  {
    title: 'Measure what matters',
    text: 'Use analytics, performance, and finance views to steer delivery — not just react to it.',
    icon: FiBarChart2
  }
];

const BOARD_POINTS = [
  'Assignees & deadlines on every card',
  'Estimates and logged hours in one place',
  'Reviews and comments without leaving the board'
];

const BOARD_COLUMNS = [
  { title: 'Todo', status: 'todo', cards: ['Brief intake', 'Scope check'] },
  { title: 'In Progress', status: 'in-progress', cards: ['UI system', 'API hooks'] },
  { title: 'In Review', status: 'in-review', cards: ['Design pass'] },
  { title: 'Done', status: 'done', cards: ['Launch checklist'] }
];

const CHART_BARS = [38, 52, 46, 68, 74, 60, 82];

const CHAT_PREVIEW = [
  { from: 'user', text: "Who's overdue on the Nova project?" },
  { from: 'ai', text: '2 tasks are overdue, both assigned to Developers. Want me to notify them?' }
];

const PROJECT_ROWS = [
  { name: 'Nova — Marketing Site', progress: 72 },
  { name: 'Atlas — Mobile App', progress: 45 },
  { name: 'Forge — Internal Tools', progress: 90 }
];

const BUDGET_ROWS = [
  { name: 'Nova budget', spent: 68 },
  { name: 'Atlas budget', spent: 34 },
  { name: 'Forge budget', spent: 95 }
];

const MATRIX_COLS = ['Projects', 'Users', 'Finance'];
const MATRIX_ROWS = [
  { role: 'Super Manager', grants: [true, true, true] },
  { role: 'Manager', grants: [true, true, false] },
  { role: 'Designer', grants: [true, false, false] },
  { role: 'Developer', grants: [true, false, false] }
];

const FAQ_ITEMS = [
  {
    q: 'Who can see what inside the platform?',
    a: 'Every screen is scoped by role. Super Managers see everything; Managers see their teams; Designers, Developers, and Business Developers only see the projects and data relevant to their work.'
  },
  {
    q: 'Can the AI assistant take actions, or does it just answer questions?',
    a: 'Both. It can look up projects, tasks, and people, and perform actions like creating tasks or notifying teammates — always within whatever that user is already permitted to do.'
  },
  {
    q: 'How accurate is the time tracking?',
    a: 'Time is logged per task against an estimate, so you always see planned vs. actual hours, both per person and rolled up per project.'
  },
  {
    q: 'Does it handle budgets and commissions, or just tasks?',
    a: 'Both. Project budgets, payments, and commission tracking live alongside delivery, so finance never has to be reconciled from a separate spreadsheet.'
  },
  {
    q: 'What roles are supported today?',
    a: 'Super Manager, Manager, Designer, Developer, and Business Developer — each with a distinct, pre-scoped set of permissions out of the box.'
  }
];

const BoardMock = ({ compact = false }) => (
  <div className={`lp-board-mock${compact ? ' lp-board-mock--compact' : ''}`}>
    {BOARD_COLUMNS.map((col) => (
      <div key={col.title} className="lp-board-mock__col">
        <div className="lp-board-mock__col-title">
          <span className={`lp-board-mock__dot lp-board-mock__dot--${col.status}`} />
          {col.title}
        </div>
        {col.cards.map((card) => (
          <div key={card} className={`lp-board-mock__card lp-board-mock__card--${col.status}`}>
            {card}
          </div>
        ))}
      </div>
    ))}
  </div>
);

const ChartMock = ({ label }) => (
  <div className="lp-chart-mock">
    {label && <span className="lp-chart-mock__label">{label}</span>}
    <div className="lp-chart-mock__bars">
      {CHART_BARS.map((height, index) => (
        <span
          key={index}
          className={`lp-chart-mock__bar${index === CHART_BARS.length - 1 ? ' is-accent' : ''}`}
          style={{ height: `${height}%` }}
        />
      ))}
    </div>
    <div className="lp-chart-mock__axis">
      {CHART_BARS.map((_, index) => (
        <span key={index}>{`W${index + 1}`}</span>
      ))}
    </div>
  </div>
);

const ListMock = ({ rows, overAt }) => (
  <div className="lp-mock-list">
    {rows.map((row) => {
      const value = row.progress ?? row.spent;
      return (
        <div key={row.name} className="lp-mock-list__row">
          <span className="lp-mock-list__name">{row.name}</span>
          <span className="lp-mock-list__bar">
            <span
              className={`lp-mock-list__fill${overAt && value >= overAt ? ' is-over' : ''}`}
              style={{ width: `${Math.min(value, 100)}%` }}
            />
          </span>
          <span className="lp-mock-list__pct">{value}%</span>
        </div>
      );
    })}
  </div>
);

const RoleMatrixMock = () => (
  <div className="lp-matrix">
    <div className="lp-matrix__row lp-matrix__row--head">
      <span />
      {MATRIX_COLS.map((col) => (
        <span key={col}>{col}</span>
      ))}
    </div>
    {MATRIX_ROWS.map((row) => (
      <div key={row.role} className="lp-matrix__row">
        <span className="lp-matrix__label">{row.role}</span>
        {row.grants.map((granted, index) => (
          <span key={index} className={`lp-matrix__cell${granted ? ' is-granted' : ''}`}>
            {granted ? <FiCheck /> : <FiMinus />}
          </span>
        ))}
      </div>
    ))}
  </div>
);

const ChatMock = () => (
  <div className="lp-chat-mock">
    {CHAT_PREVIEW.map((line, index) => (
      <span key={index} className={`lp-chat-mock__bubble lp-chat-mock__bubble--${line.from}`}>
        {line.text}
      </span>
    ))}
  </div>
);

const TOUR_VISUALS = {
  projects: () => <ListMock rows={PROJECT_ROWS} />,
  kanban: () => <BoardMock compact />,
  roles: () => <RoleMatrixMock />,
  chart: () => <ChartMock label="Logged hours — last 7 weeks" />,
  finance: () => <ListMock rows={BUDGET_ROWS} overAt={90} />,
  chat: () => <ChatMock />
};

const Landing = () => {
  const rootRef = useRef(null);
  const progressRef = useRef(null);
  const lenisRef = useRef(null);
  const tourRowsRef = useRef([]);
  const [navSolid, setNavSolid] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);
  const [activeFeature, setActiveFeature] = useState(0);
  const [activeRole, setActiveRole] = useState(0);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let lenis;
    const ctx = gsap.context(() => {
      if (!reduced) {
        lenis = new Lenis({
          duration: 1.1,
          easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)),
          smoothWheel: true
        });
        lenisRef.current = lenis;

        lenis.on('scroll', ScrollTrigger.update);
        const ticker = (time) => lenis.raf(time * 1000);
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
        setNavSolid(y > 24);
        setShowTop(y > 600);
      };

      if (lenis) {
        lenis.on('scroll', onScrollUi);
      } else {
        window.addEventListener('scroll', onScrollUi, { passive: true });
        root._lpScroll = onScrollUi;
      }
      onScrollUi();

      gsap.from('.lp-hero__shell > *', {
        y: 24,
        opacity: 0,
        duration: reduced ? 0.01 : 0.7,
        stagger: reduced ? 0 : 0.08,
        ease: 'power2.out'
      });

      gsap.from('.lp-hero__frame', {
        y: 24,
        opacity: 0,
        duration: reduced ? 0.01 : 0.8,
        ease: 'power2.out',
        delay: reduced ? 0 : 0.15
      });

      gsap.utils.toArray('.lp-reveal').forEach((el) => {
        gsap.from(el, {
          y: 32,
          opacity: 0,
          duration: reduced ? 0.01 : 0.7,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 88%',
            toggleActions: 'play none none none'
          }
        });
      });

      gsap.utils.toArray('.lp-reveal-group').forEach((group) => {
        gsap.from(group.children, {
          y: 28,
          opacity: 0,
          duration: reduced ? 0.01 : 0.6,
          stagger: reduced ? 0 : 0.08,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: group,
            start: 'top 88%',
            toggleActions: 'play none none none'
          }
        });
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

      if (document.querySelector('.lp-board__demo-card')) {
        gsap.fromTo(
          '.lp-board__demo-card',
          { left: '28%', opacity: 0 },
          {
            left: '80%',
            opacity: 1,
            duration: reduced ? 0.01 : 1.2,
            ease: 'power2.inOut',
            scrollTrigger: {
              trigger: '.lp-board__stage',
              start: 'top 70%',
              toggleActions: 'play none none reverse'
            }
          }
        );
      }
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
    };
  }, []);

  useEffect(() => {
    const rows = tourRowsRef.current.filter(Boolean);
    if (!rows.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.dataset.index);
            if (!Number.isNaN(index)) setActiveFeature(index);
          }
        });
      },
      { rootMargin: '-40% 0px -40% 0px', threshold: 0 }
    );

    rows.forEach((row) => observer.observe(row));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    gsap.fromTo(
      '.lp-personas__bar',
      { scaleX: 0 },
      { scaleX: 1, transformOrigin: 'left center', duration: reduced ? 0.01 : 0.6, ease: 'power2.out' }
    );
  }, [activeRole]);

  const scrollTo = (id) => {
    setMenuOpen(false);
    const el = document.getElementById(id);
    if (!el) return;
    if (lenisRef.current) {
      lenisRef.current.scrollTo(el, { offset: -72 });
      return;
    }
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollTop = () => {
    setMenuOpen(false);
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0);
      return;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navLinks = [
    { id: 'story', label: 'Story' },
    { id: 'features', label: 'Features' },
    { id: 'roles', label: 'Roles' },
    { id: 'flow', label: 'How it works' }
  ];

  const ActiveVisual = TOUR_VISUALS[FEATURES[activeFeature].mock];

  return (
    <div ref={rootRef} className="landing">
      <div ref={progressRef} className="lp-progress" aria-hidden />

      <header className={`lp-nav${navSolid ? ' is-solid' : ''}${menuOpen ? ' is-open' : ''}`}>
        <div className="lp-nav__inner">
          <a href="#top" className="lp-nav__brand" onClick={(e) => { e.preventDefault(); scrollTop(); }}>
            <Logo size="md" />
          </a>

          <nav className="lp-nav__links" aria-label="Landing">
            {navLinks.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                onClick={(e) => { e.preventDefault(); scrollTo(link.id); }}
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="lp-nav__actions">
            <Link to="/login" className="lp-btn lp-btn--solid">
              Open app <FiArrowRight />
            </Link>
            <button
              type="button"
              className="lp-nav__toggle"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              {menuOpen ? <FiX /> : <FiMenu />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="lp-nav__mobile">
            {navLinks.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                onClick={(e) => { e.preventDefault(); scrollTo(link.id); }}
              >
                {link.label}
              </a>
            ))}
          </div>
        )}
      </header>

      <main id="top">
        <section className="lp-hero">
          <div className="lp-hero__shell">
            <span className="lp-hero__eyebrow">Workforce operations, unified</span>
            <h1 className="lp-hero__title">
              Manage your entire <span className="lp-hero__title-accent">workforce</span> in one place.
            </h1>
            <p className="lp-hero__sub">
              Projects, people, performance, and finance — streamlined into one platform
              built to keep delivery clear and your business moving.
            </p>
            <div className="lp-hero__cta">
              <Link to="/login" className="lp-btn lp-btn--accent lp-btn--xl">
                Get started <FiArrowRight />
              </Link>
              <button type="button" className="lp-btn lp-btn--ghost lp-btn--xl" onClick={() => scrollTo('features')}>
                Explore features
              </button>
            </div>
          </div>

          <div className="lp-hero__showcase">
            <div className="lp-hero__frame">
              <div className="lp-hero__frame-bar">
                <span />
                <span />
                <span />
              </div>
              <div className="lp-hero__app">
                <div className="lp-hero__sidebar">
                  {[FiLayers, FiColumns, FiUsers, FiBarChart2, FiDollarSign].map((Icon, index) => (
                    <span key={index} className={`lp-hero__sidebar-icon${index === 1 ? ' is-active' : ''}`}>
                      <Icon />
                    </span>
                  ))}
                </div>
                <div className="lp-hero__main">
                  <div className="lp-hero__topbar">
                    <span className="lp-hero__search" />
                    <span className="lp-hero__avatars">
                      <span>A</span>
                      <span>M</span>
                      <span>D</span>
                    </span>
                  </div>
                  <BoardMock compact />
                </div>
              </div>

              <div className="lp-hero__badge lp-hero__badge--a">
                <FiZap /> Real-time sync
              </div>
              <div className="lp-hero__badge lp-hero__badge--b">
                <FiShield /> Role-based access
              </div>
            </div>
          </div>
        </section>

        <section id="story" className="lp-section-band">
          <div className="lp-shell lp-manifesto-wrap">
            <span className="lp-eyebrow lp-reveal">The problem</span>
            <div className="lp-manifesto lp-reveal-group">
              <p className="lp-manifesto__lead">
                {APP_NAME} exists because growing teams need one place where delivery, people, and money stay connected.
              </p>
              {PROBLEMS.map((item) => (
                <p key={item.title} className="lp-manifesto__line">
                  <span className="lp-manifesto__mark">{item.title}.</span> {item.text}
                </p>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="lp-section-band lp-section-band--tint lp-tour">
          <div className="lp-shell">
            <div className="lp-section-head lp-reveal">
              <span className="lp-eyebrow">Capabilities</span>
              <h2 className="lp-title">Built for how serious teams actually work.</h2>
              <p className="lp-text">
                One workspace, six real jobs — scroll to see what each one looks like in practice.
              </p>
            </div>

            <div className="lp-tour__grid">
              <div className="lp-tour__rows">
                {FEATURES.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <button
                      key={feature.title}
                      type="button"
                      ref={(el) => { tourRowsRef.current[index] = el; }}
                      data-index={index}
                      className={`lp-tour__row${activeFeature === index ? ' is-active' : ''}`}
                      onClick={() => setActiveFeature(index)}
                    >
                      <span className="lp-icon-box"><Icon /></span>
                      <span className="lp-tour__row-text">
                        <h3>{feature.title}</h3>
                        <p>{feature.desc}</p>
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="lp-tour__visual">
                <div className="lp-tour__frame">
                  <div className="lp-hero__frame-bar">
                    <span />
                    <span />
                    <span />
                  </div>
                  <div key={activeFeature} className="lp-tour__visual-inner">
                    <ActiveVisual />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="lp-section-band lp-board">
          <div className="lp-shell lp-board__inner">
            <div className="lp-reveal">
              <span className="lp-eyebrow">Boards</span>
              <h2 className="lp-title">Kanban that stays honest.</h2>
              <p className="lp-text">
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
            <div className="lp-board__stage lp-reveal">
              <BoardMock />
              <div className="lp-board__demo-card" aria-hidden>
                <FiCheck /> QA prep
              </div>
            </div>
          </div>
        </section>

        <section id="roles" className="lp-section-band lp-personas">
          <div className="lp-shell">
            <div className="lp-section-head lp-reveal">
              <span className="lp-eyebrow">Who it serves</span>
              <h2 className="lp-title">Clear roles. Clear power.</h2>
              <p className="lp-text">Pick a role to see exactly what it can touch.</p>
            </div>

            <div className="lp-personas__shell lp-reveal">
              <div className="lp-personas__tabs" role="tablist" aria-label="Roles">
                {ROLES.map((role, index) => (
                  <button
                    key={role.title}
                    type="button"
                    role="tab"
                    aria-selected={activeRole === index}
                    className={`lp-personas__tab${activeRole === index ? ' is-active' : ''}`}
                    onClick={() => setActiveRole(index)}
                  >
                    {role.title}
                  </button>
                ))}
              </div>

              <div key={activeRole} className="lp-personas__panel">
                <span className="lp-personas__badge">
                  {(() => {
                    const Icon = ROLES[activeRole].icon;
                    return <Icon />;
                  })()}
                </span>
                <div className="lp-personas__body">
                  <h3>{ROLES[activeRole].title}</h3>
                  <p>{ROLES[activeRole].text}</p>

                  <div className="lp-personas__chips">
                    {ROLES[activeRole].access.map((item) => (
                      <span key={item} className="lp-chip">{item}</span>
                    ))}
                  </div>

                  <div className="lp-personas__scope">
                    <span className="lp-personas__scope-label">Platform access</span>
                    <span className="lp-personas__track">
                      <span className="lp-personas__bar" style={{ width: `${ROLES[activeRole].scope}%` }} />
                    </span>
                    <span className="lp-personas__pct">{ROLES[activeRole].scope}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="flow" className="lp-section-band lp-section-band--tint lp-steps">
          <div className="lp-shell">
            <div className="lp-section-head lp-reveal">
              <span className="lp-eyebrow">How it works</span>
              <h2 className="lp-title">Three moves to a living system.</h2>
              <p className="lp-text">
                From first invite to measurable delivery — a clear path your whole team can follow.
              </p>
            </div>

            <div className="lp-steps__progress" aria-hidden>
              <div className="lp-steps__line">
                <span className="lp-steps__line-fill" />
              </div>
              {STEPS.map((step, index) => (
                <div key={step.title} className="lp-steps__node">
                  <span className="lp-steps__dot">{index + 1}</span>
                </div>
              ))}
            </div>

            <div className="lp-steps__track lp-reveal-group">
              {STEPS.map((step, index) => {
                const Icon = step.icon;
                return (
                  <article key={step.title} className="lp-steps__card">
                    <span className="lp-steps__num">0{index + 1}</span>
                    <span className="lp-icon-box"><Icon /></span>
                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="lp-section-band lp-faq">
          <div className="lp-shell lp-faq__grid">
            <div className="lp-faq__intro lp-reveal">
              <span className="lp-eyebrow">FAQ</span>
              <h2 className="lp-title">Questions, answered.</h2>
              <p className="lp-text">The practical details teams ask about before rolling this out.</p>
              <Link to="/login" className="lp-faq__cta">
                Still unsure? Ask the AI assistant <FiArrowRight />
              </Link>
            </div>

            <div className="lp-faq__list lp-reveal-group">
              {FAQ_ITEMS.map((item, index) => {
                const isOpen = openFaq === index;
                return (
                  <div key={item.q} className={`lp-faq__item${isOpen ? ' is-open' : ''}`}>
                    <button
                      type="button"
                      className="lp-faq__q"
                      aria-expanded={isOpen}
                      onClick={() => setOpenFaq(isOpen ? -1 : index)}
                    >
                      <span className="lp-faq__q-text">{item.q}</span>
                      <span className="lp-faq__icon" aria-hidden><FiPlus /></span>
                    </button>
                    <div className="lp-faq__a-wrap">
                      <div className="lp-faq__a-inner">
                        <p className="lp-faq__a">{item.a}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="lp-section-band lp-cta">
          <div className="lp-shell lp-cta__panel lp-reveal">
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
        <div className="lp-shell lp-footer__inner">
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
