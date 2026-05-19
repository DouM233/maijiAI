# 麦吉AI AI工具中心

这是麦吉AI的前台工具入口站。当前重点已经从“后台管理 / 专家上架 MVP”收口为“可点击跳转的小工具矩阵”。

## 当前已接入工具

- 麦吉AI买家秀生成器：https://maijiai.coze.site/
- 麦吉AI推广图生成器：https://vision-loop.coze.site/
- 麦吉AI GIF处理器：https://maijigif.coze.site/

## 本地运行

```powershell
.\dev.ps1
```

默认地址：

```text
http://127.0.0.1:5175/
```

## 构建检查

```powershell
npm run build
```

## 工具链接配置

工具卡片跳转地址统一配置在：

```text
data/tool-links.js
```

如果某个工具暂时没有上线地址，把 `url` 留空即可，前端会显示“待接入”状态。

## 当前产品边界

- 官网当前只做前台工具入口。
- 后台管理、专家上架、知识库挂载等复杂功能暂时隐藏。
- 旧原型代码仍保留，方便后续重新启用或拆分。
- 部署目标优先考虑阿里云 ECS，静态资源后续可同步到 OSS / S3。

## 协作文档

- 项目交接文档：`docs/project-handoff.md`
- 前后端协作文档：`docs/frontend-backend-collaboration.md`
- 专家 MVP 架构说明：`docs/expert-mvp-architecture.md`
