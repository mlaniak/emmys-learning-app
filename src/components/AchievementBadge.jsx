/**
 * Achievement Badge Component (Legacy)
 * 
 * This component is maintained for backward compatibility.
 * New implementations should use AchievementNotification instead.
 */

import React from 'react';
import AchievementNotification from './AchievementNotification';

const AchievementBadge = (props) => {
  // Forward all props to the new AchievementNotification component
  return <AchievementNotification {...props} />;
};

export default AchievementBadge;