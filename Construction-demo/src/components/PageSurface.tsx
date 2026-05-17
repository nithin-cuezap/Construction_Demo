/**
 * @fileoverview Reusable page layout wrapper with consistent spacing and scrolling.
 * 
 * Provides a standardized page surface with:
 * - Responsive padding that adapts to screen sizes
 * - Full-height scrollable content area
 * - Optional centered content layout
 * 
 * @module components/PageSurface
 */

import type { ReactNode } from 'react';

const PAGE_CONTAINER_BASE_CLASS = 'mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8';

/**
 * Props for PageSurface component.
 */
export interface PageSurfaceProps {
  /** Content to render within the page surface */
  children: ReactNode;
  /** Whether to center content vertically and horizontally */
  centerContent?: boolean;
}

/**
 * Page layout wrapper providing consistent spacing and structure.
 * 
 * Use centerContent for loading states, error screens, or single-card views.
 * Default layout is suitable for forms and multi-section pages.
 * 
 * @example
 * ```tsx
 * <PageSurface>
 *   <h1>My Page Content</h1>
 * </PageSurface>
 * ```
 * 
 * @example
 * ```tsx
 * <PageSurface centerContent>
 *   <LoadingSpinner />
 * </PageSurface>
 * ```
 */
export default function PageSurface({ children, centerContent = false }: PageSurfaceProps) {
  return (
    <div className="h-full w-full overflow-y-auto bg-slate-50">
      <div className={`${PAGE_CONTAINER_BASE_CLASS} ${centerContent ? 'flex min-h-full items-center justify-center' : ''}`}>
        {children}
      </div>
    </div>
  );
}
