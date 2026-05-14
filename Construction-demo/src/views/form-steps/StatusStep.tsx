import type { TenderPackageStatus, TenderPackageStep } from './TenderPackageForm.types';

interface StatusStepProps {
  currentStep: TenderPackageStep;
  stepLabel: string;
  stepStatus: TenderPackageStatus;
}

export default function StatusStep({ currentStep, stepLabel, stepStatus }: StatusStepProps) {
  if (currentStep < 5) {
    return null;
  }

  return (
    <div className="bg-white p-6 rounded-lg border border-slate-200 mb-6">
      <h2 className="text-2xl font-semibold text-slate-900 mb-2">{stepLabel}</h2>
      <p className="text-slate-600">
        This stage sets package status to <span className="font-semibold">{stepStatus}</span>.
        Clicking Save &amp; Exit will return to the Tender Package list.
      </p>
    </div>
  );
}
