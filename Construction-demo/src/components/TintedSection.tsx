/**
 * @fileoverview Colored content section with accent border for visual hierarchy.
 * 
 * Provides a visually distinct section with:
 * - Accent-colored left border and background tint
 * - Title and description header
 * - Flexible content area
 * 
 * Used to separate form sections, highlight important information, or group related content.
 * 
 * @module components/TintedSection
 */

import type { ReactNode } from 'react';

/**
 * Available accent colors for tinted sections.
 * Each color has semantic meaning in the application context.
 */
export type TintedSectionAccent = 'blue' | 'green';

/**
 * Style configurations for each accent color.
 * Defines consistent color palettes across the application.
 */
const TINTED_SECTION_STYLES: Record<TintedSectionAccent, {
  container: string;
  title: string;
  description: string;
}> = {
  blue: {
    container: 'bg-blue-50 border-l-4 border-blue-500',
    title: 'text-blue-900',
    description: 'text-blue-700',
  },
  green: {
    container: 'bg-green-50 border-l-4 border-green-500',
    title: 'text-green-900',
    description: 'text-green-700',
  },
};

/**
 * Props for TintedSection component.
 */
export interface TintedSectionProps {
  /** Color accent for the section */
  accent: TintedSectionAccent;
  /** Section heading */
  title: string;
  /** Explanatory text below the title */
  description: string;
  /** Content to render in the section body */
  children: ReactNode;
  /** Custom className for the body container */
  bodyClassName?: string;
}

/**
 * Colored section component for visual grouping and hierarchy.
 * 
 * Use blue accent for informational sections, green for success or submission actions.
 * 
 * @example
 * ```tsx
 * <TintedSection
 *   accent="blue"
 *   title="Upload Documents"
 *   description="Add all required project files"
 * >
 *   <FileUpload />
 * </TintedSection>
 * ```
 */
export default function TintedSection({ 
  accent, 
  title, 
  description, 
  children, 
  bodyClassName = 'mb-4' 
}: TintedSectionProps) {
  const style = TINTED_SECTION_STYLES[accent];

  return (
    <div className={`${style.container} rounded-lg p-6 mb-6`}>
      <div className={bodyClassName}>
        <h2 className={`text-xl font-bold ${style.title} mb-1`}>{title}</h2>
        <p className={`text-sm ${style.description}`}>
          {description}
        </p>
      </div>
      {children}
    </div>
  );
}
