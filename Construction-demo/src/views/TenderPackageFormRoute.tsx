/**
 * Route wrapper component for the tender package form view.
 * Handles URL parameter parsing and redirects to appropriate form steps.
 * 
 * @module views/TenderPackageFormRoute
 */

import { Navigate, useParams } from 'react-router-dom';
import type { TenderPackage } from '../types';
import TenderPackageFormView from './TenderPackageFormView';
import type { TenderPackageStep } from './form-steps/TenderPackageForm.types';

/**
 * Props for the TenderPackageFormRoute component.
 */
interface TenderPackageFormRouteProps {
  /** Array of all tender packages for lookup */
  tenderPackages: TenderPackage[];
  /** Mapping of URL-friendly step names to step numbers */
  stepNameToNumber: Record<string, TenderPackageStep>;
  /** Mapping of step numbers to URL-friendly names */
  stepNames: Record<TenderPackageStep, string>;
  /** Callback when creating a new package and continuing to next step */
  onCreateAndContinue: (packageData: TenderPackage, nextStep: TenderPackageStep) => void;
  /** Callback when saving and continuing to next step */
  onSaveAndContinue: (packageData: TenderPackage, nextStep: TenderPackageStep) => void;
  /** Callback when saving and exiting the form */
  onSaveAndExit: (packageData: TenderPackage, editingPackageId: string | null) => void;
  /** Callback when canceling the form */
  onCancel: () => void;
}

/**
 * Route wrapper that extracts URL parameters and renders the form view.
 * Handles invalid routes and missing packages by redirecting appropriately.
 * 
 * @param props - Component props
 * @returns Rendered form view or redirect
 */
export default function TenderPackageFormRoute({
  tenderPackages,
  stepNameToNumber,
  onCreateAndContinue,
  onSaveAndContinue,
  onSaveAndExit,
  onCancel,
}: TenderPackageFormRouteProps) {
  const { packageId, stepName } = useParams<{ packageId?: string; stepName: string }>();
  
  // Parse step name from URL to step number
  const currentStep = stepName ? stepNameToNumber[stepName] : null;

  // Redirect to primary-information if step is invalid
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

  // Redirect to list if trying to edit non-existent package
  if (editingPackageId && !editingPackage) {
    return <Navigate to="/tenderpackages" replace />;
  }

  return (
    <TenderPackageFormView
      editingPackage={editingPackage}
      currentStep={currentStep}
      onCreateAndContinue={onCreateAndContinue}
      onSaveAndContinue={onSaveAndContinue}
      onSaveAndExit={(packageData) => onSaveAndExit(packageData, editingPackageId)}
      onCancel={onCancel}
    />
  );
}
