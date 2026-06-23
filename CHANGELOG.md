## Changelog

### 2.0.3

- **New: PDF dark mode via color inversion** — When a PDF page is detected (`document.contentType === 'application/pdf'` or `.pdf` URL), dark mode is applied via a `backdrop-filter: invert(1) hue-rotate(180deg)` overlay instead of inline style injection. This works at the compositor level and covers all PDF rendering methods: Chrome (`<div>`/canvas-based viewer) and Edge (`<object>`-based viewer). Applying `filter` directly to `<embed>` has no effect on Chrome's native PDF renderer, so the overlay approach is used instead.
- **New: Exclude list type selector** — Three distinct pattern types can now be selected when adding an exclude entry:
  - `*.domain` (wildcard): matches all subdomains of the given domain, port-agnostic.
  - `domain` (exact): matches the exact hostname and its subdomains, port-agnostic.
  - `domain:port`: matches the exact hostname only when accessed on the specified port.
  - Type is displayed as a colored badge (`[*]` / `[D]` / `[:P]`) in the exclude list.
- **New: Toggle behavior for exclude buttons** — The "Add" button switches to "Remove" when the typed pattern already exists in the list. The "Exclude current site" button switches to "× Remove from exclude" when the current site is already excluded; clicking it removes all matching entries.
- **Fix: Port-aware exclude matching** — `background.js` now returns the port alongside the hostname. `content.js` and `popup.js` exclude matching now correctly handles `domain-port` entries using `location.port`.

### 2.0.2

- Restored from CRX: lite mode, gradient darkify, observer throttle, and related fixes.

### 2.0.1

- **Bug fix: Mode state not persisted across tabs/sites** — Clicking Enable Normal/Ultra now correctly saves the global `darkMode` value alongside the per-site setting. Previously, switching to another tab always showed no button active, and page auto-apply on load was also silently skipped.

### 2.0.0

- **Major: Simplified to 2 modes** — Removed the old 4-mode system (fast/slow/direct/ultra). Now only **Normal Mode** and **Ultra Mode** remain.
  - **Normal Mode**: Applies dark theme via direct inline style manipulation. Replaces the old "Direct Style" mode.
  - **Ultra Mode**: Applies dark theme via CSS classes AND inline styles simultaneously for maximum coverage. Replaces the old "Ultra" mode.
  - Removed: "Toggle Dark Mode" (class-only fast batch) and "Toggle Dark Mode slow/performance" (class-only throttled batch) as they were strictly weaker than the remaining modes.
- **New: Global Mode** — "Apply to all sites" checkbox. When enabled, dark mode is automatically applied to every page you visit (respecting the exclude list).
- **New: Exclude List** — Add domains that should be skipped by dark mode.
  - Manual domain input with Add button.
  - "Exclude current site" quick-add button.
  - Remove domains with × button.
  - Supports subdomain matching (e.g. adding `youtube.com` also excludes `www.youtube.com`).
  - Adding a currently-viewed excluded domain immediately removes dark mode.
- **UI redesign** — Dark-themed popup with cleaner layout, toggle buttons, and inline exclude list management.
- **MutationObserver fix** — Previous version could stack multiple observers. Now properly disconnects before creating a new one.
- **Transparent color handling** — Colors with alpha < 0.1 are now ignored to avoid misinterpreting transparent elements.
- **Border color support in Normal mode** — Normal mode now also darkens light borders, matching Ultra mode behavior.

### 1.0.6

- When handling colors in rgba(r, g, b, a), the alpha value (a) determines the opacity of the color:

      a = 1.0 → fully opaque (the color is solid)

      a = 0.0 → fully transparent (invisible)

      0 < a < 1 → partially transparent (the color blends with the background)

  In the dark mode script, we don't just check the brightness of rgb(r, g, b).
  We also factor in the alpha value to avoid misinterpreting transparent whites or blacks.

### 1.0.5

- **Background Color Adaptation for `<a>` and `<button>` Elements**  
  Added the ability to detect and apply dark mode to background colors of `<a>` (anchor) and `<button>` elements. Previously, these elements were not included in the dark mode adaptation if they had custom background colors. With this update, both anchor and button elements will now seamlessly adapt their background to a darker shade when dark mode is enabled, ensuring consistent visual coherence across all interactive elements on the page.

### 1.0.4

- **Enhanced Border Color Adaptation in Dark Mode**  
  Improved the dark mode by including support for adapting border colors.
- **Gradient Backgrounds Now Supported**
- **SVG Elements and Colors Adjusted**
- **Mutation Observer for Dynamic Content**

### 1.0.3

- **Expanded Support for iFrames and Shadow DOM**

### 1.0.2

- **Enhanced Dark Mode Application for a Wider Range of Colors**  
  Leveraged HSL color analysis to identify and convert a broader spectrum of colors to dark mode.
