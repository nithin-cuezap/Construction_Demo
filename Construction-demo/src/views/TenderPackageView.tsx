import { useState } from 'react';
import { deletePackage, savePackage } from '../TenderPackage.ops';
import type { TenderPackage } from '../types';
import TenderPackageFormView from './TenderPackageFormView';
import TenderPackageListView from './TenderPackageListView';

interface TenderPackageViewProps {
  tenderPackages: TenderPackage[];
  onUpdatePackages: (packages: TenderPackage[]) => void;
  onPackageSaved: () => void;
}

export default function TenderPackageView({
  tenderPackages,
  onUpdatePackages,
  onPackageSaved,
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
  };

  const handleEditPackage = (packageId: string) => {
    const existingPackage = tenderPackages.find((pkg) => pkg.id === packageId);
    setEditingPackageId(packageId);
    setFormStep(existingPackage ? (existingPackage.workflowStage ?? getFormStepForStatus(existingPackage.status)) : 1);
    setViewMode('form');
  };

  const handleBackToList = () => {
    setEditingPackageId(null);
    setFormStep(1);
    setViewMode('list');
  };

  const handleSavePackage = (packageData: TenderPackage) => {
    onUpdatePackages(savePackage(tenderPackages, packageData, editingPackageId));
    setEditingPackageId(null);
    setFormStep(1);
    setViewMode('list');
    onPackageSaved();
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
            onUpdatePackages(savePackage(tenderPackages, { ...packageData, workflowStage: nextStep }, editingPackageId));
            setEditingPackageId(packageData.id);
            setFormStep(nextStep);
          }}
          onSaveAndExit={handleSavePackage}
          onCancel={handleBackToList}
        />
      )}
    </div>
  );
}
