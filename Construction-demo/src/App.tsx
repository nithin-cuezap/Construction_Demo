/**
 * @fileoverview Root application component with routing and layout.
 * 
 * The main App component sets up the application structure including:
 * - Global state management for tender packages
 * - Route configuration for different workflow views
 * - Header with active package context
 * - Synchronization between route path and workflow stage
 * 
 * The app uses React Router for navigation and maintains tender package state
 * at the top level to share across views.
 * 
 * @module App
 */

import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Header from './components/Header';
import {
  getTenderPackagesData,
  setTenderPackagesData,
  setWorkflowStageData,
} from './TenderPackage.ops';
import type { TenderPackage } from './types';
// import AwardingView from './views/AwardingView';
// import InvitationView from './views/InvitationView';
import TenderPackageView from './views/TenderPackageView';

/**
 * Determines the workflow stage identifier from the current route path.
 * Maps URL paths to workflow stage names for database synchronization.
 * 
 * @param {string} pathname - The current route pathname
 * @returns {"TenderPackages" | "Invitation" | "Awarding"} The workflow stage identifier
 */
const stageFromPath = (pathname: string) => {
  const normalized = pathname.replace(/^\//, '').toLowerCase();
  if (normalized.startsWith('tenderpackages')) return 'TenderPackages';
  if (normalized.startsWith('invitation')) return 'Invitation';
  if (normalized.startsWith('awarding')) return 'Awarding';
  return 'TenderPackages';
};

/**
 * Root application component.
 * Manages global tender package state and provides routing structure.
 * Synchronizes workflow stage with the current route.
 * 
 * @returns {JSX.Element} The complete application UI
 */
export default function App() {
  const location = useLocation();
  
  // Initialize tender packages from mock database
  const [tenderPackages, setTenderPackages] = useState<TenderPackage[]>(
    () => getTenderPackagesData(),
  );
  
  // Track the currently active/selected tender package for header display
  const [activeTenderPackage, setActiveTenderPackage] = useState<TenderPackage | null>(null);

  /**
   * Updates tender packages state and persists to database.
   * @param {TenderPackage[]} next - The new tender packages array
   */
  const updateTenderPackages = (next: TenderPackage[]) => {
    setTenderPackages(next);
    setTenderPackagesData(next);
  };

  // Synchronize workflow stage in database when route changes
  useEffect(() => {
    setWorkflowStageData(stageFromPath(location.pathname));
  }, [location.pathname]);

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      <Header activeTenderPackage={activeTenderPackage} />
      <div className="flex flex-1 overflow-hidden">
        <Routes>
          <Route
            path="/tenderpackages/*"
            element={(
              <TenderPackageView
                tenderPackages={tenderPackages}
                onUpdatePackages={updateTenderPackages}
                onPackageSaved={() => undefined}
                onActivePackageChange={setActiveTenderPackage}
              />
            )}
          />
          <Route path="/invitation" element={<Navigate to="/tenderpackages" replace />} />
          <Route path="/awarding" element={<Navigate to="/tenderpackages" replace />} />
          <Route path="*" element={<Navigate to="/tenderpackages" replace />} />
        </Routes>
      </div>
    </div>
  );
}