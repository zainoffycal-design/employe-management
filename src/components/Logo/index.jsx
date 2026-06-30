import { memo } from 'react';
import { Link } from 'react-router-dom';
import { APP_NAME } from '../../constants/app';
import './Logo.scss';

const LogoMark = memo(() => (
  <svg
    className="app-logo__mark"
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden
  >
    <rect className="app-logo__mark-bg" width="40" height="40" rx="10" />
    <circle className="app-logo__mark-fg" cx="20" cy="13" r="4.5" />
    <path
      className="app-logo__mark-fg"
      d="M11 29c0-4.1 3.4-7.5 9-7.5s9 3.4 9 7.5"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <circle className="app-logo__mark-fg app-logo__mark-fg--muted" cx="9" cy="15" r="3" />
    <path
      className="app-logo__mark-fg app-logo__mark-fg--muted"
      d="M4 29c0-3 2.2-5.5 5.5-5.5"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <circle className="app-logo__mark-fg app-logo__mark-fg--muted" cx="31" cy="15" r="3" />
    <path
      className="app-logo__mark-fg app-logo__mark-fg--muted"
      d="M36 29c0-3-2.2-5.5-5.5-5.5"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
));

LogoMark.displayName = 'LogoMark';

const Logo = memo(({
  variant = 'default',
  size = 'md',
  className = '',
  to,
  onClick,
  title = APP_NAME
}) => {
  const content = (
    <>
      <LogoMark />
      <span className="app-logo__wordmark">
        <span className="app-logo__line">Employee</span>
        <span className="app-logo__line app-logo__line--accent">Management System</span>
      </span>
    </>
  );

  const classes = `app-logo app-logo--${variant} app-logo--${size} ${className}`.trim();

  if (to) {
    return (
      <Link to={to} className={classes} title={title} aria-label={title}>
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button type="button" className={classes} onClick={onClick} title={title} aria-label={title}>
        {content}
      </button>
    );
  }

  return (
    <div className={classes} title={title}>
      {content}
    </div>
  );
});

Logo.displayName = 'Logo';

export default Logo;
