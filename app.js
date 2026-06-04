const loginView = document.querySelector("#loginView");
const workspace = document.querySelector("#workspace");
const dingLogin = document.querySelector("#dingLogin");
const promptInput = document.querySelector("#promptInput");
const sendButton = document.querySelector("#sendButton");
const composer = document.querySelector(".composer");
const toolLeft = document.querySelector(".tool-left");
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
const agentConfigs = window.MAIJI_AGENTS || {};
const toolLinks = window.MAIJI_TOOL_LINKS || {};
const customExpertStorageKey = "maiji_custom_experts";
const defaultChatModel = "gpt-5.4-mini";
let selectedModel = "GPT5.4快速";
let selectedModelApi = defaultChatModel;
let pendingExpert = "";
let activeExpert = "";
let isGenerating = false;
let currentConversationId = "";
let currentConversationMessages = [];
let uploadedAttachments = [];

/* ── 对话持久化工具函数 ── */
function getAuthToken() {
  return localStorage.getItem("maijiai_token") || "";
}

function authHeaders() {
  return { "Content-Type": "application/json", Authorization: "Bearer " + getAuthToken() };
}

async function saveConversation(userMsg, assistantMsg) {
  if (!getAuthToken() || !currentConversationId) return;
  var title = (userMsg || "").slice(0, 50);
  try {
    await fetch("/api/conversations", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        conversationId: currentConversationId,
        title: title,
        agentId: activeExpert || "",
        model: getResolvedApiModel(),
        messages: [
          { role: "user", content: userMsg },
          { role: "assistant", content: assistantMsg }
        ]
      })
    });
  } catch (e) { console.warn("保存对话失败:", e); }
}

async function deleteConversation(convId) {
  try {
    await fetch("/api/conversations?id=" + encodeURIComponent(convId), {
      method: "DELETE",
      headers: authHeaders()
    });
    if (currentConversationId === convId) resetConversation();
    loadConversationList();
  } catch (e) { console.warn("删除对话失败:", e); }
}

async function loadConversationList() {
  if (!getAuthToken()) return;
  try {
    var res = await fetch("/api/conversations", { headers: authHeaders() });
    if (!res.ok) return;
    var data = await res.json();
    historyList.innerHTML = "";
    (data.conversations || []).forEach(function(conv) {
      var item = document.createElement("div");
      item.className = "history-item-wrap";

      var btn = document.createElement("button");
      btn.className = "history-item";
      btn.type = "button";
      btn.textContent = conv.title.length > 14 ? conv.title.slice(0, 14) + "..." : (conv.title || "对话");
      btn.dataset.convId = conv.id;
      btn.addEventListener("click", function() { restoreConversation(conv.id, conv.agent_id); });

      var del = document.createElement("button");
      del.className = "history-delete";
      del.type = "button";
      del.setAttribute("aria-label", "删除对话");
      del.textContent = "×";
      del.addEventListener("click", function(e) {
        e.stopPropagation();
        deleteConversation(conv.id);
      });

      item.append(btn, del);
      historyList.append(item);
    });
  } catch (e) { console.warn("加载对话列表失败:", e); }
}

async function restoreConversation(convId, agentId) {
  if (!getAuthToken()) return;
  try {
    var res = await fetch("/api/conversations/messages?id=" + encodeURIComponent(convId), { headers: authHeaders() });
    if (!res.ok) return;
    var data = await res.json();
    currentConversationId = convId;
    currentConversationMessages = (data.messages || []).map(function(m) { return { role: m.role, content: m.content }; });
    if (agentId) {
      activeExpert = agentId;
    }
    messageList.innerHTML = "";
    contentArea.classList.add("chat-mode");
    chatView.classList.remove("is-hidden");
    chatTitle.textContent = agentId || "对话";
    currentConversationMessages.forEach(function(m) {
      if (m.role === "user" || m.role === "assistant") {
        addMessage(m.role === "user" ? "user" : "ai", m.content);
      }
    });
  } catch (e) { console.warn("恢复对话失败:", e); }
}

const fileInput = document.createElement("input");
fileInput.type = "file";
fileInput.multiple = true;
fileInput.accept = ".pdf,.doc,.docx,.txt,.md,.csv,.json";
fileInput.className = "hidden-file-input";

const attachmentTray = document.createElement("div");
attachmentTray.className = "attachment-tray is-hidden";

const dropHint = document.createElement("div");
dropHint.className = "drop-hint is-hidden";
dropHint.textContent = "松开以上传简历或文本文件";

document.body.append(fileInput);
composer?.insertBefore(attachmentTray, composer.firstChild);
composer?.append(dropHint);

function isCompactLayout() {
  return window.innerWidth <= 980;
}

function getCurrentConversationId() {
  if (!currentConversationId) {
    currentConversationId = `conv-${Date.now()}`;
  }
  return currentConversationId;
}

function getResolvedApiModel() {
  return selectedModelApi || defaultChatModel;
}

function updateSendReadyState() {
  const hasText = promptInput.value.trim().length > 0;
  const hasAttachments = uploadedAttachments.length > 0;
  sendButton.classList.toggle("ready", hasText || hasAttachments);
}

function renderAttachmentTray() {
  attachmentTray.innerHTML = "";
  attachmentTray.classList.toggle("is-hidden", uploadedAttachments.length === 0);

  uploadedAttachments.forEach((file, index) => {
    const chip = document.createElement("article");
    chip.className = "attachment-chip";
    chip.innerHTML = `
      <div class="attachment-chip-copy">
        <strong>${file.name}</strong>
        <small>${file.statusText || file.kind || "已解析"}</small>
      </div>
      <button class="attachment-remove" type="button" aria-label="移除附件">×</button>
    `;
    chip.querySelector(".attachment-remove")?.addEventListener("click", () => {
      uploadedAttachments.splice(index, 1);
      renderAttachmentTray();
      updateSendReadyState();
    });
    attachmentTray.append(chip);
  });
}

function clearAttachments() {
  uploadedAttachments = [];
  fileInput.value = "";
  renderAttachmentTray();
  updateSendReadyState();
}

async function parseFiles(files) {
  const formData = new FormData();
  Array.from(files).forEach((file) => formData.append("files", file));

  const response = await fetch("/api/parse-file", {
    method: "POST",
    body: formData
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error || "文件解析失败");
  }

  return Array.isArray(data?.files) ? data.files : [];
}

async function handleIncomingFiles(fileList) {
  const files = Array.from(fileList || []).filter(Boolean);
  if (!files.length) return;

  composer?.classList.add("is-uploading");
  try {
    const parsedFiles = await parseFiles(files);
    uploadedAttachments = uploadedAttachments.concat(
      parsedFiles.map((item) => ({
        name: item.name,
        kind: item.kind,
        content: item.content,
        statusText: item.statusText || `已解析 ${item.kind || "文件"}`
      }))
    );
    renderAttachmentTray();
    updateSendReadyState();
  } finally {
    composer?.classList.remove("is-uploading");
  }
}

function buildMessageWithAttachments(text) {
  if (!uploadedAttachments.length) {
    return text.trim();
  }

  const sections = uploadedAttachments.map((file, index) => {
    const excerpt = String(file.content || "").trim();
    return [
      `### 附件 ${index + 1}`,
      `文件名：${file.name}`,
      `文件类型：${file.kind || "文本"}`,
      "文件内容：",
      excerpt
    ].join("\n");
  });

  return [text.trim(), "## 附件材料", ...sections].filter(Boolean).join("\n\n");
}

function buildAgentSystemPrompt() {
  if (!activeExpert) return "";

  const config = agentConfigs[activeExpert];
  if (config && typeof config.systemPrompt === "string") {
    return config.systemPrompt;
  }

  const expert = getExpertConfig(activeExpert);
  if (!expert) return "";

  return [
    `你现在是「${expert.name}」智能体。`,
    `专家定位：${expert.profile?.expertise || ""}`,
    `沟通语气：${expert.profile?.tone || ""}`,
    `语言风格：${expert.profile?.language || ""}`,
    `核心目标：${(expert.goals || []).join("；")}`,
    `工作流：${(expert.workflow || []).join(" -> ")}`
  ]
    .filter(Boolean)
    .join("\n");
}

async function requestChatStreamReply(message, onDelta, onDone, onError) {
  const history = currentConversationMessages.slice(0, -1);
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      model: getResolvedApiModel(),
      agentId: activeExpert || "",
      conversationId: getCurrentConversationId(),
      history,
      systemPrompt: buildAgentSystemPrompt(),
      stream: true
    })
  });

  if (!response.ok) {
    let errorMsg = "Chat request failed.";
    try {
      const errData = await response.json();
      errorMsg = errData?.details || errData?.error || errorMsg;
    } catch {}
    throw new Error(errorMsg);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullReply = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (payload === "[DONE]") {
        onDone(fullReply);
        return;
      }
      try {
        const data = JSON.parse(payload);
        if (data.type === "meta" && data.conversationId) {
          currentConversationId = data.conversationId;
        } else if (data.type === "delta" && data.content) {
          fullReply += data.content;
          onDelta(data.content, fullReply);
        } else if (data.type === "error") {
          throw new Error(data.error || "Stream error");
        }
      } catch (e) {
        if (e.message && e.message !== "Stream error" && !e.message.startsWith("Unexpected")) {
          throw e;
        }
      }
    }
  }
  /* 如果上游没发 [DONE] 但流结束了，也触发完成 */
  onDone(fullReply);
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

function getAgentConfig(agentId) {
  return agentConfigs[agentId] || null;
}

function getAssistantLabel() {
  const agent = getAgentConfig(activeExpert);
  if (agent?.name) return agent.name;
  if (activeExpert) return activeExpert;
  return selectedModel;
}

function getAgentPlaceholder() {
  const agent = getAgentConfig(activeExpert);
  if (agent?.placeholder) return agent.placeholder;
  if (activeExpert) return `正在使用「${getAssistantLabel()}」，请输入你的任务或素材...`;
  return "在这里输入任何问题...";
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderInlineMarkdown(value) {
  let output = escapeHtml(value);
  output = output.replace(/`([^`]+)`/g, "<code>$1</code>");
  output = output.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  output = output.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  return output;
}

function isTableSeparatorLine(line) {
  return /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(line.trim());
}

function renderMarkdownTable(lines) {
  if (lines.length < 2) return `<p>${renderInlineMarkdown(lines.join(" "))}</p>`;

  const headerCells = lines[0]
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
  const bodyLines = lines.slice(2);

  const headerHtml = headerCells.map((cell) => `<th>${renderInlineMarkdown(cell)}</th>`).join("");
  const bodyHtml = bodyLines
    .map((line) => {
      const cells = line
        .trim()
        .replace(/^\|/, "")
        .replace(/\|$/, "")
        .split("|")
        .map((cell) => `<td>${renderInlineMarkdown(cell.trim())}</td>`)
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");

  return `<div class="markdown-table-wrap"><table><thead><tr>${headerHtml}</tr></thead><tbody>${bodyHtml}</tbody></table></div>`;
}

function renderMarkdown(text) {
  const lines = String(text || "").replace(/\r\n/g, "\n").split("\n");
  const parts = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    if (trimmed.startsWith("```")) {
      const block = [];
      index += 1;
      while (index < lines.length && !lines[index].trim().startsWith("```")) {
        block.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) index += 1;
      parts.push(`<pre><code>${escapeHtml(block.join("\n"))}</code></pre>`);
      continue;
    }

    if (trimmed.includes("|") && index + 1 < lines.length && isTableSeparatorLine(lines[index + 1])) {
      const tableLines = [line, lines[index + 1]];
      index += 2;
      while (index < lines.length && lines[index].trim().includes("|")) {
        tableLines.push(lines[index]);
        index += 1;
      }
      parts.push(renderMarkdownTable(tableLines));
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      parts.push(`<h${level}>${renderInlineMarkdown(headingMatch[2])}</h${level}>`);
      index += 1;
      continue;
    }

    if (trimmed.startsWith(">")) {
      const block = [];
      while (index < lines.length && lines[index].trim().startsWith(">")) {
        block.push(renderInlineMarkdown(lines[index].trim().replace(/^>\s?/, "")));
        index += 1;
      }
      parts.push(`<blockquote>${block.join("<br>")}</blockquote>`);
      continue;
    }

    if (/^\s*[-*]\s+/.test(line)) {
      const items = [];
      while (index < lines.length && /^\s*[-*]\s+/.test(lines[index])) {
        items.push(`<li>${renderInlineMarkdown(lines[index].replace(/^\s*[-*]\s+/, "").trim())}</li>`);
        index += 1;
      }
      parts.push(`<ul>${items.join("")}</ul>`);
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      const items = [];
      while (index < lines.length && /^\s*\d+\.\s+/.test(lines[index])) {
        items.push(`<li>${renderInlineMarkdown(lines[index].replace(/^\s*\d+\.\s+/, "").trim())}</li>`);
        index += 1;
      }
      parts.push(`<ol>${items.join("")}</ol>`);
      continue;
    }

    const paragraph = [];
    while (
      index < lines.length &&
      lines[index].trim() &&
      !/^(#{1,6})\s+/.test(lines[index].trim()) &&
      !lines[index].trim().startsWith(">") &&
      !/^\s*[-*]\s+/.test(lines[index]) &&
      !/^\s*\d+\.\s+/.test(lines[index]) &&
      !(lines[index].trim().includes("|") && index + 1 < lines.length && isTableSeparatorLine(lines[index + 1]))
    ) {
      paragraph.push(renderInlineMarkdown(lines[index].trim()));
      index += 1;
    }
    parts.push(`<p>${paragraph.join("<br>")}</p>`);
  }

  return parts.join("");
}

function renderMessageContent(node, text, useMarkdown) {
  node.className = useMarkdown ? "message-content markdown-body" : "message-content";
  if (useMarkdown) {
    node.innerHTML = renderMarkdown(text);
  } else {
    node.textContent = text;
  }
}

function buildExpertSummary(name) {
  const agent = getAgentConfig(name);
  if (agent?.summaryPrompt) {
    return agent.summaryPrompt;
  }

  const expert = getExpertConfig(name);
  if (!expert) {
    return "请总结当前对话里的关键信息、目标和待办项，然后交给该智能体继续处理。";
  }

  return [
    `即将启用专家：${expert.name}`,
    `专家定位：${expert.profile.expertise}`,
    `沟通语气：${expert.profile.tone}`,
    `语言风格：${expert.profile.language}`,
    `核心目标：${expert.goals.join("；")}`,
    `工作流：${expert.workflow.join(" -> ")}`
  ].join("\n");
}

function openConversation(text) {
  contentArea.classList.add("chat-mode");
  chatView.classList.remove("is-hidden");
  chatTitle.textContent = activeExpert
    ? getAssistantLabel()
    : text.length > 18
      ? `${text.slice(0, 18)}...`
      : text || "新的麦吉AI对话";
}

function addMessage(role, text, options = {}) {
  const { markdown = role === "ai" } = options;
  const message = document.createElement("article");
  message.className = `message ${role}`;

  const avatar = document.createElement("span");
  avatar.className = "message-avatar";
  avatar.textContent = role === "user" ? "我" : "麦";

  const bubble = document.createElement("div");
  bubble.className = "message-bubble";

  const meta = document.createElement("div");
  meta.className = "message-meta";
  meta.textContent = role === "user" ? "你" : getAssistantLabel();

  const content = document.createElement("div");
  renderMessageContent(content, text, markdown);

  bubble.append(meta, content);

  if (role === "user") {
    message.append(bubble, avatar);
  } else {
    message.append(avatar, bubble);
  }

  messageList.append(message);
  messageList.scrollTop = messageList.scrollHeight;
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
  meta.textContent = getAssistantLabel();

  const content = document.createElement("div");
  content.className = "message-content";
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
      renderMessageContent(content, text, true);
      isGenerating = false;
      sendButton.textContent = "▶";
      sendButton.setAttribute("aria-label", "发送");
      sendButton.classList.toggle("ready", promptInput.value.trim().length > 0);
    }
  }, 14);
}

function activateAgent(agentId, options = {}) {
  const { showWelcome = true } = options;
  const agent = getAgentConfig(agentId);
  const expert = getExpertConfig(agentId);

  activeExpert = agentId;
  activeExpertName.textContent = agent?.name || expert?.name || agentId;
  expertState.classList.remove("is-hidden");
  expertState.style.display = "flex";

  if (agent?.allowModelSwitch) {
    modelSelect.classList.remove("locked");
    modelLabel.textContent = selectedModel;
  } else {
    modelSelect.classList.add("locked");
    modelLabel.textContent = expert ? expert.boundModel : `${activeExpertName.textContent} 专属模型`;
  }

  closeModelMenu();
  closeSummaryModal();
  currentConversationId = "";
  currentConversationMessages = [];
  messageList.innerHTML = "";
  promptInput.placeholder = getAgentPlaceholder();
  openConversation("");

  if (showWelcome && agent?.openingMessage) {
    currentConversationMessages.push({ role: "assistant", content: agent.openingMessage });
    addMessage("ai", agent.openingMessage, { markdown: true });
  }

  promptInput.focus();
}

function bindAgentCard(card) {
  const toolId = card.dataset.toolId;
  const tool = toolId ? toolLinks[toolId] : null;
  const agentId = card.dataset.agent;
  const agent = agentId ? getAgentConfig(agentId) : null;

  if (agent?.directEntry) {
    card.addEventListener(
      "click",
      (event) => {
        event.preventDefault();
        event.stopPropagation();
        activateAgent(agentId, { showWelcome: true });
      },
      { capture: true }
    );
    card.setAttribute("title", `进入${agent.name}`);
    return;
  }

  if (tool?.url) {
    card.addEventListener("click", () => {
      window.open(tool.url, "_blank", "noopener,noreferrer");
    });
    card.setAttribute("title", `打开${tool.name || "工具"}`);
    return;
  }

  if (tool) {
    card.classList.add("is-pending");
    card.setAttribute("title", `${tool.name || "工具"}正在接入`);
    const textWrap = card.querySelector("span:last-child");
    if (textWrap && !textWrap.querySelector(".tool-status")) {
      const status = document.createElement("em");
      status.className = "tool-status";
      status.textContent = tool.status || "待接入";
      textWrap.append(status);
    }
    return;
  }

  card.addEventListener("click", () => {
    pendingExpert = card.dataset.agent;
    summaryText.value = buildExpertSummary(pendingExpert);
    summaryModal.classList.remove("is-hidden");
    summaryText.focus();
  });
}

function resetConversation() {
  setActiveNav(newChatNav);
  closeSidebarMenu();
  currentConversationId = "";
  currentConversationMessages = [];
  activeExpert = "";
  activeExpertName.textContent = "";
  messageList.innerHTML = "";
  contentArea.classList.remove("chat-mode");
  contentArea.classList.remove("creator-mode");
  contentArea.classList.remove("knowledge-mode");
  contentArea.classList.remove("admin-mode");
  creatorView.classList.add("is-hidden");
  knowledgeView.classList.add("is-hidden");
  adminView.classList.add("is-hidden");
  chatView.classList.add("is-hidden");
  expertState.classList.add("is-hidden");
  expertState.style.display = "";
  modelSelect.classList.remove("locked");
  modelLabel.textContent = selectedModel;
  chatTitle.textContent = "新的麦吉AI对话";
  clearAttachments();
  promptInput.placeholder = getAgentPlaceholder();
  promptInput.focus();
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

// 钉钉扫码登录 - 新版 OAuth 2.0
dingLogin.addEventListener("click", () => {
  var CLIENT_ID = "dingbnoeknp9jtjdautf";
  var REDIRECT_URI = "http://121.43.251.177/api/auth/dingtalk";
  var authUrl = "https://login.dingtalk.com/oauth2/auth?" +
    "client_id=" + CLIENT_ID + "&" +
    "redirect_uri=" + encodeURIComponent(REDIRECT_URI) + "&" +
    "response_type=code&" +
    "scope=openid&" +
    "prompt=consent&" +
    "state=" + Date.now();
  window.location.href = authUrl;
});

// 检查登录状态 - 如果有 token 直接显示工作空间
(function checkAuthOnLoad() {
  var token = localStorage.getItem("maijiai_token");
  var userStr = localStorage.getItem("maijiai_user");
  if (token && userStr) {
    try {
      var user = JSON.parse(userStr);
      if (user && user.name) {
        loginView.classList.add("is-hidden");
        workspace.classList.remove("is-hidden");
        setActiveNav(newChatNav);
        syncSidebarMenuState(false);
        var nameEl = document.querySelector("#userDisplayName");
        if (nameEl) nameEl.textContent = user.name;
        var avatarImg = document.querySelector("#userAvatar");
        var avatarFallback = document.querySelector("#userAvatarFallback");
        if (user.avatar && avatarImg) {
          avatarImg.src = user.avatar;
          avatarImg.style.display = "";
          if (avatarFallback) avatarFallback.style.display = "none";
        } else if (avatarFallback && user.name) {
          avatarFallback.textContent = user.name.slice(0, 1);
        }
        loadConversationList();
      }
    } catch(e) {}
  }
})();

promptInput.addEventListener("input", () => {
  updateSendReadyState();
});

sendButton.addEventListener("click", async () => {
  const text = promptInput.value.trim();
  if ((!text && !uploadedAttachments.length) || isGenerating) return;

  const outboundText = buildMessageWithAttachments(text || "请结合我上传的附件继续分析。");

  currentConversationMessages.push({ role: "user", content: outboundText });
  openConversation(text || "附件分析");
  addMessage("user", text || "请结合我上传的附件继续分析。", { markdown: false });
  addThinkingMessage();

  promptInput.value = "";
  clearAttachments();
  sendButton.classList.remove("ready");

  await replaceThinkingMessage(outboundText);
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

async function replaceThinkingMessage(text) {
  const thinking = messageList.querySelector(".thinking");
  if (thinking) thinking.remove();

  /* 创建 AI 消息气泡，流式写入内容 */
  const message = document.createElement("article");
  message.className = "message ai";

  const avatar = document.createElement("span");
  avatar.className = "message-avatar";
  avatar.textContent = "麦";

  const bubble = document.createElement("div");
  bubble.className = "message-bubble";

  const meta = document.createElement("div");
  meta.className = "message-meta";
  meta.textContent = getAssistantLabel();

  const content = document.createElement("div");
  content.className = "message-content streaming";
  bubble.append(meta, content);
  message.append(avatar, bubble);
  messageList.append(message);

  function finishGenerating() {
    isGenerating = false;
    content.classList.remove("streaming");
    sendButton.textContent = "▶";
    sendButton.setAttribute("aria-label", "发送");
    sendButton.classList.toggle("ready", promptInput.value.trim().length > 0);
  }

  try {
    await requestChatStreamReply(
      text,
      /* onDelta */
      (delta, fullText) => {
        content.textContent = fullText;
        messageList.scrollTop = messageList.scrollHeight;
      },
      /* onDone */
      (fullReply) => {
        const finalReply = fullReply || buildExpertReply(text);
        currentConversationMessages.push({ role: "assistant", content: finalReply });
        if (window.marked) {
          content.innerHTML = window.marked.parse(finalReply);
        } else {
          content.textContent = finalReply;
        }
        content.classList.add("markdown-body");
        messageList.scrollTop = messageList.scrollHeight;
        finishGenerating();
        saveConversation(text, finalReply);
        loadConversationList();
      },
      /* onError */
      (error) => {
        const errorMsg = `聊天接口暂时不可用：${error}`;
        currentConversationMessages.push({ role: "assistant", content: errorMsg });
        content.textContent = errorMsg;
        finishGenerating();
      }
    );
  } catch (error) {
    const fallbackReply =
      error instanceof Error
        ? `聊天接口暂时不可用：${error.message}`
        : "聊天接口暂时不可用，请稍后再试。";
    currentConversationMessages.push({ role: "assistant", content: fallbackReply });
    content.textContent = fallbackReply;
    finishGenerating();
  }
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
    if (option.disabled || option.classList.contains("is-disabled")) {
      return;
    }
    selectedModel = option.dataset.label || option.dataset.model;
    selectedModelApi = option.dataset.model || defaultChatModel;
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
  const toolId = card.dataset.toolId;
  const tool = toolId ? toolLinks[toolId] : null;

  if (tool?.url) {
    card.addEventListener("click", () => {
      window.open(tool.url, "_blank", "noopener,noreferrer");
    });
    card.setAttribute("title", `打开${tool.name || "工具"}`);
    return;
  }

  if (tool) {
    card.classList.add("is-pending");
    card.setAttribute("title", `${tool.name || "工具"}正在接入`);
    const textWrap = card.querySelector("span:last-child");
    if (textWrap && !textWrap.querySelector(".tool-status")) {
      const status = document.createElement("em");
      status.className = "tool-status";
      status.textContent = tool.status || "待接入";
      textWrap.append(status);
    }
    return;
  }

  card.addEventListener("click", () => {
    pendingExpert = card.dataset.agent;
    summaryText.value = buildExpertSummary(pendingExpert);
    summaryModal.classList.remove("is-hidden");
    summaryText.focus();
  });
}

document.querySelectorAll(".agent-card").forEach(bindAgentCard);

toolLeft?.addEventListener("click", () => {
  fileInput.click();
});

fileInput.addEventListener("change", async (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement) || !target.files?.length) return;
  try {
    await handleIncomingFiles(target.files);
  } catch (error) {
    const message = error instanceof Error ? error.message : "文件解析失败，请稍后再试。";
    addMessage("ai", `上传暂时失败：${message}`);
  }
});

promptInput.addEventListener("paste", async (event) => {
  const files = Array.from(event.clipboardData?.files || []);
  if (!files.length) return;
  event.preventDefault();
  try {
    await handleIncomingFiles(files);
  } catch (error) {
    const message = error instanceof Error ? error.message : "文件解析失败，请稍后再试。";
    addMessage("ai", `上传暂时失败：${message}`);
  }
});

["dragenter", "dragover"].forEach((eventName) => {
  composer?.addEventListener(eventName, (event) => {
    event.preventDefault();
    event.stopPropagation();
    composer.classList.add("is-dragover");
    dropHint.classList.remove("is-hidden");
  });
});

["dragleave", "dragend"].forEach((eventName) => {
  composer?.addEventListener(eventName, (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.target === composer || event.target === promptInput) {
      composer.classList.remove("is-dragover");
      dropHint.classList.add("is-hidden");
    }
  });
});

composer?.addEventListener("drop", async (event) => {
  event.preventDefault();
  event.stopPropagation();
  composer.classList.remove("is-dragover");
  dropHint.classList.add("is-hidden");
  const files = Array.from(event.dataTransfer?.files || []);
  if (!files.length) return;
  try {
    await handleIncomingFiles(files);
  } catch (error) {
    const message = error instanceof Error ? error.message : "文件解析失败，请稍后再试。";
    addMessage("ai", `上传暂时失败：${message}`);
  }
});

function createExpertCard(expert) {
  const group = Array.from(document.querySelectorAll(".tool-group")).find((section) => {
    const title = section.querySelector("h2");
    return title && title.textContent === expert.category;
  });
  if (!group) return;
  const grid = group.querySelector(".card-grid");
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

// resetConversation 定义在 line ~765，此处仅绑定事件
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

function openConversation(text) {
  contentArea.classList.add("chat-mode");
  chatView.classList.remove("is-hidden");
  chatTitle.textContent = activeExpert
    ? getAssistantLabel()
    : text.length > 18
      ? `${text.slice(0, 18)}...`
      : text || "新的麦吉AI对话";
}

function addMessage(role, text, options = {}) {
  const { markdown = role === "ai" } = options;
  const message = document.createElement("article");
  message.className = `message ${role}`;

  const avatar = document.createElement("span");
  avatar.className = "message-avatar";
  avatar.textContent = role === "user" ? "我" : "麦";

  const bubble = document.createElement("div");
  bubble.className = "message-bubble";

  const meta = document.createElement("div");
  meta.className = "message-meta";
  meta.textContent = role === "user" ? "你" : getAssistantLabel();

  const content = document.createElement("div");
  renderMessageContent(content, text, markdown);
  bubble.append(meta, content);

  if (role === "user") {
    message.append(bubble, avatar);
  } else {
    message.append(avatar, bubble);
  }

  messageList.append(message);
  messageList.scrollTop = messageList.scrollHeight;
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
  meta.textContent = getAssistantLabel();

  const content = document.createElement("div");
  content.className = "message-content";
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
      renderMessageContent(content, text, true);
      isGenerating = false;
      sendButton.textContent = "▶";
      sendButton.setAttribute("aria-label", "发送");
      sendButton.classList.toggle("ready", promptInput.value.trim().length > 0);
    }
  }, 14);
}

function bindAgentCard(card) {
  const toolId = card.dataset.toolId;
  const tool = toolId ? toolLinks[toolId] : null;
  const agentId = card.dataset.agent;
  const agent = agentId ? getAgentConfig(agentId) : null;

  if (agent?.directEntry) {
    card.addEventListener(
      "click",
      (event) => {
        event.preventDefault();
        event.stopPropagation();
        activateAgent(agentId, { showWelcome: true });
      },
      { capture: true }
    );
    card.setAttribute("title", `进入${agent.name}`);
    return;
  }

  if (tool?.url) {
    card.addEventListener("click", () => {
      window.open(tool.url, "_blank", "noopener,noreferrer");
    });
    card.setAttribute("title", `打开${tool.name || "工具"}`);
    return;
  }

  if (tool) {
    card.classList.add("is-pending");
    card.setAttribute("title", `${tool.name || "工具"}正在接入`);
    const textWrap = card.querySelector("span:last-child");
    if (textWrap && !textWrap.querySelector(".tool-status")) {
      const status = document.createElement("em");
      status.className = "tool-status";
      status.textContent = tool.status || "待接入";
      textWrap.append(status);
    }
    return;
  }

  card.addEventListener("click", () => {
    pendingExpert = card.dataset.agent;
    summaryText.value = buildExpertSummary(pendingExpert);
    summaryModal.classList.remove("is-hidden");
    summaryText.focus();
  });
}

function resetConversation() {
  setActiveNav(newChatNav);
  closeSidebarMenu();
  currentConversationId = "";
  currentConversationMessages = [];
  activeExpert = "";
  activeExpertName.textContent = "";
  messageList.innerHTML = "";
  contentArea.classList.remove("chat-mode");
  contentArea.classList.remove("creator-mode");
  contentArea.classList.remove("knowledge-mode");
  contentArea.classList.remove("admin-mode");
  creatorView.classList.add("is-hidden");
  knowledgeView.classList.add("is-hidden");
  adminView.classList.add("is-hidden");
  chatView.classList.add("is-hidden");
  expertState.classList.add("is-hidden");
  expertState.style.display = "";
  modelSelect.classList.remove("locked");
  modelLabel.textContent = selectedModel;
  chatTitle.textContent = "新的麦吉AI对话";
  promptInput.placeholder = getAgentPlaceholder();
  promptInput.focus();
}

confirmSummary.addEventListener(
  "click",
  (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    activateAgent(pendingExpert, { showWelcome: false });
  },
  { capture: true }
);

exitExpert.addEventListener(
  "click",
  (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    activeExpert = "";
    activeExpertName.textContent = "";
    expertState.classList.add("is-hidden");
    expertState.style.display = "";
    modelSelect.classList.remove("locked");
    modelLabel.textContent = selectedModel;
    promptInput.placeholder = getAgentPlaceholder();
  },
  { capture: true }
);

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
