import { memo } from 'react';
import { APP_NAME, CREATOR_NAME } from '../../constants/app';
import './AppFooter.scss';

const AppFooter = memo(({ className = '' }) => (
  <footer className={`app-footer ${className}`.trim()}>
    <span className="app-footer__brand">{APP_NAME}</span>
    <span className="app-footer__sep" aria-hidden>·</span>
    <span className="app-footer__creator">Created by {CREATOR_NAME}</span>
  </footer>
));

AppFooter.displayName = 'AppFooter';

export default AppFooter;
