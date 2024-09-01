## Changelog

### 1.0.2
- **Enhanced Dark Mode Application for a Wider Range of Colors**  
  Improved the dark mode functionality by extending its application to a broader spectrum of colors. Leveraged advanced color analysis using HSL (Hue, Saturation, Lightness) to identify and convert not only light shades but also intermediate gray tones to a deeper, more consistent dark theme. This update ensures that a greater variety of background and text colors are converted to dark mode, enhancing readability and user experience across diverse websites.

### 1.0.3
- **Expanded Support for iFrames and Shadow DOM**  
  Introduced comprehensive support for applying dark mode within embedded iFrames and Shadow DOMs. This update ensures that dark mode styles are propagated seamlessly across all nested content, including third-party embedded content and encapsulated components within Shadow DOM. The extension now fully integrates dark mode across all layers of web page structures, providing a unified and immersive dark theme experience regardless of content embedding or web component isolation.

### 1.0.4
- **Enhanced Border Color Adaptation in Dark Mode**  
  Improved the dark mode by including support for adapting border colors. This update ensures that borders, which were previously unaffected by dark mode, are now consistently darkened to match the overall theme. Borders that were originally light or bright will now automatically adjust to a darker shade, maintaining visual coherence across all elements.
- **Gradient Backgrounds Now Supported**  
  Dark mode now applies to gradient backgrounds as well. The update introduces the ability to detect and adjust gradients, ensuring that even multi-colored backgrounds are darkened appropriately. This enhancement guarantees that websites utilizing gradients in their design are also visually consistent in dark mode, improving overall readability and aesthetic coherence.
- **SVG Elements and Colors Adjusted**  
  Added support for adapting the colors of SVG elements in dark mode. This includes handling fill and stroke properties for various SVG shapes such as ```<path>, <circle>, <ellipse>, <rect>, <line>, <polygon>, and <polyline>```. Previously unstyled SVG elements are now given default dark colors to ensure they align with the dark mode theme.
- **Mutation Observer for Dynamic Content**  
  Implemented a Mutation Observer to monitor and apply dark mode styles to newly added content on the page. This feature ensures that dark mode adapts to dynamically loaded content, such as infinite scrolling or AJAX-loaded elements, providing consistent theming without requiring page reloads.
