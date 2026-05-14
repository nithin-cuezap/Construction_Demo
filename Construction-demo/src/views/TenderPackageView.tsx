import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { deletePackage, savePackage } from '../TenderPackage.ops';
import type { TenderPackage } from '../types';
import TenderPackageFormView from './TenderPackageFormView';
import TenderPackageListView from './TenderPackageListView';
import type { TenderPackageStep } from './form-steps/TenderPackageForm.types';

interface TenderPackageViewProps {
  tenderPackages: TenderPackage[];
  onUpdatePackages: (packages: TenderPackage[]) => void;
  onPackageSaved: () => void;
  onActivePackageChange?: (pkg: TenderPackage | null) => void;
}

export default function TenderPackageView({
  tenderPackages,
  onUpdatePackages,
  onPackageSaved,
  onActivePackageChange,
}: TenderPackageViewProps) {
  const navigate = useNavigate();

  const STEP_NAMES: Record<TenderPackageStep, string> = {
    1: 'primary-information',
    2: 'documents',
    3: 'work-scoping-shortlisting',
    4: 'bid-invitation',
    5: 'bid-review',
    6: 'finalized',
    7: 'closed',
  };

  const STEP_NAME_TO_NUMBER: Record<string, TenderPackageStep> = {
    'primary-information': 1,
    'documents': 2,
    'work-scoping-shortlisting': 3,
    'bid-invitation': 4,
    'bid-review': 5,
    'finalized': 6,
    'closed': 7,
  };

  const getFormStepForStatus = (status: TenderPackage['status']): 1 | 2 | 3 | 4 | 5 | 6 | 7 => {
    switch (status) {
      case 'Work Scoping & Contractor Shortlisting':
        return 3;
      case 'Bid Invitation':
        return 4;
      case 'Bid Review':
        return 5;
      case 'Finalized':
        return 6;
      case 'Closed':
        return 7;
      case 'Draft':
      default:
        return 1;
    }
  };

  const parseStep = (stepParam: string | undefined): TenderPackageStep | null => {
    if (!stepParam) return null;
    const stepNumber = STEP_NAME_TO_NUMBER[stepParam];
    return stepNumber || null;
  };

  const handleAddNewPackage = () => {
    onActivePackageChange?.(null);
    navigate('/tenderpackages/new/primary-information');
  };

  const handleEditPackage = (packageId: string) => {
    const existingPackage = tenderPackages.find((pkg) => pkg.id === packageId);
    const targetStep = existingPackage
      ? (existingPackage.workflowStage ?? getFormStepForStatus(existingPackage.status))
      : 1;
    onActivePackageChange?.(existingPackage ?? null);
    navigate(`/tenderpackages/${packageId}/${STEP_NAMES[targetStep]}`);
  };

  const handleBackToList = () => {
    onActivePackageChange?.(null);
    navigate('/tenderpackages');
  };

  const handleSavePackage = (packageData: TenderPackage, editingPackageId: string | null) => {
    onUpdatePackages(savePackage(tenderPackages, packageData, editingPackageId));
    onPackageSaved();
    onActivePackageChange?.(null);
    navigate('/tenderpackages');
  };

  const handleDeletePackage = (packageId: string) => {
    onUpdatePackages(deletePackage(tenderPackages, packageId));
  };

  const FormRoute = () => {
    const { packageId, stepName } = useParams<{ packageId?: string; stepName: string }>();
    const currentStep = parseStep(stepName);

    if (!currentStep) {
      if (packageId && packageId !== 'new') {
        return <Navigate to={`/tenderpackages/${packageId}/primary-information`} replace />;
      }
      return <Navigate to="/tenderpackages/new/primary-information" replace />;
    }

    const editingPackageId = packageId && packageId !== 'new' ? packageId : null;
    const editingPackage = editingPackageId
      ? tenderPackages.find((pkg) => pkg.id === editingPackageId)
      : undefined;

    if (editingPackageId && !editingPackage) {
      return <Navigate to="/tenderpackages" replace />;
    }

    return (
      <TenderPackageFormView
        editingPackage={editingPackage}
        currentStep={currentStep}
        onSaveAndContinue={(packageData, nextStep) => {
          const saved = { ...packageData, workflowStage: nextStep };
          onUpdatePackages(savePackage(tenderPackages, saved, editingPackageId));
          onActivePackageChange?.(saved);
          navigate(`/tenderpackages/${saved.id}/${STEP_NAMES[nextStep]}`);
        }}
        onSaveAndExit={(packageData) => handleSavePackage(packageData, editingPackageId)}
        onCancel={handleBackToList}
      />
    );
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-50">
      <Routes>
        <Route
          index
          element={(
            <TenderPackageListView
              packages={tenderPackages}
              onAddNew={handleAddNewPackage}
              onEdit={handleEditPackage}
              onDelete={handleDeletePackage}
            />
          )}
        />
        <Route path="new/:stepName" element={<FormRoute />} />
        <Route path=":packageId/:stepName" element={<FormRoute />} />
        <Route path="*" element={<Navigate to="/tenderpackages" replace />} />
      </Routes>
    </div>
  );
}
