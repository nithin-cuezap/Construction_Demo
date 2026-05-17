import { useState } from 'react';
import {
  areAllWorkItemsShortlistingCompleted,
  getSelectionViewData,
  isAnyWorkItemInvitationSent,
} from '../Selection.ops';
import { getNextPackageControlNumber } from '../TenderPackage.ops';
import type { TenderPackage } from '../types';
import DocumentsStep from './form-steps/DocumentsStep';
import FormActionBar from './form-steps/FormActionBar';
import InvitationStep from './form-steps/InvitationStep';
import PrimaryInformationStep from './form-steps/PrimaryInformationStep';
import StatusStep from './form-steps/StatusStep';
import type {
  TenderPackageFormData,
  TenderPackageStep,
  UploadedDocument,
} from './form-steps/TenderPackageForm.types';
import SelectionView from './SelectionView';

interface TenderPackageFormViewProps {
  editingPackage?: TenderPackage;
  currentStep: TenderPackageStep;
  onCreateAndContinue: (packageData: TenderPackage, nextStep: TenderPackageStep) => void;
  onSaveAndContinue: (packageData: TenderPackage, nextStep: TenderPackageStep) => void;
  onSaveAndExit: (packageData: TenderPackage) => void;
  onCancel: () => void;
}

export default function TenderPackageFormView({
  editingPackage,
  currentStep,
  onCreateAndContinue,
  onSaveAndContinue,
  onSaveAndExit,
  onCancel,
}: TenderPackageFormViewProps) {
  const [formPackageId] = useState(() => editingPackage?.id || `tp-${Date.now()}`);
  const TOTAL_STEPS = 7;
  const STEP_LABELS: Record<TenderPackageStep, string> = {
    1: 'Primary Information',
    2: 'Document Upload',
    3: 'Work Scoping & Contractor Shortlisting',
    4: 'Bid Invitation',
    5: 'Bid Review',
    6: 'Finalized',
    7: 'Closed',
  };
  const STEP_STATUS: Record<TenderPackageStep, TenderPackage['status']> = {
    1: 'Draft',
    2: 'Draft',
    3: 'Work Scoping & Contractor Shortlisting',
    4: 'Bid Invitation',
    5: 'Bid Review',
    6: 'Finalized',
    7: 'Closed',
  };

  const [formData, setFormData] = useState<TenderPackageFormData>({
    packageName: editingPackage?.packageName || '',
    packageControlNumber: editingPackage?.packageControlNumber || getNextPackageControlNumber(),
    projectDescription: editingPackage?.projectDescription || '',
    tenderSubmissionDueDate: editingPackage?.tenderSubmissionDueDate || '',
    rfqDueDate: editingPackage?.rfqDueDate || '',
    subContractorBidSubmissionDueDate: editingPackage?.subContractorBidSubmissionDueDate || '',
    subContractorRfqDueDate: editingPackage?.subContractorRfqDueDate || '',
    workflowStage: editingPackage?.workflowStage || currentStep,
    siteAddress: editingPackage?.siteAddress || {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      latitude: 0,
      longitude: 0,
      country: 'USA',
    },
    customerName: editingPackage?.customerName || '',
    customerContactDetails: editingPackage?.customerContactDetails || {
      name: '',
      email: '',
      phone: '',
      mobile: '',
      title: '',
    },
    documents: editingPackage?.documents || [],
    status: (editingPackage?.status || 'Draft') as
      | 'Draft'
      | 'Work Scoping & Contractor Shortlisting'
      | 'Bid Invitation'
      | 'Bid Review'
      | 'Finalized'
      | 'Closed',
  });

  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>(
    editingPackage?.documents.map((doc) => ({
      ...doc,
      file: null as File | null,
    })) || []
  );
  const [isShortlistingComplete, setIsShortlistingComplete] = useState(() =>{
    const workItems = getSelectionViewData(formPackageId).workItems;
    return areAllWorkItemsShortlistingCompleted(workItems) || isAnyWorkItemInvitationSent(workItems);
  }
  );

  const validatePrimaryInformation = () => {
    if (
      !formData.packageName ||
      !formData.siteAddress.street ||
      !formData.siteAddress.city ||
      !formData.customerName ||
      !formData.customerContactDetails.name
    ) {
      alert('Please fill in all required fields');
      return false;
    }
    return true;
  };

  const buildPackageToSave = (): TenderPackage => {
    return {
      id: formPackageId,
      ...formData,
      workflowStage: currentStep,
      status: STEP_STATUS[currentStep],
      documents: uploadedDocuments.map(({ file, ...doc }) => {
        void file;
        return doc;
      }),
      createdAt: editingPackage?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  };

  const handleNextStep = () => {
    if (currentStep === 1 && !validatePrimaryInformation()) return;
    if (currentStep === 3 && !isShortlistingComplete) return;
    if (currentStep < TOTAL_STEPS) {
      const nextStep = (currentStep + 1) as TenderPackageStep;
      if (!editingPackage && currentStep === 1) {
        onCreateAndContinue(buildPackageToSave(), nextStep);
        return;
      }
      onSaveAndContinue(buildPackageToSave(), nextStep);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      const previousStep = (currentStep - 1) as TenderPackageStep;
      onSaveAndContinue(buildPackageToSave(), previousStep);
    }
  };

  const handleSaveAndExit = () => {
    if (!validatePrimaryInformation()) return;

    onSaveAndExit(buildPackageToSave());
  };

  return (
    <div className={`flex flex-col h-full w-full ${currentStep === 3 ? 'p-0 overflow-hidden' : 'p-4 overflow-auto'}`}>
      {currentStep === 1 && (
        <PrimaryInformationStep
          formData={formData}
          setFormData={setFormData}
        />
      )}

      {currentStep === 2 && (
        <DocumentsStep
          uploadedDocuments={uploadedDocuments}
          setUploadedDocuments={setUploadedDocuments}
        />
      )}

      <StatusStep
        currentStep={currentStep}
        stepLabel={STEP_LABELS[currentStep]}
        stepStatus={STEP_STATUS[currentStep]}
      />

      {currentStep === 3 && (
        <div className="flex-1 border-t border-slate-200 overflow-hidden bg-slate-50 w-full min-w-0">
          <SelectionView
            tenderPackageId={formPackageId}
            onShortlistingCompletionChange={setIsShortlistingComplete}
          />
        </div>
      )}

      {currentStep === 4 && (
        <InvitationStep
          tenderPackageId={formPackageId}
          formData={formData}
        />
      )}

      <FormActionBar
        currentStep={currentStep}
        totalSteps={TOTAL_STEPS}
        stepLabels={STEP_LABELS}
        isShortlistingComplete={isShortlistingComplete}
        onCancel={onCancel}
        onSaveAndExit={handleSaveAndExit}
        onPreviousStep={handlePreviousStep}
        onNextStep={handleNextStep}
      />
    </div>
  );
}
