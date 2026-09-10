/**
 * Main App Layout Shell
 * 
 * Hinglish Hint:
 * Har screen ko ek structured responsive container me wrap karta hai:
 * - Desktop (>=1024px): Sleek top desktop navbar + wide responsive workspace
 * - Mobile (<1024px): Mobile header + content + bottom tab navigation
 */

import React from 'react';
import { AppHeader } from './AppHeader';
import { BottomNav } from './BottomNav';
import { DesktopNavbar } from './DesktopNavbar';

export const AppLayout = ({
  children,
  title,
  subtitle,
  showBack = false,
  hideNav = false,
}) => {
  return (
    <div className="app-container">
      {!hideNav && <DesktopNavbar />}
      <AppHeader title={title} subtitle={subtitle} showBack={showBack} />
      <main className={`app-content ${hideNav ? 'no-bottom-nav' : ''}`}>
        {children}
      </main>
      {!hideNav && <BottomNav />}
    </div>
  );
};
