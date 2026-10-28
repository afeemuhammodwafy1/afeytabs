const STORAGE_KEY = "contextkeeper_sessions";
const GUIDE_SEEN_KEY = "contextkeeper_welcome_guide_seen_v1";

const saveSessionBtn = document.getElementById("saveSessionBtn");
const sessionForm = document.getElementById("sessionForm");
const sessionNameInput = document.getElementById("sessionName");
const sessionsList = document.getElementById("sessionsList");
const sessionCount = document.getElementById("sessionCount");
const statusMessage = document.getElementById("statusMessage");
const exportBtn = document.getElementById("exportBtn");
const importBtn = document.getElementById("importBtn");
const importFile = document.getElementById("importFile");
const tabPicker = document.getElementById("tabPicker");
const tabChoices = document.getElementById("tabChoices");
const pickerTabCount = document.getElementById("pickerTabCount");
const toggleAllTabsBtn = document.getElementById("toggleAllTabsBtn");
const saveSelectedBtn = document.getElementById("saveSelectedBtn");
const saveAllBtn = document.getElementById("saveAllBtn");
const closePickerBtn = document.getElementById("closePickerBtn");
const workspaceNoteInput = document.getElementById("workspaceNote");
const welcomeGuide = document.getElementById("welcomeGuide");
const dismissGuideBtn = document.getElementById("dismissGuideBtn");
const reopenGuideLaterBtn = document.getElementById("reopenGuideLaterBtn");

let sessions = [];
let availableTabs = [];
let pendingSessionName = "";

const icons = {
  restore: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11a9 9 0 1 0 2.6-6.3L3 7"></path><path d="M3 3v4h4M12 7v5l3 2"></path></svg>',
  note: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><path d="M14 3v6h6M8 13h8M8 17h6"></path></svg>',
  trash: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M5 7l1 13h12l1-13M9 7V4h6v3"></path></svg>',
  tabs: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"></rect><path d="M3 9h18M7 7h.01M10 7h.01"></path></svg>',
  window: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"></rect><path d="M3 9h18M13 14h4M15 12v4"></path></svg>',
  close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"></path></svg>'
};

function showStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.style.color = isError ? "var(--danger)" : "var(--success)";
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function loadSessions() {
  const result = await chrome.storage.local.get([STORAGE_KEY, GUIDE_SEEN_KEY]);
  sessions = Array.isArray(result[STORAGE_KEY]) ? result[STORAGE_KEY] : [];
  renderSessions();
  if (!result[GUIDE_SEEN_KEY]) {
    welcomeGuide.hidden = false;
    dismissGuideBtn.focus();
  }
}

async function dismissWelcomeGuide(markAsSeen) {
  welcomeGuide.hidden = true;
  if (markAsSeen) {
    try {
      await chrome.storage.local.set({ [GUIDE_SEEN_KEY]: true });
    } catch (error) {
      console.error("Afey Tabs: could not save guide preference", error);
    }
  }
}

async function persistSessions() {
  await chrome.storage.local.set({ [STORAGE_KEY]: sessions });
  renderSessions();
}

async function getCurrentTabs() {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  return tabs
    .filter((tab) => tab.url && /^https?:\/\//i.test(tab.url))
    .map((tab) => ({
      id: tab.id,
      title: tab.title || tab.url,
      url: tab.url,
      favIconUrl: tab.favIconUrl || "",
      pinned: Boolean(tab.pinned)
    }));
}

async function openTabPicker(customName = "") {
  try {
    availableTabs = await getCurrentTabs();
    pendingSessionName = customName.trim();
    workspaceNoteInput.value = "";
    if (availableTabs.length === 0) {
      showStatus("No web tabs available to save in this window.", true);
      return;
    }
    renderTabChoices();
    tabPicker.hidden = false;
    tabPicker.scrollIntoView({ behavior: "smooth", block: "nearest" });
    showStatus("");
  } catch (error) {
    console.error("Afey Tabs: could not read current tabs", error);
    showStatus("Could not read tabs. Check extension permissions and try again.", true);
  }
}

function renderTabChoices() {
  tabChoices.replaceChildren();
  pickerTabCount.textContent = `${availableTabs.length} web tab${availableTabs.length === 1 ? "" : "s"} available`;
  toggleAllTabsBtn.textContent = "Deselect all";

  availableTabs.forEach((tab, index) => {
    const label = document.createElement("label");
    label.className = "tab-choice";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = true;
    checkbox.dataset.tabIndex = String(index);
    checkbox.setAttribute("aria-label", `Select ${tab.title || tab.url}`);

    const favicon = document.createElement("span");
    favicon.className = "tab-favicon";
    if (tab.favIconUrl && /^https?:\/\//i.test(tab.favIconUrl)) {
      const img = document.createElement("img");
      img.src = tab.favIconUrl;
      img.alt = "";
      img.onerror = () => {
        favicon.replaceChildren();
        favicon.innerHTML = icons.tabs;
      };
      favicon.append(img);
    } else {
      favicon.innerHTML = icons.tabs;
    }

    const copy = document.createElement("span");
    copy.className = "tab-choice-copy";
    const title = document.createElement("div");
    title.className = "tab-choice-title";
    title.textContent = tab.title || tab.url;
    const url = document.createElement("div");
    url.className = "tab-choice-url";
    url.textContent = tab.url;
    copy.append(title, url);
    label.append(checkbox, favicon, copy);
    tabChoices.append(label);
  });

  updateToggleAllLabel();
}

function updateToggleAllLabel() {
  const boxes = [...tabChoices.querySelectorAll('input[type="checkbox"]')];
  const allSelected = boxes.length > 0 && boxes.every((box) => box.checked);
  toggleAllTabsBtn.textContent = allSelected ? "Deselect all" : "Select all";
  const selectedCount = boxes.filter((box) => box.checked).length;
  saveSelectedBtn.textContent = `Save selected (${selectedCount})`;
  saveSelectedBtn.disabled = selectedCount === 0;
}

function selectedTabs() {
  const selectedIndexes = new Set(
    [...tabChoices.querySelectorAll('input[type="checkbox"]:checked')]
      .map((box) => Number(box.dataset.tabIndex))
  );
  return availableTabs.filter((tab, index) => selectedIndexes.has(index));
}

async function saveChosenTabs(tabsToSave) {
  if (tabsToSave.length === 0) {
    showStatus("Select at least one tab to save.", true);
    return;
  }

  try {
    const now = new Date().toISOString();
    const session = {
      id: makeId(),
      name: pendingSessionName || `Workspace ${new Date().toLocaleDateString()}`,
      createdAt: now,
      updatedAt: now,
      tabs: tabsToSave.map((tab) => ({
        title: tab.title,
        url: tab.url,
        pinned: Boolean(tab.pinned)
      })),
      note: workspaceNoteInput.value.trim()
    };

    sessions.unshift(session);
    await persistSessions();
    sessionNameInput.value = "";
    tabPicker.hidden = true;
    workspaceNoteInput.value = "";
    showStatus(`Saved ${tabsToSave.length} of ${availableTabs.length} available tabs.`);
  } catch (error) {
    console.error("Afey Tabs: failed to save workspace", error);
    showStatus("Could not save workspace. Reload the extension and try again.", true);
  }
}

function createButton(label, className, iconMarkup, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `small-button ${className || ""}`.trim();
  button.innerHTML = `${iconMarkup || ""}<span>${label}</span>`;
  button.addEventListener("click", onClick);
  return button;
}

function createEmptyState() {
  const empty = document.createElement("div");
  empty.className = "empty-state";
  empty.innerHTML = `
    <div class="empty-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="15" rx="2"></rect><path d="M3 8h18M7 6h.01M10 6h.01"></path></svg>
    </div>
    <strong>No saved workspaces yet</strong>
    <p>Save your current tabs to create your first workspace.</p>`;
  return empty;
}

function renderSessions() {
  sessionCount.textContent = String(sessions.length);
  sessionsList.replaceChildren();

  if (sessions.length === 0) {
    sessionsList.append(createEmptyState());
    return;
  }

  for (const session of sessions) {
    const card = document.createElement("article");
    card.className = "session-card";
    card.dataset.sessionId = session.id;

    const head = document.createElement("div");
    head.className = "session-head";
    const info = document.createElement("div");
    info.className = "session-info";
    const title = document.createElement("h4");
    title.textContent = session.name || "Untitled workspace";

    const meta = document.createElement("div");
    meta.className = "session-meta";
    meta.innerHTML = `${icons.tabs}<span>${session.tabs.length} ${session.tabs.length === 1 ? "tab" : "tabs"}</span><span aria-hidden="true">·</span><span>${escapeHtml(formatDate(session.createdAt))}</span>`;
    info.append(title, meta);
    head.append(info);
    card.append(head);

    if (session.note) {
      const note = document.createElement("p");
      note.className = "session-note";
      note.textContent = session.note;
      card.append(note);
    }

    const actions = document.createElement("div");
    actions.className = "session-actions";
    actions.append(
      createButton("Restore", "restore", icons.restore, () => restoreSession(session.id)),
      createButton("New window", "", icons.window, () => restoreSessionInNewWindow(session.id)),
      createButton("Edit note", "", icons.note, () => editNote(session.id)),
      createButton("Delete", "delete", icons.trash, () => deleteSession(session.id))
    );
    card.append(actions);
    sessionsList.append(card);
  }
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Saved workspace";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

function getValidTabs(session) {
  return session.tabs.filter((tab) => {
    try {
      const url = new URL(tab.url);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  });
}

function normalizeUrl(url) {
  try {
    const u = new URL(url);
    u.hash = "";
    return u.href.replace(/\/$/, "");
  } catch {
    return url;
  }
}

async function restoreSession(sessionId) {
  const session = sessions.find((item) => item.id === sessionId);
  if (!session) return;

  const validTabs = getValidTabs(session);
  if (validTabs.length === 0) {
    showStatus("This workspace has no valid web URLs to restore.", true);
    return;
  }

  let openUrls = new Set();
  try {
    const current = await chrome.tabs.query({ currentWindow: true });
    openUrls = new Set(current.filter((t) => t.url).map((t) => normalizeUrl(t.url)));
  } catch (error) {
    console.warn("Afey Tabs: could not read open tabs", error);
  }

  let restored = 0;
  let skipped = 0;
  for (const tab of validTabs) {
    const key = normalizeUrl(tab.url);
    if (openUrls.has(key)) {
      skipped += 1;
      continue;
    }
    try {
      await chrome.tabs.create({
        url: tab.url,
        active: false,
        pinned: Boolean(tab.pinned)
      });
      openUrls.add(key);
      restored += 1;
    } catch (error) {
      console.warn("Afey Tabs: could not restore a tab", tab.url, error);
    }
  }

  const skippedText = skipped ? `, ${skipped} already open` : "";
  showStatus(`Restored ${restored} of ${validTabs.length} tabs${skippedText}.`);
}

async function restoreSessionInNewWindow(sessionId) {
  const session = sessions.find((item) => item.id === sessionId);
  if (!session) return;

  const validTabs = getValidTabs(session);
  if (validTabs.length === 0) {
    showStatus("This workspace has no valid web URLs to restore.", true);
    return;
  }

  try {
    const win = await chrome.windows.create({
      url: validTabs.map((tab) => tab.url),
      focused: true
    });
    const created = win.tabs || [];
    for (let i = 0; i < created.length && i < validTabs.length; i++) {
      if (validTabs[i].pinned) {
        try {
          await chrome.tabs.update(created[i].id, { pinned: true });
        } catch (error) {
          console.warn("Afey Tabs: could not pin tab", error);
        }
      }
    }
    showStatus(`Opened ${validTabs.length} tabs in a new window.`);
  } catch (error) {
    console.error("Afey Tabs: could not open new window", error);
    showStatus("Could not open a new window.", true);
  }
}

function editNote(sessionId) {
  const session = sessions.find((item) => item.id === sessionId);
  const card = sessionsList.querySelector(`[data-session-id="${CSS.escape(sessionId)}"]`);
  if (!session || !card) return;

  if (card.querySelector(".note-editor")) {
    card.querySelector(".note-editor").focus();
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.className = "note-editor";
  textarea.rows = 3;
  textarea.maxLength = 2000;
  textarea.placeholder = "What were you working on? What comes next?";
  textarea.value = session.note || "";
  textarea.setAttribute("aria-label", `Notes for ${session.name}`);

  const buttonRow = document.createElement("div");
  buttonRow.className = "note-save-row";
  const cancelButton = createButton("Cancel", "", icons.close, () => {
    textarea.remove();
    buttonRow.remove();
  });
  const saveButton = createButton("Save note", "restore", icons.note, async () => {
    session.note = textarea.value.trim();
    session.updatedAt = new Date().toISOString();
    try {
      await persistSessions();
      showStatus("Workspace note saved.");
    } catch (error) {
      console.error("Afey Tabs: failed to save note", error);
      showStatus("Could not save note. Please try again.", true);
    }
  });
  buttonRow.append(cancelButton, saveButton);
  card.append(textarea, buttonRow);
  textarea.focus();
}

async function deleteSession(sessionId) {
  const session = sessions.find((item) => item.id === sessionId);
  if (!session) return;
  if (!confirm(`Delete "${session.name}"? This cannot be undone.`)) return;
  sessions = sessions.filter((item) => item.id !== sessionId);
  await persistSessions();
  showStatus("Workspace deleted.");
}

function exportSessions() {
  const backup = {
    app: "Afey Tabs",
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    sessions
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `afey-tabs-backup-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showStatus("Backup export started.");
}

function sanitizeImportedSession(raw) {
  if (!raw || typeof raw !== "object" || !Array.isArray(raw.tabs)) return null;
  const tabs = raw.tabs
    .filter((tab) => tab && typeof tab.url === "string" && /^https?:\/\//i.test(tab.url))
    .map((tab) => ({
      title: typeof tab.title === "string" && tab.title ? tab.title.slice(0, 500) : tab.url,
      url: tab.url,
      pinned: Boolean(tab.pinned)
    }));
  if (tabs.length === 0) return null;
  const now = new Date().toISOString();
  return {
    id: typeof raw.id === "string" && raw.id ? raw.id : makeId(),
    name: typeof raw.name === "string" && raw.name.trim() ? raw.name.trim().slice(0, 80) : "Imported workspace",
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : now,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : now,
    tabs,
    note: typeof raw.note === "string" ? raw.note.slice(0, 2000) : ""
  };
}

async function importSessions(file) {
  if (!file) return;
  try {
    if (file.size > 20 * 1024 * 1024) {
      showStatus("That file is too large to be a workspace backup.", true);
      return;
    }
    const data = JSON.parse(await file.text());
    const incoming = Array.isArray(data) ? data : data && Array.isArray(data.sessions) ? data.sessions : null;
    if (!incoming) {
      showStatus("This is not a valid Afey Tabs backup.", true);
      return;
    }

    const existingIds = new Set(sessions.map((s) => s.id));
    let added = 0;
    let skipped = 0;
    const toAdd = [];
    for (const raw of incoming) {
      const session = sanitizeImportedSession(raw);
      if (!session) { skipped += 1; continue; }
      if (existingIds.has(session.id)) { skipped += 1; continue; }
      existingIds.add(session.id);
      toAdd.push(session);
      added += 1;
    }

    if (added === 0) {
      showStatus(skipped ? "Nothing new to import (already saved or invalid)." : "No workspaces found in this file.", true);
      return;
    }

    sessions = [...sessions, ...toAdd].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    await persistSessions();
    showStatus(`Imported ${added} workspace${added === 1 ? "" : "s"}${skipped ? `, skipped ${skipped}` : ""}.`);
  } catch (error) {
    console.error("Afey Tabs: import failed", error);
    showStatus("Could not read that file. Make sure it is an Afey Tabs backup.", true);
  } finally {
    importFile.value = "";
  }
}

saveSessionBtn.addEventListener("click", () => openTabPicker(sessionNameInput.value));
sessionForm.addEventListener("submit", (event) => {
  event.preventDefault();
  openTabPicker(sessionNameInput.value);
});
toggleAllTabsBtn.addEventListener("click", () => {
  const boxes = [...tabChoices.querySelectorAll('input[type="checkbox"]')];
  const shouldSelectAll = boxes.some((box) => !box.checked);
  boxes.forEach((box) => { box.checked = shouldSelectAll; });
  updateToggleAllLabel();
});
tabChoices.addEventListener("change", updateToggleAllLabel);
saveSelectedBtn.addEventListener("click", () => saveChosenTabs(selectedTabs()));
saveAllBtn.addEventListener("click", () => saveChosenTabs(availableTabs));
closePickerBtn.addEventListener("click", () => { tabPicker.hidden = true; });
exportBtn.addEventListener("click", exportSessions);
importBtn.addEventListener("click", () => importFile.click());
importFile.addEventListener("change", () => importSessions(importFile.files[0]));
dismissGuideBtn.addEventListener("click", () => dismissWelcomeGuide(true));
reopenGuideLaterBtn.addEventListener("click", () => dismissWelcomeGuide(false));
welcomeGuide.addEventListener("click", (event) => {
  if (event.target === welcomeGuide) dismissWelcomeGuide(false);
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !welcomeGuide.hidden) dismissWelcomeGuide(false);
});

loadSessions().catch((error) => {
  console.error("Afey Tabs: could not load saved workspaces", error);
  showStatus("Could not load workspaces. Reload the extension and try again.", true);
});
