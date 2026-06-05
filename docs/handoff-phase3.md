# 麦吉AI 工作交接文档 — Phase 3

## 项目概况

麦吉AI 是企业内部 AI 资产集成管理平台，部署在阿里云 ECS，使用 Next.js 15 + MySQL (RDS) + 钉钉登录。

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
# 本地改完代码
git add -A && git commit -m "描述" && git push origin main

# SSH 到服务器
cd /var/www/maijiAI
git pull origin main
npm install          # 有新依赖时
npm run build
pm2 restart maijiAI --update-env

# 有新数据库表/迁移时
node scripts/migrate-agents.js
```

**注意**：ECS 访问 GitHub 偶尔超时，多试几次。  
**注意**：`app.js` 是通过 `lib/prototype-template.js` 在构建时内联进 HTML 的，每次改 `app.js` 必须重新 `npm run build`。

---

## Phase 2 已完成内容

### 1. Markdown 渲染
- AI 回复支持代码块、表格、列表、引用块、标题等格式
- 使用内置 `renderMarkdown()` 函数（不依赖外部 CDN），流式输出结束后统一渲染
- `renderMessageContent(content, text, true)` 同时用于新消息和历史恢复，保持一致

### 2. 对话删除 + 新对话重置
- 历史列表每条 hover 显示 × 删除按钮，调 `DELETE /api/conversations?id=xxx`
- 后端先校验归属再删消息和对话（级联删除）
- `resetConversation()` 重写为 JS 强制 display 控制（不依赖 CSS class 级联），修复了多个重复函数定义导致的 bug

### 3. 模型切换
- 前端 `selectedModelApi` → `getResolvedApiModel()` → 传给后端 `/api/chat`
- 后端用 `model` 参数调 yunwu.ai

### 4. 日间/夜间模式切换
- 侧栏底部切换按钮，切换 `body.light-mode` CSS class
- 偏好存 localStorage，下次自动恢复
- 覆盖了：侧栏、顶栏、输入框、消息气泡、工具卡片、模型菜单、专家状态栏、Markdown 渲染颜色

### 5. 工具区重组
- 4 列卡片网格（原 3 列），emoji 彩色图标
- 分类：🧰 工作工具 / 📋 管理工具
- 已上线工具：买家秀生成器、推广图生成器、GIF处理器、AI声音克隆/音乐生成、STP预览器

### 6. PDF 文件解析（真实）
- 换用 `pdf2json`（纯 JS，无 DOM 依赖），解决了 pdfjs-dist v5 的 DOMMatrix 问题
- 支持 PDF / DOCX / TXT / MD / CSV / JSON
- 文件内容拼进 AI 消息，但 **对话框只显示用户输入的文字**，历史恢复也截掉附件原文

### 7. 用户身份识别
- 启动时先用 localStorage 缓存显示，再调 `/api/auth/me` 从数据库刷新最新姓名和头像
- 修复了 `checkAuthOnLoad` 依赖 `user.name` 的历史记录不加载问题

### 8. 专家配置数据库化（管理员权限）
- 新增 `agents` 表存储智能体配置
- `GET /api/agents` 公开，前端启动时加载并覆盖静态 JS 配置
- `POST / PUT / DELETE /api/agents` 仅管理员可用（校验 users.role = 'admin'）
- 侧栏底部管理员可见「⚙ 管理智能体」入口，支持增删改智能体

### 9. 返回主页按钮
- 对话/专家模式下，标题栏左侧显示「← 主页」按钮，点击返回工具列表

---

## 当前文件结构

```
/var/www/maijiAI/
├── app/
│   ├── api/
│   │   ├── agents/route.js          ← 智能体 CRUD（管理员鉴权）
│   │   ├── auth/
│   │   │   ├── dingtalk/route.js    ← 钉钉 OAuth 2.0 回调
│   │   │   └── me/route.js          ← 获取当前用户信息（ES module）
│   │   ├── chat/route.js             ← AI 对话（SSE 流式）
│   │   ├── conversations/
│   │   │   ├── route.js              ← 对话 CRUD + DELETE
│   │   │   └── messages/route.js     ← 获取对话消息
│   │   └── parse-file/route.js       ← 文件解析（pdf2json）
│   ├── auth/success/page.js          ← 登录成功中转页
│   ├── layout.js
│   └── page.js                       ← 主页（加载 prototype-template）
├── lib/
│   ├── db.js                         ← MySQL 连接池
│   ├── chat-agents.js                ← 聊天智能体配置（本地备用）
│   └── prototype-template.js         ← 从 index.html 提取模板，内联 app.js
├── data/
│   ├── agents.js                     ← 前端智能体数据（已被 API 动态覆盖）
│   ├── experts.js                    ← 专家卡片数据（旧版，暂未迁移）
│   ├── departments.js                ← 部门数据
│   └── tool-links.js                 ← 工具链接（外部跳转工具）
├── scripts/
│   ├── init-db.js                    ← 数据库初始化
│   └── migrate-agents.js             ← 智能体迁移脚本（建表+写入）
├── app.js                            ← 前端主逻辑（~1790行，vanilla JS）
├── index.html                        ← 前端 HTML 模板
├── styles.css                        ← 全局样式（含日间/夜间模式）
└── .env                              ← 服务器环境变量（不在 Git 中）
```

---

## 数据库表

```
users      — 钉钉用户（dingtalk_id, name, avatar_url, role[admin/user]）
agents     — 智能体配置（system_prompt, direct_entry, category 等）★ Phase 2 新增
conversations — 对话记录
messages   — 对话消息
tools      — 工具列表（暂未使用）
access_logs — 访问日志（暂未使用）
```

### 设置管理员
```sql
-- 查看所有用户
SELECT id, name, role FROM users;

-- 设置管理员
UPDATE users SET role = 'admin' WHERE name = '你的钉钉姓名';
```

---

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

---

## 已知问题 & 注意事项

### ⚠️ 重要：app.js 修改注意
`app.js` 通过 `lib/prototype-template.js` 在构建时读取并内联进 HTML。  
用编辑器（如 Edit 工具）修改后**必须 `npm run build`** 才能生效。  
历史上多次发生文件被截断的问题，建议用 Python 脚本做字符串替换，避免用工具直接写大文件。

### ⚠️ 重复函数定义（已清理）
历史遗留问题：`bindAgentCard`、`resetConversation`、`openConversation`、`addMessage` 等函数曾有多个定义，JS 会使用最后一个。已清理，目前每个函数只有一处定义。

### ⚠️ HTML 中缺失的元素
以下 ID 在 HTML 中**不存在**（侧栏简化时移除了），但 `app.js` 顶部仍有 `querySelector`，返回 `null`：
- `#adminNav`
- `#sidebarMenuToggle`
- 以及多个管理面板相关元素（`#adminView`, `#creatorView` 等实际存在但功能未使用）

已在代码中全部加了 `?.` 可选链或 `if (el)` 保护，不影响运行。

### 钉钉权限问题
钉钉开放平台的 `Contact.User.Read` 权限**尚未开通**，导致部分登录失败。  
**修复方法**：登录钉钉开放平台 → 应用管理 → 权限管理 → 申请 `Contact.User.Read`。

---

## Phase 3 待做事项（优先级排序）

### P0 — 待处理
1. **域名 + HTTPS**：配置域名解析，申请 SSL 证书（Let's Encrypt 免费）
2. **钉钉权限修复**：开通 `Contact.User.Read`，确保所有用户可登录

### P1 — 业务功能
3. **用户权限 + Token 额度管理**：后台配置每人每日 token 上限，防止滥用
4. **工具卡片接入更多智能体**：随着更多工具上线，更新 `tool-links.js` 和 `index.html`
5. **知识库 RAG**：文件上传 → 切片 → 向量化 → 专家挂载（需要向量数据库）
6. **审计日志**：记录每次 API 调用，统计用量

### P2 — 规模化
7. **前端重构**：55KB app.js → React 组件化
8. **CI/CD**：GitHub Actions 自动构建部署

---

## 技术决策记录

- **为什么用 prototype-template.js**：项目从静态 HTML 原型迁移到 Next.js，最小改动策略。`app.js` 内联进 HTML 避免额外请求，但也带来了修改必须重新 build 的限制。
- **为什么用 pdf2json 而不是 pdfjs-dist**：pdfjs-dist v5 依赖 `DOMMatrix`（浏览器 API），在 Node.js 服务端无法运行（除非安装 @napi-rs/canvas 原生包）。pdf2json 纯 JS 实现，无此问题。
- **为什么智能体配置从 JS 迁到数据库**：避免每次新增智能体都要改代码、重新 build。管理员通过 UI 直接操作，普通用户无权修改。
- **JWT 存储在 localStorage**：当前阶段够用，后续如需更高安全性可改为 HttpOnly Cookie。
- **日间/夜间模式**：通过 `body.light-mode` CSS class 切换，偏好存 localStorage。暗色是默认模式（与品牌调性一致），日间模式为可选。
