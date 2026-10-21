# Afey Tabs

**Save your workspace. Remember your progress.**

Afey Tabs is a local-first Chrome extension by **Wafyro Software** that helps you save the web tabs related to a task and add a note so you can remember what you were doing when you return.

**Current release: `v1.0.0` — Stable**

**Founder & Software Developer:** Afee Muhammod Wafy

## Features

- Show a quick-start **How to use** guide the first time the extension is opened. The guide can be dismissed and will not appear again after choosing “Got it, let’s start”.
- Select individual eligible web tabs or save all eligible HTTP/HTTPS tabs in the current browser window.
- Create named workspaces for different tasks.
- Add a note with the task context, reminders, or next steps; edit the note later.
- Restore saved tabs in a workspace.
- Delete workspaces you no longer need.
- Export saved workspaces to a JSON backup.
- Store workspace data locally with `chrome.storage.local`; no account or remote database is required by the extension.

## Install locally

1. Download and extract the release ZIP.
2. Open `chrome://extensions` in Google Chrome.
3. Turn on **Developer mode**.
4. Select **Load unpacked**.
5. Choose the extracted `Afey Tabs` folder — the one containing `manifest.json`.
6. Open the Afey Tabs extension. On first open, the quick-start guide explains the basics.

## Quick start

1. Select **Save current workspace**.
2. Choose the web tabs you want to keep, or select all eligible tabs.
3. Optionally enter a workspace name and add a note about what you were doing or what comes next.
4. Select **Save selected** or **Save all tabs**.
5. When you return later, choose **Restore** to reopen its tabs. Use **Edit note** to update your reminder.
6. Use **Export** to download a JSON backup of your saved workspaces.

## Privacy

- Workspace data is stored in the browser using `chrome.storage.local`.
- Afey Tabs does not require an account or intentionally send saved workspace data to a Afey Tabs server.
- When you save a workspace, the extension stores the selected tab titles and URLs, pinned state, workspace name, and optional note.
- **Local storage is not encryption.** Do not save passwords, access tokens, confidential URLs, or other sensitive information in notes. Exported JSON backups can contain URLs and notes; keep them secure.
- The extension currently saves eligible HTTP/HTTPS tabs from the current browser window. Browser-internal pages and other non-web URLs are excluded.

## Current scope and limitations

This release focuses on saving and restoring tab-based workspaces with a single optional note. It does not currently include accounts, cloud sync, AI features, a workspace search interface, or JSON import. Future updates may expand these capabilities.

## Technology

- Chrome Extension Manifest V3
- HTML, CSS, and JavaScript
- `chrome.tabs` and `chrome.storage.local`

## Feedback

Bug reports and feature suggestions are welcome through the project's GitHub repository. When reporting a problem, include your browser version, steps to reproduce, and expected versus actual behavior. Do not include private URLs or workspace backup files in public issues.

## License

Released under the MIT License. See [`LICENSE`](LICENSE).

---

Built by **Wafyro Software**  
**Afee Muhammod Wafy — Founder & Software Developer**
