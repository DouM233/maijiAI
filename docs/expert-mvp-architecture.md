# 麦吉AI 专家 MVP 架构

## 目标

麦吉AI 的专家不只是“卡片名称 + Prompt”，而是类似 GPT/Gem 的结构化智能体。每个专家都应该被拆成可配置、可审计、可复用的数据。

## 专家结构

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
};
```

## 字段说明

- `Profile`：定义专家是谁，擅长什么，用什么语气和语言风格说话。
- `Constraints`：定义专家不能做什么，避免输出空话、跑题或不合规内容。
- `Goals`：定义专家服务的业务目标，方便后续评估效果。
- `Workflow`：定义专家每次回答的工作步骤，保证输出稳定。
- `boundModel`：专家强绑定模型，进入专家模式后前端模型选择器锁定。
- `knowledgeBaseIds`：后续接 RAG 时，用来绑定 PDF、Docx、SOP 等知识库。

## MVP 阶段实现

当前原型先使用本地文件：

```text
data/experts.js
```

后续真实 MVP 中，这份数据应该迁移到 Supabase：

```text
experts
expert_versions
expert_knowledge_bases
conversations
messages
usage_logs
```

## 专家调用流程

1. 用户点击专家卡片。
2. 前端读取专家配置，生成上下文摘要确认窗。
3. 用户确认摘要。
4. 系统进入专家模式，锁定专家绑定模型。
5. 后端将 `Profile + Constraints + Goals + Workflow + 用户消息 + RAG 结果` 拼装成服务端 Prompt。
6. 调用 `api.bltcy.ai` 的 OpenAI 兼容接口。
7. 保存对话、模型、Token 用量和专家版本号，供审计追溯。

## 当前已落地专家

- 爆款裂变分析AI教练
- 天猫竞争策略教练
- 小红书千帆投放专家
- 个人访谈官
- 电商管理落地顾问

## 下一步

建议下一步开发“创建专家”页面，页面结构参考 GPT/Gem：

- 名称
- 描述
- 指令/Profile
- 约束/Constraints
- 目标/Goals
- 工作流/Workflow
- 默认工具
- 知识库上传
- 右侧预览

