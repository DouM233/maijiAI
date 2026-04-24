# 麦吉AI 项目交接文档

本文档用于在更换 Codex 账号、交给新开发者，或后续继续开发时快速恢复上下文。

## 1. 项目定位

项目名称：麦吉AI

产品定位：企业内部 AI 资产集成管理平台。第一阶段是前端原型，目标是验证用户端 AI 工作台、专家卡片、专家上架、后台管理、知识库挂载、审计用量和权限额度配置等核心流程。

当前阶段：静态前端原型，未接真实后端、数据库、钉钉登录或真实 AI API。

视觉方向：

- 主白色
- 辅助浅蓝色
- 类 Gemini 的轻量工作台布局
- 公司 IP 形象已加入首屏

重要产品边界：

- 用户侧只负责使用已上架专家，不提供知识库挂载入口。
- 后台侧负责专家上架、知识库挂载、审计、用户权限和额度配置。
- 中英双语字段只要求出现在“创建专家 / 上架专家”页面，其它页面中文为主，主标题明显即可。

## 2. 当前目录

项目路径：

```text
C:\Users\10335\Desktop\maijiAI
```

主要文件：

```text
index.html                         主页面结构
styles.css                         全局样式
app.js                             前端交互逻辑
README.md                          简要说明
requirements.md                    原始需求文档
dev.ps1                            本地开发服务器启动脚本
package.json                       Vite 配置
package-lock.json                  npm 锁定文件
assets/maiji-ip.png                公司 IP 形象
data/experts.js                    结构化专家配置
data/departments.js                部门、员工、风险会话数据
docs/expert-mvp-architecture.md    专家 MVP 架构说明
docs/project-handoff.md            本交接文档
```

本地 Node：

```text
.tools/node-v22.22.2-win-x64
```

说明：系统级 Node/npm 曾经不可用，所以项目内放了便携版 Node。

## 3. 运行方式

方式一：直接打开 HTML。

```text
C:\Users\10335\Desktop\maijiAI\index.html
```

方式二：PowerShell 运行开发服务器。

```powershell
cd C:\Users\10335\Desktop\maijiAI
.\dev.ps1
```

默认地址：

```text
http://127.0.0.1:5175/
```

JS 语法检查方式：

```powershell
.\.tools\node-v22.22.2-win-x64\node.exe --check .\app.js
```

## 4. 已完成的用户端功能

### 4.1 假钉钉登录

登录页有“钉钉登录”按钮，点击后进入假用户工作台。当前没有接真实钉钉 OAuth。

### 4.2 主工作台

布局：

- 左侧导航栏
- 中央问候语
- 中央对话输入框
- 模型切换下拉
- 专家卡片区
- 公司 IP 形象

模型切换：

- GPT 快速
- GPT 思考
- GPT Pro

专家模式下模型选择会锁定。

### 4.3 专注对话页

发送消息后进入专注对话界面：

- 左侧菜单不变
- 首页问候和专家卡片隐藏
- 对话消息在中间
- 输入框在底部
- 用户消息靠右
- AI 回复靠左
- AI 回复支持逐字生成效果

### 4.4 专家卡片

当前内置专家：

- 爆款裂变分析AI教练
- 天猫竞争策略教练
- 小红书千帆投放专家
- 个人访谈官
- 电商管理落地顾问

点击专家卡片后：

1. 弹出上下文摘要确认窗。
2. 用户可编辑摘要。
3. 确认后进入专家模式。
4. 模型选择器锁定为专家绑定模型。

## 5. 专家配置模型

专家数据在：

```text
data/experts.js
```

专家结构包括：

```js
{
  id,
  name,
  category,
  boundModel,
  cardDescription,
  profile: {
    expertise,
    tone,
    language
  },
  constraints,
  goals,
  workflow
}
```

产品决策：

- 专家不是简单 Prompt，而是类似 GPT/Gem 的结构化智能体。
- `Profile / Constraints / Goals / Workflow` 是核心结构。
- 后续真实 MVP 中应迁移到 Supabase 表，而不是写死在 JS。

详细架构见：

```text
docs/expert-mvp-architecture.md
```

## 6. 创建专家页面

入口：

```text
后台管理 → 上架专家
```

页面特点：

- 只在该页面保留中英双语字段。
- 左侧表单，右侧实时预览。
- 保存后生成专家卡片。
- 自建专家保存到浏览器 localStorage，刷新后仍保留。
- 刷新后，自建专家也会出现在后台专家列表。

字段包括：

- 专家名称 / Name
- 一句话描述 / Description
- 分类 / Category
- 绑定模型 / Bound Model
- Profile / 专家画像
- 专业能力 / Expertise
- 语气 / Tone
- 语言风格 / Language
- Constraints / 约束禁令
- Goals / 目标
- Workflow / 工作流
- Knowledge / 知识库

注意：当前保存只是前端 localStorage，不是数据库。

## 7. 后台管理模块

入口：

```text
左侧导航 → 后台管理
```

后台现在包含：

- 专家列表
- 上架规则
- 审计与用量
- 用户与部门管理
- 权限与额度配置

每个后台模块都支持展开和收起。

### 7.1 专家列表

显示：

- 系统预置专家
- 本地新增专家
- 分类
- 绑定模型
- 描述

操作占位：

- 编辑
- 挂载知识库

### 7.2 上架规则

当前规则：

- 用户面板不提供知识库挂载入口。
- 专家 Prompt、模型、知识库映射由后台统一管理。
- 自建专家保留在本地，并同步展示到后台专家列表。

### 7.3 知识库挂载

入口：

```text
后台专家列表 → 挂载知识库
```

知识库页面只属于后台，不在用户侧展示。

当前为前端原型：

- 上传区域占位
- 模拟上传
- 文档列表
- Processing / Ready 状态
- 目标专家选择
- 检索策略选择
- RAG 状态流程

RAG 流程：

1. 文件上传
2. 文档解析
3. 切片向量化
4. 专家挂载

真实 MVP 阶段建议：

- 文件上传到 Supabase Storage
- 文档切片写入向量库
- 维护专家与知识库的映射表

## 8. 审计与用量模块

数据文件：

```text
data/departments.js
```

当前包含：

- 部门结构
- 示例员工
- 风险会话

已录入部门框架：

视觉设计一部，40 人：

- 设计部A组，9 人
- 设计部B组，11 人
- 设计部C组，9 人
- 设计部D组，4 人
- 渲染A组，4 人
- 渲染B组，4 人
- 渲染C组，4 人

天猫运营部，54 人：

- 天猫一部，10 人
- 天猫二部，9 人
- 天猫三部，5 人
- 天猫四部，10 人
- 天猫五部，8 人
- 天猫六部，5 人
- 天猫七部，7 人

京东运营部，36 人：

- 京东一部，12 人
- 京东二部，7 人
- 京东三部，10 人
- 京东四部，7 人

京东运维部，10 人：

- A组，4 人
- B组，2 人
- C组，4 人

当前审计指标：

- 总人数
- Token 消耗
- 专家调用
- 风险会话
- 部门结构
- 专家调用排行
- 风险会话列表

风险会话的重要产品决策：

- 必须落到具体人名，不能只显示部门。
- 当前显示员工姓名、岗位、部门、小组、专家、风险类型和风险原因。

示例风险人员：

- 陈晓宇，天猫运营部，天猫四部，运营负责人
- 林佳宁，视觉设计一部，设计部B组，资深设计师
- 周启明，京东运营部，京东一部，店铺运营

## 9. 用户与部门管理

后台中已有用户表：

- 姓名
- 部门
- 角色
- 今日额度
- 可见专家数量

示例员工：

- 陈晓宇
- 林佳宁
- 周启明
- 李仕齐
- 梁丽娟

当前只是展示型原型，没有真实新增、编辑、删除。

## 10. 权限与额度配置

产品决策：

- 配置某个人 Token 时，必须先选部门，再选该部门内员工。

当前实现：

1. 选择部门。
2. 员工下拉自动过滤为该部门内员工。
3. 配置每日 Token 额度。
4. 配置是否允许使用 Pro 模型。
5. 配置是否纳入审计追踪。
6. 显示策略预览。
7. 点击“应用策略”显示已应用反馈。

当前只是前端交互，没有写入数据库。

## 11. 本地持久化说明

目前只有“创建专家”会写入浏览器 localStorage。

Key：

```text
maiji_custom_experts
```

影响：

- 刷新页面后，自建专家仍保留。
- 更换浏览器、清缓存、换用户环境后，这些本地专家可能消失。
- 重要专家后续应迁移到 `data/experts.js` 或真实数据库。

## 12. API 与后端规划

用户提供的 API 中转站：

```text
api.bltcy.ai
```

API 文档：

```text
https://gpt-best.apifox.cn/doc-6535931
```

重要安全原则：

- 不要把 API Key 写进前端代码。
- 真实 MVP 中必须通过服务端 API 路由转发。

建议技术栈：

- Next.js
- Tailwind CSS
- Supabase Auth / Database / Storage
- Vercel AI SDK 或 OpenAI 兼容请求封装
- 钉钉登录

建议服务端路由：

```text
/api/chat
/api/experts
/api/knowledge
/api/audit
/api/users
/api/usage
```

## 13. 建议数据库表

专家相关：

```text
experts
expert_versions
expert_knowledge_bases
knowledge_documents
knowledge_chunks
```

用户与权限：

```text
users
departments
teams
roles
user_expert_permissions
quota_policies
```

对话与审计：

```text
conversations
messages
usage_logs
risk_sessions
audit_logs
```

## 14. 下一步建议

推荐下一步进入真实 MVP 架构准备：

1. 把静态原型迁移为 Next.js 项目。
2. 保留现有视觉和交互。
3. 建立服务端 API 路由骨架。
4. 把 `data/experts.js` 和 `data/departments.js` 抽象成后端数据模型。
5. 接 Supabase 数据库。
6. 接钉钉登录。
7. 接 `api.bltcy.ai` 聊天接口。

优先级建议：

1. Next.js 项目结构
2. Supabase 表结构
3. 服务端 `/api/chat`
4. 专家数据入库
5. 用户、部门、额度入库
6. 钉钉登录
7. RAG 知识库
8. 审计日志

## 15. 注意事项

- 当前项目没有 Git 仓库，之前机器上也没有可用 git 命令。
- 当前 Node/npm 使用项目内便携版，不依赖系统 Node。
- 当前页面是原型，不要把它当生产安全实现。
- 中英双语只保留在创建专家页面。
- 用户侧不提供知识库挂载。
- 风险会话必须显示具体人名。
- 权限额度配置必须先选部门，再选部门内员工。
- 后台模块需要支持展开/收起。

