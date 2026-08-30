import { useEffect, useRef, useState } from "react";

import CharacterHeader from "./components/CharacterHeader";
import ChatInput from "./components/ChatInput";
import MessageList from "./components/MessageList";

import { getCharacters, streamChat } from "./services/api";

import type { Character, Message } from "./types/chat";

function App() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacterId, setSelectedCharacterId] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingCharacters, setIsLoadingCharacters] = useState(true);
  const [characterLoadError, setCharacterLoadError] = useState("");

  const abortControllerRef = useRef<AbortController | null>(null);

  const selectedCharacter = characters.find(
    (character) => character.id === selectedCharacterId
  );

  useEffect(() => {
    async function loadCharacters() {
      try {
        setIsLoadingCharacters(true);
        setCharacterLoadError("");

        const data = await getCharacters();

        setCharacters(data);

        if (data.length > 0) {
          setSelectedCharacterId(data[0].id);
        }
      } catch (error) {
        console.error("Failed to load characters", error);

        const message =
          error instanceof Error
            ? error.message
            : "Unknown error";

        setCharacterLoadError(
          `角色加载失败：${message}`
        );
      } finally {
        setIsLoadingCharacters(false);
      }
    }

    loadCharacters();
  }, []);

  async function generateReply(
    conversationMessages: Message[]
  ) {
    if (!selectedCharacterId) {
      return;
    }

    setIsGenerating(true);

    const controller = new AbortController();

    abortControllerRef.current = controller;

    try {
      await streamChat({
        characterId: selectedCharacterId,
        messages: conversationMessages,
        signal: controller.signal,

        onChunk: (chunk) => {
          setMessages((prev) => {
            const next = [...prev];
            const lastMessage = next[next.length - 1];

            if (lastMessage?.role === "assistant") {
              next[next.length - 1] = {
                ...lastMessage,
                content: lastMessage.content + chunk,
              };
            }

            return next;
          });
        },
      });
    } catch (error) {
      if (
        error instanceof DOMException &&
        error.name === "AbortError"
      ) {
        console.log("Generation stopped");
        return;
      }

      console.error(error);

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unknown error";

      setMessages((prev) => {
        const next = [...prev];
        const lastMessage = next[next.length - 1];

        if (lastMessage?.role === "assistant") {
          next[next.length - 1] = {
            role: "assistant",
            content: `请求失败：${errorMessage}`,
          };
        }

        return next;
      });
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  }

  async function sendMessage() {
    const text = input.trim();

    if (
      !text ||
      isGenerating ||
      !selectedCharacter
    ) {
      return;
    }

    const userMessage: Message = {
      role: "user",
      content: text,
    };

    const context: Message[] = [
      ...messages,
      userMessage,
    ];

    setInput("");

    setMessages([
      ...context,
      {
        role: "assistant",
        content: "",
      },
    ]);

    await generateReply(context);
  }

  async function regenerate() {
    if (
      isGenerating ||
      !selectedCharacter
    ) {
      return;
    }

    const context = [...messages];

    if (
      context[context.length - 1]?.role ===
      "assistant"
    ) {
      context.pop();
    }

    if (
      context[context.length - 1]?.role !==
      "user"
    ) {
      return;
    }

    setMessages([
      ...context,
      {
        role: "assistant",
        content: "",
      },
    ]);

    await generateReply(context);
  }

  function stopGeneration() {
    abortControllerRef.current?.abort();
  }

  function changeCharacter(
    characterId: string
  ) {
    abortControllerRef.current?.abort();

    setSelectedCharacterId(
      characterId
    );

    setMessages([]);
    setInput("");
  }

  if (isLoadingCharacters) {
    return (
      <div className="page-center">
        <p className="state-text">
          正在加载角色...
        </p>
      </div>
    );
  }

  if (characterLoadError) {
    return (
      <div className="page-center">
        <div className="error-card">
          <h1 className="error-title">
            无法加载角色
          </h1>

          <p className="error-text">
            {characterLoadError}
          </p>
        </div>
      </div>
    );
  }

  if (
    characters.length === 0 ||
    !selectedCharacter
  ) {
    return (
      <div className="page-center">
        <p className="state-text">
          暂无可用角色
        </p>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="chat-shell">
        <CharacterHeader
          characters={characters}
          selectedCharacter={selectedCharacter}
          selectedCharacterId={selectedCharacterId}
          isGenerating={isGenerating}
          onCharacterChange={changeCharacter}
        />

        <MessageList
          messages={messages}
          selectedCharacter={selectedCharacter}
          isGenerating={isGenerating}
          onRegenerate={regenerate}
        />

        <ChatInput
          input={input}
          characterName={selectedCharacter.name}
          isGenerating={isGenerating}
          onInputChange={setInput}
          onSend={sendMessage}
          onStop={stopGeneration}
        />
      </div>
    </div>
  );
}

export default App;