import json
from typing import Literal

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from character import characters
from prompt_builder import build_system_prompt


app = FastAPI()


OLLAMA_URL = "http://localhost:11434/api/chat"

MODEL_NAME = "qwen3:4b"

MAX_RECENT_MESSAGES = 4


class Message(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    character_id: str
    messages: list[Message]


@app.get("/health")
async def health():
    return {
        "status": "ok"
    }


@app.get("/characters")
async def get_characters():
    # 目前 MVP 直接返回。
    # 后面会改成只返回前端需要的数据。
    return list(characters.values())


@app.get("/characters/{character_id}")
async def get_character(character_id: str):
    character = characters.get(
        character_id
    )

    if not character:
        raise HTTPException(
            status_code=404,
            detail="Character not found"
        )

    return character


async def summarize_messages(
    messages: list[Message],
) -> str:
    """
    把较早的聊天记录压缩成 Conversation Summary。
    """

    if not messages:
        return ""

    conversation_text = "\n".join(
        f"{message.role}: {message.content}"
        for message in messages
    )

    summary_prompt = f"""
请总结下面这段角色扮演聊天记录。

目标：
保留之后继续聊天时真正重要的信息。

重点保留：
- 用户的重要个人信息
- 用户表达过的喜好
- 用户提到的重要人物
- 已发生的重要事件
- 用户和角色之间的关系变化
- 约定、承诺和计划
- 对后续剧情重要的信息

不要：
- 保留无意义寒暄
- 逐句复述
- 添加聊天中不存在的信息
- 写得过长

请输出简洁的事实总结。

聊天记录：

{conversation_text}
""".strip()

    payload = {
        "model": MODEL_NAME,

        "messages": [
            {
                "role": "system",
                "content": (
                    "你是一个负责压缩聊天上下文的助手。"
                    "只总结已有信息，不要编造。"
                ),
            },
            {
                "role": "user",
                "content": summary_prompt,
            },
        ],

        "stream": False,
    }

    async with httpx.AsyncClient(
        timeout=None
    ) as client:

        response = await client.post(
            OLLAMA_URL,
            json=payload,
        )

        response.raise_for_status()

        data = response.json()

    return (
        data
        .get("message", {})
        .get("content", "")
        .strip()
    )


@app.post("/chat/stream")
async def chat_stream(
    request: ChatRequest
):
    character = characters.get(
        request.character_id
    )

    if not character:
        raise HTTPException(
            status_code=404,
            detail="Character not found"
        )

    system_prompt = build_system_prompt(
        character
    )

    all_messages = request.messages

    conversation_summary = ""

    recent_messages = all_messages

    # 超过最近消息限制才进行总结
    if len(all_messages) > MAX_RECENT_MESSAGES:

        old_messages = (
            all_messages[
                :-MAX_RECENT_MESSAGES
            ]
        )

        recent_messages = (
            all_messages[
                -MAX_RECENT_MESSAGES:
            ]
        )

        conversation_summary = (
            await summarize_messages(
                old_messages
            )
        )

    async def generate():

        ollama_messages = [
            {
                "role": "system",
                "content": system_prompt,
            }
        ]

        # 有旧聊天总结时加入上下文
        if conversation_summary:

            ollama_messages.append(
                {
                    "role": "system",

                    "content": f"""
以下是用户与角色之前聊天的重要摘要。

这是过去真实发生过的事情，
请在后续对话中自然地记住这些信息。

Conversation Summary:

{conversation_summary}
""".strip(),
                }
            )

        # 加入最近聊天
        for message in recent_messages:

            ollama_messages.append(
                {
                    "role": message.role,
                    "content": message.content,
                }
            )

        payload = {
            "model": MODEL_NAME,
            "messages": ollama_messages,
            "stream": True,
        }

        async with httpx.AsyncClient(
            timeout=None
        ) as client:

            async with client.stream(
                "POST",
                OLLAMA_URL,
                json=payload,
            ) as response:

                response.raise_for_status()

                async for line in (
                    response.aiter_lines()
                ):

                    if not line:
                        continue

                    data = json.loads(
                        line
                    )

                    content = (
                        data
                        .get(
                            "message",
                            {}
                        )
                        .get(
                            "content",
                            ""
                        )
                    )

                    if content:
                        yield content

    return StreamingResponse(
        generate(),
        media_type="text/plain",
    )