import Button from '../../components/Button';
import type { TenderPackageStep } from './TenderPackageForm.types';

interface FormActionBarProps {
  currentStep: TenderPackageStep;
  totalSteps: number;
  stepLabels: Record<TenderPackageStep, string>;
  isShortlistingComplete: boolean;
  onCancel: () => void;
  onSaveAndExit: () => void;
  onPreviousStep: () => void;
  onNextStep: () => void;
}

export default function FormActionBar({
  currentStep,
  totalSteps,
  stepLabels,
  isShortlistingComplete,
  onCancel,
  onSaveAndExit,
  onPreviousStep,
  onNextStep,
}: FormActionBarProps) {
  return (
    <div className={currentStep === 3 ? 'space-y-3 px-4 pt-3 pb-4 bg-white border-t border-slate-200' : 'space-y-3'}>
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <Button
          onClick={onCancel}
          className="px-6 py-2 border border-slate-300 rounded-lg text-xs xl:text-sm text-slate-700 font-medium hover:bg-slate-100 transition-colors"
        >
          Cancel
        </Button>
        <Button
          onClick={onSaveAndExit}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs xl:text-sm font-medium transition-colors"
        >
          Save & Exit
        </Button>
      </div>

      <div className="flex justify-between items-center gap-4 w-full">
        <Button
          onClick={onPreviousStep}
          disabled={currentStep === 1}
          className="px-6 py-2 border border-slate-300 rounded-lg text-xs xl:text-sm text-slate-700 font-medium hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {currentStep > 1
            ? `Previous: ${stepLabels[(currentStep - 1) as TenderPackageStep]}`
            : 'Previous'}
        </Button>
        <div className="flex flex-col items-end gap-1">
          <Button
            onClick={onNextStep}
            disabled={currentStep === totalSteps || (currentStep === 3 && !isShortlistingComplete)}
            className="px-6 py-2 border border-blue-300 text-blue-700 rounded-lg text-xs xl:text-sm font-medium hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {currentStep < totalSteps
              ? `Next: ${stepLabels[(currentStep + 1) as TenderPackageStep]}`
              : 'Next'}
          </Button>
          {currentStep === 3 && !isShortlistingComplete && (
            <p className="text-xs text-amber-600">
              Complete shortlisting on all workitems to proceed.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
