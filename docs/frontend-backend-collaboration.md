# 麦吉AI 前后端协作文档

本文档用于前端开发与后端开发并行协作，减少重复沟通成本。

## 1. 当前分工

- 前端开发：负责页面、交互、组件拆分、联调接入、接口调用、前端状态管理。
- 后端开发：负责登录、数据库、API、知识库/RAG、审计、权限、部署接口。

当前仓库以 `Next.js` 为前端主骨架，保留了原型页面与交互，便于继续拆组件和接接口。

## 2. 当前项目状态

- 当前已经完成前端原型迁移到 `Next.js` 骨架。
- 页面和交互仍以原型逻辑为主，部分功能仍是前端模拟。
- 暂未接入真实后端接口、数据库、钉钉登录和真实 AI 聊天接口。

## 3. 建议协作边界

### 3.1 前端负责

- 组件拆分与页面维护
- 交互状态与加载状态
- 表单校验与错误提示
- 调用后端 API
- 前端本地 mock 数据逐步替换为接口返回

### 3.2 后端负责

- 用户认证与钉钉登录
- 专家数据持久化
- 用户、部门、角色、额度、权限管理
- 知识库上传、解析、向量化与挂载
- 聊天接口封装与模型转发
- 审计与风险会话记录

## 4. 当前前端页面清单

### 4.1 用户侧

- 登录页
- 主工作台
- 普通聊天流
- 专家模式聊天流

### 4.2 后台侧

- 专家列表
- 创建/编辑专家
- 知识库挂载
- 审计与用量
- 用户与部门管理
- 权限与额度配置

## 5. 哪些功能已经可联调

以下模块已具备较清晰的前端交互结构，可以优先接后端接口：

- 专家列表
- 创建/编辑专家
- 知识库挂载页
- 用户与部门管理
- 权限与额度配置
- 聊天入口与专家模式入口

## 6. 哪些功能目前还是前端模拟

- 钉钉登录
- AI 聊天回复
- 专家保存到数据库
- 文档真实上传与解析
- 审计数据统计
- 风险会话查看详情
- 用户新增/编辑/删除
- 策略应用持久化

## 7. 建议优先联调顺序

按投入产出比，建议后端按下面顺序提供接口：

1. `GET /api/experts`
2. `POST /api/experts`
3. `PUT /api/experts/:id`
4. `GET /api/users`
5. `GET /api/departments`
6. `POST /api/quota-policies`
7. `POST /api/chat`
8. `POST /api/knowledge/upload`
9. `GET /api/audit/overview`
10. `GET /api/risk-sessions`

## 8. 建议接口返回结构

### 8.1 Expert

```ts
type Expert = {
  id: string;
  name: string;
  category: string;
  boundModel: string;
  cardDescription: string;
  profile: {
    expertise: string;
    tone: string;
    language: string;
  };
  constraints: string[];
  goals: string[];
  workflow: string[];
  knowledgeBaseIds?: string[];
  enabled?: boolean;
  createdAt?: string;
  updatedAt?: string;
};
```

### 8.2 Department

```ts
type Department = {
  id: string;
  name: string;
  people: number;
  teams: Array<{
    id: string;
    name: string;
    people: number;
  }>;
};
```

### 8.3 User

```ts
type User = {
  id: string;
  name: string;
  department: string;
  team: string;
  role: string;
  quota: number;
  experts: number;
};
```

### 8.4 Risk Session

```ts
type RiskSession = {
  id: string;
  user: string;
  role: string;
  department: string;
  team: string;
  riskType: string;
  detail: string;
  expert: string;
  createdAt?: string;
};
```

### 8.5 Chat

```ts
type ChatRequest = {
  conversationId?: string;
  expertId?: string;
  model?: string;
  summary?: string;
  message: string;
};

type ChatResponse = {
  conversationId: string;
  messageId: string;
  role: "assistant";
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
};
```

## 9. 后端实现约束

- 不要把第三方 API Key 暴露给前端。
- 聊天请求必须走后端中转。
- 登录态建议由后端统一签发。
- 权限、额度、可见专家列表由后端控制，前端只消费结果。
- 知识库挂载关系由后端统一管理。

## 10. 当前前端数据来源

现阶段前端还依赖以下本地数据：

- `data/experts.js`
- `data/departments.js`
- 浏览器 `localStorage`

后端接口接入后，建议按这个顺序替换：

1. 替换 `experts`
2. 替换 `departments`
3. 替换 `users`
4. 替换 `riskSessions`
5. 移除 `localStorage` 中的专家主存储职责

## 11. 联调建议

- 前端优先约定字段名，不要频繁改字段结构。
- 后端先保证列表和详情接口稳定，再补写入接口。
- 所有时间字段统一返回 ISO 8601。
- 所有分页接口建议统一返回 `items`、`total`、`page`、`pageSize`。
- 所有错误返回建议统一结构：

```json
{
  "code": "BAD_REQUEST",
  "message": "错误说明"
}
```

## 12. Git 协作建议

- 默认分支：`master`
- 前端开发分支建议：`feat/frontend-*`
- 后端开发分支建议：`feat/backend-*`
- 联调分支建议：`feat/integration-*`

提交信息建议：

- `feat: 新增专家创建页接口接入`
- `fix: 修复后台知识库目标专家回填`
- `refactor: 拆分聊天工作台组件`
- `docs: 更新前后端协作文档`

## 13. 下一步建议

最推荐的下一步是：

1. 前端继续拆组件
2. 后端先产出 `experts / users / departments / chat` 四类接口
3. 双方先完成专家列表与聊天接口联调
4. 然后再接知识库、审计与权限模块

