# Accessibility

Target: WCAG 2.2 AA principles. This repository is not a certification of conformance.

Implemented measures include landmarks, one primary heading per page, a visible-on-focus skip link, native radio/select/input controls, associated labels, visible focus outlines, route focus management, responsive reflow, reduced-motion support, descriptive errors and live search announcements. Text tables convey all chart data. The network table contains all relationships even where the graphic deliberately displays fewer expertise nodes.

## Automated checks

Playwright runs axe-core with WCAG 2 A/AA, 2.1 AA and 2.2 AA tags over home, results, profile, explore, network and information pages. A keyboard test checks the skip link; a 390-pixel viewport test checks reflow. Component tests use accessible role and label queries to exercise normal interactions.

## Manual release checklist

1. Navigate all controls and menus with Tab, Shift+Tab, arrows, Enter and Space. Confirm focus visibility and order, including paginated results and disclosure tables.
2. Test NVDA/Firefox and VoiceOver/Safari headings, landmarks, search announcements, errors, radio options and chart tables.
3. Test 200% text resizing, 400% page zoom and narrow viewports. Check that content remains available without two-dimensional scrolling, except genuinely tabular data.
4. Verify text, focus and non-text contrast with actual rendered colours and browser settings.
5. Use forced-colour mode and reduced motion. Check native form controls and focus indicators.
6. Disable JavaScript and follow the complete text-directory link.
7. Involve people with disabilities before claiming conformance or launching a public institutional service.

Automated scans cannot validate content clarity, cognitive accessibility or all assistive-technology behaviour. The SVG network is supplementary, and tooltip-only information is never required.
