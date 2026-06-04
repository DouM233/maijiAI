# 麦吉AI 工作交接文档 — Phase 2

## 项目概况

麦吉AI 是企业内部 AI 资产集成管理平台，已部署在阿里云 ECS，使用 Next.js 15 + MySQL (RDS) + 钉钉登录。

## Phase 1 已完成（本次会话成果）

### 1. AI 对话流式响应 (SSE)
- **后端** `app/api/chat/route.js`：默认 `stream: true`，向 yunwu.ai 请求流式输出，通过 SSE (`text/event-stream`) 逐块转发给前端。先发 `meta` 事件（含 conversationId），之后每个 `delta` 立即推送，最后 `[DONE]`。保留 `stream: false` 非流式回退。
- **前端** `app.js`：`requestChatStreamReply()` 用 `fetch + ReadableStream` 实时读取 SSE。`replaceThinkingMessage()` 创建空气泡，每收到 delta 追加 `textContent`，真实流式输出而非假动画。

### 2. 钉钉扫码登录
- **前端** `app.js`：auth URL 使用新版 OAuth 2.0 端点 `https://login.dingtalk.com/oauth2/auth`，参数 `client_id` + `scope=openid` + `prompt=consent`。
- **后端** `app/api/auth/dingtalk/route.js`：用 code 换 `userAccessToken`（POST `api.dingtalk.com/v1.0/oauth2/userAccessToken`），再用 token 获取用户信息（GET `api.dingtalk.com/v1.0/contact/users/me`）。查找或创建 MySQL 用户记录，生成 JWT，重定向到 `/auth/success`。
- **权限要求**：钉钉开放平台需开启 `Contact.User.Read` 权限。
- **回调 URL**：`http://121.43.251.177/api/auth/dingtalk`（注意没有 `/callback`，因为 Next.js App Router 的 route.js 直接对应该路径）。

### 3. 对话记录持久化
- **数据库表**：`conversations`（id, user_id, title, agent_id, model, created_at, updated_at）和 `messages`（id, conversation_id, role, content, created_at）。
- **API**：
  - `GET /api/conversations` — 获取当前用户的对话列表（需 JWT Bearer token）
  - `POST /api/conversations` — 创建/更新对话 + 保存消息
  - `GET /api/conversations/messages?id=xxx` — 获取指定对话的所有消息
- **前端**：每轮对话完成后自动调用 `saveConversation()` 存库，登录时 `loadConversationList()` 从数据库加载历史，点击历史项调用 `restoreConversation()` 恢复对话。

### 4. 用户头像与姓名
- 登录后左下角显示钉钉真实头像（`#userAvatar`）和姓名（`#userDisplayName`），无头像时显示姓名首字。

### 5. 清理占位内容
- 已删除：搜索工具、公司知识库（侧栏+首页）、假历史记录、简历分析卡片、今日额度、"更多工具即将上线" 卡片。

## 服务器信息

| 项目 | 值 |
|------|-----|
| ECS 公网 IP | 121.43.251.177 |
| SSH | `ssh root@121.43.251.177` |
| 网站地址 | http://121.43.251.177 |
| 项目路径 | /var/www/maijiAI |
| 进程管理 | pm2 (名称: maijiAI) |
| GitHub | https://github.com/DouM233/maijiAI.git |
| RDS | rm-bp1i000kgs39a1688.mysql.rds.aliyuncs.com |
| 数据库 | maijiai |
| AI API | yunwu.ai (key 在 .env) |

## 部署流程

```bash
# 本地改完代码后
git add -A && git commit -m "描述" && git push origin main

# SSH 到 ECS
cd /var/www/maijiAI
git checkout -- .
git pull origin main
npm run build
pm2 restart maijiAI --update-env

# 如果新增了数据库表
node scripts/init-db.js
```

注意：ECS 访问 GitHub 偶尔超时，多试几次。

## 当前文件结构

```
/var/www/maijiAI/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── dingtalk/route.js    ← 钉钉 OAuth 2.0 回调
│   │   │   └── me/route.js          ← 获取当前用户信息
│   │   ├── chat/route.js             ← AI 对话（SSE 流式）
│   │   ├── conversations/
│   │   │   ├── route.js              ← 对话 CRUD
│   │   │   └── messages/route.js     ← 获取对话消息
│   │   └── parse-file/route.js       ← 文件解析
│   ├── auth/success/page.js          ← 登录成功中转页
│   ├── layout.js
│   └── page.js                       ← 主页（加载 prototype-template）
├── lib/
│   ├── db.js                         ← MySQL 连接池
│   ├── chat-agents.js                ← 聊天智能体配置
│   └── prototype-template.js         ← 从 index.html 提取模板
├── data/
│   ├── agents.js                     ← 前端智能体数据
│   ├── experts.js                    ← 专家卡片数据
│   ├── departments.js                ← 部门数据
│   └── tool-links.js                 ← 工具链接数据
├── scripts/
│   └── init-db.js                    ← 数据库初始化
├── app.js                            ← 前端主逻辑（55KB，vanilla JS）
├── index.html                        ← 前端 HTML 模板
├── styles.css                        ← 全局样式
└── .env                              ← 服务器环境变量（不在 Git 中）
```

## 数据库表

```
users          — 钉钉用户（dingtalk_id, name, avatar_url, role）
conversations  — 对话记录（user_id, title, agent_id, model）
messages       — 对话消息（conversation_id, role, content）
tools          — 工具列表
access_logs    — 访问日志
```

## .env 配置项

```
DB_HOST / DB_PORT / DB_USER / DB_PASSWORD / DB_NAME — MySQL
DINGTALK_APP_KEY / DINGTALK_APP_SECRET — 钉钉应用
DINGTALK_REDIRECT_URI — http://121.43.251.177/api/auth/dingtalk
APP_URL — http://121.43.251.177
SESSION_SECRET — JWT 签名密钥
YUNWU_API_KEY — AI API 密钥
YUNWU_BASE_URL — https://yunwu.ai/v1
YUNWU_DEFAULT_MODEL — gpt-5.4-mini
```

## Phase 2 待做事项（优先级排序）

### P0 — 体验完善
1. **Markdown 渲染**：AI 回复支持代码块、表格、列表等格式化显示（当前是纯文本 textContent）
2. **对话删除 + 新对话重置**：点"发起新对话"正确清空状态，支持删除历史对话
3. **模型切换实际生效**：前端模型选择器的值传给后端 API，支持切换不同模型
4. **域名 + HTTPS**：配置域名解析，申请 SSL 证书

### P1 — 业务功能
5. **用户权限 + Token 额度管理**：后台配置每人每日 token 上限
6. **专家系统数据库化**：专家配置从前端 JS 迁移到数据库，支持增删改
7. **知识库 RAG**：文件上传 → 切片 → 向量化 → 专家挂载
8. **审计日志**：记录每次 API 调用，统计用量

### P2 — 规模化
9. **前端重构**：55KB app.js → React 组件化
10. **后台管理面板**：独立后台页面
11. **CI/CD**：GitHub Actions 自动构建部署

## 技术决策记录

- **为什么用 prototype-template.js 而不是直接 React**：项目从静态 HTML 原型迁移到 Next.js，当前阶段选择最小改动策略——把 index.html 注入 Next.js 渲染，保留原有交互逻辑。Phase 2 后期应逐步迁移为 React 组件。
- **为什么用 yunwu.ai 而不是直接调 DeepSeek/OpenAI**：yunwu.ai 是 OpenAI 兼容的 API 中转站，可以一个接口切换多个模型。
- **JWT 存储在 localStorage**：当前阶段够用，后续如需更高安全性可改为 HttpOnly Cookie。
