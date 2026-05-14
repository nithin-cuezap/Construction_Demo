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

const stageFromPath = (pathname: string) => {
  const normalized = pathname.replace(/^\//, '').toLowerCase();
  if (normalized.startsWith('tenderpackages')) return 'TenderPackages';
  if (normalized.startsWith('invitation')) return 'Invitation';
  if (normalized.startsWith('awarding')) return 'Awarding';
  return 'TenderPackages';
};

export default function App() {
  const location = useLocation();
  const [tenderPackages, setTenderPackages] = useState<TenderPackage[]>(
    () => getTenderPackagesData(),
  );
  const [activeTenderPackage, setActiveTenderPackage] = useState<TenderPackage | null>(null);

  const updateTenderPackages = (next: TenderPackage[]) => {
    setTenderPackages(next);
    setTenderPackagesData(next);
  };

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