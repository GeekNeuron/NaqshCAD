# Privacy and security

## What NaqshCAD does with your data

- **Nothing leaves your device.** The app makes no network requests while it runs; all code, fonts and assets are local files.
- **Where data lives:** in the file you save, and in this browser's local storage under three keys (settings, autosave, custom symbols). See FILE_FORMAT.md for the exact content.
- **Share links** contain the whole project inside the URL text. Anyone who has the link has the plan. The link is only as private as the place you paste it. Nothing is stored on a server.
- **Autosave** is opt-in (off by default), stays in the browser and is deleted when you save to a file or choose Delete autosave. Clearing the browser's site data removes everything.

## Input handling

| Input | Protection |
|---|---|
| Imported SVG symbols | Parsed as XML. Removed: `script`, `foreignObject`, `iframe`, `object`, `embed`, `audio`, `video`, `image`, animation elements, `<style>` blocks that import or reference URLs, all `on*` attributes, `javascript:` values, and any `href` or `url()` that is not a local `#` reference. A `viewBox` or width and height is required. Size limit 300 KB, 40 symbols |
| Project, settings and compare files | Parsed as JSON inside `try/catch`; settings are validated key by key; the wall graph is validated before use; invalid content is ignored or reported, never executed |
| Share links | Decoded and parsed as JSON only after the user confirms; failures show an error |
| Text labels and names | Inserted as text, not as HTML. Layer names (including those read from a project file or share link) are limited to 60 characters and shown with `textContent`; layer ids from files must match `[A-Za-z0-9_-]` and are escaped in selectors |

## Limits to be aware of

- Local storage is readable by any script running on the same origin. Do not host the app next to untrusted scripts. If you host it on a shared domain, remember other pages on that origin can read the same keys.
- Files you save are not encrypted.
- The app has no authentication or user accounts because it has no server.

## Reporting a problem

Open an issue with the file or steps that reproduce it. Do not attach plans that contain private information.

## Security history

- **Fixed in v25:** in v24 and earlier, a custom layer name stored in a project file or share link was inserted as HTML, so a crafted file could run script when opened, and a crafted layer id could break the layer list. If you share files or links with people you do not fully trust, use v25 or later. Share links already ask for confirmation before opening, but that confirmation does not protect older versions.
