/**
 * @fileoverview Marketing footer for contractor network signup promotion.
 * 
 * Displays call-to-action for vendors to join the contractor network platform.
 * Currently shows a disabled placeholder button as the signup flow is not yet implemented.
 * 
 * @module components/ContractorSignupFooter
 */

import { ArrowRight } from 'lucide-react';
import branding from '../branding.config';
import Button from './Button';

/**
 * Marketing footer promoting contractor network signup.
 * 
 * Shown after bid submission to introduce vendors to the broader platform.
 * Button is intentionally disabled as external contractor onboarding is not yet built.
 * 
 * @example
 * ```tsx
 * <ContractorSignupFooter />
 * ```
 */
export default function ContractorSignupFooter() {
  return (
    <div className="bg-amber-50 border-l-4 border-amber-500 rounded-2xl p-6 md:p-7 mt-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <div className="inline-flex items-center rounded-full border border-amber-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
            Contractor Network
          </div>
          <h2 className="mt-3 text-2xl font-bold text-amber-950">Join the Contractor Network</h2>
          <p className="mt-2 text-sm leading-6 text-amber-900/80 md:text-base">
            You&apos;re submitting to just one project. Imagine accessing hundreds of tender opportunities from top general contractors, all in one place. Build relationships that grow your business with {branding.orgName}.
          </p>
          <p className="mt-3 text-sm font-medium text-amber-800">
            Signup opens soon. This CTA is a placeholder for the upcoming contractor onboarding flow.
          </p>
        </div>

        <div className="flex flex-col items-start gap-3 md:items-end">
          <Button
            type="button"
            variant="secondary"
            disabled
            className="flex items-center gap-2 border-amber-700 bg-amber-600 text-white hover:bg-amber-600 active:bg-amber-600 disabled:border-amber-300 disabled:bg-amber-300"
          >
            Sign Up & Get Invited
            <ArrowRight size={16} />
          </Button>
          <p className="text-xs text-amber-700">External contractor signup route coming soon.</p>
        </div>
      </div>
    </div>
  );
}
