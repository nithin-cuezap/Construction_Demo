/**
 * White-label branding configuration.
 * Customize these values to brand the application for your organization.
 */
export interface BrandingConfig {
  /** URL to the organization logo image. Set to null to use the default icon. */
  logoUrl: string | null;
  /** Primary organization name displayed in the header. */
  orgName: string;
  /** Optional secondary tagline/descriptor shown beneath the org name. */
  orgTagline?: string;
  /** Accent color class used for the default logo placeholder (Tailwind bg-* class). */
  logoAccentClass?: string;
}

const branding: BrandingConfig = {
  logoUrl: null,
  orgName: 'Your Organization',
  orgTagline: 'Procurement & Tendering',
  logoAccentClass: 'bg-blue-600',
};

export default branding;
