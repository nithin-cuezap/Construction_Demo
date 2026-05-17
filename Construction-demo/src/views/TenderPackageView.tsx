/**
 * @fileoverview Main view for tender package management and workflow routing.
 * 
 * This view component handles the routing between tender package list and form views,
 * manages the tender package CRUD operations, and maps workflow stages to URL routes.
 * It serves as the parent container for all tender package-related screens.
 * 
 * @module views/TenderPackageView
 */

import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { deletePackage, savePackage } from '../TenderPackage.ops';
import type { TenderPackage } from '../types';
import TenderPackageFormRoute from './TenderPackageFormRoute';
import TenderPackageListView from './TenderPackageListView';
import type { TenderPackageStep } from './form-steps/TenderPackageForm.types';

/**
 * Props for the TenderPackageView component.
 */
interface TenderPackageViewProps {
  /** Array of all tender packages */
  tenderPackages: TenderPackage[];
  /** Callback to update the tender packages array */
  onUpdatePackages: (packages: TenderPackage[]) => void;
  /** Callback when a package is saved */
  onPackageSaved: () => void;
  /** Callback when the active package changes (for header display) */
  onActivePackageChange?: (pkg: TenderPackage | null) => void;
}

/**
 * Mapping of workflow step numbers to URL-friendly step names.
 * Centralized to ensure consistency across routing and navigation.
 */
const STEP_NAMES: Record<TenderPackageStep, string> = {
  1: 'primary-information',
  2: 'documents',
  3: 'work-scoping-shortlisting',
  4: 'bid-invitation',
  5: 'bid-review',
  6: 'finalized',
  7: 'closed',
};

/**
 * Reverse mapping of step names to step numbers.
 * Used for parsing URL parameters back to workflow steps.
 */
const STEP_NAME_TO_NUMBER: Record<string, TenderPackageStep> = {
  'primary-information': 1,
  'documents': 2,
  'work-scoping-shortlisting': 3,
  'bid-invitation': 4,
  'bid-review': 5,
  'finalized': 6,
  'closed': 7,
};

/**
 * Main view component for tender package management.
 * Orchestrates routing between list and form views, and delegates package operations.
 * 
 * @param props - Component props
 * @param props.tenderPackages - Array of all tender packages
 * @param props.onUpdatePackages - Callback to update the tender packages array
 * @param props.onPackageSaved - Callback when a package is saved
 * @param props.onActivePackageChange - Callback when the active package changes (for header display)
 * @returns Rendered tender package view with nested routes
 */
export default function TenderPackageView({
  tenderPackages,
  onUpdatePackages,
  onPackageSaved,
  onActivePackageChange,
}: TenderPackageViewProps) {
  const navigate = useNavigate();

  /**
   * Determines the appropriate form step based on the tender package status.
   * Falls back to primary-information for Draft or unknown statuses.
   * 
   * @param status - The tender package status
   * @returns The corresponding form step number
   */
  const getFormStepForStatus = (status: TenderPackage['status']): TenderPackageStep => {
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

  // Clear active package when creating new
  const handleAddNewPackage = () => {
    onActivePackageChange?.(null);
    navigate('/tenderpackages/new/primary-information');
  };

  // Resume editing from saved workflow stage or status-based step
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

  const handleCreateAndContinue = (packageData: TenderPackage, nextStep: TenderPackageStep) => {
    const saved = { ...packageData, workflowStage: nextStep };
    onUpdatePackages(savePackage(tenderPackages, saved, null));
    onActivePackageChange?.(saved);
    navigate(`/tenderpackages/${saved.id}/${STEP_NAMES[nextStep]}`);
  };

  // Update package and workflow stage when continuing to next step
  const handleSaveAndContinue = (packageData: TenderPackage, nextStep: TenderPackageStep) => {
    const saved = { ...packageData, workflowStage: nextStep };
    onUpdatePackages(savePackage(tenderPackages, saved, packageData.id));
    onActivePackageChange?.(saved);
    navigate(`/tenderpackages/${saved.id}/${STEP_NAMES[nextStep]}`);
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-50">
      <Routes>
        <Route
          index
          element={
            <TenderPackageListView
              packages={tenderPackages}
              onAddNew={handleAddNewPackage}
              onEdit={handleEditPackage}
              onDelete={handleDeletePackage}
            />
          }
        />
        <Route
          path="new/:stepName"
          element={
            <TenderPackageFormRoute
              tenderPackages={tenderPackages}
              stepNameToNumber={STEP_NAME_TO_NUMBER}
              stepNames={STEP_NAMES}
              onCreateAndContinue={handleCreateAndContinue}
              onSaveAndContinue={handleSaveAndContinue}
              onSaveAndExit={handleSavePackage}
              onCancel={handleBackToList}
            />
          }
        />
        <Route
          path=":packageId/:stepName"
          element={
            <TenderPackageFormRoute
              tenderPackages={tenderPackages}
              stepNameToNumber={STEP_NAME_TO_NUMBER}
              stepNames={STEP_NAMES}
              onCreateAndContinue={handleCreateAndContinue}
              onSaveAndContinue={handleSaveAndContinue}
              onSaveAndExit={handleSavePackage}
              onCancel={handleBackToList}
            />
          }
        />
        <Route path="*" element={<Navigate to="/tenderpackages" replace />} />
      </Routes>
    </div>
  );
}
       