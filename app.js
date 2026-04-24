const loginView = document.querySelector("#loginView");
const workspace = document.querySelector("#workspace");
const dingLogin = document.querySelector("#dingLogin");
const promptInput = document.querySelector("#promptInput");
const sendButton = document.querySelector("#sendButton");
const modelSwitcher = document.querySelector("#modelSwitcher");
const modelSelect = document.querySelector("#modelSelect");
const modelLabel = document.querySelector("#modelLabel");
const modelMenu = document.querySelector("#modelMenu");
const summaryModal = document.querySelector("#summaryModal");
const summaryText = document.querySelector("#summaryText");
const closeModal = document.querySelector("#closeModal");
const cancelSummary = document.querySelector("#cancelSummary");
const confirmSummary = document.querySelector("#confirmSummary");
const expertState = document.querySelector("#expertState");
const activeExpertName = document.querySelector("#activeExpertName");
const exitExpert = document.querySelector("#exitExpert");
const historyList = document.querySelector("#historyList");
const newChatNav = document.querySelector("#newChatNav");
const adminNav = document.querySelector("#adminNav");
const sidebar = document.querySelector("#sidebar");
const sidebarMenuToggle = document.querySelector("#sidebarMenuToggle");
const contentArea = document.querySelector("#contentArea");
const chatView = document.querySelector("#chatView");
const chatTitle = document.querySelector("#chatTitle");
const messageList = document.querySelector("#messageList");
const clearChat = document.querySelector("#clearChat");
const creatorView = document.querySelector("#creatorView");
const saveExpert = document.querySelector("#saveExpert");
const toolSections = document.querySelector("#toolSections");
const adminView = document.querySelector("#adminView");
const adminCreateExpert = document.querySelector("#adminCreateExpert");
const adminExpertList = document.querySelector("#adminExpertList");
const expertCountBadge = document.querySelector("#expertCountBadge");
const knowledgeView = document.querySelector("#knowledgeView");
const mockUpload = document.querySelector("#mockUpload");
const addKnowledgeDoc = document.querySelector("#addKnowledgeDoc");
const docList = document.querySelector("#docList");
const knowledgeExpertSelect = document.querySelector("#knowledgeExpertSelect");
const departmentList = document.querySelector("#departmentList");
const metricPeople = document.querySelector("#metricPeople");
const riskList = document.querySelector("#riskList");
const userRows = document.querySelector("#userRows");
const policyDepartment = document.querySelector("#policyDepartment");
const policyUser = document.querySelector("#policyUser");
const policyQuota = document.querySelector("#policyQuota");
const policyPro = document.querySelector("#policyPro");
const policyAudit = document.querySelector("#policyAudit");
const policyPreview = document.querySelector("#policyPreview");
const applyPolicy = document.querySelector("#applyPolicy");

const expertConfigs = window.MAIJI_EXPERTS || {};
const departments = window.MAIJI_DEPARTMENTS || [];
const users = window.MAIJI_USERS || [];
const riskSessions = window.MAIJI_RISK_SESSIONS || [];
const customExpertStorageKey = "maiji_custom_experts";
let selectedModel = "GPT 快速";
let pendingExpert = "";
let activeExpert = "";
let isGenerating = false;

function isCompactLayout() {
  return window.innerWidth <= 980;
}

function syncSidebarMenuState(isOpen) {
  workspace.classList.toggle("sidebar-open", isOpen);
  sidebar.classList.toggle("menu-open", isOpen);
  sidebarMenuToggle.setAttribute("aria-expanded", String(isOpen));
}

function closeSidebarMenu() {
  if (!isCompactLayout()) return;
  syncSidebarMenuState(false);
}

function toggleSidebarMenu() {
  if (!isCompactLayout()) return;
  syncSidebarMenuState(!workspace.classList.contains("sidebar-open"));
}

function setActiveNav(activeButton) {
  [newChatNav, adminNav].forEach((button) => {
    button.classList.toggle("active", button === activeButton);
  });
}

function getExpertConfig(name) {
  return expertConfigs[name] || null;
}

function buildExpertSummary(name) {
  const expert = getExpertConfig(name);
  if (!expert) return "请总结当前对话上下文，并交给该专家继续处理。";

  return [
    `即将启用专家：${expert.name}`,
    `专家定位：${expert.profile.expertise}`,
    `沟通语气：${expert.profile.tone}`,
    `语言风格：${expert.profile.language}`,
    `核心目标：${expert.goals.join("；")}`,
    `工作流：${expert.workflow.join(" -> ")}`
  ].join("\n");
}

function buildExpertReply(text) {
  const expert = getExpertConfig(activeExpert);
  if (!expert) return `我会使用「${selectedModel}」处理这个任务。这是前端原型中的模拟回复：我会围绕“${text}”继续拆解目标、关键步骤和可执行建议。`;

  return [
    `我已进入「${expert.name}」模式。`,
    `我会按这个专家的工作流处理：${expert.workflow[0]}`,
    `你刚才的问题是“${text}”。`,
    `先做单点突破：请先补充一个最关键的数据，比如 ROI、转化率、人效、客单价或投放成本。没有真实数据，我不会给你空泛建议。`
  ].join("");
}

const creatorFields = {
  name: document.querySelector("#expertNameInput"),
  description: document.querySelector("#expertDescInput"),
  category: document.querySelector("#expertCategoryInput"),
  model: document.querySelector("#expertModelInput"),
  expertise: document.querySelector("#expertiseInput"),
  tone: document.querySelector("#toneInput"),
  language: document.querySelector("#languageInput"),
  constraints: document.querySelector("#constraintsInput"),
  goals: document.querySelector("#goalsInput"),
  workflow: document.querySelector("#workflowInput")
};

const previewNodes = {
  name: document.querySelector("#previewName"),
  description: document.querySelector("#previewDesc"),
  category: document.querySelector("#previewCategory"),
  model: document.querySelector("#previewModel"),
  prompt: document.querySelector("#promptPreview"),
  answer: document.querySelector("#previewAnswer")
};

function splitLines(value) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function getCreatorExpert() {
  const name = creatorFields.name.value.trim() || "未命名专家";
  return {
    id: name.toLowerCase().replace(/\s+/g, "-"),
    name,
    category: creatorFields.category.value,
    boundModel: creatorFields.model.value,
    cardDescription: creatorFields.description.value.trim() || "暂无描述",
    profile: {
      expertise: creatorFields.expertise.value.trim(),
      tone: creatorFields.tone.value.trim(),
      language: creatorFields.language.value.trim()
    },
    constraints: splitLines(creatorFields.constraints.value),
    goals: splitLines(creatorFields.goals.value),
    workflow: splitLines(creatorFields.workflow.value)
  };
}

function fillCreatorForm(expert) {
  if (!expert) return;

  creatorFields.name.value = expert.name || "";
  creatorFields.description.value = expert.cardDescription || "";
  creatorFields.category.value = expert.category || creatorFields.category.options[0]?.value || "";
  creatorFields.model.value = expert.boundModel || creatorFields.model.options[0]?.value || "";
  creatorFields.expertise.value = expert.profile?.expertise || "";
  creatorFields.tone.value = expert.profile?.tone || "";
  creatorFields.language.value = expert.profile?.language || "";
  creatorFields.constraints.value = (expert.constraints || []).join("\n");
  creatorFields.goals.value = (expert.goals || []).join("\n");
  creatorFields.workflow.value = (expert.workflow || []).join("\n");
}

function buildPromptPreview(expert) {
  return [
    `[${expert.name}]`,
    "Profile",
    `Expertise: ${expert.profile.expertise}`,
    `Tone: ${expert.profile.tone}`,
    `Language: ${expert.profile.language}`,
    "",
    "Constraints",
    ...expert.constraints.map((item, index) => `禁令${index + 1}: ${item}`),
    "",
    "Goals",
    ...expert.goals.map((item, index) => `核心目标${String.fromCharCode(65 + index)}: ${item}`),
    "",
    "Workflow",
    ...expert.workflow.map((item, index) => `Step ${index + 1}: ${item}`)
  ].join("\n");
}

function updateExpertPreview() {
  const expert = getCreatorExpert();
  previewNodes.name.textContent = expert.name;
  previewNodes.description.textContent = expert.cardDescription;
  previewNodes.category.textContent = expert.category;
  previewNodes.model.textContent = expert.boundModel;
  previewNodes.prompt.textContent = buildPromptPreview(expert);
  previewNodes.answer.textContent = `我是「${expert.name}」。我会用「${expert.profile.tone || "清晰务实"}」的方式工作。请先给我一个具体问题，我会按工作流第一步开始：${expert.workflow[0] || "诊断当前问题"}。`;
}

dingLogin.addEventListener("click", () => {
  loginView.classList.add("is-hidden");
  workspace.classList.remove("is-hidden");
  setActiveNav(newChatNav);
  syncSidebarMenuState(false);
  promptInput.focus();
});

promptInput.addEventListener("input", () => {
  sendButton.classList.toggle("ready", promptInput.value.trim().length > 0);
});

sendButton.addEventListener("click", () => {
  const text = promptInput.value.trim();
  if (!text || isGenerating) return;

  openConversation(text);
  addMessage("user", text);
  addThinkingMessage();
  window.setTimeout(() => {
    replaceThinkingMessage(text);
  }, 650);

  const item = document.createElement("button");
  item.className = "history-item";
  item.type = "button";
  item.textContent = text.length > 14 ? `${text.slice(0, 14)}...` : text;
  historyList.prepend(item);

  promptInput.value = "";
  sendButton.classList.remove("ready");
});

function openConversation(text) {
  contentArea.classList.add("chat-mode");
  chatView.classList.remove("is-hidden");
  chatTitle.textContent = activeExpert || (text.length > 18 ? `${text.slice(0, 18)}...` : text);
}

function addMessage(role, text) {
  const message = document.createElement("article");
  message.className = `message ${role}`;

  const avatar = document.createElement("span");
  avatar.className = "message-avatar";
  avatar.textContent = role === "user" ? "我" : "麦";

  const bubble = document.createElement("div");
  bubble.className = "message-bubble";

  const meta = document.createElement("div");
  meta.className = "message-meta";
  meta.textContent = role === "user" ? "你" : activeExpert || selectedModel;

  const content = document.createElement("div");
  content.textContent = text;

  bubble.append(meta, content);

  if (role === "user") {
    message.append(bubble, avatar);
  } else {
    message.append(avatar, bubble);
  }

  messageList.append(message);
  messageList.scrollTop = messageList.scrollHeight;
}

function addThinkingMessage() {
  isGenerating = true;
  sendButton.classList.remove("ready");
  sendButton.setAttribute("aria-label", "正在生成");
  sendButton.textContent = "■";

  const message = document.createElement("article");
  message.className = "message ai thinking";
  message.innerHTML = `
    <span class="message-avatar">麦</span>
    <div class="message-bubble">
      <div class="message-meta">${activeExpert || selectedModel}</div>
      <span class="typing-dot" aria-label="正在生成"></span>
    </div>
  `;
  messageList.append(message);
  messageList.scrollTop = messageList.scrollHeight;
}

function replaceThinkingMessage(text) {
  const thinking = messageList.querySelector(".thinking");
  if (thinking) thinking.remove();
  addStreamingMessage("ai", buildExpertReply(text));
}

function addStreamingMessage(role, text) {
  const message = document.createElement("article");
  message.className = `message ${role}`;

  const avatar = document.createElement("span");
  avatar.className = "message-avatar";
  avatar.textContent = "麦";

  const bubble = document.createElement("div");
  bubble.className = "message-bubble";

  const meta = document.createElement("div");
  meta.className = "message-meta";
  meta.textContent = activeExpert || selectedModel;

  const content = document.createElement("div");
  bubble.append(meta, content);
  message.append(avatar, bubble);
  messageList.append(message);

  let index = 0;
  const timer = window.setInterval(() => {
    content.textContent = text.slice(0, index + 1);
    index += 1;
    messageList.scrollTop = messageList.scrollHeight;

    if (index >= text.length) {
      window.clearInterval(timer);
      isGenerating = false;
      sendButton.textContent = "▶";
      sendButton.setAttribute("aria-label", "发送");
      sendButton.classList.toggle("ready", promptInput.value.trim().length > 0);
    }
  }, 18);
}

function closeModelMenu() {
  modelMenu.classList.add("is-hidden");
  modelSelect.setAttribute("aria-expanded", "false");
}

function openModelMenu() {
  modelMenu.classList.remove("is-hidden");
  modelSelect.setAttribute("aria-expanded", "true");
}

modelSelect.addEventListener("click", (event) => {
  event.stopPropagation();
  if (activeExpert) return;
  if (modelMenu.classList.contains("is-hidden")) {
    openModelMenu();
  } else {
    closeModelMenu();
  }
});

document.querySelectorAll(".model-option").forEach((option) => {
  option.addEventListener("click", () => {
    selectedModel = option.dataset.model;
    modelLabel.textContent = selectedModel;
    document.querySelectorAll(".model-option").forEach((item) => {
      item.classList.toggle("selected", item === option);
    });
    closeModelMenu();
  });
});

document.addEventListener("click", (event) => {
  if (!modelSwitcher.contains(event.target)) {
    closeModelMenu();
  }
});

function bindAgentCard(card) {
  card.addEventListener("click", () => {
    pendingExpert = card.dataset.agent;
    summaryText.value = buildExpertSummary(pendingExpert);
    summaryModal.classList.remove("is-hidden");
    summaryText.focus();
  });
}

document.querySelectorAll("[data-agent]").forEach(bindAgentCard);

function createExpertCard(expert) {
  const group = Array.from(document.querySelectorAll(".tool-group")).find((section) => {
    const title = section.querySelector("h2");
    return title && title.textContent === expert.category;
  });
  const grid = group ? group.querySelector(".card-grid") : toolSections.querySelector(".card-grid");
  if (!grid) return;

  const card = document.createElement("button");
  card.className = "agent-card";
  card.type = "button";
  card.dataset.agent = expert.name;
  card.innerHTML = `
    <span class="card-icon advisor" aria-hidden="true">▦</span>
    <span>
      <strong>${expert.name}</strong>
      <small>${expert.cardDescription}</small>
    </span>
  `;
  bindAgentCard(card);
  grid.prepend(card);
}

function loadCustomExperts() {
  const saved = JSON.parse(localStorage.getItem(customExpertStorageKey) || "[]");
  saved.forEach((expert) => {
    if (!expert || !expert.name) return;
    expertConfigs[expert.name] = expert;
    if (!document.querySelector(`[data-agent="${expert.name}"]`)) {
      createExpertCard(expert);
    }
  });
  refreshKnowledgeExpertOptions();
}

function saveCustomExpert(expert) {
  const saved = JSON.parse(localStorage.getItem(customExpertStorageKey) || "[]");
  const next = saved.filter((item) => item.name !== expert.name);
  next.unshift(expert);
  localStorage.setItem(customExpertStorageKey, JSON.stringify(next));
}

function refreshKnowledgeExpertOptions() {
  const names = Object.keys(expertConfigs);
  knowledgeExpertSelect.innerHTML = names.map((name) => `<option>${name}</option>`).join("");
}

function renderAdminExpertList() {
  const experts = Object.values(expertConfigs);
  expertCountBadge.textContent = `${experts.length} 个专家`;
  adminExpertList.innerHTML = experts
    .map((expert) => {
      const isCustom = JSON.parse(localStorage.getItem(customExpertStorageKey) || "[]").some((item) => item.name === expert.name);
      return `
        <article class="admin-expert-item">
          <div>
            <h3>${expert.name}</h3>
            <p>${expert.category} · ${expert.boundModel} · ${isCustom ? "本地新增" : "系统预置"}</p>
            <p>${expert.cardDescription}</p>
          </div>
          <div class="admin-actions">
            <button class="mini-button" type="button" data-admin-create="${expert.name}">编辑</button>
            <button class="mini-button" type="button" data-admin-knowledge="${expert.name}">挂载知识库</button>
          </div>
        </article>
      `;
    })
    .join("");

  adminExpertList.querySelectorAll("[data-admin-create]").forEach((button) => {
    button.addEventListener("click", () => {
      editExpert(button.dataset.adminCreate);
    });
  });
  adminExpertList.querySelectorAll("[data-admin-knowledge]").forEach((button) => {
    button.addEventListener("click", () => {
      openKnowledgeView(button.dataset.adminKnowledge);
    });
  });
}

function renderDepartments() {
  const totalPeople = departments.reduce((sum, department) => sum + department.people, 0);
  metricPeople.textContent = totalPeople;
  departmentList.innerHTML = departments
    .map((department) => {
      const teams = department.teams
        .map((team) => `<span class="team-pill">${team.name} · ${team.people}人</span>`)
        .join("");
      return `
        <article class="department-item">
          <div class="department-head">
            <strong>${department.name}</strong>
            <span>${department.people}人</span>
          </div>
          <div class="team-list">${teams}</div>
        </article>
      `;
    })
    .join("");
}

function renderRiskSessions() {
  riskList.innerHTML = riskSessions
    .map((session) => {
      return `
        <article>
          <div class="risk-person">
            <strong>${session.user} · ${session.role}</strong>
            <em>${session.riskType}</em>
          </div>
          <div class="risk-meta">${session.department} · ${session.team} · ${session.expert}</div>
          <span>${session.detail}</span>
          <button class="mini-button risk-action" type="button">查看对话</button>
        </article>
      `;
    })
    .join("");
}

function renderUsers() {
  userRows.innerHTML = users
    .map((user) => {
      const quotaClass = user.quota >= 85 ? "quota-pill high" : "quota-pill";
      return `
        <div class="user-row">
          <span>${user.name}</span>
          <span>${user.department} · ${user.team}</span>
          <span>${user.role}</span>
          <span class="${quotaClass}">${user.quota}%</span>
          <span>${user.experts} 个</span>
        </div>
      `;
    })
    .join("");
}

function renderPolicyDepartments() {
  policyDepartment.innerHTML = departments.map((department) => `<option value="${department.name}">${department.name}</option>`).join("");
  renderPolicyUsers();
}

function renderPolicyUsers() {
  const selectedDepartment = policyDepartment.value;
  const departmentUsers = users.filter((user) => user.department === selectedDepartment);
  policyUser.innerHTML = departmentUsers.map((user) => `<option value="${user.name}">${user.name} · ${user.team} · ${user.role}</option>`).join("");
}

function updatePolicyPreview() {
  const department = policyDepartment.value || "未选择部门";
  const selectedUser = users.find((user) => user.name === policyUser.value);
  const target = selectedUser ? `${selectedUser.name}（${department} · ${selectedUser.team} · ${selectedUser.role}）` : department;
  const proText = policyPro.checked ? "允许使用 Pro 模型" : "禁止使用 Pro 模型";
  const auditText = policyAudit.checked ? "纳入审计追踪" : "不纳入审计追踪";
  policyPreview.textContent = `将为 ${target} 配置每日 Token 额度 ${Number(policyQuota.value).toLocaleString()}，${proText}，${auditText}。`;
}

function editExpert(expertName) {
  const expert = getExpertConfig(expertName);
  if (expert) {
    fillCreatorForm(expert);
  }
  openCreatorView();
}

function bindCollapsibleSections() {
  document.querySelectorAll(".collapsible-section").forEach((section) => {
    const button = section.querySelector(".collapse-toggle");
    if (!button || button.dataset.bound) return;
    button.dataset.bound = "true";
    button.addEventListener("click", () => {
      const collapsed = section.classList.toggle("collapsed");
      button.textContent = collapsed ? "展开" : "收起";
      button.setAttribute("aria-label", collapsed ? "展开模块" : "收起模块");
    });
  });
}

function openCreatorView() {
  setActiveNav(adminNav);
  closeSidebarMenu();
  contentArea.classList.remove("chat-mode");
  contentArea.classList.remove("admin-mode");
  contentArea.classList.remove("knowledge-mode");
  contentArea.classList.add("creator-mode");
  chatView.classList.add("is-hidden");
  adminView.classList.add("is-hidden");
  knowledgeView.classList.add("is-hidden");
  creatorView.classList.remove("is-hidden");
  updateExpertPreview();
}

function openKnowledgeView(expertName = "") {
  setActiveNav(adminNav);
  closeSidebarMenu();
  contentArea.classList.remove("chat-mode");
  contentArea.classList.remove("admin-mode");
  contentArea.classList.remove("creator-mode");
  contentArea.classList.add("knowledge-mode");
  chatView.classList.add("is-hidden");
  adminView.classList.add("is-hidden");
  creatorView.classList.add("is-hidden");
  knowledgeView.classList.remove("is-hidden");
  refreshKnowledgeExpertOptions();
  if (expertName && expertConfigs[expertName]) {
    knowledgeExpertSelect.value = expertName;
  }
}

function openAdminView() {
  setActiveNav(adminNav);
  closeSidebarMenu();
  contentArea.classList.remove("chat-mode");
  contentArea.classList.remove("creator-mode");
  contentArea.classList.remove("knowledge-mode");
  contentArea.classList.add("admin-mode");
  chatView.classList.add("is-hidden");
  creatorView.classList.add("is-hidden");
  knowledgeView.classList.add("is-hidden");
  adminView.classList.remove("is-hidden");
  renderAdminExpertList();
  renderDepartments();
  renderRiskSessions();
  renderUsers();
  renderPolicyDepartments();
  updatePolicyPreview();
  bindCollapsibleSections();
}

function addMockDocument() {
  const targetExpert = knowledgeExpertSelect.value || "未绑定专家";
  const now = new Date();
  const filename = `新上传资料-${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}.pdf`;
  const item = document.createElement("article");
  item.className = "doc-item";
  item.innerHTML = `
    <span class="doc-icon" aria-hidden="true">PDF</span>
    <div>
      <h3>${filename}</h3>
      <p>绑定：${targetExpert} · 处理中</p>
    </div>
    <strong class="status-processing">处理中</strong>
  `;
  docList.prepend(item);

  window.setTimeout(() => {
    item.querySelector("p").textContent = `绑定：${targetExpert} · 已向量化`;
    const status = item.querySelector("strong");
    status.textContent = "已就绪";
    status.className = "status-ready";
  }, 1000);
}

function closeSummaryModal() {
  summaryModal.classList.add("is-hidden");
}

closeModal.addEventListener("click", closeSummaryModal);
cancelSummary.addEventListener("click", closeSummaryModal);

summaryModal.addEventListener("click", (event) => {
  if (event.target === summaryModal) closeSummaryModal();
});

confirmSummary.addEventListener("click", () => {
  activeExpert = pendingExpert;
  const expert = getExpertConfig(activeExpert);
  activeExpertName.textContent = activeExpert;
  expertState.classList.remove("is-hidden");
  expertState.style.display = "flex";
  modelLabel.textContent = expert ? expert.boundModel : `${activeExpert} 专属模型`;
  modelSelect.classList.add("locked");
  closeModelMenu();
  closeSummaryModal();
  promptInput.placeholder = `正在使用「${activeExpert}」，请输入你的任务或素材...`;
  promptInput.focus();
});

exitExpert.addEventListener("click", () => {
  activeExpert = "";
  activeExpertName.textContent = "";
  expertState.classList.add("is-hidden");
  expertState.style.display = "";
  modelSelect.classList.remove("locked");
  modelLabel.textContent = selectedModel;
  promptInput.placeholder = "在这里输入任何问题...";
});

function resetConversation() {
  setActiveNav(newChatNav);
  closeSidebarMenu();
  messageList.innerHTML = "";
  contentArea.classList.remove("chat-mode");
  contentArea.classList.remove("creator-mode");
  contentArea.classList.remove("knowledge-mode");
  contentArea.classList.remove("admin-mode");
  creatorView.classList.add("is-hidden");
  knowledgeView.classList.add("is-hidden");
  adminView.classList.add("is-hidden");
  chatView.classList.add("is-hidden");
  chatTitle.textContent = "新的麦吉AI对话";
  promptInput.focus();
}

clearChat.addEventListener("click", resetConversation);
newChatNav.addEventListener("click", resetConversation);

adminNav.addEventListener("click", openAdminView);
adminCreateExpert.addEventListener("click", openCreatorView);
sidebarMenuToggle.addEventListener("click", toggleSidebarMenu);

[policyDepartment, policyUser, policyQuota, policyPro, policyAudit].forEach((field) => {
  field.addEventListener("input", updatePolicyPreview);
  field.addEventListener("change", updatePolicyPreview);
});

policyDepartment.addEventListener("change", () => {
  renderPolicyUsers();
  updatePolicyPreview();
});

applyPolicy.addEventListener("click", () => {
  updatePolicyPreview();
  applyPolicy.textContent = "已应用";
  window.setTimeout(() => {
    applyPolicy.textContent = "应用策略";
  }, 1000);
});

Object.values(creatorFields).forEach((field) => {
  field.addEventListener("input", updateExpertPreview);
  field.addEventListener("change", updateExpertPreview);
});

saveExpert.addEventListener("click", () => {
  const expert = getCreatorExpert();
  expertConfigs[expert.name] = expert;
  saveCustomExpert(expert);
  if (!document.querySelector(`[data-agent="${expert.name}"]`)) {
    createExpertCard(expert);
  }
  refreshKnowledgeExpertOptions();
  renderAdminExpertList();
  saveExpert.textContent = "已保存";
  window.setTimeout(() => {
    saveExpert.textContent = "保存专家 / Save";
  }, 1200);
});

mockUpload.addEventListener("click", addMockDocument);
addKnowledgeDoc.addEventListener("click", addMockDocument);

updateExpertPreview();
loadCustomExperts();
renderAdminExpertList();
renderDepartments();
renderRiskSessions();
renderUsers();
renderPolicyDepartments();
updatePolicyPreview();
bindCollapsibleSections();

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !summaryModal.classList.contains("is-hidden")) {
    closeSummaryModal();
  }

  if (event.key === "Escape" && !modelMenu.classList.contains("is-hidden")) {
    closeModelMenu();
  }

  if (event.key === "Escape" && workspace.classList.contains("sidebar-open")) {
    closeSidebarMenu();
  }
});

document.addEventListener("click", (event) => {
  if (!isCompactLayout()) return;
  if (!workspace.classList.contains("sidebar-open")) return;
  if (sidebar.contains(event.target)) return;
  closeSidebarMenu();
});

window.addEventListener("resize", () => {
  if (!isCompactLayout()) {
    syncSidebarMenuState(false);
  }
});
