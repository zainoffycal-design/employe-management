import { memo } from 'react';
import AuthShowcase from '../AuthShowcase';
import logo from '../../assets/logo.svg';
import './AuthLayout.scss';

const AuthLayout = memo(({
  children,
  title,
  subtitle,
  className = '',
  showAside = true
}) => {
  return (
    <div className={`auth-page ${className}`}>
      <div className="auth-split">
        {showAside && (
          <aside className="auth-aside">
            <AuthShowcase />
          </aside>
        )}
        <div className="auth-panel">
          <div className="auth-card">
            <div className="auth-header">
              <img src={logo} alt="Logo" className="auth-logo" />
              <h1>{title}</h1>
              <p>{subtitle}</p>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
});

AuthLayout.displayName = 'AuthLayout';

export default AuthLayout;
