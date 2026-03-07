# Dark Theme Force Maker

## Description

Dark Theme Force Maker is a Chrome extension that forces dark mode on any website, even those without native dark theme support. It analyzes every element's computed colors and converts them to a dark palette in real time.

## Features

- **Normal Mode** — Applies dark theme via inline styles. Lightweight and effective for most sites.
- **Ultra Mode** — Applies dark theme via CSS classes AND inline styles simultaneously. Maximum coverage for sites with aggressive styling.
- **Global Mode** — Toggle to automatically apply dark mode to every site you visit.
- **Exclude List** — Add domains that should never have dark mode applied (e.g. sites that already have dark themes).
- Handles iframes and Shadow DOM.
- MutationObserver watches for dynamically loaded content.
- Transparent/semi-transparent colors are ignored (alpha < 0.1).

## Installation

1. Download or clone the repository.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable "Developer mode" using the toggle switch.
4. Click "Load unpacked" and select the project directory.

## Usage

1. Click the extension icon to open the popup.
2. Choose **Normal Mode** or **Ultra Mode** to toggle dark theme on the current tab.
3. Enable **"Apply to all sites"** to automatically apply dark mode globally.
4. Use the **Exclude List** to skip specific domains:
   - Type a domain and click "Add", or
   - Click "Exclude current site" to add the current domain.
   - Click × to remove a domain from the list.

## License

This project is licensed under the GPL-3.0 License. See the [LICENSE](LICENSE) file for more details.

## Contributing

Feel free to open issues or submit pull requests. See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Contact

For any inquiries: [pikchu3333@gmail.com](mailto:pikchu3333@gmail.com)
