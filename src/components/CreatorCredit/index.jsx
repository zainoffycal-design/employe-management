import { memo } from 'react';
import { CREATOR_NAME } from '../../constants/app';
import './CreatorCredit.scss';

const CreatorCredit = memo(({ className = '', variant = 'default' }) => (
  <p className={`creator-credit creator-credit--${variant} ${className}`.trim()}>
    Created by {CREATOR_NAME}
  </p>
));

CreatorCredit.displayName = 'CreatorCredit';

export default CreatorCredit;
