# AI Roleplay

一个基于 **React + ASP.NET Core + FastAPI + Ollama** 的 AI 角色扮演聊天项目。

当前目标是先完成 AI 核心体验，再逐步加入数据库、长期记忆、用户系统和部署。

## Tech Stack

* React + TypeScript
* Vite
* Tailwind CSS
* ASP.NET Core
* C#
* FastAPI
* Python
* Ollama
* `qwen3:4b`

## Architecture

```text
React
  ↓
ASP.NET Core
  ↓
FastAPI
  ↓
Ollama
  ↓
qwen3:4b
```

AI 回复通过 Streaming 原路返回：

```text
Ollama
  ↓
FastAPI StreamingResponse
  ↓
ASP.NET Streaming Proxy
  ↓
React ReadableStream
```

## 已完成功能

* 多角色聊天
* 动态角色加载
* Character Prompt Builder
* 多轮对话
* Streaming 回复
* Stop Generation
* Regenerate
* 自动滚动
* Conversation Context
* 最近 20 条消息窗口
* Conversation Summary
* React → ASP.NET Core → FastAPI → Ollama 完整链路

## Project Structure

```text
ai-roleplay/
├── frontend/
│   └── React + TypeScript + Tailwind
│
├── backend/
│   └── ASP.NET Core API
│
├── ai/
│   ├── main.py
│   ├── character.py
│   └── prompt_builder.py
│
└── README.md
```

## Local Development

### Ollama

```bash
ollama run qwen3:4b
```

### FastAPI

```bash
cd ai
uv sync
uv run uvicorn main:app --reload --port 8000
```

运行于：

```text
http://127.0.0.1:8000
```

### ASP.NET Core

```bash
cd backend/AiRoleplay.Api
dotnet watch
```

运行于：

```text
http://localhost:5193
```

### React

```bash
cd frontend
npm install
npm run dev
```

运行于：

```text
http://localhost:5173
```

## Current Phase

```text
Phase 0 — Project Setup          ✅
Phase 1 — Single Character      ✅
Phase 2 — Streaming             ✅
Phase 3 — Multi-turn Context    ✅
Phase 4 — Character Engine      ✅
Phase 5 — Context & Summary     ✅

Phase 6 — Character Quality     ← Next
Phase 7 — PostgreSQL
Phase 8 — Long-term Memory
Phase 9 — User / Auth
Phase 10 — Product Features
Phase 11 — Commercialization
Phase 12 — Production
```

当前已经完成：

> **AI Roleplay Core MVP**

## Next

下一阶段重点提升角色质量，包括：

* Scenario
* Relationship
* Example Dialogues
* Response Rules
* 更明显的角色人格差异

之后再加入：

```text
PostgreSQL
→ Conversation Persistence
→ Long-term Memory
→ pgvector
→ User / Auth
→ Product Features
→ Deployment
```
