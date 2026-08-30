import { useEffect, useRef } from "react";
import type { Character, Message } from "../types/chat";

type Props = {
  messages: Message[];
  selectedCharacter: Character;
  isGenerating: boolean;
  onRegenerate: () => void;
};

function MessageList({
  messages,
  selectedCharacter,
  isGenerating,
  onRegenerate,
}: Props) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  return (
    <main className="message-area">
      {messages.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-content">
            <div className="character-avatar-large">
              {selectedCharacter.name.slice(0, 1)}
            </div>

            <h2 className="character-name">
              {selectedCharacter.name}
            </h2>

            <p className="character-meta">
              {selectedCharacter.age}岁 · {selectedCharacter.occupation}
            </p>

            <p className="empty-greeting">
              “{selectedCharacter.greeting}”
            </p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {messages.map((message, index) => {
          const isLastAssistant =
            message.role === "assistant" &&
            index === messages.length - 1;

          return (
            <div
              key={index}
              className={`flex ${
                message.role === "user"
                  ? "justify-end"
                  : "justify-start"
              }`}
            >
              <div className="max-w-[75%]">
                <div
                  className={`message-bubble ${
                    message.role === "user"
                      ? "message-user"
                      : "message-assistant"
                  }`}
                >
                  {message.content ||
                    (message.role === "assistant" && isGenerating
                      ? "..."
                      : "")}
                </div>

                {isLastAssistant &&
                  !isGenerating &&
                  message.content && (
                    <button
                      onClick={onRegenerate}
                      className="regenerate-button"
                    >
                      重新生成
                    </button>
                  )}
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>
    </main>
  );
}

export default MessageList;