import fs from "node:fs";
import path from "node:path";

function readFile(relativePath) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

function extractBlock(html, pattern, label) {
  const match = html.match(pattern);
  if (!match) {
    throw new Error(`Missing prototype block: ${label}`);
  }
  return match[0].trim();
}

export function getPrototypeTemplate() {
  const indexHtml = readFile("index.html");

  return {
    loginView: extractBlock(indexHtml, /<section class="login-view" id="loginView">[\s\S]*?<\/section>/, "loginView"),
    sidebar: extractBlock(indexHtml, /<aside class="sidebar" id="sidebar">[\s\S]*?<\/aside>/, "sidebar"),
    topbar: extractBlock(indexHtml, /<header class="topbar">[\s\S]*?<\/header>/, "topbar"),
    chatView: extractBlock(indexHtml, /<section class="chat-view is-hidden" id="chatView"[\s\S]*?<\/section>/, "chatView"),
    heroArea: extractBlock(indexHtml, /<section class="hero-area" id="heroArea">[\s\S]*?<\/section>/, "heroArea"),
    creatorView: extractBlock(indexHtml, /<section class="creator-view is-hidden" id="creatorView"[\s\S]*?<\/section>/, "creatorView"),
    adminView: extractBlock(indexHtml, /<section class="admin-view is-hidden" id="adminView"[\s\S]*?<\/section>/, "adminView"),
    knowledgeView: extractBlock(indexHtml, /<section class="knowledge-view is-hidden" id="knowledgeView"[\s\S]*?<\/section>/, "knowledgeView"),
    toolSections: extractBlock(indexHtml, /<section class="tool-sections" id="toolSections">[\s\S]*?<\/section>/, "toolSections"),
    summaryModal: extractBlock(indexHtml, /<div class="modal-layer is-hidden" id="summaryModal"[\s\S]*?<\/div>\s*<\/div>/, "summaryModal"),
    expertsScript: readFile(path.join("data", "experts.js")),
    departmentsScript: readFile(path.join("data", "departments.js")),
    appScript: readFile("app.js")
  };
}
