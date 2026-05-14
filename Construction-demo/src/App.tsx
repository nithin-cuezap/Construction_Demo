import { useEffect, useState } from 'react';
import Header from './components/Header';
import {
  getTenderPackagesData,
  getWorkflowStageData,
  setTenderPackagesData,
  setWorkflowStageData,
  type WorkflowStage,
} from './TenderPackage.ops';
import type { TenderPackage } from './types';
// import AwardingView from './views/AwardingView';
// import InvitationView from './views/InvitationView';
import TenderPackageView from './views/TenderPackageView';

const STAGE_HASH: Record<WorkflowStage, string> = {
  TenderPackages: '#/tenderpackages',
  Invitation: '#/invitation',
  Awarding: '#/awarding',
};

const stageFromHash = (hash: string): WorkflowStage => {
  const normalized = hash.replace(/^#\/?/, '').toLowerCase();
  if (normalized === 'tenderpackages') return 'TenderPackages';
  if (normalized === 'invitation') return 'Invitation';
  if (normalized === 'awarding') return 'Awarding';
  return 'TenderPackages';
};

export default function App() {
  const [workflowStage, setWorkflowStage] = useState<WorkflowStage>(() => {
    if (window.location.hash) {
      return stageFromHash(window.location.hash);
    }
    return getWorkflowStageData();
  });
  const [tenderPackages, setTenderPackages] = useState<TenderPackage[]>(
    () => getTenderPackagesData(),
  );

  const updateTenderPackages = (next: TenderPackage[]) => {
    setTenderPackages(next);
    setTenderPackagesData(next);
  };

  // const navigateToStage = (stage: WorkflowStage) => {
  //   setWorkflowStage(stage);
  //   mockDb.setWorkflowStage(stage);
  //   const targetHash = STAGE_HASH[stage];
  //   if (window.location.hash !== targetHash) {
  //     window.location.hash = targetHash;
  //   }
  // };

  useEffect(() => {
    if (!window.location.hash) {
      window.location.hash = STAGE_HASH[workflowStage];
    }

    const onHashChange = () => {
      const nextStage = stageFromHash(window.location.hash);
      setWorkflowStage(nextStage);
      setWorkflowStageData(nextStage);
    };

    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [workflowStage]);

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <TenderPackageView
          tenderPackages={tenderPackages}
          onUpdatePackages={updateTenderPackages}
          onPackageSaved={() => undefined}
        />
      </div>
    </div>
  );
}