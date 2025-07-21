let editor;
let models = {};
let currentTab = null;

require.config({ paths: { vs: './vs' } });

require(['vs/editor/editor.main'], function () {
  editor = monaco.editor.create(document.getElementById("container"), {
    value: '',
    language: 'lua',
    theme: 'vs-dark',
    automaticLayout: true
  });

  document.getElementById("add-tab").addEventListener("click", () => {
    const tabName = getUniqueTabName();
    createTab(tabName, "");
  });

  loadTabsFromStorage();
});

function getUniqueTabName(base = "new.lua") {
  let name = base;
  let index = 1;
  while (models.hasOwnProperty(name)) {
    name = `new${index++}.lua`;
  }
  return name;
}

function createTab(name, code = "") {
  const saved = localStorage.getItem("tab:" + name);
  const model = monaco.editor.createModel(saved ?? code, "lua");
  models[name] = model;

  model.onDidChangeContent(() => {
    localStorage.setItem("tab:" + name, model.getValue());
  });

  const tab = document.createElement("div");
  tab.className = "tab";

  const icon = document.createElement("span");
  icon.className = "tab-icon";
  icon.innerHTML = "🌙";

  const title = document.createElement("span");
  title.className = "tab-title";
  title.textContent = name;

  const closeBtn = document.createElement("span");
  closeBtn.className = "close";
  closeBtn.textContent = "×";
  closeBtn.onclick = (e) => {
    e.stopPropagation();
    closeTab(name, tab);
  };

  tab.appendChild(icon);
  tab.appendChild(title);
  tab.appendChild(closeBtn);
  tab.addEventListener("click", () => switchTab(name));
  tab.addEventListener("dblclick", () => renameTab(name, tab, title));

  document.getElementById("tab-bar").appendChild(tab);
  switchTab(name);
  saveTabList();
}

function switchTab(name) {
  if (!models[name]) return;

  document.querySelectorAll(".tab").forEach(tab => tab.classList.remove("active"));
  const tabs = [...document.querySelectorAll(".tab")];
  const targetTab = tabs.find(tab => tab.innerText.includes(name));
  if (targetTab) targetTab.classList.add("active");

  currentTab = name;
  localStorage.setItem("lastTab", name);
  editor.setModel(models[name]);
}

function renameTab(oldName, tabEl, titleEl) {
  const input = document.createElement("input");
  input.type = "text";
  input.value = oldName;
  input.style = "width: 100px;";
  tabEl.replaceChild(input, titleEl);
  input.focus();

  input.onblur = () => {
    const newName = input.value.trim();
    if (!newName || models[newName]) {
      tabEl.replaceChild(titleEl, input);
      return;
    }

    models[newName] = models[oldName];
    delete models[oldName];

    const saved = localStorage.getItem("tab:" + oldName);
    if (saved) {
      localStorage.setItem("tab:" + newName, saved);
      localStorage.removeItem("tab:" + oldName);
    }

    titleEl.textContent = newName;
    tabEl.replaceChild(titleEl, input);
    if (currentTab === oldName) currentTab = newName;
    saveTabList();
  };
}

function closeTab(name, tabEl) {
  if (currentTab === name) {
    const remaining = Object.keys(models).filter(n => n !== name);
    if (remaining.length) switchTab(remaining[0]);
    else editor.setModel(null);
  }

  delete models[name];
  tabEl.remove();
  localStorage.removeItem("tab:" + name);
  saveTabList();
}

function saveTabList() {
  const tabNames = Object.keys(models);
  localStorage.setItem("tabList", JSON.stringify(tabNames));
}

function loadTabsFromStorage() {
  const savedTabs = JSON.parse(localStorage.getItem("tabList") || "[]");
  if (savedTabs.length === 0) {
    createTab("main.lua", "--[[\n  https://discord.gg/kraH4XfuPs\n]]");
    return;
  }

  for (const tab of savedTabs) {
    createTab(tab);
  }

  const last = localStorage.getItem("lastTab");
  if (last && models[last]) {
    switchTab(last);
  }
}