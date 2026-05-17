---
applyTo: src/**/*.tsx,src/**/*.css
---

# Design And Theme Rules

Use these rules whenever creating or editing UI components, views, or styles.

## Visual Direction

- Keep a clear, intentional construction-industry visual language.
- Prefer confident, high-contrast hierarchy over neutral, generic layouts.
- Preserve consistency across screens for spacing, typography scale, and color meaning.

## Theme Consistency

- Reuse the same semantic colors for status and workflow meaning.
- Keep interaction states consistent: default, hover, active, focus, disabled.
- Do not introduce random one-off colors or ad-hoc utility combinations when an existing pattern exists.

## Section Groupings

- Use tinted panels for named section groupings.
- Use a left accent border when sections are stacked vertically.
- Use a top accent border when sections are arranged side-by-side horizontally.
- Choose the accent direction based on the layout of the view, so the border reinforces the reading flow.
- Keep the section title inside the tinted panel and place any helper note directly beneath the heading.
- Reuse the same accent color family for the heading, border, and hover treatment within a section.
- Avoid plain, ungrouped subsection blocks when the screen is organized into named sections.

## Layout And Responsiveness

- Design mobile-first and verify desktop composition.
- Avoid overflow traps: long tables/forms must remain usable on smaller widths.
- Keep dense enterprise views readable with clear grouping and section headers.

## Components

- Reuse existing shared components first (for example button/card patterns).
- Keep variants coherent; do not create near-duplicate styles for similar actions.
- Maintain predictable affordances for destructive, primary, and secondary actions.

## Forms

- Preserve clear multi-step progress and required-field signaling.
- Keep labels explicit and aligned with domain language.
- Use validation and error messaging that is specific and actionable.

## Accessibility

- Ensure visible focus states on interactive controls.
- Maintain sufficient color contrast for text and badges.
- Avoid relying on color alone to communicate status.

## Motion And Polish

- Use subtle, purposeful transitions only where they improve comprehension.
- Avoid decorative motion that distracts from workflow tasks.

## Before Finalizing UI Changes

- Check for visual consistency with nearby screens.
- Check mobile and desktop behavior.
- Check that status colors and typography hierarchy remain coherent.
