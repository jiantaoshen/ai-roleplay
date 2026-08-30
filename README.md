# AI Roleplay

一个基于 **React + ASP.NET Core + FastAPI + Ollama** 的 AI 角色扮演聊天项目。

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

AI 回复通过 Streaming 返回：

```text
Ollama
  ↓
FastAPI
  ↓
ASP.NET Core
  ↓
React
```

## 已完成功能

* 多角色聊天
* 动态角色加载
* Character Prompt Builder
* 多轮上下文
* Streaming 回复
* Stop Generation
* Regenerate
* Conversation Summary
* 最近 20 条消息上下文
* Character Quality 调优
* Frontend 组件拆分
* Backend Service Layer
* 一键启动脚本 `dev.ps1`

## Project Structure

```text
ai-roleplay/
├── frontend/
│   └── React + TypeScript
├── backend/
│   └── ASP.NET Core
├── ai/
│   └── FastAPI + Ollama
├── dev.ps1
└── README.md
```

## Character Engine

当前角色配置支持：

```text
background
personality
speaking_style
scenario
relationship
response_rules
example_dialogues
```

不同角色已经具备明显不同的语言风格和行为方式。

## Context

长对话会使用：

```text
Character Prompt
+
Conversation Summary
+
Recent 20 Messages
```

减少上下文长度，同时保留重要历史信息。

## Local Development

一键启动：

```powershell
.\dev.ps1
```

或者分别启动：

```bash
# AI
cd ai
uv run uvicorn main:app --reload --port 8000

# Backend
cd backend/AiRoleplay.Api
dotnet watch

# Frontend
cd frontend
npm run dev
```

## Current Phase

```text
Phase 0 — Project Setup          ✅
Phase 1 — Single Character      ✅
Phase 2 — Streaming             ✅
Phase 3 — Multi-turn Context    ✅
Phase 4 — Character Engine      ✅
Phase 5 — Context & Summary     ✅
Phase 6 — Character Quality     ✅
Phase 6.5 — Code Refactor       ✅

Phase 7 — PostgreSQL            ← Next
```

## Current Status

**AI Roleplay Core MVP 已完成。**

当前还没有数据库，因此刷新页面后聊天记录会丢失。

下一阶段计划加入：

```text
PostgreSQL
→ Conversations
→ Messages
→ Conversation History
→ Summary Persistence
→ Long-term Memory
```
