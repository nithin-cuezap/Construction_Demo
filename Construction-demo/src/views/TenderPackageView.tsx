import { useState } from 'react';
import { deletePackage, savePackage } from '../TenderPackage.ops';
import type { TenderPackage } from '../types';
import TenderPackageFormView from './TenderPackageFormView';
import TenderPackageListView from './TenderPackageListView';

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
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [editingPackageId, setEditingPackageId] = useState<string | null>(null);
  const [formStep, setFormStep] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7>(1);

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

  const handleAddNewPackage = () => {
    setEditingPackageId(null);
    setFormStep(1);
    setViewMode('form');
    onActivePackageChange?.(null);
  };

  const handleEditPackage = (packageId: string) => {
    const existingPackage = tenderPackages.find((pkg) => pkg.id === packageId);
    setEditingPackageId(packageId);
    setFormStep(existingPackage ? (existingPackage.workflowStage ?? getFormStepForStatus(existingPackage.status)) : 1);
    setViewMode('form');
    onActivePackageChange?.(existingPackage ?? null);
  };

  const handleBackToList = () => {
    setEditingPackageId(null);
    setFormStep(1);
    setViewMode('list');
    onActivePackageChange?.(null);
  };

  const handleSavePackage = (packageData: TenderPackage) => {
    onUpdatePackages(savePackage(tenderPackages, packageData, editingPackageId));
    setEditingPackageId(null);
    setFormStep(1);
    setViewMode('list');
    onPackageSaved();
    onActivePackageChange?.(null);
  };

  const handleDeletePackage = (packageId: string) => {
    onUpdatePackages(deletePackage(tenderPackages, packageId));
  };

  const editingPackage = editingPackageId
    ? tenderPackages.find((pkg) => pkg.id === editingPackageId)
    : undefined;

  return (
    <div className="w-full h-full flex flex-col bg-slate-50">
      {viewMode === 'list' ? (
        <TenderPackageListView
          packages={tenderPackages}
          onAddNew={handleAddNewPackage}
          onEdit={handleEditPackage}
          onDelete={handleDeletePackage}
        />
      ) : (
        <TenderPackageFormView
          editingPackage={editingPackage}
          currentStep={formStep}
          onSaveAndContinue={(packageData, nextStep) => {
            const saved = { ...packageData, workflowStage: nextStep };
            onUpdatePackages(savePackage(tenderPackages, saved, editingPackageId));
            setEditingPackageId(packageData.id);
            setFormStep(nextStep);
            onActivePackageChange?.(saved);
          }}
          onSaveAndExit={handleSavePackage}
          onCancel={handleBackToList}
        />
      )}
    </div>
  );
}
